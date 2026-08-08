# AKAIUNSAN Attendance Mobile App (Flutter)

**Phase 2 — mobile client scaffold (PRD-EPIC-002)**

## Status

Mobile app scaffold for 200 employees to check-in/out at project sites. Implementation **in progress** — has screens for login + today + check-in/out, but **requires native scaffolding** (Android/iOS folders) to actually build.

## What's in this scaffold

| File | Purpose |
| --- | --- |
| `pubspec.yaml` | Dependencies (Riverpod, Dio, Geolocator, image_picker, etc.) |
| `lib/main.dart` | App entry + GoRouter + i18n setup |
| `lib/core/config.dart` | API base URL (compile-time `--dart-define`) |
| `lib/core/auth_storage.dart` | JWT storage via `flutter_secure_storage` |
| `lib/core/http_client.dart` | Dio + auth interceptor + error mapping |
| `lib/features/auth/` | Login with phone+password OR phone+OTP |
| `lib/features/attendance/` | Daily mobile attendance layout + live GPS/photo check-in/out flow |
| `lib/l10n/app_vi.arb` | Vietnamese translations (default) |
| `lib/l10n/app_en.arb` | English translations |

## What's MISSING (requires `flutter create` to complete)

Native folders that Flutter generates but we didn't include:
- `android/` (Gradle config, Manifest, MainActivity.kt)
- `ios/` (Xcode project, Info.plist, AppDelegate.swift)
- Linux/macOS/Windows platforms (not needed — mobile-only app)

## How to complete setup

```bash
cd systems/attendance/mobile

# Option A: If mobile/ has only lib/ — run flutter create on top (preserves lib/)
flutter create --project-name ak_attendance_mobile --org vn.ak --platforms=android,ios .

# Then:
flutter pub get
flutter gen-l10n  # generate localization
flutter run       # with Android emulator / iOS simulator running
```

## Building APK / IPA

```bash
# Android debug
flutter build apk --debug --dart-define=API_BASE_URL=https://ak-tunnel.example.com/api

# Android release
flutter build apk --release --dart-define=API_BASE_URL=https://ak-tunnel.example.com/api

# iOS release (needs Xcode + Apple Developer cert)
flutter build ipa --release --dart-define=API_BASE_URL=https://ak-tunnel.example.com/api
```

## Permissions (must add to Manifest / Info.plist after `flutter create`)

### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.CAMERA"/>
```

### iOS (`ios/Runner/Info.plist`)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>AKAIUNSAN cần truy cập vị trí để check-in tại dự án</string>
<key>NSCameraUsageDescription</key>
<string>AKAIUNSAN cần truy cập camera để chụp ảnh xác nhận chấm công</string>
```

## Architecture

- **State management:** Riverpod 2.x
- **Navigation:** go_router
- **Localization:** flutter_localizations + ARB files (vi default, en)
- **HTTP:** Dio with interceptor for Bearer token + error mapping
- **Storage:** flutter_secure_storage (Keychain on iOS, EncryptedSharedPreferences on Android)

## Coverage

- ✅ Login (password + OTP modes)
- ✅ Today's assignment screen
- ✅ Check-in flow (GPS + camera + submit)
- ✅ Check-out flow (same as check-in)
- ⏳ History screen (planned)
- ⏳ Offline queue (planned for Phase 3+)
- ⏳ Push notifications (out of MVP scope)

## Testing

```bash
flutter test
```

Widget tests cover project/geofence parsing and the 390x844 daily attendance layout.

## Related Documents

- [System Architecture](../../docs/architecture.md)
- [Domain Specs](../../../../3-technical/3.1-system-foundation/architecture/domain-specs.md)
- [API Contracts](../../../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
