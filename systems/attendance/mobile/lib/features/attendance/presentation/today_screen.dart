// Employee Today screen — every assigned shift with one clear action per shift.

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
  Future<List<ShiftAssignment>>? _future;

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
        child: FutureBuilder<List<ShiftAssignment>>(
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
            final assignments = snap.data ?? const [];
            if (assignments.isEmpty) {
              return _NoShift(onRetry: _load, onLogout: _logout);
            }
            return _TodayContent(
              assignments: assignments,
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
    required this.assignments,
    required this.onLogout,
    required this.onRefresh,
  });

  final List<ShiftAssignment> assignments;
  final VoidCallback onLogout;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 620),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          children: [
            _TodayMasthead(
              greeting: _greeting(),
              date: DateFormat('EEEE, d/M/yyyy', 'vi').format(DateTime.now()),
              assignmentCount: assignments.length,
            ),
            if (assignments.length > 1) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F2E4),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFDCDECD)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.alt_route, color: Color(0xFF4F601A)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Hôm nay cô/chú có ${assignments.length} ca. Hãy chọn đúng dự án và khung giờ khi chấm công.',
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 22),
            ...assignments.expand((assignment) => [
                  _AssignmentPanel(
                    assignment: assignment,
                    onRefresh: onRefresh,
                  ),
                  const SizedBox(height: 22),
                ]),
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
}

class _TodayMasthead extends StatelessWidget {
  const _TodayMasthead({
    required this.greeting,
    required this.date,
    required this.assignmentCount,
  });

  final String greeting;
  final String date;
  final int assignmentCount;

