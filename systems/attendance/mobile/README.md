# AKAIUNSAN Attendance Mobile App (Flutter)

**Phase 2 — employee attendance client (`PRD-EPIC-002`)**

## Status

The repository contains Android and iOS Flutter scaffolds plus the MVP employee flow: Prismate-branded native/Flutter loading, auth bootstrap, password/OTP login, refresh-token rotation, today's assignment, GPS validation input, live camera capture, and check-in/out. The UI is Vietnamese-first, scroll-safe at 200% text scaling, and uses large touch targets for an older field workforce. Flutter analysis and 16/16 tests pass. An iOS debug build runs on an iPhone 17 Pro Simulator with Xcode 26.6 and CocoaPods 1.17.0; local UAT confirms the native-to-Flutter launch transition, Login layout, assignment display, geofence coordinates, and final check-in/out state with device-local timestamps. A prior Android debug APK gate passed, but the latest branding resource change could not be repackaged on this Mac because it has no Android SDK. The Simulator has no camera stream, so photo upload was verified through the public API while the UI was verified to fail closed without a photo. History, offline queue, push notifications, physical-device camera validation, and release signing remain outside this remediation batch.

## Project structure

| Path | Purpose |
| --- | --- |
| `android/` | Gradle project, permissions, debug-only local HTTP allowance |
| `ios/` | Xcode project, camera/location descriptions, localhost ATS exception |
| `assets/branding/` | Optimized app-ready derivative of the canonical Prismate logo |
| `lib/main.dart` | Stable auth-aware GoRouter, branded splash/theme, and localization setup |
| `lib/core/` | API URL, secure token storage, Dio auth/refresh client, reusable Prismate loader |
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

# Required once before the first local iOS build.
cd ios && pod install && cd ..
```

The CI `Flutter mobile` job repeats these checks and builds an Android debug APK artifact.

## Brand and loading

- The canonical source stays at `shared/assets/Prismate Brand Assets/LOGO/Prismate_Black@5x.png`; the mobile bundle uses the optimized 1200×464 derivative at `assets/branding/prismate_logo_black.png`.
- Android and iOS show a static density-appropriate Prismate mark before Flutter draws its first frame. Android includes both the legacy launch background and an Android 12+ system-splash-safe square derivative; light and dark system modes share the white startup background. Flutter then uses the same mark with a gentle opacity/scale pulse for real bootstrap, login, Today, location, camera, submit, and reconciliation work.
- The animation stops when reduced motion is requested. Loading is tied to actual async state; the app never delays navigation only to keep the logo visible.

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

iOS debug compilation and launch are validated on the iOS 26.5 Simulator with Xcode 26.6 and CocoaPods 1.17.0. Release builds and physical devices still require an Apple Developer team and the appropriate signing profile. Neither platform's signing secret belongs in this repository.

## Runtime permissions

- Android: Internet, precise/coarse location, and camera are declared in the main manifest.
- iOS: camera and location-while-in-use descriptions are declared in `Info.plist`.
- The app still requests runtime location/camera access and fails closed when GPS is unavailable.
- Employee submit stays disabled without both fresh GPS and a newly captured JPEG. Cancelling capture shows a normal retry message. Denied/permanent permission, missing hardware, plugin failure, and unconfirmed network responses have separate recovery messages; no gallery/photo-less fallback exists. The API fully decodes JPEG evidence and rejects fake headers, corrupt images, oversized data, decompression-heavy rasters, and images smaller than 320×240.
- Normal states keep a quiet `Không chụp được ảnh?` help link. Confirmed camera permission/hardware/plugin failures instead show the prominent `Nhờ giám sát hỗ trợ` recovery panel and `Kiểm tra lại chấm công`. The supervisor/system-admin web flow creates a manual exception with actor, camera-failure reason code, bounded assignment time, override provenance, and atomic audit; the employee never calls that endpoint. The employee manual badge appears only for that structured assisted-camera provenance, not every general BO override.
- Camera-only capture and the two-minute freshness check are official-client controls. Device attestation/liveness is outside MVP, so the backend does not claim cryptographic proof that an arbitrary direct API caller used a live camera.
- iOS Simulator reports `Camera not available`; use a physical device for the release GPS/camera acceptance pass.

## Architecture

- State management: Riverpod 2.x
- Navigation: one stable `go_router` instance driven synchronously by a one-read auth bootstrap controller (`/splash` → Login/Today)
- Localization: `flutter_localizations` with Vietnamese default and English fallback
- HTTP: Dio bearer interceptor with single-flight refresh rotation and one retry; network failure during refresh does not erase stored credentials
- Storage: `flutter_secure_storage` (iOS Keychain / Android encrypted preferences)

## Related documents

- [System Architecture](../docs/architecture.md)
- [Domain Specs](../../../3-technical/3.1-system-foundation/architecture/domain-specs.md)
- [API Contracts](../../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
