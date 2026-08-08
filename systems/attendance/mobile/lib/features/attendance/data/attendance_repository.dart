// Attendance repository — check-in/out + today's assignment.

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth_storage.dart';
import '../../../core/http_client.dart';

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository(
    http: HttpClient(authStorage: ref.read(authStorageProvider)),
  );
});

class ShiftAssignment {
  final String id;
  final String projectId;
  final String projectName;
  final String projectAddress;
  final double? projectLatitude;
  final double? projectLongitude;
  final int geofenceRadiusMeters;
  final String shiftId;
  final String shiftName;
  final String startTime;
  final String endTime;
  final DateTime date;
  final String? attendanceRecordId;
  final DateTime? checkInAt;
  final DateTime? checkOutAt;
  final String? overrideById;
  final String? overrideReason;

  ShiftAssignment({
    required this.id,
    required this.projectId,
    required this.projectName,
    this.projectAddress = '',
    this.projectLatitude,
    this.projectLongitude,
    this.geofenceRadiusMeters = 100,
    required this.shiftId,
    required this.shiftName,
    required this.startTime,
    required this.endTime,
    required this.date,
    this.attendanceRecordId,
    this.checkInAt,
    this.checkOutAt,
    this.overrideById,
    this.overrideReason,
  });

  bool get isSupervisorAssisted {
    final actorId = overrideById?.trim();
    final reason = overrideReason;
    if (actorId == null || actorId.isEmpty || reason == null) return false;
    return const {
      'capture_unavailable',
      'permission_blocked',
      'device_failure',
    }.any((code) => reason.startsWith('$code:'));
  }

  factory ShiftAssignment.fromJson(Map<String, dynamic> j) {
    final shift = j['shift'] as Map<String, dynamic>?;
    final project = j['project'] as Map<String, dynamic>?;
    final record = j['attendanceRecord'] as Map<String, dynamic>?;
    return ShiftAssignment(
      id: j['id'] as String,
      projectId: (project?['id'] ?? j['projectId']) as String,
      projectName: (project?['name'] ?? '') as String,
      projectAddress: (project?['address'] ?? '') as String,
      projectLatitude: _toDouble(project?['latitude']),
      projectLongitude: _toDouble(project?['longitude']),
      geofenceRadiusMeters:
          (project?['geofenceRadiusMeters'] as num?)?.toInt() ?? 100,
      shiftId: (shift?['id'] ?? j['shiftId']) as String,
      shiftName: (shift?['name'] ?? '') as String,
      startTime: (shift?['startTime'] ?? '') as String,
      endTime: (shift?['endTime'] ?? '') as String,
      date: DateTime.parse(j['date'] as String),
      attendanceRecordId: record?['id'] as String?,
      checkInAt: record?['checkInAt'] != null
          ? DateTime.parse(record!['checkInAt'] as String).toLocal()
          : null,
      checkOutAt: record?['checkOutAt'] != null
          ? DateTime.parse(record!['checkOutAt'] as String).toLocal()
          : null,
      overrideById: record?['overrideById'] as String?,
      overrideReason: record?['overrideReason'] as String?,
    );
  }
}

double? _toDouble(Object? value) {
  if (value is num) return value.toDouble();
  return value is String ? double.tryParse(value) : null;
}

class AttendanceRepository {
  final HttpClient _http;
  AttendanceRepository({required HttpClient http}) : _http = http;

  Future<ShiftAssignment?> getMyToday() async {
    try {
      final res = await _http.get('/v1/attendance/my-today');
      if (res['id'] == null) return null; // no assignment
      return ShiftAssignment.fromJson(res);
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<Map<String, dynamic>> checkIn({
    required String shiftAssignmentId,
    required double latitude,
    required double longitude,
    required double accuracy,
    required String photoBase64,
  }) async {
    final res = await _http.post('/v1/attendance/check-in', data: {
      'shiftAssignmentId': shiftAssignmentId,
      'gps': {
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': accuracy
      },
      'photoBase64': photoBase64,
    });
    return res;
  }

  Future<Map<String, dynamic>> checkOut({
    required String shiftAssignmentId,
    required double latitude,
    required double longitude,
    required double accuracy,
    required String photoBase64,
  }) async {
    return _http.post('/v1/attendance/check-out', data: {
      'shiftAssignmentId': shiftAssignmentId,
      'gps': {
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': accuracy
      },
      'photoBase64': photoBase64,
    });
  }
}
