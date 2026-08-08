import 'package:ak_attendance_mobile/features/attendance/data/attendance_repository.dart';
import 'package:ak_attendance_mobile/features/attendance/presentation/attendance_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final assignment = ShiftAssignment(
    id: 'assignment-1',
    projectId: 'project-1',
    projectName: 'Tòa nhà Vincom Quận 1',
    projectAddress: '72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM',
    projectLatitude: 10.777,
    projectLongitude: 106.701,
    geofenceRadiusMeters: 50,
    shiftId: 'shift-1',
    shiftName: 'Ca sáng',
    startTime: '08:00',
    endTime: '12:00',
    date: DateTime(2026, 8, 8),
  );

  test('parses project geofence data from today assignment', () {
    final parsed = ShiftAssignment.fromJson({
      'id': 'assignment-1',
      'projectId': 'project-1',
      'shiftId': 'shift-1',
      'date': '2026-08-08T00:00:00.000Z',
      'project': {
        'id': 'project-1',
        'name': 'Tòa nhà Vincom Quận 1',
        'address': '72 Lê Thánh Tôn',
        'latitude': '10.7770000',
        'longitude': 106.701,
        'geofenceRadiusMeters': 50,
      },
      'shift': {
        'id': 'shift-1',
        'name': 'Ca sáng',
        'startTime': '08:00',
        'endTime': '12:00',
      },
    });

    expect(parsed.projectAddress, '72 Lê Thánh Tôn');
    expect(parsed.projectLatitude, 10.777);
    expect(parsed.projectLongitude, 106.701);
    expect(parsed.geofenceRadiusMeters, 50);
  });

  testWidgets('renders the daily check-in reference layout', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    var actionPressed = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SafeArea(
            child: Column(
              children: [
                DailyAttendanceHeader(
                  now: DateTime(2026, 8, 8, 7, 46, 32),
                  leadingIcon: Icons.menu_rounded,
                  onLeading: () {},
                  onNotifications: () {},
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        ShiftSummaryCard(assignment: assignment),
                        const SizedBox(height: 16),
                        const LocationVerificationPanel(
                          hasPosition: true,
                          isInside: true,
                          distanceMeters: 18,
                          radiusMeters: 50,
                        ),
                        const SizedBox(height: 16),
                        CircularAttendanceAction(
                          isCheckOut: false,
                          onPressed: () => actionPressed = true,
                        ),
                        const SizedBox(height: 16),
                        PhotoVerificationCard(
                          isCheckOut: false,
                          onTakePhoto: () {},
                        ),
                      ],
                    ),
                  ),
                ),
                AttendanceBottomNavigation(
                  onHome: () {},
                  onPlaceholder: () {},
                ),
              ],
            ),
          ),
        ),
      ),
    );

    expect(find.text('Ca sáng: 08:00 - 12:00'), findsOneWidget);
    expect(find.text('Đã vào đúng vị trí công trình'), findsOneWidget);
    expect(find.text('BẮT ĐẦU\nVÀO CA\n(CHECK-IN)'), findsOneWidget);
    expect(find.text('Chụp ảnh check-in'), findsOneWidget);

    await tester.ensureVisible(find.text('BẮT ĐẦU\nVÀO CA\n(CHECK-IN)'));
    await tester.tap(find.text('BẮT ĐẦU\nVÀO CA\n(CHECK-IN)'));
    expect(actionPressed, isTrue);
  });
}
