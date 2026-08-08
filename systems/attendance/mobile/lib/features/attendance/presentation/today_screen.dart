// Daily attendance home — today's shift, status and check-in/out entry point.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/http_client.dart';
import '../../auth/data/auth_repository.dart';
import '../data/attendance_repository.dart';
import 'attendance_widgets.dart';

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository(
    http: HttpClient(authStorage: ref.read(authStorageProvider)),
  );
});

class TodayScreen extends ConsumerStatefulWidget {
  const TodayScreen({super.key});

  @override
  ConsumerState<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends ConsumerState<TodayScreen> {
  late Future<ShiftAssignment?> _future;
  late DateTime _now;
  Timer? _clock;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _future = ref.read(attendanceRepositoryProvider).getMyToday();
    _clock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _clock?.cancel();
    super.dispose();
  }

  Future<void> _reload() async {
    final next = ref.read(attendanceRepositoryProvider).getMyToday();
    setState(() => _future = next);
    await next;
  }

  Future<void> _logout() async {
    await ref.read(authRepositoryProvider).logout();
    if (!mounted) return;
    context.go('/login');
  }

  void _openMenu() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const ListTile(
                leading: CircleAvatar(
                  backgroundColor: Color(0xFFE9F2FF),
                  child: Icon(Icons.person_rounded, color: attendanceBlue),
                ),
                title: Text(
                  'Nhân viên AKAIUNSAN',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: Text('Ứng dụng chấm công'),
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.logout_rounded),
                title: Text(AppLocalizations.of(context).logout),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  _logout();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showComingSoon() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Tính năng này sẽ được cập nhật sớm.')),
    );
  }

  void _openAttendance(ShiftAssignment assignment) {
    if (assignment.checkInAt == null) {
      context.go('/check-in/${assignment.id}');
    } else if (assignment.checkOutAt == null) {
      context.go('/check-out/${assignment.id}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            DailyAttendanceHeader(
              now: _now,
              leadingIcon: Icons.menu_rounded,
              onLeading: _openMenu,
              onNotifications: _showComingSoon,
            ),
            Expanded(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: FutureBuilder<ShiftAssignment?>(
                    future: _future,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState != ConnectionState.done) {
                        return const Center(
                          child: CircularProgressIndicator(
                            color: attendanceBlue,
                          ),
                        );
                      }
                      if (snapshot.hasError) {
                        return _StateList(
                          onRefresh: _reload,
                          child: AttendanceMessageCard(
                            icon: Icons.cloud_off_rounded,
                            title: 'Không tải được ca làm việc',
                            message: snapshot.error.toString(),
                            color: attendanceRed,
                            onRetry: _reload,
                          ),
                        );
                      }

                      final assignment = snapshot.data;
                      if (assignment == null) {
                        return _StateList(
                          onRefresh: _reload,
                          child: const AttendanceMessageCard(
                            icon: Icons.event_available_rounded,
                            title: 'Hôm nay chưa có ca làm việc',
                            message:
                                'Lịch làm việc sẽ hiển thị tại đây sau khi '
                                'quản lý phân ca.',
                          ),
                        );
                      }

                      return RefreshIndicator(
                        onRefresh: _reload,
                        color: attendanceBlue,
                        child: ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                          children: [
                            ShiftSummaryCard(assignment: assignment),
                            if (assignment.checkInAt != null) ...[
                              const SizedBox(height: 12),
                              CheckInStatusBanner(
                                checkInAt: assignment.checkInAt!,
                                checkOutAt: assignment.checkOutAt,
                                now: _now,
                              ),
                            ],
                            const SizedBox(height: 22),
                            LocationVerificationPanel(
                              hasPosition: false,
                              radiusMeters: assignment.geofenceRadiusMeters,
                            ),
                            const SizedBox(height: 20),
                            if (assignment.checkOutAt == null) ...[
                              CircularAttendanceAction(
                                isCheckOut: assignment.checkInAt != null,
                                onPressed: () => _openAttendance(assignment),
                              ),
                              const SizedBox(height: 20),
                              PhotoVerificationCard(
                                isCheckOut: assignment.checkInAt != null,
                                onTakePhoto: () => _openAttendance(assignment),
                              ),
                            ] else
                              const AttendanceMessageCard(
                                icon: Icons.task_alt_rounded,
                                title: 'Đã hoàn thành ca hôm nay',
                                message:
                                    'Thông tin chấm công và ảnh xác minh đã '
                                    'được lưu thành công.',
                                color: attendanceGreen,
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
            AttendanceBottomNavigation(
              onHome: () {},
              onPlaceholder: _showComingSoon,
            ),
          ],
        ),
      ),
    );
  }
}

class _StateList extends StatelessWidget {
  final Future<void> Function() onRefresh;
  final Widget child;

  const _StateList({required this.onRefresh, required this.child});

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: attendanceBlue,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        children: [
          SizedBox(height: MediaQuery.sizeOf(context).height * 0.12),
          child,
        ],
      ),
    );
  }
}
