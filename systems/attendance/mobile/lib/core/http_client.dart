// Dio HTTP client with auth interceptor + error mapping.

import 'package:dio/dio.dart';
import 'auth_storage.dart';
import 'config.dart';

bool isDefinitiveRefreshRejection(int? statusCode) =>
    statusCode == 401 || statusCode == 403;

class ApiException implements Exception {
  final String code;
  final String message;
  final int statusCode;
  final Map<String, dynamic>? details;

  ApiException(
      {required this.code,
      required this.message,
      required this.statusCode,
      this.details});

  @override
  String toString() => '$code: $message';
}

class HttpClient {
  final Dio _dio;
  final AuthStorage _authStorage;
  late final Dio _refreshDio;
  Future<bool>? _refreshInFlight;

  HttpClient({required AuthStorage authStorage})
      : _authStorage = authStorage,
        _dio = Dio(BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 30),
          headers: {'Content-Type': 'application/json'},
        )) {
    _refreshDio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _authStorage.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (err, handler) async {
        if (err.response?.statusCode == 401 &&
            err.requestOptions.path != '/v1/auth/refresh' &&
            err.requestOptions.extra['authRetried'] != true) {
          final refreshed = await _refreshOnce();
          if (refreshed) {
            final token = await _authStorage.getAccessToken();
            err.requestOptions.extra['authRetried'] = true;
            err.requestOptions.headers['Authorization'] = 'Bearer $token';
            try {
              final response = await _dio.fetch<dynamic>(err.requestOptions);
              handler.resolve(response);
              return;
            } on DioException catch (retryError) {
              handler.next(retryError);
              return;
            }
          }
        }
        final status = err.response?.statusCode ?? 0;
        final data = err.response?.data;
        if (data is Map && data['error'] is Map) {
          final e = data['error'] as Map;
          handler.reject(DioException(
            requestOptions: err.requestOptions,
            response: err.response,
            type: err.type,
            error: ApiException(
              code: e['code'] as String? ?? 'UNKNOWN',
              message: e['message'] as String? ?? 'Unknown error',
              statusCode: status,
              details: e['details'] is Map
                  ? Map<String, dynamic>.from(e['details'] as Map)
                  : null,
            ),
          ));
          return;
        }
        handler.next(err);
      },
    ));
  }

  Future<bool> _refreshOnce() async {
    final existing = _refreshInFlight;
    if (existing != null) return existing;
    final operation = _refreshAccessToken();
    _refreshInFlight = operation;
    try {
      return await operation;
    } finally {
      _refreshInFlight = null;
    }
  }

  Future<bool> _refreshAccessToken() async {
    final refreshToken = await _authStorage.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;
    try {
      final response = await _refreshDio.post<Map<String, dynamic>>(
        '/v1/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data;
      final accessToken = data?['accessToken'] as String?;
      final rotatedRefreshToken = data?['refreshToken'] as String?;
      if (accessToken == null || rotatedRefreshToken == null) return false;
      await _authStorage.updateTokens(
        accessToken: accessToken,
        refreshToken: rotatedRefreshToken,
      );
      return true;
    } on DioException catch (error) {
      final status = error.response?.statusCode;
      if (isDefinitiveRefreshRejection(status)) {
        await _authStorage.clear();
      }
      return false;
    }
  }

  Future<Map<String, dynamic>> get(String path,
      {Map<String, dynamic>? query}) async {
    return _wrap(() => _dio.get(path, queryParameters: query));
  }

  Future<Map<String, dynamic>> post(String path, {Object? data}) async {
    return _wrap(() => _dio.post(path, data: data));
  }

  Future<Map<String, dynamic>> _wrap(
      Future<Response<dynamic>> Function() fn) async {
    try {
      final res = await fn();
      final data = res.data;
      if (data is Map<String, dynamic>) return data;
      return {'data': data};
    } on DioException catch (e) {
      if (e.error is ApiException) throw e.error as ApiException;
      throw ApiException(
        code: 'NETWORK_ERROR',
        message: e.message ?? 'Network error',
        statusCode: e.response?.statusCode ?? 0,
      );
    }
  }
}
