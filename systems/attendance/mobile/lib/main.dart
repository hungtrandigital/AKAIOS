// App entry point — sets up Riverpod, GoRouter, Localization.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/auth_storage.dart';
import 'core/config.dart';
import 'l10n/app_localizations.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/attendance/presentation/today_screen.dart';
import 'features/attendance/presentation/checkin_screen.dart';

void main() {
  runApp(const ProviderScope(child: AKApp()));
}

class AKApp extends ConsumerStatefulWidget {
  const AKApp({super.key});

  @override
  ConsumerState<AKApp> createState() => _AKAppState();
}

class _AKAppState extends ConsumerState<AKApp> {
  late final GoRouter _router;
  late final AuthStorage _authStorage;

  @override
  void initState() {
    super.initState();
    _authStorage = ref.read(authStorageProvider);
    _router = GoRouter(
      initialLocation: '/login',
      redirect: (context, state) async {
        final loggedIn = await _authStorage.getAccessToken();
        if (loggedIn == null && state.matchedLocation != '/login') {
          return '/login';
        }
        if (loggedIn != null && state.matchedLocation == '/login') {
          return '/today';
        }
        return null;
      },
      routes: [
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/today', builder: (_, __) => const TodayScreen()),
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
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AKAIUNSAN',
      theme: ThemeData(primarySwatch: Colors.blue, useMaterial3: true),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      locale: Locale(AppConfig.resolveLocale(AppConfig.locale)),
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}
