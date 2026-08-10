# AKAIUNSAN Attendance Mobile App (Flutter)

**Phase 2 — employee attendance client (`PRD-EPIC-002`)**

## Status

The repository contains Android and iOS Flutter scaffolds plus the MVP employee flow: Prismate-branded native/Flutter loading, auth bootstrap, password/OTP login, refresh-token rotation, all of today's assignments, GPS validation input, live camera capture, and check-in/out. Each assignment has one compact card with its state, project, time, progress, and next action; reconciled `absent`, `on_leave`, and `holiday` records are terminal. Check-in/out uses a clear three-step header and remains scroll-safe at 200% text scaling for an older field workforce. Flutter analysis and 22/22 tests pass. A debug iPhone 17 Pro Simulator build completed the normal GPS/JPEG/API/MinIO check-in and check-out path through the explicit simulator seam below. This does not validate camera hardware. History, offline queue, push notifications, physical-device camera validation, and release signing remain outside this remediation batch.

## Project structure

| Path | Purpose |
| --- | --- |
| `android/` | Gradle project, permissions, debug-only local HTTP allowance |
| `ios/` | Xcode project, camera/location descriptions, localhost ATS exception |
| `assets/branding/` | Optimized app-ready derivative of the canonical Prismate logo |
| `assets/fonts/` | Offline Manrope and Be Vietnam Pro bundle with upstream SIL OFL licenses |
| `lib/main.dart` | Stable auth-aware GoRouter, branded splash/theme, and localization setup |
| `lib/core/` | API URL, secure token storage, Dio auth/refresh client, reusable Prismate loader |
| `lib/features/auth/` | Password and OTP login plus logout |
| `lib/features/attendance/` | Today's assignments and independent check-in/out flows |
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

### Latest Android UAT artifact

On 2026-08-10, the current worktree built and launched on a Google APIs Android
emulator using:

```bash
flutter build apk --debug \
  --dart-define=API_BASE_URL=https://akaios.prismate.vn/api/attendance
```

The ignored local artifact is
`build/app/outputs/flutter-apk/app-debug.apk` (94,843,852 bytes; about 90.45 MiB), package
`vn.akaiunsan.ak_attendance_mobile`, version `0.1.0+1`, minSdk 21, targetSdk 34,
SHA-256 `1ba7f5ba67af1f4ebf2e9652dc5ddc46119a3f396f3deb95b2562fa90057d6f3`.
It is signed only with the Android debug certificate and is for controlled
device testing, not distribution.

The local/UAT Caddy profiles expose that ignored build output read-only at
`/downloads/akaios-attendance-debug.apk` with `no-store` caching. With the
tunnel profile active, testers can download the current build from
`https://akaios.prismate.vn/downloads/akaios-attendance-debug.apk`; the local
tunnel origin is `http://127.0.0.1:8081/downloads/akaios-attendance-debug.apk`.

The public host currently serves the application but still routes the mobile
prefix through the old web rewrite, producing backend path
`/v1/attendance/v1/...` and HTTP 404. Update the HPC to a reviewed release that
contains the committed Caddy prefix handling before testing Login against this
APK; the unauthenticated `my-today` smoke request should then return 401, not 404.

## Brand and loading

- The employee product UI uses the bounded corporate profile from the internal
  style guide: Manrope headings, Be Vietnam Pro body/control text, olive/forest/
  lime/paper colors, and one prominent shift action. Marketing hero scale,
  image-led layouts, parallax, and decorative motion are intentionally excluded.
- Login, Today, and check-in/out preserve ≥16sp body text, ≥52dp primary actions,
  200% text scaling, explicit shift/project status, GPS, fresh-camera, and
  camera-failure recovery. The web Back Office keeps its existing Inter/blue
  profile; this mobile theme does not replace it.
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

# Debug iOS Simulator UAT only: opt in to a visibly labeled simulated JPEG.
flutter run \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=UAT_SIMULATED_CAMERA=true

# Physical devices and production builds should use HTTPS through Caddy
flutter run --dart-define=API_BASE_URL=https://akaios.prismate.vn/api/attendance
```

Android cleartext traffic is enabled only for debug builds. Release Android and physical-device iOS testing should use HTTPS.
`UAT_SIMULATED_CAMERA` defaults to false. The app additionally requires a debug
build and an iOS Simulator runtime, so profile/release, Android, and physical
iPhone runs ignore the flag and keep the camera path fail closed.

## Build and signing

```bash
flutter build apk --debug \
  --dart-define=API_BASE_URL=https://akaios.prismate.vn/api/attendance

flutter build apk --release \
  --dart-define=API_BASE_URL=https://akaios.prismate.vn/api/attendance

flutter build ipa --release \
  --dart-define=API_BASE_URL=https://akaios.prismate.vn/api/attendance
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
- For controlled local data-path testing only, the opt-in debug Simulator seam
  writes a labeled 320×240 JPEG and still requires fresh GPS, JPEG decode,
  upload/storage, and normal attendance validation. It is not camera evidence.

## Architecture

- State management: Riverpod 2.x
- Navigation: one stable `go_router` instance driven synchronously by a one-read auth bootstrap controller (`/splash` → Login/Today)
- Localization: `flutter_localizations` with Vietnamese default and English fallback
- HTTP: Dio bearer interceptor with single-flight refresh rotation and one retry; network failure during refresh does not erase stored credentials
- Storage: `flutter_secure_storage` (iOS Keychain / Android encrypted preferences)

## Related documents

- [Internal UI style contract](../../../docs/style-system/STYLE_GUIDE.md) — authoritative for product behavior and accessibility
- [Corporate brand guide](../../../4-marketing/brand-guidelines.md) — visual reference; the internal style contract takes precedence
- [System Architecture](../docs/architecture.md)
- [Domain Specs](../../../3-technical/3.1-system-foundation/architecture/domain-specs.md)
- [API Contracts](../../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
