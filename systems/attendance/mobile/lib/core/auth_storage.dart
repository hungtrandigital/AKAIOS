// Secure storage for JWT tokens.

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthStorage {
  static const _accessTokenKey = 'access_token';
  static const _userIdKey = 'user_id';
  static const _userRoleKey = 'user_role';

  final FlutterSecureStorage _storage;

  AuthStorage() : _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  Future<void> saveTokens({
    required String accessToken,
    required String userId,
    required String role,
  }) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: accessToken),
      _storage.write(key: _userIdKey, value: userId),
      _storage.write(key: _userRoleKey, value: role),
    ]);
  }

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);
  Future<String?> getUserId() => _storage.read(key: _userIdKey);
  Future<String?> getRole() => _storage.read(key: _userRoleKey);

  Future<void> clear() => Future.wait([
    _storage.delete(key: _accessTokenKey),
    _storage.delete(key: _userIdKey),
    _storage.delete(key: _userRoleKey),
  ]);
}
