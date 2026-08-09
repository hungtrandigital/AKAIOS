// Check-in/out — fresh GPS + live camera photo, with explicit safe recovery.

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/http_client.dart';
import '../../../core/prismate_loading.dart';
import '../../../l10n/app_localizations.dart';
import '../data/attendance_repository.dart';

const maxAttendancePhotoBytes = 5 * 1024 * 1024;
const evidenceFreshness = Duration(minutes: 2);
const _uatSimulatedCameraRequested = bool.fromEnvironment(
  'UAT_SIMULATED_CAMERA',
  defaultValue: false,
);
const _uatFixtureJpegBase64 =
    '/9j/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCADwAUADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAT/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAb/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCMBWpQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//2Q==';

bool allowsUatSimulatedCamera({
  required bool isDebug,
  required bool requested,
  required bool isIos,
  required bool isSimulator,
}) =>
    isDebug && requested && isIos && isSimulator;

enum CaptureFlowState {
  idle,
  acquiringLocation,
  capturingPhoto,
  ready,
  submitting,
  success,
  cameraCancelled,
  cameraDenied,
  cameraUnavailable,
  cameraFailure,
  locationDenied,
  networkUnconfirmed,
  checkingStatus,
  failure,
}

enum CameraFailureKind { denied, unavailable, failure }

bool shouldOfferSupervisorFallback(CaptureFlowState state) => const {
      CaptureFlowState.cameraDenied,
      CaptureFlowState.cameraUnavailable,
      CaptureFlowState.cameraFailure,
      CaptureFlowState.checkingStatus,
    }.contains(state);

CameraFailureKind classifyCameraPlatformError(String? code) {
  switch (code) {
    case 'camera_access_denied':
    case 'camera_access_denied_without_prompt':
    case 'camera_access_restricted':
      return CameraFailureKind.denied;
    case 'no_available_camera':
    case 'camera_not_supported':
      return CameraFailureKind.unavailable;
    default:
      return CameraFailureKind.failure;
  }
}

bool isFreshEvidence(DateTime? capturedAt, DateTime now) {
  if (capturedAt == null) return false;
  final age = now.difference(capturedAt);
  return !age.isNegative && age <= evidenceFreshness;
}

bool hasJpegSignature(List<int> bytes) =>
    bytes.length >= 3 &&
    bytes[0] == 0xff &&
    bytes[1] == 0xd8 &&
    bytes[2] == 0xff;

bool hasRecordedAttendanceEvent(
  List<ShiftAssignment> assignments,
  String shiftAssignmentId,
  bool isCheckOut,
) {
  final matching = assignments.where((item) => item.id == shiftAssignmentId);
  if (matching.isEmpty) return false;
  final assignment = matching.first;
  return isCheckOut
      ? assignment.checkOutAt != null
      : assignment.checkInAt != null;
}

class CheckScreen extends ConsumerStatefulWidget {
  const CheckScreen({
    super.key,
    required this.shiftAssignmentId,
    required this.isCheckOut,
  });

  final String shiftAssignmentId;
  final bool isCheckOut;

  @override
  ConsumerState<CheckScreen> createState() => _CheckScreenState();
}

class _CheckScreenState extends ConsumerState<CheckScreen> {
  Position? _position;
  DateTime? _positionCapturedAt;
  XFile? _photo;
  DateTime? _photoCapturedAt;
  CaptureFlowState _flow = CaptureFlowState.idle;
  String? _message;
  bool _canOpenAppSettings = false;
  bool _canOpenLocationSettings = false;
  bool _usingUatSimulatedPhoto = false;

  bool get _uatSimulatedCameraEnabled => allowsUatSimulatedCamera(
        isDebug: kDebugMode,
        requested: _uatSimulatedCameraRequested,
        isIos: Platform.isIOS,
        isSimulator: Platform.environment.containsKey('SIMULATOR_UDID') ||
            Platform.environment.containsKey('SIMULATOR_DEVICE_NAME'),
      );

