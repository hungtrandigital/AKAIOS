// App entry point — Riverpod, stable auth-aware router and branded theme.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/auth_storage.dart';
import 'core/config.dart';
import 'core/prismate_loading.dart';
import 'features/attendance/presentation/checkin_screen.dart';
import 'features/attendance/presentation/today_screen.dart';
import 'features/auth/presentation/login_screen.dart';
import 'l10n/app_localizations.dart';

void main() {
  runApp(const ProviderScope(child: AKApp()));
}

const akBrandBlue = Color(0xFF0289F7);
const akBrandBlueDark = Color(0xFF0070CC);
const akInk = Color(0xFF17202A);
const akCanvas = Color(0xFFF4F9FD);

class AKApp extends ConsumerStatefulWidget {
  const AKApp({super.key});

  @override
  ConsumerState<AKApp> createState() => _AKAppState();
}

class _AKAppState extends ConsumerState<AKApp> {
  late final GoRouter _router;
  late final AuthSessionController _authSession;

  @override
  void initState() {
    super.initState();
    _authSession = ref.read(authSessionProvider);
    _router = GoRouter(
      initialLocation: '/splash',
      refreshListenable: _authSession,
      redirect: (context, state) {
        final location = state.matchedLocation;
        switch (_authSession.state) {
          case AuthSessionState.initializing:
          case AuthSessionState.storageError:
            return location == '/splash' ? null : '/splash';
          case AuthSessionState.authenticated:
            return location == '/splash' || location == '/login'
                ? '/today'
                : null;
          case AuthSessionState.unauthenticated:
            return location == '/login' ? null : '/login';
        }
      },
      routes: [
        GoRoute(
          path: '/splash',
          pageBuilder: (_, __) => const NoTransitionPage<void>(
            child: SplashScreen(),
          ),
        ),
        GoRoute(
          path: '/login',
          pageBuilder: (_, __) => _fadePage(const LoginScreen()),
        ),
        GoRoute(
          path: '/today',
          pageBuilder: (_, __) => _fadePage(const TodayScreen()),
        ),
        GoRoute(
          path: '/check-in/:assignmentId',
          builder: (_, state) => CheckScreen(
            shiftAssignmentId: state.pathParameters['assignmentId']!,
            isCheckOut: false,
          ),
        ),
        GoRoute(
          path: '/check-out/:assignmentId',
          builder: (_, state) => CheckScreen(
            shiftAssignmentId: state.pathParameters['assignmentId']!,
            isCheckOut: true,
          ),
        ),
      ],
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _authSession.bootstrap();
    });
  }

  @override
  void dispose() {
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AKAIUNSAN',
      theme: _buildTheme(),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      locale: Locale(AppConfig.resolveLocale(AppConfig.locale)),
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}

CustomTransitionPage<void> _fadePage(Widget child) {
  return CustomTransitionPage<void>(
    child: child,
    transitionDuration: const Duration(milliseconds: 260),
    reverseTransitionDuration: const Duration(milliseconds: 180),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (MediaQuery.disableAnimationsOf(context)) return child;
      return FadeTransition(opacity: animation, child: child);
    },
  );
}

ThemeData _buildTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: akBrandBlue,
    brightness: Brightness.light,
    primary: akBrandBlueDark,
    surface: Colors.white,
    error: const Color(0xFFB42318),
  );
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: akCanvas,
    visualDensity: VisualDensity.standard,
  );
  return base.copyWith(
    textTheme: base.textTheme.copyWith(
      headlineMedium: base.textTheme.headlineMedium?.copyWith(
        color: akInk,
        fontSize: 30,
        fontWeight: FontWeight.w800,
        height: 1.15,
      ),
      titleLarge: base.textTheme.titleLarge?.copyWith(
        color: akInk,
        fontSize: 22,
        fontWeight: FontWeight.w800,
      ),
      titleMedium: base.textTheme.titleMedium?.copyWith(
        color: akInk,
        fontSize: 18,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: base.textTheme.bodyLarge?.copyWith(
        color: akInk,
        fontSize: 17,
        height: 1.45,
      ),
      bodyMedium: base.textTheme.bodyMedium?.copyWith(
        color: const Color(0xFF384553),
        fontSize: 16,
        height: 1.45,
      ),
      labelLarge: base.textTheme.labelLarge?.copyWith(
        fontSize: 17,
        fontWeight: FontWeight.w700,
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: akInk,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: akInk,
        fontSize: 21,
        fontWeight: FontWeight.w800,
      ),
    ),
    cardTheme: CardTheme(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: const BorderSide(color: Color(0xFFDCEAF5)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFB8CCE0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFB8CCE0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: akBrandBlueDark, width: 2),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(56),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(56),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        side: const BorderSide(color: Color(0xFF91B6D5)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        minimumSize: const Size(48, 48),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    ),
  );
}

class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(authSessionProvider).state;
    final hasError = state == AuthSessionState.storageError;
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                PrismateLoadingMark(
                  width: 208,
                  animate: !hasError,
                  semanticLabel: hasError ? 'Prismate' : 'Đang xử lý',
                ),
                const SizedBox(height: 26),
                Text(
                  'AKAIUNSAN Chấm công',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  hasError
                      ? 'Không thể đọc phiên đăng nhập trên máy.'
                      : 'Đang chuẩn bị ca làm hôm nay…',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                if (hasError) ...[
                  const SizedBox(height: 28),
                  FilledButton.icon(
                    onPressed: () => ref.read(authSessionProvider).bootstrap(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Thử lại'),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Thông tin đăng nhập chưa bị xóa.',
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
