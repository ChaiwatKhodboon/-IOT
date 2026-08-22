import 'dart:convert';
import 'package:http/http.dart' as http;

const apiBase = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://192.168.1.187:3000/api',
);

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