  bool get _busy => const {
        CaptureFlowState.acquiringLocation,
        CaptureFlowState.capturingPhoto,
        CaptureFlowState.submitting,
        CaptureFlowState.checkingStatus,
      }.contains(_flow);

  bool get _hasFreshEvidence {
    final now = DateTime.now();
    return _position != null &&
        _photo != null &&
        isFreshEvidence(_positionCapturedAt, now) &&
        isFreshEvidence(_photoCapturedAt, now);
  }

  Future<void> _getGps() async {
    _position = null;
    _positionCapturedAt = null;
    setState(() {
      _flow = CaptureFlowState.acquiringLocation;
      _message = null;
      _canOpenAppSettings = false;
      _canOpenLocationSettings = false;
    });
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (!mounted) return;
        setState(() {
          _flow = CaptureFlowState.locationDenied;
          _message =
              'GPS đang tắt. Chấm công chưa được ghi nhận. Cô/chú mở GPS rồi thử lại.';
          _canOpenLocationSettings = true;
        });
        return;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (!mounted) return;
        setState(() {
          _flow = CaptureFlowState.locationDenied;
          _message = permission == LocationPermission.deniedForever
              ? 'Quyền vị trí đang bị chặn trong Cài đặt. Chấm công chưa được ghi nhận.'
              : 'Cô/chú chưa cho phép dùng vị trí. Chấm công chưa được ghi nhận.';
          _canOpenAppSettings = permission == LocationPermission.deniedForever;
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      if (!mounted) return;
      setState(() {
        _position = position;
        _positionCapturedAt = DateTime.now();
        _flow = _photo == null ? CaptureFlowState.idle : CaptureFlowState.ready;
        _message = null;
      });
    } on TimeoutException {
      if (mounted) {
        setState(() {
          _flow = CaptureFlowState.failure;
          _message =
              'Lấy vị trí hơi lâu. Cô/chú đứng nơi thoáng hơn rồi thử lại.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _flow = CaptureFlowState.failure;
          _message =
              'Không lấy được vị trí. Chấm công chưa được ghi nhận. Vui lòng thử lại.';
        });
      }
    }
  }

  Future<void> _takePhoto() async {
    if (_position == null) {
      setState(() => _message = 'Cô/chú hoàn thành bước Vị trí trước nhé.');
      return;
    }
    final previousPhoto = _photo;
    _photo = null;
    _photoCapturedAt = null;
    _usingUatSimulatedPhoto = false;
    setState(() {
      _flow = CaptureFlowState.capturingPhoto;
      _message = null;
      _canOpenAppSettings = false;
    });
    await _deletePhoto(previousPhoto);
    XFile? pendingPhoto;
    try {
      var status = await Permission.camera.status;
      if (status.isDenied) status = await Permission.camera.request();
      if (status.isPermanentlyDenied || status.isRestricted) {
        if (!mounted) return;
        setState(() {
          _flow = CaptureFlowState.cameraDenied;
          _message =
              'Ứng dụng chưa được phép dùng camera. Cô/chú mở Cài đặt, bật Camera rồi chụp lại.';
          _canOpenAppSettings = true;
        });
        return;
      }
      if (!status.isGranted) {
        if (!mounted) return;
        setState(() {
          _flow = CaptureFlowState.cameraDenied;
          _message =
              'Ứng dụng chưa được phép dùng camera. Cô/chú cho phép Camera rồi chụp lại.';
        });
        return;
      }

      pendingPhoto = await ImagePicker().pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1280,
        preferredCameraDevice: CameraDevice.rear,
      );
      if (pendingPhoto == null) {
        if (!mounted) return;
        setState(() {
          _flow = CaptureFlowState.cameraCancelled;
          _message = 'Cô/chú chưa chụp ảnh. Bấm “Chụp ảnh” để tiếp tục.';
        });
        return;
      }

      final file = File(pendingPhoto.path);
      final size = await file.length();
      final header = await file.openRead(0, 3).fold<List<int>>(
        <int>[],
        (bytes, chunk) => bytes..addAll(chunk),
      );
      if (size <= 0 ||
          size > maxAttendancePhotoBytes ||
          !hasJpegSignature(header)) {
        await _deletePhoto(pendingPhoto);
        pendingPhoto = null;
        if (!mounted) return;
        setState(() {
          _flow = CaptureFlowState.failure;
          _message = size > maxAttendancePhotoBytes
              ? 'Ảnh quá lớn. Cô/chú chụp lại để hệ thống gửi được.'
              : 'Ảnh chưa dùng được. Cô/chú chụp lại nhé.';
        });
        return;
      }

      if (!mounted) {
        await _deletePhoto(pendingPhoto);
        return;
      }
      final acceptedPhoto = pendingPhoto;
      pendingPhoto = null;
      setState(() {
        _photo = acceptedPhoto;
        _photoCapturedAt = DateTime.now();
        _flow = CaptureFlowState.ready;
        _message = null;
      });
    } on PlatformException catch (error) {
      await _deletePhoto(pendingPhoto);
      _applyCameraFailure(classifyCameraPlatformError(error.code));
    } catch (_) {
      await _deletePhoto(pendingPhoto);
      _applyCameraFailure(CameraFailureKind.failure);
    }
  }

