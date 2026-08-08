// Check-in/out screen — reference layout with live GPS, camera and submit.

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/http_client.dart';
import '../data/attendance_repository.dart';
import 'attendance_widgets.dart';
import 'today_screen.dart';

class CheckScreen extends ConsumerStatefulWidget {
  final String shiftAssignmentId;
  final bool isCheckOut;

  const CheckScreen({
    super.key,
    required this.shiftAssignmentId,
    required this.isCheckOut,
  });

  @override
  ConsumerState<CheckScreen> createState() => _CheckScreenState();
}

class _CheckScreenState extends ConsumerState<CheckScreen> {
  late Future<ShiftAssignment?> _assignmentFuture;
  late DateTime _now;
  Timer? _clock;
  Position? _position;
  XFile? _photo;
  bool _locating = false;
  bool _submitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _assignmentFuture = ref.read(attendanceRepositoryProvider).getMyToday();
    _clock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _getGps());
  }

  @override
  void dispose() {
    _clock?.cancel();
    super.dispose();
  }

  Future<void> _getGps() async {
    if (_locating || _submitting) return;
    setState(() {
      _locating = true;
      _errorMessage = null;
    });

    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied) {
        throw Exception('Cần quyền truy cập vị trí để chấm công.');
      }
      if (permission == LocationPermission.deniedForever) {
        throw Exception(
          'Quyền vị trí đã bị tắt. Vui lòng bật lại trong Cài đặt.',
        );
      }
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw Exception('GPS đang tắt. Vui lòng bật dịch vụ vị trí.');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      if (!mounted) return;
      setState(() => _position = position);
    } catch (error) {
      if (!mounted) return;
      setState(() => _errorMessage = _cleanError(error));
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _takePhoto() async {
    if (_submitting) return;
    try {
      final photo = await ImagePicker().pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1280,
      );
      if (!mounted || photo == null) return;
      setState(() {
        _photo = photo;
        _errorMessage = null;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Không thể mở camera: ${_cleanError(error)}';
      });
    }
  }

  double? _distanceToProject(ShiftAssignment assignment) {
    final latitude = assignment.projectLatitude;
    final longitude = assignment.projectLongitude;
    final position = _position;
    if (latitude == null || longitude == null || position == null) return null;
    return Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      latitude,
      longitude,
    );
  }

  bool? _isInsideProject(ShiftAssignment assignment) {
    final distance = _distanceToProject(assignment);
    if (distance == null) return null;
    return distance <= assignment.geofenceRadiusMeters;
  }

  Future<void> _submit(ShiftAssignment assignment) async {
    if (_position == null) {
      setState(() => _errorMessage = 'Vui lòng xác định vị trí trước.');
      await _getGps();
      return;
    }
    if (_isInsideProject(assignment) == false) {
      setState(() {
        _errorMessage =
            'Bạn đang ở ngoài khu vực làm việc. Vui lòng di chuyển đến '
            'công trình để chấm công.';
      });
      return;
    }
    if (_photo == null) {
      setState(() => _errorMessage = 'Vui lòng chụp ảnh xác minh trước.');
      return;
    }

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });
    try {
      final bytes = await File(_photo!.path).readAsBytes();
      final photoBase64 = base64Encode(bytes);
      final repository = ref.read(attendanceRepositoryProvider);

      if (widget.isCheckOut) {
        await repository.checkOut(
          shiftAssignmentId: widget.shiftAssignmentId,
          latitude: _position!.latitude,
          longitude: _position!.longitude,
          accuracy: _position!.accuracy,
          photoBase64: photoBase64,
        );
      } else {
        await repository.checkIn(
          shiftAssignmentId: widget.shiftAssignmentId,
          latitude: _position!.latitude,
          longitude: _position!.longitude,
          accuracy: _position!.accuracy,
          photoBase64: photoBase64,
        );
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.isCheckOut ? 'Check-out thành công' : 'Check-in thành công',
          ),
          backgroundColor: attendanceGreen,
        ),
      );
      context.go('/today');
    } on ApiException catch (error) {
      if (mounted) setState(() => _errorMessage = error.message);
    } catch (error) {
      if (mounted) setState(() => _errorMessage = _cleanError(error));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _cleanError(Object error) {
    return error.toString().replaceFirst('Exception: ', '');
  }

  void _showComingSoon() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Tính năng này sẽ được cập nhật sớm.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            DailyAttendanceHeader(
              now: _now,
              leadingIcon: Icons.arrow_back_rounded,
              onLeading: () => context.go('/today'),
              onNotifications: _showComingSoon,
            ),
            Expanded(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: FutureBuilder<ShiftAssignment?>(
                    future: _assignmentFuture,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState != ConnectionState.done) {
                        return const Center(
                          child: CircularProgressIndicator(
                            color: attendanceBlue,
                          ),
                        );
                      }
                      final assignment = snapshot.data;
                      if (snapshot.hasError || assignment == null) {
                        return ListView(
                          padding: const EdgeInsets.all(20),
                          children: [
                            AttendanceMessageCard(
                              icon: Icons.cloud_off_rounded,
                              title: 'Không tải được ca làm việc',
                              message: snapshot.hasError
                                  ? snapshot.error.toString()
                                  : 'Ca làm việc không còn khả dụng.',
                              color: attendanceRed,
                              onRetry: () {
                                setState(() {
                                  _assignmentFuture = ref
                                      .read(attendanceRepositoryProvider)
                                      .getMyToday();
                                });
                              },
                            ),
                          ],
                        );
                      }

                      final distance = _distanceToProject(assignment);
                      final isInside = _isInsideProject(assignment);
                      return ListView(
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
                            hasPosition: _position != null,
                            isInside: isInside,
                            distanceMeters: distance,
                            radiusMeters: assignment.geofenceRadiusMeters,
                            loading: _locating,
                            onRefresh: _submitting ? null : _getGps,
                          ),
                          const SizedBox(height: 20),
                          CircularAttendanceAction(
                            isCheckOut: widget.isCheckOut,
                            loading: _submitting,
                            onPressed: () => _submit(assignment),
                          ),
                          const SizedBox(height: 20),
                          PhotoVerificationCard(
                            isCheckOut: widget.isCheckOut,
                            preview: _photo == null
                                ? null
                                : FileImage(File(_photo!.path)),
                            onTakePhoto: _submitting ? null : _takePhoto,
                          ),
                          if (_errorMessage != null) ...[
                            const SizedBox(height: 14),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFECEC),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: attendanceRed.withOpacity(0.25),
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(
                                    Icons.error_outline_rounded,
                                    color: attendanceRed,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _errorMessage!,
                                      style: const TextStyle(
                                        color: Color(0xFFB42328),
                                        fontSize: 12,
                                        height: 1.4,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      );
                    },
                  ),
                ),
              ),
            ),
            AttendanceBottomNavigation(
              onHome: () => context.go('/today'),
              onPlaceholder: _showComingSoon,
              onAttendance: () {},
            ),
          ],
        ),
      ),
    );
  }
}