  @override
  Widget build(BuildContext context) {
    final usesLargeText = MediaQuery.textScalerOf(context).scale(16) >= 28;
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 20, 22, 22),
      decoration: BoxDecoration(
        color: const Color(0xFF1B2512),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 12,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: Color(0xFFC7DC50),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                usesLargeText ? 'HÔM NAY' : 'NHỊP LÀM VIỆC HÔM NAY',
                style: const TextStyle(
                  color: Color(0xFFC7DC50),
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: .8,
                ),
              ),
              Text(
                '$assignmentCount ca',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          SizedBox(height: usesLargeText ? 16 : 22),
          Text(
            greeting,
            style: (usesLargeText
                    ? Theme.of(context).textTheme.titleLarge
                    : Theme.of(context).textTheme.headlineMedium)
                ?.copyWith(color: Colors.white),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(
                Icons.calendar_today_outlined,
                color: Color(0xFFC7DC50),
                size: 19,
              ),
              const SizedBox(width: 9),
              Expanded(
                child: Text(
                  date,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: const Color(0xFFE7EAD9),
                      ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AssignmentPanel extends StatelessWidget {
  const _AssignmentPanel({
    required this.assignment,
    required this.onRefresh,
  });

  final ShiftAssignment assignment;
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
    final isNonWorking = assignment.isNonWorkingAttendance;
    final statusColor = isNonWorking
        ? const Color(0xFF666B5A)
        : completed
            ? const Color(0xFF4F601A)
            : hasCheckedIn
                ? const Color(0xFF1B2512)
                : const Color(0xFFA55B13);
    final statusBackground = isNonWorking
        ? const Color(0xFFF2F1EC)
        : completed
            ? const Color(0xFFF0F2E4)
            : hasCheckedIn
                ? const Color(0xFFE8EDC8)
                : const Color(0xFFFFF4E8);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 7,
            color: statusColor,
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 20, 22, 22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: statusBackground,
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Text(
                        isNonWorking
                            ? assignment.attendanceStatusLabel.toUpperCase()
                            : completed
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
                    Text(
                      assignment.shiftName,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  assignment.projectName,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 10),
                _InfoLine(
                  icon: Icons.schedule_rounded,
                  label: '${assignment.startTime} – ${assignment.endTime}',
                ),
                if (assignment.projectAddress.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _InfoLine(
                    icon: Icons.location_on_outlined,
                    label: assignment.projectAddress,
                  ),
                ],
                if (!isNonWorking) ...[
                  const SizedBox(height: 20),
                  _ShiftProgress(
                    checkInAt: assignment.checkInAt,
                    checkOutAt: assignment.checkOutAt,
                  ),
                ],
                if (assignment.isSupervisorAssisted) ...[
                  const SizedBox(height: 16),
                  const _ManualBadge(),
                ],
                const SizedBox(height: 20),
                if (isNonWorking)
                  _ShiftNotice(
                    message:
                        'Ca này đã được ghi nhận “${assignment.attendanceStatusLabel}”. Cô/chú không cần chấm công.',
                    foreground: const Color(0xFF344054),
                    background: const Color(0xFFF2F4F7),
                    border: const Color(0xFFD0D5DD),
                    icon: Icons.event_busy_outlined,
                  )
                else if (!hasCheckedIn)
                  _ShiftAction(
                    onPressed: () =>
                        _openCheck(context, '/check-in/${assignment.id}'),
                    icon: Icons.login,
                    label: '${l.checkIn} · ${assignment.shiftName}',
                  )
                else if (!hasCheckedOut)
                  _ShiftAction(
                    onPressed: () =>
                        _openCheck(context, '/check-out/${assignment.id}'),
                    icon: Icons.logout,
                    label: '${l.checkOut} · ${assignment.shiftName}',
                    isCheckOut: true,
                  )
                else
                  _ShiftNotice(
                    message:
                        'Đã hoàn thành chấm công cho ca ${assignment.shiftName}.',
                    foreground: const Color(0xFF4F601A),
                    background: const Color(0xFFF0F2E4),
                    border: const Color(0xFFCCD4A4),
                    icon: Icons.task_alt,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ShiftAction extends StatelessWidget {
  const _ShiftAction({
    required this.onPressed,
    required this.icon,
    required this.label,
    this.isCheckOut = false,
  });

  final VoidCallback onPressed;
  final IconData icon;
  final String label;
  final bool isCheckOut;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: Material(
        color: isCheckOut ? const Color(0xFF4F601A) : const Color(0xFF1B2512),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 64),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 14, 10),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(
                      color: Color(0xFFC7DC50),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: const Color(0xFF1B2512)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      label,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            color: Colors.white,
                          ),
                    ),
                  ),
                  const Icon(
                    Icons.arrow_forward_rounded,
                    color: Color(0xFFC7DC50),
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

class _ShiftProgress extends StatelessWidget {
  const _ShiftProgress({required this.checkInAt, required this.checkOutAt});

  final DateTime? checkInAt;
  final DateTime? checkOutAt;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Tiến độ ca',
      child: Row(
        children: [
          Expanded(
            child: _ProgressPoint(
              done: checkInAt != null,
              title: 'Vào ca',
              value: checkInAt == null
                  ? 'Chưa ghi nhận'
                  : DateFormat('HH:mm').format(checkInAt!),
            ),
          ),
          Container(
            width: 34,
            height: 2,
            margin: const EdgeInsets.symmetric(horizontal: 8),
            color: checkOutAt != null
                ? const Color(0xFF6C7D22)
                : const Color(0xFFDCDECD),
          ),
          Expanded(
            child: _ProgressPoint(
              done: checkOutAt != null,
              title: 'Ra ca',
              value: checkOutAt == null
                  ? 'Chưa ghi nhận'
                  : DateFormat('HH:mm').format(checkOutAt!),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressPoint extends StatelessWidget {
  const _ProgressPoint({
    required this.done,
    required this.title,
    required this.value,
  });

  final bool done;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          done ? Icons.check_circle : Icons.radio_button_unchecked,
          color: done ? const Color(0xFF6C7D22) : const Color(0xFF8B8F80),
          size: 27,
        ),
        const SizedBox(height: 7),
        Text(
          title,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        Text(value, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}

class _ShiftNotice extends StatelessWidget {
  const _ShiftNotice({
    required this.message,
    required this.foreground,
    required this.background,
    required this.border,
    required this.icon,
  });

  final String message;
  final Color foreground;
  final Color background;
  final Color border;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Icon(icon, color: foreground, size: 26),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: foreground,
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
        ],
      ),
    );
  }
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
        Icon(icon, size: 24, color: const Color(0xFF6C7D22)),
        const SizedBox(width: 11),
        Expanded(
            child: Text(label, style: Theme.of(context).textTheme.bodyLarge)),
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
