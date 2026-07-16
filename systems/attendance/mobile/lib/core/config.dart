// App config — API endpoint, etc.

class AppConfig {
  // Override at build time: --dart-define=API_BASE_URL=https://ak-tunnel.example.com/api
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api',
  );

  static const String locale = String.fromEnvironment(
    'LOCALE',
    defaultValue: 'vi',
  );
}