  Future<void> _useUatSimulatedPhoto() async {
    if (!_uatSimulatedCameraEnabled || _position == null || _busy) return;
    final previousPhoto = _photo;
    setState(() {
      _photo = null;
      _photoCapturedAt = null;
      _usingUatSimulatedPhoto = false;
      _flow = CaptureFlowState.capturingPhoto;
      _message = null;
    });
    await _deletePhoto(previousPhoto);

    File? fixture;
    try {
      fixture = File(
        '${Directory.systemTemp.path}/akaiunsan-uat-${DateTime.now().microsecondsSinceEpoch}.jpg',
      );
      await fixture.writeAsBytes(base64Decode(_uatFixtureJpegBase64),
          flush: true);
      final photo = XFile(fixture.path, mimeType: 'image/jpeg');
      if (!mounted) {
        await fixture.delete();
        return;
      }
      setState(() {
        _photo = photo;
        _photoCapturedAt = DateTime.now();
        _usingUatSimulatedPhoto = true;
        _flow = CaptureFlowState.ready;
        _message =
            'Đã dùng ảnh mô phỏng để kiểm thử trên Mac. Đây không phải ảnh camera thật.';
      });
    } catch (_) {
      if (fixture != null && await fixture.exists()) await fixture.delete();
      if (!mounted) return;
      setState(() {
        _flow = CaptureFlowState.cameraFailure;
        _message = 'Không tạo được ảnh mô phỏng UAT. Vui lòng thử lại.';
      });
    }
  }

  void _applyCameraFailure(CameraFailureKind kind) {
    if (!mounted) return;
    setState(() {
      _flow = switch (kind) {
        CameraFailureKind.denied => CaptureFlowState.cameraDenied,
        CameraFailureKind.unavailable => CaptureFlowState.cameraUnavailable,
        CameraFailureKind.failure => CaptureFlowState.cameraFailure,
      };
      _canOpenAppSettings = kind == CameraFailureKind.denied;
      _message = switch (kind) {
        CameraFailureKind.denied =>
          'Ứng dụng chưa được phép dùng camera. Cô/chú mở Cài đặt, bật Camera rồi chụp lại.',
        CameraFailureKind.unavailable =>
          'Điện thoại không mở được camera. Cô/chú thử lại một lần. Nếu vẫn chưa được, hãy nhờ giám sát hỗ trợ.',
        CameraFailureKind.failure =>
          'Camera đang gặp sự cố. Cô/chú thử lại một lần. Nếu vẫn chưa được, hãy nhờ giám sát hỗ trợ.',
      };
    });
  }

