// Auth repository — login flow with phone + password or phone + OTP.

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/http_client.dart';
import '../../../core/auth_storage.dart';

final authStorageProvider = Provider<AuthStorage>((ref) => AuthStorage());

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final storage = ref.read(authStorageProvider);
  return AuthRepository(
    http: HttpClient(authStorage: storage),
    storage: storage,
  );
});

class AuthRepository {
  final HttpClient _http;
  final AuthStorage _storage;

  AuthRepository({required HttpClient http, required AuthStorage storage})
      : _http = http,
        _storage = storage;

  Future<bool> isLoggedIn() async {
    final token = await _storage.getAccessToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> loginWithPassword(
      {required String phone, required String password}) async {
    final res = await _http.post('/v1/auth/login', data: {
      'phone': phone,
      'password': password,
    });
    await _saveAuth(res);
  }

  Future<void> requestOtp({required String phone}) async {
    await _http.post('/v1/auth/request-otp', data: {'phone': phone});
  }

  Future<void> loginWithOtp(
      {required String phone, required String otp}) async {
    final res = await _http.post('/v1/auth/login-otp', data: {
      'phone': phone,
      'otp': otp,
    });
    await _saveAuth(res);
  }

  Future<void> logout() async {
    try {
      await _http.post('/v1/auth/logout');
    } catch (_) {
      // Ignore errors — we'll clear tokens locally anyway
    }
    await _storage.clear();
  }

  Future<void> _saveAuth(Map<String, dynamic> res) async {
    final token = res['accessToken'] as String;
    final user = res['user'] as Map<String, dynamic>;
    await _storage.saveTokens(
      accessToken: token,
      userId: user['id'] as String,
      role: user['role'] as String,
    );
  }
}
