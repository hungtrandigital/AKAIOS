import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ak_attendance_mobile/core/config.dart';
import 'package:ak_attendance_mobile/core/auth_storage.dart';
import 'package:ak_attendance_mobile/core/http_client.dart';
import 'package:ak_attendance_mobile/core/prismate_loading.dart';
import 'package:ak_attendance_mobile/features/attendance/data/attendance_repository.dart';
import 'package:ak_attendance_mobile/features/attendance/presentation/checkin_screen.dart';
import 'package:ak_attendance_mobile/features/auth/data/auth_repository.dart';
import 'package:ak_attendance_mobile/main.dart';

class _FakeAuthStorage extends AuthStorage {
  _FakeAuthStorage(this.readToken);

  final Future<String?> Function() readToken;

  @override
  Future<String?> getAccessToken() => readToken();
}

class _FakeAttendanceRepository extends AttendanceRepository {
  _FakeAttendanceRepository(this.assignment)
      : super(
            http: HttpClient(authStorage: _FakeAuthStorage(() async => null)));

  ShiftAssignment? assignment;

  @override
  Future<ShiftAssignment?> getMyToday() async => assignment;
}

void main() {
  test('uses the direct local attendance API by default', () {
    expect(AppConfig.apiBaseUrl, 'http://localhost:3000');
  });

  test('defaults localization to Vietnamese and rejects unsupported locales',
      () {
    expect(AppConfig.resolveLocale(AppConfig.locale), 'vi');
    expect(AppConfig.resolveLocale('en'), 'en');
    expect(AppConfig.resolveLocale('fr'), 'vi');
  });

  test('normalizes common Vietnamese phone formats', () {
    expect(normalizeVietnamPhone('0912 345 678'), '+84912345678');
    expect(normalizeVietnamPhone('84.912.345.678'), '+84912345678');
    expect(normalizeVietnamPhone('+84-912-345-678'), '+84912345678');
  });

  test('converts attendance timestamps from UTC to the device timezone', () {
    const checkInUtc = '2026-07-20T09:19:00.000Z';
    const checkOutUtc = '2026-07-20T10:19:00.000Z';
    final assignment = ShiftAssignment.fromJson({
      'id': 'assignment-id',
      'projectId': 'project-id',
      'shiftId': 'shift-id',
      'date': '2026-07-20T00:00:00.000Z',
      'attendanceRecord': {
        'id': 'record-id',
        'checkInAt': checkInUtc,
        'checkOutAt': checkOutUtc,
      },
    });

    expect(assignment.checkInAt, DateTime.parse(checkInUtc).toLocal());
    expect(assignment.checkOutAt, DateTime.parse(checkOutUtc).toLocal());
    expect(assignment.checkInAt!.isUtc, isFalse);
    expect(assignment.checkOutAt!.isUtc, isFalse);
  });

  test('recognizes only supervisor-assisted camera events as manual', () {
    final supervisorAssisted = ShiftAssignment.fromJson({
      'id': 'assignment-id',
      'projectId': 'project-id',
      'shiftId': 'shift-id',
      'date': '2026-07-20T00:00:00.000Z',
      'attendanceRecord': {
        'id': 'record-id',
        'overrideById': 'supervisor-id',
        'overrideReason': 'device_failure: verified on site',
      },
    });

    final ordinaryOverride = ShiftAssignment.fromJson({
      'id': 'ordinary-assignment-id',
      'projectId': 'project-id',
      'shiftId': 'shift-id',
      'date': '2026-07-20T00:00:00.000Z',
      'attendanceRecord': {
        'id': 'ordinary-record-id',
        'overrideById': 'bo-id',
        'overrideReason': 'Sửa giờ theo biên bản đối soát',
      },
    });

    expect(supervisorAssisted.isSupervisorAssisted, isTrue);
    expect(supervisorAssisted.overrideReason, contains('device_failure'));
    expect(ordinaryOverride.isSupervisorAssisted, isFalse);

    final blankActor = ShiftAssignment.fromJson({
      'id': 'blank-actor-assignment-id',
      'projectId': 'project-id',
      'shiftId': 'shift-id',
      'date': '2026-07-20T00:00:00.000Z',
      'attendanceRecord': {
        'id': 'blank-actor-record-id',
        'overrideById': '   ',
        'overrideReason': 'device_failure: verified on site',
      },
    });
    expect(blankActor.isSupervisorAssisted, isFalse);
  });

  test('classifies camera permission and hardware failures without bypassing',
      () {
    expect(classifyCameraPlatformError('camera_access_denied'),
        CameraFailureKind.denied);
    expect(classifyCameraPlatformError('no_available_camera'),
        CameraFailureKind.unavailable);
    expect(classifyCameraPlatformError('unexpected_plugin_error'),
        CameraFailureKind.failure);
    expect(shouldOfferSupervisorFallback(CaptureFlowState.cameraCancelled),
        isFalse);
    expect(shouldOfferSupervisorFallback(CaptureFlowState.locationDenied),
        isFalse);
    expect(
        shouldOfferSupervisorFallback(CaptureFlowState.cameraDenied), isTrue);
    expect(shouldOfferSupervisorFallback(CaptureFlowState.cameraUnavailable),
        isTrue);
    expect(
        shouldOfferSupervisorFallback(CaptureFlowState.cameraFailure), isTrue);
  });

  test('requires recently captured attendance evidence', () {
    final now = DateTime(2026, 7, 20, 8);
    expect(isFreshEvidence(now.subtract(const Duration(seconds: 30)), now),
        isTrue);
    expect(isFreshEvidence(now.subtract(const Duration(minutes: 3)), now),
        isFalse);
    expect(isFreshEvidence(null, now), isFalse);
  });

  test('accepts only JPEG photo signatures', () {
    expect(hasJpegSignature([0xff, 0xd8, 0xff, 0xe0]), isTrue);
    expect(hasJpegSignature([0x89, 0x50, 0x4e, 0x47]), isFalse);
    expect(hasJpegSignature([]), isFalse);
  });

  test('keeps stored credentials on refresh network failure', () {
    expect(isDefinitiveRefreshRejection(null), isFalse);
    expect(isDefinitiveRefreshRejection(500), isFalse);
    expect(isDefinitiveRefreshRejection(401), isTrue);
  });

  testWidgets('keeps the branded splash visible until storage resolves',
      (tester) async {
    final token = Completer<String?>();
    final storage = _FakeAuthStorage(() => token.future);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authStorageProvider.overrideWithValue(storage)],
        child: const AKApp(),
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('AKAIUNSAN Chấm công'), findsOneWidget);
    expect(find.byType(Image), findsOneWidget);
    expect(find.text('Chào cô/chú!'), findsNothing);

    token.complete(null);
    await tester.pumpAndSettle();
    expect(find.text('Chào cô/chú!'), findsOneWidget);
  });

  testWidgets('Prismate loader becomes static when Reduce Motion is enabled',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(disableAnimations: true),
          child: Scaffold(body: PrismateLoadingMark()),
        ),
      ),
    );

    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('Đang xử lý'), findsOneWidget);
    expect(find.byType(Image), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('camera fallback expands only for camera failures',
      (tester) async {
    Future<void> pumpPanel(CaptureFlowState state) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CameraRecoveryPanel(
              state: state,
              busy: false,
              onShowHelp: () {},
              onRecheck: () {},
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
    }

    await pumpPanel(CaptureFlowState.cameraCancelled);
    expect(find.text('Không chụp được ảnh?'), findsOneWidget);
    expect(find.text('Chấm công chưa được ghi nhận'), findsNothing);

    await pumpPanel(CaptureFlowState.locationDenied);
    expect(find.text('Không chụp được ảnh?'), findsOneWidget);
    expect(find.text('Chấm công chưa được ghi nhận'), findsNothing);

    for (final state in [
      CaptureFlowState.cameraDenied,
      CaptureFlowState.cameraUnavailable,
      CaptureFlowState.cameraFailure,
    ]) {
      await pumpPanel(state);
      expect(find.text('Chấm công chưa được ghi nhận'), findsOneWidget);
      expect(find.text('Nhờ giám sát hỗ trợ'), findsOneWidget);
      expect(find.text('Kiểm tra lại chấm công'), findsOneWidget);
    }
  });

  testWidgets('login remains usable on a small screen with large text',
      (tester) async {
    tester.view.physicalSize = const Size(320, 568);
    tester.view.devicePixelRatio = 1;
    tester.platformDispatcher.textScaleFactorTestValue = 2;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
      tester.platformDispatcher.clearTextScaleFactorTestValue();
    });

    final storage = _FakeAuthStorage(() async => null);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authStorageProvider.overrideWithValue(storage)],
        child: const AKApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Chào cô/chú!'), findsOneWidget);
    expect(find.byType(SingleChildScrollView), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Today and check-in steps fit small screens with large text',
      (tester) async {
    tester.view.physicalSize = const Size(320, 568);
    tester.view.devicePixelRatio = 1;
    tester.platformDispatcher.textScaleFactorTestValue = 2;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
      tester.platformDispatcher.clearTextScaleFactorTestValue();
    });
    final assignment = ShiftAssignment(
      id: 'assignment-id',
      projectId: 'project-id',
      projectName: 'Dự án Bệnh viện Trung tâm',
      shiftId: 'shift-id',
      shiftName: 'Ca sáng',
      startTime: '06:00',
      endTime: '14:00',
      date: DateTime(2026, 7, 20),
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authStorageProvider
              .overrideWithValue(_FakeAuthStorage(() async => 'token')),
          attendanceRepositoryProvider.overrideWithValue(
            _FakeAttendanceRepository(assignment),
          ),
        ],
        child: const AKApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Dự án Bệnh viện Trung tâm'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.scrollUntilVisible(
      find.text('Check-in'),
      220,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Check-in'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('Bước 3 · Xác nhận'),
      220,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Bước 3 · Xác nhận'), findsOneWidget);
    expect(find.byType(ListView), findsOneWidget);
    expect(tester.takeException(), isNull);
    final backButton = find.text('Quay lại ca hôm nay');
    await tester.scrollUntilVisible(
      backButton,
      180,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.ensureVisible(backButton);
    await tester.pumpAndSettle();
    await tester.tap(backButton);
    await tester.pumpAndSettle();
    expect(find.text('Ca hôm nay'), findsOneWidget);
    expect(find.text('Bước 3 · Xác nhận'), findsNothing);
  });

  testWidgets('employee can reconcile a supervisor manual event',
      (tester) async {
    final original = ShiftAssignment(
      id: 'assignment-id',
      projectId: 'project-id',
      projectName: 'Dự án Bệnh viện Trung tâm',
      shiftId: 'shift-id',
      shiftName: 'Ca sáng',
      startTime: '06:00',
      endTime: '14:00',
      date: DateTime(2026, 7, 20),
    );
    final repository = _FakeAttendanceRepository(original);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authStorageProvider
              .overrideWithValue(_FakeAuthStorage(() async => 'token')),
          attendanceRepositoryProvider.overrideWithValue(repository),
        ],
        child: const AKApp(),
      ),
    );
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('Check-in'),
      220,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Check-in'));
    await tester.pumpAndSettle();

    repository.assignment = ShiftAssignment(
      id: original.id,
      projectId: original.projectId,
      projectName: original.projectName,
      shiftId: original.shiftId,
      shiftName: original.shiftName,
      startTime: original.startTime,
      endTime: original.endTime,
      date: original.date,
      attendanceRecordId: 'manual-record-id',
      checkInAt: DateTime.now(),
      overrideById: 'supervisor-id',
      overrideReason: 'device_failure: xác nhận tại dự án',
    );
    final helpButton = find.text('Không chụp được ảnh?');
    await tester.scrollUntilVisible(
      helpButton,
      180,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.ensureVisible(helpButton);
    await tester.pumpAndSettle();
    await tester.tap(helpButton);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Kiểm tra lại chấm công'));
    await tester.pumpAndSettle();

    expect(find.text('Ca hôm nay'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Giám sát đã ghi nhận hỗ trợ'),
      180,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Giám sát đã ghi nhận hỗ trợ'), findsOneWidget);
    expect(find.text('ĐANG TRONG CA'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('no-shift state keeps a visible logout action', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authStorageProvider
              .overrideWithValue(_FakeAuthStorage(() async => 'token')),
          attendanceRepositoryProvider.overrideWithValue(
            _FakeAttendanceRepository(null),
          ),
        ],
        child: const AKApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Đăng xuất'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
