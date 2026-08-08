import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../data/attendance_repository.dart';

const attendanceGreen = Color(0xFF18A957);
const attendanceRed = Color(0xFFEF3F43);
const attendanceBlue = Color(0xFF2878E3);
const attendanceInk = Color(0xFF152238);
const attendanceMuted = Color(0xFF667085);
const attendanceBackground = Color(0xFFF7F8FA);

String formatVietnameseDate(DateTime value) {
  const weekdays = <String>[
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
    'Chủ Nhật',
  ];
  return '${weekdays[value.weekday - 1]}, ${DateFormat('dd/MM/yyyy').format(value)}';
}

String formatWorkDuration(DateTime start, DateTime end) {
  final duration = end.difference(start);
  if (duration.isNegative) return '00:00:00';
  final hours = duration.inHours.toString().padLeft(2, '0');
  final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
  final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
  return '$hours:$minutes:$seconds';
}

class DailyAttendanceHeader extends StatelessWidget {
  final DateTime now;
  final IconData leadingIcon;
  final VoidCallback onLeading;
  final VoidCallback onNotifications;

  const DailyAttendanceHeader({
    super.key,
    required this.now,
    required this.leadingIcon,
    required this.onLeading,
    required this.onNotifications,
  });

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
        child: Column(
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: onLeading,
                  icon: Icon(leadingIcon),
                  color: attendanceInk,
                  tooltip: leadingIcon == Icons.arrow_back_rounded
                      ? 'Quay lại'
                      : 'Menu',
                ),
                const Expanded(
                  child: Text(
                    'Chấm công hằng ngày',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: attendanceInk,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: onNotifications,
                  icon: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      const Icon(Icons.notifications_none_rounded),
                      Positioned(
                        right: -1,
                        top: -1,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: attendanceRed,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                  color: attendanceInk,
                  tooltip: 'Thông báo',
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Expanded(
                  flex: 4,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      const Icon(
                        Icons.calendar_today_outlined,
                        size: 18,
                        color: attendanceInk,
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerRight,
                          child: Text(
                            formatVietnameseDate(now),
                            maxLines: 1,
                            style: const TextStyle(
                              color: attendanceInk,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 1,
                  height: 22,
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  color: const Color(0xFFD9DDE4),
                ),
                Expanded(
                  flex: 3,
                  child: Row(
                    children: [
                      const Icon(
                        Icons.access_time_rounded,
                        size: 19,
                        color: attendanceInk,
                      ),
                      const SizedBox(width: 7),
                      Text(
                        DateFormat('HH:mm:ss').format(now),
                        style: const TextStyle(
                          color: attendanceBlue,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class ShiftSummaryCard extends StatelessWidget {
  final ShiftAssignment assignment;

  const ShiftSummaryCard({super.key, required this.assignment});

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: attendanceGreen,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: attendanceGreen.withOpacity(0.2),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.calendar_month_rounded,
                color: Colors.white,
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          '${assignment.shiftName}: '
                          '${assignment.startTime} - ${assignment.endTime}',
                          style: const TextStyle(
                            color: attendanceGreen,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            height: 1.25,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: attendanceGreen,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Text(
                          'Ca chính',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _InfoLine(
                    icon: Icons.apartment_rounded,
                    text: assignment.projectName,
                  ),
                  const SizedBox(height: 9),
                  _InfoLine(
                    icon: Icons.location_on_outlined,
                    text: assignment.projectAddress.isEmpty
                        ? 'Địa chỉ công trình chưa được cập nhật'
                        : assignment.projectAddress,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CheckInStatusBanner extends StatelessWidget {
  final DateTime checkInAt;
  final DateTime? checkOutAt;
  final DateTime now;

  const CheckInStatusBanner({
    super.key,
    required this.checkInAt,
    required this.now,
    this.checkOutAt,
  });

  @override
  Widget build(BuildContext context) {
    final end = checkOutAt ?? now;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F8EF),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: attendanceGreen, size: 22),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              checkOutAt == null
                  ? 'Check-in thành công lúc ${DateFormat('HH:mm').format(checkInAt)}'
                  : 'Đã hoàn thành ca lúc ${DateFormat('HH:mm').format(checkOutAt!)}',
              style: const TextStyle(
                color: Color(0xFF168347),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text(
                'Thời gian làm việc',
                style: TextStyle(color: attendanceMuted, fontSize: 10),
              ),
              Text(
                formatWorkDuration(checkInAt, end),
                style: const TextStyle(
                  color: attendanceGreen,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class LocationVerificationPanel extends StatelessWidget {
  final bool hasPosition;
  final bool? isInside;
  final double? distanceMeters;
  final int radiusMeters;
  final bool loading;
  final VoidCallback? onRefresh;

  const LocationVerificationPanel({
    super.key,
    required this.hasPosition,
    required this.radiusMeters,
    this.isInside,
    this.distanceMeters,
    this.loading = false,
    this.onRefresh,
  });

  Color get _statusColor {
    if (!hasPosition) return attendanceBlue;
    return isInside == true ? attendanceGreen : attendanceRed;
  }

  String get _statusText {
    if (loading) return 'Đang xác định vị trí...';
    if (!hasPosition) return 'Xác thực vị trí khi chấm công';
    if (isInside == true) return 'Đã vào đúng vị trí công trình';
    return 'Bạn đang ở ngoài khu vực làm việc';
  }

  @override
  Widget build(BuildContext context) {
    final distanceLabel =
        distanceMeters == null ? null : '${distanceMeters!.round()}m';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'VỊ TRÍ HIỆN TẠI',
                style: TextStyle(
                  color: attendanceInk,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.4,
                ),
              ),
            ),
            Flexible(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: _statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (loading)
                      SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: _statusColor,
                        ),
                      )
                    else
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _statusColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        _statusText,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: _statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        _SurfaceCard(
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              SizedBox(
                height: 184,
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: CustomPaint(
                        painter: _LocationMapPainter(
                          hasPosition: hasPosition,
                          isInside: isInside,
                        ),
                      ),
                    ),
                    if (onRefresh != null)
                      Positioned(
                        top: 10,
                        right: 10,
                        child: Material(
                          color: Colors.white,
                          elevation: 2,
                          shape: const CircleBorder(),
                          child: IconButton(
                            onPressed: loading ? null : onRefresh,
                            icon: const Icon(Icons.my_location_rounded),
                            color: attendanceBlue,
                            iconSize: 20,
                            tooltip: 'Cập nhật vị trí',
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 13,
                  vertical: 10,
                ),
                color: Colors.white,
                child: Row(
                  children: [
                    Icon(
                      isInside == false
                          ? Icons.error_outline_rounded
                          : Icons.location_on_rounded,
                      color: _statusColor,
                      size: 19,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        !hasPosition
                            ? onRefresh == null
                                ? 'Vị trí sẽ được xác thực ở bước chấm công '
                                    '(bán kính ${radiusMeters}m)'
                                : 'Nhấn định vị để kiểm tra bán kính '
                                    '${radiusMeters}m'
                            : isInside == true
                                ? 'Bạn đang trong khu vực cho phép '
                                    '(bán kính ${radiusMeters}m)'
                                : 'Cách công trình ${distanceLabel ?? '--'} · '
                                    'vui lòng di chuyển vào bán kính ${radiusMeters}m',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: _statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class CircularAttendanceAction extends StatelessWidget {
  final bool isCheckOut;
  final bool loading;
  final VoidCallback? onPressed;

  const CircularAttendanceAction({
    super.key,
    required this.isCheckOut,
    required this.onPressed,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isCheckOut ? attendanceRed : attendanceGreen;
    return Center(
      child: Semantics(
        button: true,
        label: isCheckOut ? 'Kết thúc ca' : 'Bắt đầu vào ca',
        child: Material(
          color: color.withOpacity(0.13),
          shape: const CircleBorder(),
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: InkWell(
              onTap: loading ? null : onPressed,
              customBorder: const CircleBorder(),
              child: Ink(
                width: 152,
                height: 152,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: color.withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                    const BoxShadow(
                      color: Colors.white24,
                      blurRadius: 2,
                      offset: Offset(-2, -2),
                    ),
                  ],
                ),
                child: loading
                    ? const Center(
                        child: SizedBox(
                          width: 30,
                          height: 30,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 3,
                          ),
                        ),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isCheckOut
                                ? Icons.logout_rounded
                                : Icons.login_rounded,
                            color: Colors.white,
                            size: 32,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            isCheckOut
                                ? 'KẾT THÚC CA\n(CHECK-OUT)'
                                : 'BẮT ĐẦU\nVÀO CA\n(CHECK-IN)',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              height: 1.2,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class PhotoVerificationCard extends StatelessWidget {
  final bool isCheckOut;
  final ImageProvider? preview;
  final VoidCallback? onTakePhoto;

  const PhotoVerificationCard({
    super.key,
    required this.isCheckOut,
    required this.onTakePhoto,
    this.preview,
  });

  @override
  Widget build(BuildContext context) {
    final color = isCheckOut ? attendanceRed : attendanceGreen;
    return _SurfaceCard(
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(16),
                    image: preview == null
                        ? null
                        : DecorationImage(image: preview!, fit: BoxFit.cover),
                  ),
                  child: preview == null
                      ? Icon(Icons.camera_alt_rounded, color: color, size: 27)
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isCheckOut
                            ? 'Chụp ảnh khu vực bàn giao'
                            : 'Chụp ảnh check-in',
                        style: const TextStyle(
                          color: attendanceInk,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isCheckOut
                            ? 'Chụp ảnh không gian đã hoàn thành công việc'
                            : 'Bắt buộc chụp ảnh selfie tại công trình',
                        style: const TextStyle(
                          color: attendanceMuted,
                          fontSize: 12,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  width: 82,
                  height: 68,
                  child: OutlinedButton(
                    onPressed: onTakePhoto,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      side: BorderSide(color: color.withOpacity(0.5)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      foregroundColor: attendanceInk,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          preview == null
                              ? Icons.photo_camera_outlined
                              : Icons.refresh_rounded,
                          size: 23,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          preview == null ? 'Chụp ảnh' : 'Chụp lại',
                          style: const TextStyle(fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  color: attendanceMuted,
                  size: 18,
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Ảnh sẽ được lưu để xác minh thời gian và địa điểm',
                    style: TextStyle(color: attendanceMuted, fontSize: 10),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AttendanceBottomNavigation extends StatelessWidget {
  final VoidCallback onHome;
  final VoidCallback onPlaceholder;
  final VoidCallback? onAttendance;

  const AttendanceBottomNavigation({
    super.key,
    required this.onHome,
    required this.onPlaceholder,
    this.onAttendance,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 8, 6, 8),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE9ECF1))),
        boxShadow: [
          BoxShadow(
            color: Color(0x0D000000),
            blurRadius: 12,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          _BottomItem(
            icon: Icons.home_rounded,
            label: 'Trang chủ',
            selected: true,
            onTap: onHome,
          ),
          _BottomItem(
            icon: Icons.calendar_month_outlined,
            label: 'Lịch làm việc',
            onTap: onPlaceholder,
          ),
          Expanded(
            child: InkWell(
              onTap: onAttendance ?? onHome,
              borderRadius: BorderRadius.circular(30),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: const BoxDecoration(
                      color: attendanceBlue,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x332878E3),
                          blurRadius: 12,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.receipt_long_rounded,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
          _BottomItem(
            icon: Icons.notifications_none_rounded,
            label: 'Thông báo',
            onTap: onPlaceholder,
          ),
          _BottomItem(
            icon: Icons.person_outline_rounded,
            label: 'Cá nhân',
            onTap: onPlaceholder,
          ),
        ],
      ),
    );
  }
}

class AttendanceMessageCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final Color color;
  final VoidCallback? onRetry;

  const AttendanceMessageCard({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.color = attendanceBlue,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: attendanceInk,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: attendanceMuted,
                fontSize: 13,
                height: 1.4,
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Thử lại'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SurfaceCard extends StatelessWidget {
  final Widget child;
  final Clip clipBehavior;

  const _SurfaceCard({
    required this.child,
    this.clipBehavior = Clip.none,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      clipBehavior: clipBehavior,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEDF0F4)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F101828),
            blurRadius: 14,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _InfoLine extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoLine({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: attendanceInk, size: 18),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: attendanceInk,
              fontSize: 12,
              height: 1.35,
            ),
          ),
        ),
      ],
    );
  }
}

class _BottomItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _BottomItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.selected = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = selected ? attendanceBlue : attendanceMuted;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 4),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: color,
                  fontSize: 9,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LocationMapPainter extends CustomPainter {
  final bool hasPosition;
  final bool? isInside;

  const _LocationMapPainter({
    required this.hasPosition,
    required this.isInside,
  });

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = const Color(0xFFF1F3EF),
    );

    final parkPaint = Paint()..color = const Color(0xFFDCEFD8);
    canvas.drawRect(
      Rect.fromLTWH(
          0, size.height * 0.62, size.width * 0.32, size.height * 0.38),
      parkPaint,
    );

    final roadPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 18
      ..strokeCap = StrokeCap.round;
    for (var i = -2; i < 6; i++) {
      final x = size.width * (i / 4);
      canvas.drawLine(
        Offset(x, -20),
        Offset(x + size.height, size.height + 20),
        roadPaint,
      );
    }
    canvas.drawLine(
      Offset(-20, size.height * 0.72),
      Offset(size.width + 20, size.height * 0.28),
      roadPaint,
    );

    final center = Offset(size.width * 0.53, size.height * 0.52);
    final radius = math.min(size.width, size.height) * 0.28;
    final zoneColor = isInside == false ? attendanceRed : attendanceGreen;
    canvas.drawCircle(
      center,
      radius,
      Paint()..color = zoneColor.withOpacity(0.1),
    );
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = zoneColor.withOpacity(0.42)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5,
    );

    canvas.drawCircle(
      center,
      9,
      Paint()..color = Colors.white,
    );
    canvas.drawCircle(
      center,
      6,
      Paint()..color = attendanceBlue,
    );

    if (hasPosition && isInside == false) {
      final pin = Offset(size.width * 0.68, size.height * 0.28);
      canvas.drawCircle(pin, 10, Paint()..color = Colors.white);
      canvas.drawCircle(pin, 7, Paint()..color = attendanceRed);
    }

    _paintLabel(
      canvas,
      'KHU VỰC\nCÔNG TRÌNH',
      Offset(size.width * 0.1, size.height * 0.28),
      attendanceInk,
    );
    _paintLabel(
      canvas,
      'Khuôn viên',
      Offset(size.width * 0.04, size.height * 0.78),
      const Color(0xFF5C8A59),
    );
  }

  void _paintLabel(Canvas canvas, String text, Offset offset, Color color) {
    final painter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w700,
          height: 1.2,
        ),
      ),
      textDirection: ui.TextDirection.ltr,
    )..layout();
    painter.paint(canvas, offset);
  }

  @override
  bool shouldRepaint(covariant _LocationMapPainter oldDelegate) {
    return oldDelegate.hasPosition != hasPosition ||
        oldDelegate.isInside != isInside;
  }
}
