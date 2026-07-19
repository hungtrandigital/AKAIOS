# AKAIUNSAN Attendance Mobile App (Flutter)

**Phase 2 — employee attendance client (`PRD-EPIC-002`)**

## Status

The repository contains Android and iOS Flutter scaffolds plus the MVP employee flow: password/OTP login, refresh-token rotation, today's assignment, GPS validation input, camera capture, and check-in/out. Android analysis, tests, and a debug APK build pass locally. The iOS scaffold and Dart layer are validated, but native iOS compilation still requires full Xcode, CocoaPods, and signing. History, offline queue, and push notifications remain outside this remediation batch.

## Project structure

| Path | Purpose |
| --- | --- |
| `android/` | Gradle project, permissions, debug-only local HTTP allowance |
| `ios/` | Xcode project, camera/location descriptions, localhost ATS exception |
| `lib/main.dart` | Riverpod, GoRouter, and localization setup |
| `lib/core/` | Compile-time API URL, secure token storage, Dio auth/refresh client |
| `lib/features/auth/` | Password and OTP login plus logout |
| `lib/features/attendance/` | Today's assignment and check-in/out flows |
| `lib/l10n/` | Vietnamese/English ARB files and generated localization sources |
| `test/` | Mobile unit/smoke tests |

## Local validation

Flutter 3.24.5 / Dart 3.5.4 is the validated toolchain.

```bash
cd systems/attendance/mobile
flutter pub get
flutter gen-l10n
dart format --output=none --set-exit-if-changed \
  lib/core lib/features lib/main.dart test
flutter analyze
flutter test
```

The CI `Flutter mobile` job repeats these checks and builds an Android debug APK artifact.

## Run on a device

The API URL is compile-time configuration. Direct backend URLs do not include the Caddy prefix; the public tunnel URL does.

```bash
# Android emulator reaches the development host through 10.0.2.2
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000

# iOS simulator uses the localhost-only ATS exception
flutter run --dart-define=API_BASE_URL=http://localhost:3000

# Physical devices and production builds should use HTTPS through Caddy
flutter run --dart-define=API_BASE_URL=https://ak-tunnel.example.com/api/attendance
```

Android cleartext traffic is enabled only for debug builds. Release Android and physical-device iOS testing should use HTTPS.

## Build and signing

```bash
flutter build apk --debug \
  --dart-define=API_BASE_URL=https://ak-tunnel.example.com/api/attendance

flutter build apk --release \
  --dart-define=API_BASE_URL=https://ak-tunnel.example.com/api/attendance

flutter build ipa --release \
  --dart-define=API_BASE_URL=https://ak-tunnel.example.com/api/attendance
```

Android releases are never signed with Flutter's shared debug key. Supply an ignored `android/key.properties` file and keep the keystore outside Git:

```properties
storeFile=/absolute/path/to/release.jks
storePassword=REDACTED
keyAlias=release
keyPassword=REDACTED
```

iOS release builds require full Xcode, CocoaPods, an Apple Developer team, and the appropriate signing profile; no native iOS build has been executed in the current environment. Neither platform's signing secret belongs in this repository.

## Runtime permissions

- Android: Internet, precise/coarse location, and camera are declared in the main manifest.
- iOS: camera and location-while-in-use descriptions are declared in `Info.plist`.
- The app still requests runtime location/camera access and fails closed when GPS is unavailable.

## Architecture

- State management: Riverpod 2.x
- Navigation: `go_router`
- Localization: `flutter_localizations` with Vietnamese default and English fallback
- HTTP: Dio bearer interceptor with single-flight refresh rotation and one retry
- Storage: `flutter_secure_storage` (iOS Keychain / Android encrypted preferences)

## Related documents

- [System Architecture](../docs/architecture.md)
- [Domain Specs](../../../3-technical/3.1-system-foundation/architecture/domain-specs.md)
- [API Contracts](../../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
