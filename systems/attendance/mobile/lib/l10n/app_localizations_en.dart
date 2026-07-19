import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'AKAIUNSAN';

  @override
  String get loginTitle => 'Login';

  @override
  String get phone => 'Phone number';

  @override
  String get password => 'Password';

  @override
  String get loginButton => 'Login';

  @override
  String get loginWithOtp => 'Login with OTP';

  @override
  String get requestOtp => 'Send OTP';

  @override
  String get otp => 'OTP code';

  @override
  String get verify => 'Verify';

  @override
  String get logout => 'Logout';

  @override
  String get todayTitle => 'Today';

  @override
  String get noAssignmentToday => 'No shift today';

  @override
  String get project => 'Project';

  @override
  String get shift => 'Shift';

  @override
  String get shiftTime => 'Shift time';

  @override
  String get checkIn => 'Check-in';

  @override
  String get checkOut => 'Check-out';

  @override
  String checkedIn(String time) {
    return 'Checked in at $time';
  }

  @override
  String checkedOut(String time) {
    return 'Checked out at $time';
  }

  @override
  String get notCheckedIn => 'Not checked in';

  @override
  String get noGpsPermission => 'Location permission required for check-in';

  @override
  String get openGpsSettings => 'Open GPS settings';

  @override
  String get gpsLoading => 'Getting location...';

  @override
  String tooFarFromProject(String distance, String radius) {
    return 'You are ${distance}m from project (allowed ${radius}m)';
  }

  @override
  String get checkInSuccess => 'Check-in successful';

  @override
  String get checkOutSuccess => 'Check-out successful';

  @override
  String get takePhoto => 'Take photo';

  @override
  String get retakePhoto => 'Retake';

  @override
  String get submitCheckIn => 'Confirm Check-in';

  @override
  String get submitCheckOut => 'Confirm Check-out';

  @override
  String get errorRequired => 'Required';

  @override
  String get errorInvalidPhone => 'Invalid phone number';

  @override
  String get errorLoginFailed => 'Login failed';

  @override
  String get errorGpsFailed => 'Cannot get location';

  @override
  String get errorCameraFailed => 'Cannot open camera';

  @override
  String get errorCheckInFailed => 'Check-in failed';
}
