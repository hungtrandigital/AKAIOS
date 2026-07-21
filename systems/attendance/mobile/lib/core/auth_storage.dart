// Secure storage for JWT tokens.

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuthStorage {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userIdKey = 'user_id';
  static const _userRoleKey = 'user_role';

  final FlutterSecureStorage _storage;
  final ValueNotifier<bool?> sessionPresence = ValueNotifier<bool?>(null);

  AuthStorage()
      : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
          iOptions:
              IOSOptions(accessibility: KeychainAccessibility.first_unlock),
        );

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    required String userId,
    required String role,
  }) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
      _storage.write(key: _userIdKey, value: userId),
      _storage.write(key: _userRoleKey, value: role),
    ]);
    sessionPresence.value = true;
  }

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);
  Future<String?> getUserId() => _storage.read(key: _userIdKey);
  Future<String?> getRole() => _storage.read(key: _userRoleKey);

  Future<void> updateTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<void> clear() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
      _storage.delete(key: _userIdKey),
      _storage.delete(key: _userRoleKey),
    ]);
    sessionPresence.value = false;
  }
}

final authStorageProvider = Provider<AuthStorage>((ref) => AuthStorage());

enum AuthSessionState {
  initializing,
  authenticated,
  unauthenticated,
  storageError,
}

/// Owns the one-time secure-storage bootstrap used by the app router.
///
/// The router observes this controller synchronously, so Login/Today never
/// flashes before the stored session has been resolved.
class AuthSessionController extends ChangeNotifier {
  AuthSessionController(this._storage) {
    _storage.sessionPresence.addListener(_handleStorageChange);
  }

  final AuthStorage _storage;
  AuthSessionState _state = AuthSessionState.initializing;
  AuthSessionState get state => _state;

  Future<void> bootstrap() async {
    _setState(AuthSessionState.initializing);
    try {
      final token =
          await _storage.getAccessToken().timeout(const Duration(seconds: 8));
      _setState(token != null && token.isNotEmpty
          ? AuthSessionState.authenticated
          : AuthSessionState.unauthenticated);
    } on TimeoutException {
      _setState(AuthSessionState.storageError);
    } catch (_) {
      _setState(AuthSessionState.storageError);
    }
  }

  void markAuthenticated() => _setState(AuthSessionState.authenticated);

  void markUnauthenticated() => _setState(AuthSessionState.unauthenticated);

  void _handleStorageChange() {
    final present = _storage.sessionPresence.value;
    if (present == true) markAuthenticated();
    if (present == false) markUnauthenticated();
  }

  void _setState(AuthSessionState next) {
    if (_state == next) return;
    _state = next;
    notifyListeners();
  }

  @override
  void dispose() {
    _storage.sessionPresence.removeListener(_handleStorageChange);
    super.dispose();
  }
}

final authSessionProvider =
    ChangeNotifierProvider<AuthSessionController>((ref) {
  return AuthSessionController(ref.read(authStorageProvider));
});
