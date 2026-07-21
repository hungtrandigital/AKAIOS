// Employee Today screen — one shift, one status and one clear next action.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/auth_storage.dart';
import '../../../core/http_client.dart';
import '../../../core/prismate_loading.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/data/auth_repository.dart';
import '../data/attendance_repository.dart';

class TodayScreen extends ConsumerStatefulWidget {
  const TodayScreen({super.key});

  @override
  ConsumerState<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends ConsumerState<TodayScreen> {
  Future<ShiftAssignment?>? _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    if (!mounted) return;
    setState(() {
      _future = ref
          .read(attendanceRepositoryProvider)
          .getMyToday()
          .timeout(const Duration(seconds: 16));
    });
  }

  Future<void> _logout() async {
    await ref.read(authRepositoryProvider).logout();
    if (!mounted) return;
    ref.read(authSessionProvider).markUnauthenticated();
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ca hôm nay'),
      ),
      body: SafeArea(
        top: false,
        child: FutureBuilder<ShiftAssignment?>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const _TodayLoading();
            }
            if (snap.hasError) {
              return _TodayError(
                error: snap.error,
                onRetry: _load,
                onLogout: _logout,
              );
            }
            final assignment = snap.data;
            if (assignment == null) {
              return _NoShift(onRetry: _load, onLogout: _logout);
            }
            return _TodayContent(
              assignment: assignment,
              onLogout: _logout,
              onRefresh: _load,
            );
          },
        ),
      ),
    );
  }
}

class _TodayLoading extends StatelessWidget {
  const _TodayLoading();

  @override
  Widget build(BuildContext context) {
    return const PrismateLoadingView(
      message: 'Đang lấy ca làm hôm nay…',
      helper: 'Thường chỉ mất vài giây.',
    );
  }
}

class _TodayError extends StatelessWidget {
  const _TodayError({
    required this.error,
    required this.onRetry,
    required this.onLogout,
  });

