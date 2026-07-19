// App config — API endpoint, etc.

class AppConfig {
  // Override at build time: --dart-define=API_BASE_URL=https://ak-tunnel.example.com/api/attendance
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  static const String locale = String.fromEnvironment(
    'LOCALE',
    defaultValue: 'vi',
  );

  static String resolveLocale(String value) =>
      value == 'en' || value == 'vi' ? value : 'vi';
}
