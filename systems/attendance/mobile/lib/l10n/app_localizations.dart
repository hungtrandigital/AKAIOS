import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_vi.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale) : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates = <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('vi')
  ];

  /// No description provided for @appTitle.
  ///
  /// In vi, this message translates to:
  /// **'AKAIUNSAN'**
  String get appTitle;

  /// No description provided for @loginTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập'**
  String get loginTitle;

  /// No description provided for @phone.
  ///
  /// In vi, this message translates to:
  /// **'Số điện thoại'**
  String get phone;

  /// No description provided for @password.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu'**
  String get password;

  /// No description provided for @loginButton.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập'**
  String get loginButton;

  /// No description provided for @loginWithOtp.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập bằng OTP'**
  String get loginWithOtp;

  /// No description provided for @requestOtp.
  ///
  /// In vi, this message translates to:
  /// **'Gửi mã OTP'**
  String get requestOtp;

  /// No description provided for @otp.
  ///
  /// In vi, this message translates to:
  /// **'Mã OTP'**
  String get otp;

  /// No description provided for @verify.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận'**
  String get verify;

  /// No description provided for @logout.
  ///
  /// In vi, this message translates to:
  /// **'Đăng xuất'**
  String get logout;

  /// No description provided for @todayTitle.
  ///
  /// In vi, this message translates to:
  /// **'Hôm nay'**
  String get todayTitle;

  /// No description provided for @noAssignmentToday.
  ///
  /// In vi, this message translates to:
  /// **'Không có ca hôm nay'**
  String get noAssignmentToday;

  /// No description provided for @project.
  ///
  /// In vi, this message translates to:
  /// **'Dự án'**
  String get project;

  /// No description provided for @shift.
  ///
  /// In vi, this message translates to:
  /// **'Ca'**
  String get shift;

  /// No description provided for @shiftTime.
  ///
  /// In vi, this message translates to:
  /// **'Thời gian ca'**
  String get shiftTime;

  /// No description provided for @checkIn.
  ///
  /// In vi, this message translates to:
  /// **'Check-in'**
  String get checkIn;

  /// No description provided for @checkOut.
  ///
  /// In vi, this message translates to:
  /// **'Check-out'**
  String get checkOut;

  /// No description provided for @checkedIn.
  ///
  /// In vi, this message translates to:
  /// **'Đã check-in lúc {time}'**
  String checkedIn(String time);

  /// No description provided for @checkedOut.
  ///
  /// In vi, this message translates to:
  /// **'Đã check-out lúc {time}'**
  String checkedOut(String time);

  /// No description provided for @notCheckedIn.
  ///
  /// In vi, this message translates to:
  /// **'Chưa check-in'**
  String get notCheckedIn;

  /// No description provided for @noGpsPermission.
  ///
  /// In vi, this message translates to:
  /// **'Cần quyền truy cập vị trí để check-in'**
  String get noGpsPermission;

  /// No description provided for @openGpsSettings.
  ///
  /// In vi, this message translates to:
  /// **'Mở cài đặt GPS'**
  String get openGpsSettings;

  /// No description provided for @gpsLoading.
  ///
  /// In vi, this message translates to:
  /// **'Đang lấy vị trí...'**
  String get gpsLoading;

  /// No description provided for @tooFarFromProject.
  ///
  /// In vi, this message translates to:
  /// **'Bạn ở cách dự án {distance}m (cho phép {radius}m)'**
  String tooFarFromProject(String distance, String radius);

  /// No description provided for @checkInSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Check-in thành công'**
  String get checkInSuccess;

  /// No description provided for @checkOutSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Check-out thành công'**
  String get checkOutSuccess;

  /// No description provided for @takePhoto.
  ///
  /// In vi, this message translates to:
  /// **'Chụp ảnh'**
  String get takePhoto;

  /// No description provided for @retakePhoto.
  ///
  /// In vi, this message translates to:
  /// **'Chụp lại'**
  String get retakePhoto;

  /// No description provided for @submitCheckIn.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận Check-in'**
  String get submitCheckIn;

  /// No description provided for @submitCheckOut.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận Check-out'**
  String get submitCheckOut;

  /// No description provided for @errorRequired.
  ///
  /// In vi, this message translates to:
  /// **'Trường bắt buộc'**
  String get errorRequired;

  /// No description provided for @errorInvalidPhone.
  ///
  /// In vi, this message translates to:
  /// **'Số điện thoại không hợp lệ'**
  String get errorInvalidPhone;

  /// No description provided for @errorLoginFailed.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập thất bại'**
  String get errorLoginFailed;

  /// No description provided for @errorGpsFailed.
  ///
  /// In vi, this message translates to:
  /// **'Không thể lấy vị trí'**
  String get errorGpsFailed;

  /// No description provided for @errorCameraFailed.
  ///
  /// In vi, this message translates to:
  /// **'Không thể mở camera'**
  String get errorCameraFailed;

  /// No description provided for @errorCheckInFailed.
  ///
  /// In vi, this message translates to:
  /// **'Check-in thất bại'**
  String get errorCheckInFailed;
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>['en', 'vi'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {


  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en': return AppLocalizationsEn();
    case 'vi': return AppLocalizationsVi();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.'
  );
}
