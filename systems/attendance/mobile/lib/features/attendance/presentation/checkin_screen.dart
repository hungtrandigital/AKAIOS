// Check-in/out screen — GPS + camera + submit.

import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';

import '../../../core/http_client.dart';
import '../../../l10n/app_localizations.dart';
import '../data/attendance_repository.dart';

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
  Position? _position;
  XFile? _photo;
  bool _loading = false;
  String? _errorMsg;

  Future<void> _getGps() async {
    setState(() {
      _loading = true;
      _errorMsg = null;
    });
    try {
      // Permission check
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permission denied');
        }
      }
      // Service check
      var serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('GPS service disabled');
      }
      _position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
    } catch (e) {
      setState(() => _errorMsg = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _takePhoto() async {
    try {
      final picker = ImagePicker();
      _photo = await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1280,
      );
      setState(() {});
    } catch (e) {
      setState(() => _errorMsg = 'Camera error: $e');
    }
  }

  Future<void> _submit() async {
    if (_position == null) {
      setState(() => _errorMsg = 'Vui lòng lấy vị trí trước');
      return;
    }
    if (_photo == null) {
      setState(() => _errorMsg = 'Vui lòng chụp ảnh');
      return;
    }

    setState(() {
      _loading = true;
      _errorMsg = null;
    });
    try {
      final bytes = await File(_photo!.path).readAsBytes();
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

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(widget.isCheckOut
                ? 'Check-out thành công'
                : 'Check-in thành công')),
      );
      context.go('/today');
    } on ApiException catch (e) {
      setState(() => _errorMsg = e.message);
    } catch (e) {
      setState(() => _errorMsg = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final action = widget.isCheckOut ? l.checkOut : l.checkIn;
    return Scaffold(
      appBar: AppBar(title: Text(action)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // GPS section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.location_on),
                        const SizedBox(width: 8),
                        Text('Vị trí',
                            style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_position != null) ...[
                      Text('Lat: ${_position!.latitude.toStringAsFixed(6)}'),
                      Text('Lng: ${_position!.longitude.toStringAsFixed(6)}'),
                    ] else
                      const Text('Chưa lấy vị trí'),
                    Text(
                        'Accuracy: ${_position?.accuracy.toStringAsFixed(1) ?? '-'} m'),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: _loading ? null : _getGps,
                      icon: const Icon(Icons.my_location),
                      label: Text(_position == null ? 'Lấy vị trí' : 'Lấy lại'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Photo section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.camera_alt),
                        const SizedBox(width: 8),
                        Text('Ảnh xác nhận',
                            style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_photo != null)
                      Container(
                        height: 200,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                        ),
                        child:
                            Image.file(File(_photo!.path), fit: BoxFit.cover),
                      )
                    else
                      Container(
                        height: 200,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          color: Colors.grey[200],
                        ),
                        child: const Center(child: Text('Chưa chụp ảnh')),
                      ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: _loading ? null : _takePhoto,
                      icon: const Icon(Icons.camera),
                      label: Text(_photo == null ? l.takePhoto : l.retakePhoto),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            if (_errorMsg != null)
              Text(_errorMsg!, style: const TextStyle(color: Colors.red)),
            const Spacer(),

            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(
                      widget.isCheckOut ? l.submitCheckOut : l.submitCheckIn),
            ),
          ],
        ),
      ),
    );
  }
}
