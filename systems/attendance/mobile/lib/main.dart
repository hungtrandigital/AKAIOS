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

const akOlive = Color(0xFF6C7D22);
const akOliveDark = Color(0xFF4F601A);
const akForest = Color(0xFF1B2512);
const akLime = Color(0xFFC7DC50);
const akSoftOlive = Color(0xFFF0F2E4);
const akPaper = Color(0xFFF9F8F3);
const akInk = Color(0xFF20251B);
const akMuted = Color(0xFF666B5A);
const akBorder = Color(0xFFDCDECD);
const akRed = Color(0xFFD0202B);

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
    seedColor: akOlive,
    brightness: Brightness.light,
    primary: akOlive,
    secondary: akLime,
    surface: const Color(0xFFFFFEFA),
    error: akRed,
    onPrimary: Colors.white,
    onSecondary: akForest,
    onSurface: akInk,
  );
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: akPaper,
    fontFamily: 'BeVietnamPro',
    visualDensity: VisualDensity.standard,
  );
  return base.copyWith(
    textTheme: base.textTheme.copyWith(
      headlineMedium: base.textTheme.headlineMedium?.copyWith(
        fontFamily: 'Manrope',
        color: akInk,
        fontSize: 32,
        fontWeight: FontWeight.w800,
        height: 1.08,
        letterSpacing: -.7,
      ),
      titleLarge: base.textTheme.titleLarge?.copyWith(
        fontFamily: 'Manrope',
        color: akInk,
        fontSize: 23,
        fontWeight: FontWeight.w800,
        height: 1.16,
        letterSpacing: -.35,
      ),
      titleMedium: base.textTheme.titleMedium?.copyWith(
        fontFamily: 'Manrope',
        color: akInk,
        fontSize: 18,
        fontWeight: FontWeight.w700,
        height: 1.24,
      ),
      bodyLarge: base.textTheme.bodyLarge?.copyWith(
        color: akInk,
        fontSize: 17,
        height: 1.5,
      ),
      bodyMedium: base.textTheme.bodyMedium?.copyWith(
        color: akMuted,
        fontSize: 16,
        height: 1.5,
      ),
      labelLarge: base.textTheme.labelLarge?.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        letterSpacing: .05,
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: akPaper,
      foregroundColor: akInk,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: 'Manrope',
        color: akInk,
        fontSize: 18,
        fontWeight: FontWeight.w800,
        letterSpacing: -.2,
      ),
    ),
    cardTheme: CardTheme(
      color: const Color(0xFFFFFEFA),
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: akBorder),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFFFFEFA),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: akBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: akBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: akOlive, width: 2),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: akOlive,
        foregroundColor: Colors.white,
        disabledBackgroundColor: const Color(0xFFD7DACB),
        disabledForegroundColor: const Color(0xFF858A78),
        minimumSize: const Size.fromHeight(56),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(56),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
        foregroundColor: akOliveDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: const BorderSide(color: akOlive),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: akOliveDark,
        minimumSize: const Size(48, 48),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    ),
    dividerColor: akBorder,
    snackBarTheme: const SnackBarThemeData(
      backgroundColor: akForest,
      contentTextStyle: TextStyle(color: Colors.white, fontSize: 16),
      behavior: SnackBarBehavior.floating,
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: Color(0xFFFFFEFA),
      surfaceTintColor: Colors.transparent,
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
      backgroundColor: akPaper,
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
