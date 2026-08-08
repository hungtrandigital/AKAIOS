// Dio HTTP client with auth interceptor + error mapping.

import 'package:dio/dio.dart';
import 'auth_storage.dart';
import 'config.dart';

class ApiException implements Exception {
  final String code;
  final String message;
  final int statusCode;

  ApiException(
      {required this.code, required this.message, required this.statusCode});

  @override
  String toString() => '$code: $message';
}

class HttpClient {
  final Dio _dio;
  final AuthStorage _authStorage;

  HttpClient({required AuthStorage authStorage})
      : _authStorage = authStorage,
        _dio = Dio(BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 30),
          headers: {'Content-Type': 'application/json'},
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _authStorage.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (err, handler) {
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
            ),
          ));
          return;
        }
        handler.next(err);
      },
    ));
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