  final Object? error;
  final VoidCallback onRetry;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    final isNetwork = error is TimeoutException ||
        (error is ApiException && (error as ApiException).statusCode == 0);
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const _RoundIcon(
                    icon: Icons.cloud_off_outlined,
                    foreground: Color(0xFF9B3A10),
                    background: Color(0xFFFFF4E8),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    isNetwork
                        ? 'Chưa kết nối được hệ thống'
                        : 'Chưa lấy được thông tin ca',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Cô/chú kiểm tra Wi-Fi hoặc 4G rồi thử lại. Nếu vẫn chưa được, hãy nhờ giám sát hỗ trợ.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 22),
                  FilledButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Thử lại'),
                  ),
                  const SizedBox(height: 10),
                  TextButton.icon(
                    onPressed: onLogout,
                    icon: const Icon(Icons.logout),
                    label: const Text('Đăng xuất'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NoShift extends StatelessWidget {
  const _NoShift({required this.onRetry, required this.onLogout});

  final VoidCallback onRetry;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const _RoundIcon(
                    icon: Icons.event_available_outlined,
                    foreground: Color(0xFF176B3A),
                    background: Color(0xFFECFDF3),
                  ),
                  const SizedBox(height: 18),
                  Text(l.noAssignmentToday,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 10),
                  Text(
                    'Cô/chú chưa cần chấm công. Nếu nghĩ rằng thiếu lịch, hãy hỏi giám sát.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 20),
                  OutlinedButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Kiểm tra lại'),
                  ),
                  const SizedBox(height: 10),
                  TextButton.icon(
                    onPressed: onLogout,
                    icon: const Icon(Icons.logout),
                    label: const Text('Đăng xuất'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TodayContent extends StatelessWidget {
  const _TodayContent({
    required this.assignment,
    required this.onLogout,
    required this.onRefresh,
  });

  final ShiftAssignment assignment;
  final VoidCallback onLogout;
  final VoidCallback onRefresh;

  Future<void> _openCheck(BuildContext context, String path) async {
    await context.push(path);
    onRefresh();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final hasCheckedIn = assignment.checkInAt != null;
    final hasCheckedOut = assignment.checkOutAt != null;
    final completed = hasCheckedIn && hasCheckedOut;
    final statusColor = completed
        ? const Color(0xFF176B3A)
        : hasCheckedIn
            ? const Color(0xFF0065A8)
            : const Color(0xFF9B3A10);
    final statusBackground = completed
        ? const Color(0xFFECFDF3)
        : hasCheckedIn
            ? const Color(0xFFEAF6FF)
            : const Color(0xFFFFF4E8);

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 620),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          children: [
            Text(
              _greeting(),
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 6),
            Text(
              DateFormat('EEEE, d/M/yyyy', 'vi').format(DateTime.now()),
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 22),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: statusBackground,
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Text(
                        completed
                            ? 'ĐÃ HOÀN THÀNH CA'
                            : hasCheckedIn
                                ? 'ĐANG TRONG CA'
                                : 'CHƯA VÀO CA',
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          letterSpacing: .3,
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(assignment.projectName,
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    _InfoLine(
                      icon: Icons.badge_outlined,
                      label: '${l.shift}: ${assignment.shiftName}',
                    ),
                    const SizedBox(height: 8),
                    _InfoLine(
                      icon: Icons.schedule,
                      label: '${assignment.startTime} – ${assignment.endTime}',
                    ),
                    if (assignment.isSupervisorAssisted) ...[
                      const SizedBox(height: 14),
                      const _ManualBadge(),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Tiến độ hôm nay',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 16),
                    _ProgressRow(
                      done: hasCheckedIn,
                      title: 'Vào ca',
                      value: hasCheckedIn
                          ? _time(assignment.checkInAt!)
                          : 'Chưa ghi nhận',
                    ),
                    const SizedBox(height: 14),
                    _ProgressRow(
                      done: hasCheckedOut,
                      title: 'Ra ca',
                      value: hasCheckedOut
                          ? _time(assignment.checkOutAt!)
                          : 'Chưa ghi nhận',
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (!hasCheckedIn)
              FilledButton.icon(
                onPressed: () =>
                    _openCheck(context, '/check-in/${assignment.id}'),
                icon: const Icon(Icons.login),
                label: Text(l.checkIn),
              )
            else if (!hasCheckedOut)
              FilledButton.icon(
                onPressed: () =>
                    _openCheck(context, '/check-out/${assignment.id}'),
                icon: const Icon(Icons.logout),
                label: Text(l.checkOut),
              )
            else
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF3),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFB7E4C7)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle,
                        color: Color(0xFF176B3A), size: 30),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Cô/chú đã hoàn thành chấm công hôm nay.',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: const Color(0xFF176B3A),
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: onLogout,
              child: const Wrap(
                alignment: WrapAlignment.center,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                runSpacing: 4,
                children: [Icon(Icons.logout, size: 20), Text('Đăng xuất')],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 11) return 'Chào buổi sáng!';
    if (hour < 18) return 'Chào buổi chiều!';
    return 'Chào buổi tối!';
  }

  String _time(DateTime value) => DateFormat('HH:mm').format(value);
}

class _RoundIcon extends StatelessWidget {
  const _RoundIcon({
    required this.icon,
    required this.foreground,
    required this.background,
  });

  final IconData icon;
  final Color foreground;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 68,
      height: 68,
      decoration: BoxDecoration(color: background, shape: BoxShape.circle),
      child: Icon(icon, color: foreground, size: 34),
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 24, color: const Color(0xFF526D82)),
        const SizedBox(width: 11),
        Expanded(
            child: Text(label, style: Theme.of(context).textTheme.bodyLarge)),
      ],
    );
  }
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({
    required this.done,
    required this.title,
    required this.value,
  });

  final bool done;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          done ? Icons.check_circle : Icons.radio_button_unchecked,
          color: done ? const Color(0xFF176B3A) : const Color(0xFF718096),
          size: 29,
        ),
        const SizedBox(width: 13),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: Theme.of(context)
                      .textTheme
                      .bodyLarge
                      ?.copyWith(fontWeight: FontWeight.w700)),
              Text(value, style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ),
      ],
    );
  }
}

class _ManualBadge extends StatelessWidget {
  const _ManualBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF4E8),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const Icon(Icons.supervisor_account_outlined,
              color: Color(0xFF9B3A10)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Giám sát đã ghi nhận hỗ trợ',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF7A2E0B),
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