  Future<void> _submit() async {
    final now = DateTime.now();
    if (!_hasFreshEvidence) {
      setState(() {
        _flow = CaptureFlowState.failure;
        _message = _position == null
            ? 'Cô/chú cần lấy vị trí trước.'
            : _photo == null
                ? 'Cô/chú cần chụp ảnh trực tiếp trước.'
                : 'Vị trí hoặc ảnh đã quá 2 phút. Cô/chú vui lòng lấy lại để chấm công chính xác.';
        if (!isFreshEvidence(_positionCapturedAt, now)) {
          _position = null;
          _positionCapturedAt = null;
        }
      });
      return;
    }

    setState(() {
      _flow = CaptureFlowState.submitting;
      _message = null;
    });
    try {
      final file = File(_photo!.path);
      final size = await file.length();
      if (size <= 0 || size > maxAttendancePhotoBytes) {
        throw const FormatException('Invalid attendance photo');
      }
      final bytes = await file.readAsBytes();
      if (!hasJpegSignature(bytes)) {
        throw const FormatException('Invalid attendance photo');
      }
      final photoBase64 = base64Encode(bytes);
      final repo = ref.read(attendanceRepositoryProvider);
      if (widget.isCheckOut) {
        await repo.checkOut(
          shiftAssignmentId: widget.shiftAssignmentId,
          latitude: _position!.latitude,
          longitude: _position!.longitude,
          accuracy: _position!.accuracy,
          photoBase64: photoBase64,
        );
      } else {
        await repo.checkIn(
          shiftAssignmentId: widget.shiftAssignmentId,
          latitude: _position!.latitude,
          longitude: _position!.longitude,
          accuracy: _position!.accuracy,
          photoBase64: photoBase64,
        );
      }
      await _completeSuccess();
    } on ApiException catch (error) {
      if (error.statusCode == 0 || error.statusCode == 409) {
        await _reconcileAfterUnconfirmedRequest();
      } else if (mounted) {
        setState(() {
          _flow = CaptureFlowState.failure;
          _message = _friendlyAttendanceError(error);
        });
      }
    } on FormatException {
      await _invalidatePhotoEvidence();
    } on FileSystemException {
      await _invalidatePhotoEvidence();
    } catch (_) {
      if (mounted) {
        setState(() {
          _flow = CaptureFlowState.failure;
          _message =
              'Không gửi được chấm công. Chưa có xác nhận từ hệ thống; cô/chú vui lòng kiểm tra trạng thái.';
        });
      }
    }
  }

  Future<void> _invalidatePhotoEvidence() async {
    final invalidPhoto = _photo;
    if (mounted) {
      setState(() {
        _photo = null;
        _photoCapturedAt = null;
        _flow = CaptureFlowState.failure;
        _message =
            'Ảnh chưa dùng được. Chấm công chưa được ghi nhận; cô/chú chụp lại nhé.';
      });
    }
    await _deletePhoto(invalidPhoto);
  }

