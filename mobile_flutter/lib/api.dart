import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

const configuredApiBase = String.fromEnvironment('API_URL');

String get apiBase {
  if (configuredApiBase.isNotEmpty) {
    return configuredApiBase.endsWith('/')
        ? configuredApiBase.substring(0, configuredApiBase.length - 1)
        : configuredApiBase;
  }
  if (kIsWeb) return '${Uri.base.origin}/api';
  if (defaultTargetPlatform == TargetPlatform.android) {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
}

class Api {
  String? token;
  Future<dynamic> call(
    String path, {
    String method = 'GET',
    Object? body,
  }) async {
    final response =
        http.Request(method, Uri.parse('$apiBase$path'))
          ..headers.addAll({
            'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          })
          ..body = body == null ? '' : jsonEncode(body);
    final streamed = await response.send();
    final text = await streamed.stream.bytesToString();
    final data = text.isEmpty ? null : jsonDecode(text);
    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      throw Exception(data?['message'] ?? 'ไม่สามารถเชื่อมต่อระบบได้');
    }
    return data;
  }
}
