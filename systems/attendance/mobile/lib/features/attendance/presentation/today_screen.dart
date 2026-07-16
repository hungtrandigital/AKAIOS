// Today screen — show today's assignment + check-in/out status.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/auth_storage.dart';
import '../../../core/http_client.dart';
import '../../../l10n/app_localizations.dart';
import '../data/attendance_repository.dart';
import '../../auth/data/auth_repository.dart';

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository(http: HttpClient(authStorage: ref.read(authStorageProvider)));
});

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
    _future = ref.read(attendanceRepositoryProvider).getMyToday();
  }

  Future<void> _logout() async {
    await ref.read(authRepositoryProvider).logout();
    if (!mounted) return;
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l.todayTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
            tooltip: l.logout,
          ),
        ],
      ),
      body: FutureBuilder<ShiftAssignment?>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            final err = snap.error;
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text('Error: $err'),
              ),
            );
          }
          final assignment = snap.data;
          if (assignment == null) {
            return Center(child: Text(l.noAssignmentToday));
          }
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${l.project}: ${assignment.projectName}',
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text('${l.shift}: ${assignment.shiftName}'),
                        Text('${l.shiftTime}: ${assignment.startTime} - ${assignment.endTime}'),
                        Text('Date: ${DateFormat('yyyy-MM-dd').format(assignment.date)}'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                if (assignment.checkInAt != null)
                  Text(l.checkedIn(DateFormat('HH:mm').format(assignment.checkInAt!)))
                else
                  Text(l.notCheckedIn),
                if (assignment.checkOutAt != null)
                  Text(l.checkedOut(DateFormat('HH:mm').format(assignment.checkOutAt!))),
                const Spacer(),
                if (assignment.checkInAt == null)
                  ElevatedButton.icon(
                    onPressed: () => context.go('/check-in/${assignment.id}'),
                    icon: const Icon(Icons.login),
                    label: Text(l.checkIn),
                  )
                else if (assignment.checkOutAt == null)
                  ElevatedButton.icon(
                    onPressed: () => context.go('/check-out/${assignment.id}'),
                    icon: const Icon(Icons.logout),
                    label: Text(l.checkOut),
                  )
                else
                  const Text('Đã hoàn thành ca hôm nay'),
              ],
            ),
          );
        },
      ),
    );
  }
}