  Future<void> _reconcileAfterUnconfirmedRequest() async {
    if (!mounted) return;
    setState(() {
      _flow = CaptureFlowState.networkUnconfirmed;
      _message =
          'Mạng bị gián đoạn nên chưa biết hệ thống đã nhận hay chưa. Đang kiểm tra trạng thái…';
    });
    try {
      final assignment =
          await ref.read(attendanceRepositoryProvider).getMyToday();
      final recorded = hasRecordedAttendanceEvent(
        assignment,
        widget.shiftAssignmentId,
        widget.isCheckOut,
      );
      if (recorded) {
        await _completeSuccess();
        return;
      }
      if (!mounted) return;
      setState(() {
        _flow = _hasFreshEvidence
            ? CaptureFlowState.ready
            : CaptureFlowState.failure;
        _message =
            'Hệ thống chưa ghi nhận. Cô/chú có thể bấm xác nhận lại khi mạng ổn định.';
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _flow = CaptureFlowState.networkUnconfirmed;
          _message =
              'Chưa thể kiểm tra kết quả. Không bấm gửi liên tục; cô/chú kiểm tra mạng rồi bấm “Kiểm tra trạng thái”.';
        });
      }
    }
  }

  Future<void> _checkSupervisorRecord() async {
    if (!mounted) return;
    final returnFlow = _flow;
    setState(() {
      _flow = CaptureFlowState.checkingStatus;
      _message = 'Đang kiểm tra bản ghi từ giám sát…';
    });
    try {
      final assignment =
          await ref.read(attendanceRepositoryProvider).getMyToday();
      final recorded = hasRecordedAttendanceEvent(
        assignment,
        widget.shiftAssignmentId,
        widget.isCheckOut,
      );
      if (recorded) {
        await _completeSuccess(
          message: 'Giám sát đã ghi nhận chấm công giúp cô/chú.',
        );
        return;
      }
      if (!mounted) return;
      setState(() {
        _flow = returnFlow;
        _message =
            'Chưa thấy bản ghi mới. Cô/chú báo giám sát, rồi bấm “Kiểm tra lại chấm công”.';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _flow = returnFlow;
        _message =
            'Chưa kiểm tra được. Cô/chú xem lại Wi-Fi hoặc 4G rồi thử lại.';
      });
    }
  }

  Future<void> _completeSuccess({String? message}) async {
    final successPhoto = _photo;
    _photo = null;
    _photoCapturedAt = null;
    await _deletePhoto(successPhoto);
    if (!mounted) return;
    setState(() => _flow = CaptureFlowState.success);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message ??
            (widget.isCheckOut
                ? 'Đã ghi nhận ra ca thành công.'
                : 'Đã ghi nhận vào ca thành công.')),
      ),
    );
    if (context.canPop()) {
      context.pop(true);
    } else {
      context.go('/today');
    }
  }

  String _friendlyAttendanceError(ApiException error) {
    if (error.statusCode == 403 || error.statusCode == 404) {
      return 'Ca này không còn hợp lệ cho tài khoản. Cô/chú quay lại và nhờ giám sát kiểm tra.';
    }
    if (error.statusCode == 422) {
      return 'Vị trí hoặc dữ liệu chấm công chưa hợp lệ. Cô/chú kiểm tra lại từng bước.';
    }
    return 'Hệ thống chưa ghi nhận chấm công. Cô/chú vui lòng thử lại hoặc nhờ giám sát hỗ trợ.';
  }

  Future<void> _deletePhoto(XFile? photo) async {
    if (photo == null) return;
    try {
      final file = File(photo.path);
      if (await file.exists()) await file.delete();
    } catch (_) {
      // Best-effort cleanup of the image-picker cache file.
    }
  }

  void _showSupervisorHelp() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * .9,
          ),
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(
              24,
              4,
              24,
              24 + MediaQuery.viewInsetsOf(context).bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Nhờ giám sát hỗ trợ',
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                Text(
                  'Chỉ dùng cách này khi cô/chú đã thử lại nhưng camera vẫn không mở được.',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 12),
                const _HelpLine(
                    number: '1',
                    text:
                        'Báo camera bị lỗi cho giám sát đang trực tại dự án.'),
                const _HelpLine(
                    number: '2',
                    text: 'Giám sát xác nhận cô/chú có mặt và ghi nhận giúp.'),
                const _HelpLine(
                    number: '3',
                    text:
                        'Quay lại màn hình này và bấm “Kiểm tra lại chấm công”.'),
                const SizedBox(height: 10),
                Text(
                  'Không dùng ảnh cũ và không đưa tài khoản cho người khác.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 18),
                FilledButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    unawaited(_checkSupervisorRecord());
                  },
                  icon: const Icon(Icons.sync),
                  label: const Text('Kiểm tra lại chấm công'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Đóng'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    unawaited(_deletePhoto(_photo));
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(widget.isCheckOut ? 'Ra ca' : 'Vào ca')),
      body: SafeArea(
        top: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 620),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
              children: [
                _CheckFlowHero(
                  isCheckOut: widget.isCheckOut,
                  hasLocation: _position != null,
                  hasPhoto: _photo != null,
                ),
                if (_uatSimulatedCameraEnabled) ...[
                  const SizedBox(height: 14),
                  const _UatModeBanner(),
                ],
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F2E4),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.verified_user_outlined,
                          color: Color(0xFF4F601A), size: 30),
                      const SizedBox(width: 13),
                      Expanded(
                        child: Text(
                          'App cần vị trí và ảnh chụp trực tiếp để xác nhận cô/chú đang ở đúng dự án. Ảnh chỉ được gửi khi bấm xác nhận.',
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _StepCard(
                  number: 1,
                  title: 'Vị trí',
                  description: _position == null
                      ? 'Cho phép app lấy vị trí hiện tại.'
                      : 'Đã lấy vị trí với độ chính xác khoảng ${_position!.accuracy.round()} m.',
                  complete: _position != null,
                  busy: _flow == CaptureFlowState.acquiringLocation,
                  actionLabel:
                      _position == null ? 'Lấy vị trí' : 'Lấy lại vị trí',
                  busyLabel: 'Đang lấy vị trí…',
                  actionIcon: Icons.my_location,
                  primary: _position == null,
                  onPressed: _busy ? null : _getGps,
                ),
                const SizedBox(height: 14),
                _StepCard(
                  number: 2,
                  title: 'Ảnh xác nhận',
                  description: _photo == null
                      ? _position == null
                          ? 'Hoàn thành vị trí trước, sau đó chụp ảnh.'
                          : 'Chụp ảnh mới bằng camera. Không chọn ảnh cũ.'
                      : 'Đã có ảnh mới. Cô/chú có thể chụp lại nếu cần.',
                  complete: _photo != null,
                  busy: _flow == CaptureFlowState.capturingPhoto,
                  actionLabel: _photo == null ? l.takePhoto : l.retakePhoto,
                  busyLabel: 'Đang mở camera…',
                  actionIcon: Icons.camera_alt_outlined,
                  primary: _position != null && _photo == null,
                  onPressed: _busy || _position == null ? null : _takePhoto,
                  preview: _photo == null
                      ? null
                      : Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child: AspectRatio(
                                aspectRatio: 4 / 3,
                                child: Image.file(
                                  File(_photo!.path),
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Center(
                                    child: Text(
                                        'Không xem được ảnh. Vui lòng chụp lại.'),
                                  ),
                                ),
                              ),
                            ),
                            if (_usingUatSimulatedPhoto)
                              Positioned(
                                left: 10,
                                bottom: 10,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1B2512),
                                    borderRadius: BorderRadius.circular(99),
                                  ),
                                  child: const Text(
                                    'ẢNH MÔ PHỎNG UAT',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: .4,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                ),
                if (_uatSimulatedCameraEnabled && _position != null) ...[
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: _busy ? null : _useUatSimulatedPhoto,
                    icon: const Icon(Icons.science_outlined),
                    label: Text(
                      _photo == null
                          ? 'Dùng ảnh mô phỏng UAT'
                          : 'Nạp lại ảnh mô phỏng UAT',
                    ),
                  ),
                ],
                if (_message != null) ...[
                  const SizedBox(height: 16),
                  _StatusPanel(
                    message: _message!,
                    warning: _flow != CaptureFlowState.ready,
                  ),
                ],
                if (_canOpenAppSettings || _canOpenLocationSettings) ...[
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: _busy
                        ? null
                        : () async {
                            if (_canOpenLocationSettings) {
                              await Geolocator.openLocationSettings();
                            } else {
                              await openAppSettings();
                            }
                          },
                    icon: const Icon(Icons.settings_outlined),
                    label: const Text('Mở Cài đặt điện thoại'),
                  ),
                ],
                const SizedBox(height: 16),
                CameraRecoveryPanel(
                  state: _flow,
                  busy: _busy,
                  onShowHelp: _showSupervisorHelp,
                  onRecheck: _checkSupervisorRecord,
                ),
                const SizedBox(height: 22),
                Text('Bước 3 · Xác nhận',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(
                  _hasFreshEvidence
                      ? _usingUatSimulatedPhoto
                          ? 'Đủ dữ liệu UAT. Kết quả sẽ mang ảnh mô phỏng, không dùng làm bằng chứng thực địa.'
                          : 'Hai bước đã đủ. Cô/chú kiểm tra rồi bấm nút bên dưới.'
                      : 'Nút chỉ sáng khi đã có vị trí và ảnh mới.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 14),
                if (_flow == CaptureFlowState.networkUnconfirmed)
                  FilledButton.icon(
                    onPressed: _busy ? null : _reconcileAfterUnconfirmedRequest,
                    icon: const Icon(Icons.sync),
                    label: const Text('Kiểm tra trạng thái'),
                  )
                else
                  FilledButton.icon(
                    onPressed: _busy || !_hasFreshEvidence ? null : _submit,
                    icon: _flow == CaptureFlowState.submitting
                        ? const PrismateLoadingMark(
                            width: 42,
                            tint: Colors.white,
                          )
                        : Icon(widget.isCheckOut ? Icons.logout : Icons.login),
                    label: Text(_flow == CaptureFlowState.submitting
                        ? 'Đang ghi nhận…'
                        : widget.isCheckOut
                            ? l.submitCheckOut
                            : l.submitCheckIn),
                  ),
                const SizedBox(height: 10),
                TextButton.icon(
                  onPressed: _busy
                      ? null
                      : () {
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/today');
                          }
                        },
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Quay lại ca hôm nay'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CheckFlowHero extends StatelessWidget {
  const _CheckFlowHero({
    required this.isCheckOut,
    required this.hasLocation,
    required this.hasPhoto,
  });

  final bool isCheckOut;
  final bool hasLocation;
  final bool hasPhoto;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
      decoration: BoxDecoration(
        color: const Color(0xFF1B2512),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isCheckOut ? Icons.logout_rounded : Icons.login_rounded,
            color: const Color(0xFFC7DC50),
            size: 32,
          ),
          const SizedBox(height: 12),
          Text(
            isCheckOut ? 'Xác nhận ra ca' : 'Xác nhận vào ca',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontSize: 27,
                ),
          ),
          const SizedBox(height: 5),
          Text(
            'Hoàn thành lần lượt vị trí, ảnh mới và xác nhận.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFFE7EAD9),
                ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: _HeroStep(
                  number: '1',
                  label: 'Vị trí',
                  done: hasLocation,
                ),
              ),
              const _HeroConnector(),
              Expanded(
                child: _HeroStep(
                  number: '2',
                  label: 'Ảnh mới',
                  done: hasPhoto,
                ),
              ),
              const _HeroConnector(),
              const Expanded(
                child: _HeroStep(number: '3', label: 'Gửi', done: false),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroStep extends StatelessWidget {
  const _HeroStep({
    required this.number,
    required this.label,
    required this.done,
  });

  final String number;
  final String label;
  final bool done;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: done ? const Color(0xFFC7DC50) : Colors.white,
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: done
              ? const Icon(Icons.check, color: Color(0xFF1B2512), size: 21)
              : Text(
                  number,
                  style: const TextStyle(
                    color: Color(0xFF1B2512),
                    fontWeight: FontWeight.w800,
                  ),
                ),
        ),
        const SizedBox(height: 5),
        Text(
          label,
          maxLines: 2,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _HeroConnector extends StatelessWidget {
  const _HeroConnector();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20,
      height: 2,
      margin: const EdgeInsets.fromLTRB(4, 0, 4, 24),
      color: const Color(0xFF7E8860),
    );
  }
}

class _UatModeBanner extends StatelessWidget {
  const _UatModeBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF4E8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF2C7A5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.science_outlined, color: Color(0xFF9B3A10)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Đang bật mô phỏng camera cho UAT trên Mac. Chỉ bản debug mới có chế độ này.',
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

class CameraRecoveryPanel extends StatelessWidget {
  const CameraRecoveryPanel({
    super.key,
    required this.state,
    required this.busy,
    required this.onShowHelp,
    required this.onRecheck,
  });

  final CaptureFlowState state;
  final bool busy;
  final VoidCallback onShowHelp;
  final VoidCallback onRecheck;

  @override
  Widget build(BuildContext context) {
    final cameraProblem = shouldOfferSupervisorFallback(state);
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      child: cameraProblem
          ? Container(
              key: const ValueKey('camera-failure-recovery'),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF4E8),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFF2C7A5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Chấm công chưa được ghi nhận',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Nếu đã thử lại mà camera vẫn không mở, cô/chú nhờ giám sát tại dự án xác nhận giúp.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: busy ? null : onShowHelp,
                    icon: const Icon(Icons.supervisor_account_outlined),
                    label: const Text('Nhờ giám sát hỗ trợ'),
                  ),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: busy ? null : onRecheck,
                    icon: state == CaptureFlowState.checkingStatus
                        ? const PrismateLoadingMark(width: 38)
                        : const Icon(Icons.sync),
                    label: Text(
                      state == CaptureFlowState.checkingStatus
                          ? 'Đang kiểm tra…'
                          : 'Kiểm tra lại chấm công',
                    ),
                  ),
                ],
              ),
            )
          : Align(
              key: const ValueKey('camera-help-link'),
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: busy ? null : onShowHelp,
                icon: const Icon(Icons.help_outline),
                label: const Text('Không chụp được ảnh?'),
              ),
            ),
    );
  }
}

