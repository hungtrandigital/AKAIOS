import 'package:flutter_test/flutter_test.dart';

import 'package:ak_attendance_mobile/core/config.dart';
import 'package:ak_attendance_mobile/features/auth/data/auth_repository.dart';

void main() {
  test('uses the direct local attendance API by default', () {
    expect(AppConfig.apiBaseUrl, 'http://localhost:3000');
  });

  test('defaults localization to Vietnamese and rejects unsupported locales',
      () {
    expect(AppConfig.resolveLocale(AppConfig.locale), 'vi');
    expect(AppConfig.resolveLocale('en'), 'en');
    expect(AppConfig.resolveLocale('fr'), 'vi');
  });

  test('normalizes common Vietnamese phone formats', () {
    expect(normalizeVietnamPhone('0912 345 678'), '+84912345678');
    expect(normalizeVietnamPhone('84.912.345.678'), '+84912345678');
    expect(normalizeVietnamPhone('+84-912-345-678'), '+84912345678');
  });
}
