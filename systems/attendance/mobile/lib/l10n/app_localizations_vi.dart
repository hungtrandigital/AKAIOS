import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Vietnamese (`vi`).
class AppLocalizationsVi extends AppLocalizations {
  AppLocalizationsVi([String locale = 'vi']) : super(locale);

  @override
  String get appTitle => 'AKAIUNSAN';

  @override
  String get loginTitle => 'Đăng nhập';

  @override
  String get phone => 'Số điện thoại';

  @override
  String get password => 'Mật khẩu';

  @override
  String get loginButton => 'Đăng nhập';

  @override
  String get loginWithOtp => 'Đăng nhập bằng OTP';

  @override
  String get requestOtp => 'Gửi mã OTP';

  @override
  String get otp => 'Mã OTP';

  @override
  String get verify => 'Xác nhận';

  @override
  String get logout => 'Đăng xuất';

  @override
  String get todayTitle => 'Chấm công hằng ngày';

  @override
  String get noAssignmentToday => 'Không có ca hôm nay';

  @override
  String get project => 'Dự án';

  @override
  String get shift => 'Ca';

  @override
  String get shiftTime => 'Thời gian ca';

  @override
  String get checkIn => 'Check-in';

  @override
  String get checkOut => 'Check-out';

  @override
  String checkedIn(String time) {
    return 'Đã check-in lúc $time';
  }

  @override
  String checkedOut(String time) {
    return 'Đã check-out lúc $time';
  }

  @override
  String get notCheckedIn => 'Chưa check-in';

  @override
  String get noGpsPermission => 'Cần quyền truy cập vị trí để check-in';

  @override
  String get openGpsSettings => 'Mở cài đặt GPS';

  @override
  String get gpsLoading => 'Đang lấy vị trí...';

  @override
  String tooFarFromProject(String distance, String radius) {
    return 'Bạn ở cách dự án ${distance}m (cho phép ${radius}m)';
  }

  @override
  String get checkInSuccess => 'Check-in thành công';

  @override
  String get checkOutSuccess => 'Check-out thành công';

  @override
  String get takePhoto => 'Chụp ảnh';

  @override
  String get retakePhoto => 'Chụp lại';

  @override
  String get submitCheckIn => 'Xác nhận Check-in';

  @override
  String get submitCheckOut => 'Xác nhận Check-out';

  @override
  String get errorRequired => 'Trường bắt buộc';

  @override
  String get errorInvalidPhone => 'Số điện thoại không hợp lệ';

  @override
  String get errorLoginFailed => 'Đăng nhập thất bại';

  @override
  String get errorGpsFailed => 'Không thể lấy vị trí';

  @override
  String get errorCameraFailed => 'Không thể mở camera';

  @override
  String get errorCheckInFailed => 'Check-in thất bại';
}
