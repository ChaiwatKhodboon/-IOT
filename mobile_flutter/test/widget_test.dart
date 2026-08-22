// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';

import 'package:iot_equipment_mobile/main.dart';

void main() {
  testWidgets('shows the protected login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const IoTLoanApp());

    expect(find.text('เข้าสู่ระบบ'), findsWidgets);
    expect(find.text('ลงชื่อเข้าใช้ระบบ'), findsOneWidget);
    expect(find.text('ระบบยืม-คืน อุปกรณ์ IoT'), findsOneWidget);
  });
}