class _StepCard extends StatelessWidget {
  const _StepCard({
    required this.number,
    required this.title,
    required this.description,
    required this.complete,
    required this.busy,
    required this.actionLabel,
    required this.busyLabel,
    required this.actionIcon,
    required this.primary,
    required this.onPressed,
    this.preview,
  });

  final int number;
  final String title;
  final String description;
  final bool complete;
  final bool busy;
  final String actionLabel;
  final String busyLabel;
  final IconData actionIcon;
  final bool primary;
  final VoidCallback? onPressed;
  final Widget? preview;

  @override
  Widget build(BuildContext context) {
    final button = primary
        ? FilledButton.icon(
            onPressed: onPressed,
            icon: busy
                ? const PrismateLoadingMark(
                    width: 40,
                    tint: Colors.white,
                  )
                : Icon(actionIcon),
            label: Text(busy ? busyLabel : actionLabel),
          )
        : OutlinedButton.icon(
            onPressed: onPressed,
            icon:
                busy ? const PrismateLoadingMark(width: 40) : Icon(actionIcon),
            label: Text(busy ? busyLabel : actionLabel),
          );
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: complete
                        ? const Color(0xFFE8EDC8)
                        : const Color(0xFFF0F2E4),
                    shape: BoxShape.circle,
                  ),
                  child: complete
                      ? const Icon(Icons.check,
                          color: Color(0xFF4F601A), size: 24)
                      : Text(
                          '$number',
                          style: const TextStyle(
                            color: Color(0xFF4F601A),
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 4),
                      Text(description,
                          style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                ),
              ],
            ),
            if (preview != null) ...[
              const SizedBox(height: 16),
              preview!,
            ],
            const SizedBox(height: 16),
            button,
          ],
        ),
      ),
    );
  }
}

class _StatusPanel extends StatelessWidget {
  const _StatusPanel({required this.message, required this.warning});

  final String message;
  final bool warning;

  @override
  Widget build(BuildContext context) {
    final color = warning ? const Color(0xFF9B3A10) : const Color(0xFF4F601A);
    return Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: warning ? const Color(0xFFFFF4E8) : const Color(0xFFF0F2E4),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(.28)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(warning ? Icons.info_outline : Icons.check_circle_outline,
                color: color),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: Theme.of(context)
                    .textTheme
                    .bodyLarge
                    ?.copyWith(color: color, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HelpLine extends StatelessWidget {
  const _HelpLine({required this.number, required this.text});

  final String number;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: Color(0xFFF0F2E4),
              shape: BoxShape.circle,
            ),
            child: Text(number,
                style: const TextStyle(
                    color: Color(0xFF4F601A), fontWeight: FontWeight.w800)),
          ),
          const SizedBox(width: 10),
          Expanded(
              child: Text(text, style: Theme.of(context).textTheme.bodyLarge)),
        ],
      ),
    );
  }
}
