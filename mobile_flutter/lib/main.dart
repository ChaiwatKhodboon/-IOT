import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final preferences = await SharedPreferences.getInstance();
  runApp(IoTLoanApp(preferences: preferences));
}

const green = Color(0xff086b4f),
    dark = Color(0xff17212d),
    cream = Color(0xfff3f1e9),
    bg = Color(0xfff3f6f4),
    muted = Color(0xff697871),
    red = Color(0xffd43b35),
    orange = Color(0xffdb7a14);

class BrandLogo extends StatelessWidget {
  final double size;
  final bool elevated;

  const BrandLogo({super.key, required this.size, this.elevated = false});

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    padding: EdgeInsets.all(size * .055),
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: Colors.white,
      border: Border.all(color: const Color(0xffdce5e0)),
      boxShadow:
          elevated
              ? const [
                BoxShadow(
                  color: Color(0x1c102f23),
                  blurRadius: 18,
                  offset: Offset(0, 7),
                ),
              ]
              : null,
    ),
    child: ClipOval(
      child: Transform.scale(
        scale: 1.16,
        child: Image.asset(
          'assets/IT.jpg',
          fit: BoxFit.cover,
          filterQuality: FilterQuality.high,
          errorBuilder:
              (_, __, ___) => const ColoredBox(
                color: Colors.white,
                child: Icon(Icons.memory, color: green),
              ),
        ),
      ),
    ),
  );
}

class IoTLoanApp extends StatefulWidget {
  final SharedPreferences? preferences;
  const IoTLoanApp({super.key, this.preferences});
  @override
  State<IoTLoanApp> createState() => _IoTLoanAppState();
}

class _IoTLoanAppState extends State<IoTLoanApp> {
  final api = Api();
  Map<String, dynamic>? user;
  late ThemeMode themeMode;
  late String language;

  @override
  void initState() {
    super.initState();
    themeMode = ThemeMode.values.firstWhere(
      (mode) => mode.name == widget.preferences?.getString('themeMode'),
      orElse: () => ThemeMode.system,
    );
    language = widget.preferences?.getString('language') ?? 'th';
  }

  void changeTheme(ThemeMode value) {
    widget.preferences?.setString('themeMode', value.name);
    setState(() => themeMode = value);
  }

  void changeLanguage(String value) {
    widget.preferences?.setString('language', value);
    setState(() => language = value);
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'ระบบยืมคืนอุปกรณ์ IoT',
    theme: ThemeData(
      scaffoldBackgroundColor: bg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: green,
        surface: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: dark,
        elevation: 0,
        scrolledUnderElevation: 1,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
      ),
      cardTheme: CardTheme(
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 1,
        shadowColor: const Color(0x17102f23),
        margin: const EdgeInsets.symmetric(vertical: 5),
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: Color(0xffdce4df)),
          borderRadius: BorderRadius.circular(10),
        ),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Color(0xffcbd3cf)),
          borderRadius: BorderRadius.all(Radius.circular(8)),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: green, width: 1.5),
          borderRadius: BorderRadius.all(Radius.circular(8)),
        ),
        filled: true,
        fillColor: Colors.white,
        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: green,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      navigationBarTheme: const NavigationBarThemeData(
        backgroundColor: Color(0xfaffffff),
        indicatorColor: Color(0xffe7f3ed),
        elevation: 2,
        height: 72,
        labelTextStyle: WidgetStatePropertyAll(
          TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
        ),
      ),
      dividerColor: const Color(0xffe2e8e4),
      useMaterial3: true,
    ),
    darkTheme: ThemeData(
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: green,
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: const Color(0xff101815),
      cardTheme: CardTheme(
        color: const Color(0xff17231f),
        surfaceTintColor: Colors.transparent,
        elevation: 1,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: Color(0xff34443d)),
          borderRadius: BorderRadius.circular(10),
        ),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
        ),
        filled: true,
        fillColor: Color(0xff1b2924),
      ),
      navigationBarTheme: const NavigationBarThemeData(
        backgroundColor: Color(0xff121e19),
        indicatorColor: Color(0xff193c2f),
        height: 72,
        labelTextStyle: WidgetStatePropertyAll(TextStyle(fontSize: 10)),
      ),
      useMaterial3: true,
    ),
    themeMode: themeMode,
    locale: Locale(language),
    builder:
        (context, child) => ColoredBox(
          color:
              Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xff0b110f)
                  : const Color(0xffe9eef2),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: child ?? const SizedBox(),
            ),
          ),
        ),
    home:
        user == null
            ? AuthPage(
              api: api,
              language: language,
              onLogin: (u) => setState(() => user = u),
            )
            : HomePage(
              api: api,
              user: user!,
              language: language,
              themeMode: themeMode,
              onLanguageChanged: changeLanguage,
              onThemeChanged: changeTheme,
              onLogout:
                  () => setState(() {
                    api.token = null;
                    user = null;
                  }),
            ),
  );
}

class AuthPage extends StatefulWidget {
  final Api api;
  final String language;
  final ValueChanged<Map<String, dynamic>> onLogin;
  const AuthPage({
    super.key,
    required this.api,
    required this.onLogin,
    this.language = 'th',
  });
  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final user = TextEditingController(),
      pass = TextEditingController(),
      confirm = TextEditingController(),
      name = TextEditingController(),
      email = TextEditingController(),
      student = TextEditingController();
  bool signup = false, loading = false, showPassword = false;
  Future<void> submit() async {
    if (user.text.trim().isEmpty || pass.text.isEmpty) {
      return message('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    }
    if (signup && pass.text != confirm.text) {
      return message('รหัสผ่านไม่ตรงกัน');
    }
    setState(() => loading = true);
    try {
      if (signup) {
        await widget.api.call(
          '/auth/register',
          method: 'POST',
          body: {
            'username': user.text.trim(),
            'email': email.text.trim(),
            'password': pass.text,
            'fullName': name.text.trim(),
            'studentId': student.text.trim(),
          },
        );
        message('สมัครสมาชิกเรียบร้อย กรุณาเข้าสู่ระบบ');
        setState(() => signup = false);
        pass.clear();
        confirm.clear();
      } else {
        final data = await widget.api.call(
          '/auth/login',
          method: 'POST',
          body: {'username': user.text.trim(), 'password': pass.text},
        );
        widget.api.token = data['token'];
        widget.onLogin(Map<String, dynamic>.from(data['user']));
      }
    } catch (e) {
      message(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  void message(String text) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: cream,
    body: SafeArea(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            color: dark,
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 13),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ยินดีต้อนรับเข้าสู่ระบบ',
                  style: TextStyle(color: Colors.white70, fontSize: 11),
                ),
                Text(
                  'ระบบยืม-คืน อุปกรณ์ IoT',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 6),
                const Center(child: BrandLogo(size: 104, elevated: true)),
                const SizedBox(height: 14),
                Text(
                  signup ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: green,
                    fontSize: 27,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (!signup)
                          const Text(
                            'STAFF SIGN IN',
                            style: TextStyle(
                              color: muted,
                              fontSize: 10,
                              letterSpacing: 1.4,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        Text(
                          signup ? 'ลงทะเบียนผู้ใช้ใหม่' : 'ลงชื่อเข้าใช้ระบบ',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (signup) ...[
                          field('ชื่อ-นามสกุล', name),
                          field('รหัสนิสิต', student, number: true),
                        ],
                        field('ชื่อผู้ใช้หรืออีเมล', user),
                        if (signup) field('อีเมลสำหรับกู้คืนรหัสผ่าน', email),
                        field('รหัสผ่าน', pass, secret: true),
                        if (signup)
                          field('ยืนยันรหัสผ่าน', confirm, secret: true),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: loading ? null : submit,
                            child: Text(
                              loading
                                  ? 'กำลังดำเนินการ...'
                                  : signup
                                  ? 'ลงทะเบียน'
                                  : 'เข้าสู่ระบบ',
                            ),
                          ),
                        ),
                        if (!signup)
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: forgotPassword,
                              child: const Text('ลืมรหัสผ่าน?'),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => signup = !signup),
                  child: Text(
                    signup
                        ? 'มีบัญชีแล้ว / กลับเข้าสู่ระบบ'
                        : 'สมัครสมาชิกสำหรับผู้ใช้งาน',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
  Widget field(
    String label,
    TextEditingController c, {
    bool secret = false,
    bool number = false,
  }) => Padding(
    padding: const EdgeInsets.only(top: 13),
    child: TextField(
      controller: c,
      obscureText: secret && !showPassword,
      keyboardType: number ? TextInputType.number : TextInputType.text,
      decoration: InputDecoration(
        labelText: label,
        suffixIcon:
            secret
                ? IconButton(
                  onPressed: () => setState(() => showPassword = !showPassword),
                  icon: Icon(
                    showPassword ? Icons.visibility_off : Icons.visibility,
                  ),
                  tooltip: showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน',
                )
                : null,
      ),
    ),
  );

  Future<void> forgotPassword() async {
    final resetEmail = TextEditingController(
      text: user.text.contains('@') ? user.text.trim() : '',
    );
    final otp = TextEditingController();
    final newPassword = TextEditingController();
    final confirmPassword = TextEditingController();
    var otpSent = false;
    var busy = false;
    var showNewPassword = false;
    await showDialog<void>(
      context: context,
      barrierDismissible: !busy,
      builder:
          (dialogContext) => StatefulBuilder(
            builder:
                (context, setDialogState) => AlertDialog(
                  icon: const Icon(Icons.lock_reset, color: green, size: 38),
                  title: Text(otpSent ? 'กรอกรหัส OTP' : 'ลืมรหัสผ่าน'),
                  content: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          otpSent
                              ? 'กรอกรหัส 6 หลักจากอีเมล รหัสมีอายุ 5 นาที'
                              : 'ระบบจะส่งรหัส OTP ไปยังอีเมลที่ผูกกับบัญชี',
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: resetEmail,
                          enabled: !otpSent,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(labelText: 'อีเมล'),
                        ),
                        if (otpSent) ...[
                          const SizedBox(height: 12),
                          TextField(
                            controller: otp,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            decoration: const InputDecoration(
                              labelText: 'รหัส OTP 6 หลัก',
                              counterText: '',
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: newPassword,
                            obscureText: !showNewPassword,
                            decoration: InputDecoration(
                              labelText: 'รหัสผ่านใหม่',
                              suffixIcon: IconButton(
                                onPressed:
                                    () => setDialogState(
                                      () => showNewPassword = !showNewPassword,
                                    ),
                                icon: Icon(
                                  showNewPassword
                                      ? Icons.visibility_off
                                      : Icons.visibility,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: confirmPassword,
                            obscureText: !showNewPassword,
                            decoration: const InputDecoration(
                              labelText: 'ยืนยันรหัสผ่านใหม่',
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: busy ? null : () => Navigator.pop(context),
                      child: const Text('ยกเลิก'),
                    ),
                    if (otpSent)
                      TextButton(
                        onPressed:
                            busy
                                ? null
                                : () => setDialogState(() => otpSent = false),
                        child: const Text('ส่งใหม่'),
                      ),
                    FilledButton(
                      onPressed:
                          busy
                              ? null
                              : () async {
                                final address = resetEmail.text.trim();
                                if (!address.contains('@')) {
                                  message('กรุณากรอกอีเมลให้ถูกต้อง');
                                  return;
                                }
                                if (otpSent &&
                                    (otp.text.length != 6 ||
                                        newPassword.text.length < 8 ||
                                        newPassword.text !=
                                            confirmPassword.text)) {
                                  message(
                                    'ตรวจสอบ OTP และรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษรให้ตรงกัน',
                                  );
                                  return;
                                }
                                setDialogState(() => busy = true);
                                try {
                                  if (!otpSent) {
                                    final result = await widget.api.call(
                                      '/auth/forgot-password',
                                      method: 'POST',
                                      body: {'email': address},
                                    );
                                    if (!dialogContext.mounted) return;
                                    setDialogState(() => otpSent = true);
                                    message(result['message']);
                                  } else {
                                    final result = await widget.api.call(
                                      '/auth/reset-password',
                                      method: 'POST',
                                      body: {
                                        'email': address,
                                        'otp': otp.text,
                                        'password': newPassword.text,
                                      },
                                    );
                                    if (!dialogContext.mounted) return;
                                    Navigator.pop(dialogContext);
                                    user.text = address;
                                    pass.clear();
                                    message(result['message']);
                                  }
                                } catch (error) {
                                  message(
                                    error.toString().replaceFirst(
                                      'Exception: ',
                                      '',
                                    ),
                                  );
                                } finally {
                                  if (dialogContext.mounted) {
                                    setDialogState(() => busy = false);
                                  }
                                }
                              },
                      child: Text(
                        busy
                            ? 'กำลังดำเนินการ...'
                            : otpSent
                            ? 'ตั้งรหัสผ่านใหม่'
                            : 'ส่งรหัส OTP',
                      ),
                    ),
                  ],
                ),
          ),
    );
    resetEmail.dispose();
    otp.dispose();
    newPassword.dispose();
    confirmPassword.dispose();
  }
}

class HomePage extends StatefulWidget {
  final Api api;
  final Map<String, dynamic> user;
  final VoidCallback onLogout;
  final String language;
  final ThemeMode themeMode;
  final ValueChanged<String> onLanguageChanged;
  final ValueChanged<ThemeMode> onThemeChanged;
  const HomePage({
    super.key,
    required this.api,
    required this.user,
    required this.onLogout,
    required this.language,
    required this.themeMode,
    required this.onLanguageChanged,
    required this.onThemeChanged,
  });
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int index = 0;
  bool loading = false;
  Map<String, dynamic> stats = {};
  List equipment = [], loans = [], users = [];
  final Map<String, Uint8List> _decodedImageCache = {};
  final Map<int, int> cart = {};
  String equipmentQuery = '', loanQuery = '';
  String loanFilter = 'all';
  String maintenanceQuery = '';
  bool reviewingCart = false;
  DateTime checkoutDue = DateTime.now().add(const Duration(days: 7));
  final checkoutRemark = TextEditingController();
  bool get admin => widget.user['role'] == 'admin';
  bool get english => widget.language == 'en';
  String tr(String thai, String englishText) => english ? englishText : thai;
  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() => loading = true);
    try {
      final values = await Future.wait([
        widget.api.call('/dashboard'),
        widget.api.call('/equipment'),
        widget.api.call('/loans'),
        if (admin) widget.api.call('/users'),
      ]);
      setState(() {
        stats = Map<String, dynamic>.from(values[0]);
        equipment = List.from(values[1]);
        loans = List.from(values[2]);
        if (admin) users = List.from(values[3]);
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Uint8List? decodedImage(String value) {
    if (!value.startsWith('data:image/') || !value.contains(',')) return null;
    final cached = _decodedImageCache[value];
    if (cached != null) return cached;
    try {
      final bytes = base64Decode(value.substring(value.indexOf(',') + 1));
      // Keep the cache bounded so a long session cannot retain every image forever.
      if (_decodedImageCache.length >= 40) {
        _decodedImageCache.remove(_decodedImageCache.keys.first);
      }
      _decodedImageCache[value] = bytes;
      return bytes;
    } catch (_) {
      return null;
    }
  }

  Widget currentPage() {
    if (admin) {
      switch (index) {
        case 1:
          return inventory();
        case 2:
          return tracking();
        case 3:
          return maintenance();
        case 4:
          return accounts();
        case 5:
          return profile();
        default:
          return dashboard();
      }
    }
    switch (index) {
      case 1:
        return reviewingCart ? cartReviewPage() : inventory(borrow: true);
      case 2:
        return returns();
      case 3:
        return tracking();
      case 4:
        return profile();
      default:
        return dashboard();
    }
  }

  List<NavigationDestination> get destinations =>
      admin
          ? [
            NavigationDestination(
              icon: const Icon(Icons.grid_view),
              label: tr('ตรวจเช็ค', 'Dashboard'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.inventory_2_outlined),
              label: tr('คลัง', 'Inventory'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.swap_horiz),
              label: tr('ติดตาม', 'Loans'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.build_outlined),
              label: tr('ซ่อมบำรุง', 'Repair'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.manage_accounts_outlined),
              label: tr('ผู้ใช้', 'Users'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.person_outline),
              label: tr('บัญชี', 'Account'),
            ),
          ]
          : [
            NavigationDestination(
              icon: const Icon(Icons.grid_view),
              label: tr('ตรวจเช็ค', 'Dashboard'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.add_shopping_cart),
              label: tr('ยืม', 'Borrow'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.assignment_return_outlined),
              label: tr('คืน', 'Return'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.history),
              label: tr('ประวัติ', 'History'),
            ),
            NavigationDestination(
              icon: const Icon(Icons.person_outline),
              label: tr('บัญชี', 'Account'),
            ),
          ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.surface,
        toolbarHeight: 56,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: const BrandLogo(size: 40),
        ),
        title: const Text(
          'ระบบยืม-คืน อุปกรณ์ IoT',
          style: TextStyle(
            color: Color(0xff123c2f),
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
        actions: const [SizedBox(width: 56)],
      ),
      body: RefreshIndicator(
        onRefresh: load,
        child:
            loading && equipment.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : currentPage(),
      ),
      bottomNavigationBar: appNavigation(),
      bottomSheet:
          !admin && index == 1 && cart.isNotEmpty && !reviewingCart
              ? cartBar()
              : null,
    );
  }

  Widget appNavigation() {
    final items = destinations;
    final darkMode = Theme.of(context).brightness == Brightness.dark;
    return SafeArea(
      top: false,
      child: Container(
        height: 68,
        decoration: BoxDecoration(
          color: darkMode ? const Color(0xff16231d) : Colors.white,
          border: Border(
            top: BorderSide(
              color:
                  darkMode ? const Color(0xff34443d) : const Color(0xffdce4df),
            ),
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x100f2d22),
              blurRadius: 12,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          children: List.generate(items.length, (itemIndex) {
            final item = items[itemIndex];
            final selected = index == itemIndex;
            final color = selected ? green : const Color(0xff9aa7a1);
            return Expanded(
              child: InkWell(
                onTap:
                    () => setState(() {
                      index = itemIndex;
                      if (itemIndex != 1) reviewingCart = false;
                    }),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 160),
                      width: selected ? 26 : 0,
                      height: 3,
                      margin: const EdgeInsets.only(bottom: 5),
                      decoration: BoxDecoration(
                        color: selected ? green : Colors.transparent,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    IconTheme(
                      data: IconThemeData(color: color, size: 20),
                      child: item.icon,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: color,
                        fontSize: items.length > 5 ? 8 : 9,
                        fontWeight:
                            selected ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget page(String title, String subtitle, List<Widget> children) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      Text(
        title,
        style: const TextStyle(
          color: green,
          fontSize: 25,
          fontWeight: FontWeight.bold,
        ),
      ),
      Text(subtitle, style: const TextStyle(color: muted, fontSize: 12)),
      const SizedBox(height: 14),
      ...children,
    ],
  );
  Widget dashboard() =>
      page('ตรวจเช็ค', 'ภาพรวมสถานะอุปกรณ์และความเคลื่อนไหวล่าสุด', [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.8,
          children: [
            stat('อุปกรณ์ทั้งหมด', stats['total']),
            stat('พร้อมใช้งาน', stats['available'], green),
            stat('ถูกยืมอยู่', stats['activeLoans'], orange),
            stat('ชำรุด/รอซ่อม', stats['maintenance'], red),
          ],
        ),
        const Section('ความเคลื่อนไหวล่าสุด'),
        ...loans.take(4).map((x) => loanCard(x, showBorrower: admin)),
      ]);
  Widget stat(String text, dynamic value, [Color color = dark]) => Card(
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 3,
            margin: const EdgeInsets.only(bottom: 9),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          Text(
            '${value ?? 0}',
            style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w700),
          ),
          Text(text, style: const TextStyle(fontSize: 10, color: muted)),
        ],
      ),
    ),
  );
  Widget inventory({bool borrow = false}) => page(
    borrow ? 'ยืมอุปกรณ์' : 'คลังอุปกรณ์',
    borrow ? 'เลือกอุปกรณ์ที่พร้อมใช้งาน' : 'จัดการและตรวจสอบอุปกรณ์',
    [
      TextField(
        onChanged:
            (value) =>
                setState(() => equipmentQuery = value.trim().toLowerCase()),
        decoration: InputDecoration(
          hintText: 'ค้นหาด้วยชื่อ รหัส หรือหมวดหมู่...',
          prefixIcon: const Icon(Icons.search),
          suffixIcon:
              equipmentQuery.isEmpty
                  ? null
                  : const Icon(Icons.filter_alt_outlined),
        ),
      ),
      const SizedBox(height: 10),
      if (admin && !borrow)
        Align(
          alignment: Alignment.centerRight,
          child: FilledButton.icon(
            onPressed: addEquipment,
            icon: const Icon(Icons.add),
            label: const Text('เพิ่ม'),
          ),
        ),
      if (borrow)
        Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'อุปกรณ์ที่พร้อมให้ยืม',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              status('available'),
            ],
          ),
        ),
      ...equipment
          .where((x) {
            if (equipmentQuery.isEmpty) return true;
            return '${x['name']} ${x['code']} ${x['category']}'
                .toLowerCase()
                .contains(equipmentQuery);
          })
          .map((x) => equipmentCard(x, borrow)),
      if (admin && !borrow) stockSummary(),
      if (borrow && cart.isNotEmpty) const SizedBox(height: 76),
    ],
  );
  Widget stockSummary() {
    final total = equipment.fold<int>(
      0,
      (sum, x) => sum + ((x['totalQuantity'] ?? 0) as num).toInt(),
    );
    final repair = equipment.fold<int>(
      0,
      (sum, x) => sum + ((x['maintenanceQuantity'] ?? 0) as num).toInt(),
    );
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: dark,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(child: summaryValue('รวมอุปกรณ์', total)),
          Container(width: 1, height: 38, color: Colors.white24),
          Expanded(child: summaryValue('ต้องซ่อม', repair)),
        ],
      ),
    );
  }

  Widget summaryValue(String text, int value) => Column(
    children: [
      Text(text, style: const TextStyle(color: Colors.white60, fontSize: 10)),
      Text(
        '$value',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 24,
          fontWeight: FontWeight.bold,
        ),
      ),
    ],
  );
  Widget equipmentImage(dynamic item) {
    final value = item['imageUrl']?.toString() ?? '';
    final bytes = decodedImage(value);
    if (bytes != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(6),
        child: Image.memory(
          bytes,
          width: 52,
          height: 58,
          cacheWidth: 156,
          fit: BoxFit.cover,
          gaplessPlayback: true,
          errorBuilder: (_, __, ___) => const Icon(Icons.memory, color: green),
        ),
      );
    }
    return const Icon(Icons.memory, color: green);
  }

  Future<String?> pickEquipmentImage() async {
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 78,
      maxWidth: 1200,
      maxHeight: 1200,
    );
    if (picked == null) return null;
    final bytes = await picked.readAsBytes();
    if (bytes.length > 2 * 1024 * 1024) {
      throw Exception('รูปภาพต้องมีขนาดไม่เกิน 2 MB');
    }
    final lower = picked.name.toLowerCase();
    final mime =
        lower.endsWith('.png')
            ? 'image/png'
            : lower.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg';
    return 'data:$mime;base64,${base64Encode(bytes)}';
  }

  Future<void> changeEquipmentImage(dynamic item) async {
    try {
      final imageUrl = await pickEquipmentImage();
      if (imageUrl == null) return;
      setState(() => item['imageUrl'] = imageUrl);
      await widget.api.call(
        '/equipment/${item['id']}',
        method: 'PUT',
        body: {
          'code': item['code'],
          'name': item['name'],
          'category': item['category'],
          'description': item['description'] ?? '',
          'totalQuantity': item['totalQuantity'],
          'status': item['status'],
          'imageUrl': imageUrl,
        },
      );
      await load();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('บันทึกรูปอุปกรณ์แล้ว')));
      }
    } catch (e) {
      await load();
      error(e);
    }
  }

  Widget equipmentCard(dynamic x, bool borrow) => Card(
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 58,
                decoration: BoxDecoration(
                  color: const Color(0xfff3f6f4),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: equipmentImage(x),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    status(
                      x['status'] == 'retired'
                          ? 'retired'
                          : (x['maintenanceQuantity'] ?? 0) > 0 &&
                              x['maintenanceQuantity'] == x['totalQuantity']
                          ? 'maintenance'
                          : (x['availableQuantity'] ?? 0) > 0
                          ? 'available'
                          : 'outOfStock',
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${x['name']}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      '${x['code']}',
                      style: const TextStyle(fontSize: 10, color: muted),
                    ),
                    Text(
                      '${x['category']} · ชำรุด ${x['maintenanceQuantity'] ?? 0} ชิ้น · ยืมได้ ${x['availableQuantity']} ชิ้น',
                      style: const TextStyle(fontSize: 11, color: muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (admin && !borrow) ...[
            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 9),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => editEquipment(x),
                    icon: const Icon(Icons.edit_outlined, size: 17),
                    label: const Text('แก้ไข'),
                  ),
                ),
                const SizedBox(width: 7),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => changeEquipmentImage(x),
                    icon: const Icon(Icons.add_a_photo_outlined, size: 17),
                    label: Text(
                      x['imageUrl'] == null ? 'เพิ่มรูป' : 'เปลี่ยนรูป',
                    ),
                  ),
                ),
                const SizedBox(width: 7),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(foregroundColor: red),
                    onPressed: () => deleteEquipment(x),
                    icon: const Icon(Icons.delete_outline, size: 17),
                    label: const Text('ลบ'),
                  ),
                ),
              ],
            ),
          ],
          if (borrow &&
              x['status'] != 'retired' &&
              number(x['availableQuantity']) > 0)
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed:
                    (cart[number(x['id'])] ?? 0) <
                            number(x['availableQuantity'])
                        ? () {
                          setCart(x, (cart[number(x['id'])] ?? 0) + 1);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('เพิ่มในรายการยืมแล้ว'),
                              duration: Duration(milliseconds: 800),
                            ),
                          );
                        }
                        : null,
                icon: const Icon(Icons.add),
                label: Text(
                  (cart[number(x['id'])] ?? 0) > 0
                      ? 'เพิ่มอีก · เลือกแล้ว ${cart[number(x['id'])]} ชิ้น'
                      : 'เพิ่มในรายการยืม',
                ),
              ),
            ),
        ],
      ),
    ),
  );

  int number(dynamic value) =>
      value is num ? value.toInt() : int.tryParse(value?.toString() ?? '') ?? 0;

  Widget cartBar() => Material(
    elevation: 12,
    color: dark,
    child: SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        child: Row(
          children: [
            const Icon(Icons.shopping_basket_outlined, color: Colors.white),
            const SizedBox(width: 9),
            Expanded(
              child: Text(
                'เลือกแล้ว\n${cart.length} รายการ · ${cart.values.fold<int>(0, (a, b) => a + b)} ชิ้น',
                style: const TextStyle(color: Colors.white, fontSize: 11),
              ),
            ),
            FilledButton(
              onPressed: () => setState(() => reviewingCart = true),
              child: const Text('ยืนยันการยืม  →'),
            ),
          ],
        ),
      ),
    ),
  );

  Widget cartReviewPage() => page(
    'ตะกร้าอุปกรณ์',
    'ตรวจสอบจำนวนและกรอกข้อมูลการยืม',
    [
      Align(
        alignment: Alignment.centerLeft,
        child: TextButton.icon(
          onPressed: () => setState(() => reviewingCart = false),
          icon: const Icon(Icons.arrow_back),
          label: const Text('กลับไปเลือกอุปกรณ์'),
        ),
      ),
      ...cart.entries.toList().map((entry) {
        final item = equipment.firstWhere((x) => number(x['id']) == entry.key);
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                const SizedBox(
                  width: 42,
                  height: 52,
                  child: Icon(Icons.memory, color: green, size: 30),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${item['name']}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '${item['code']}',
                        style: const TextStyle(fontSize: 10, color: muted),
                      ),
                    ],
                  ),
                ),
                IconButton.filledTonal(
                  onPressed: () => setCart(item, entry.value - 1),
                  icon: const Icon(Icons.remove),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 7),
                  child: Text(
                    '${entry.value}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                IconButton.filledTonal(
                  onPressed:
                      entry.value < number(item['availableQuantity'])
                          ? () => setCart(item, entry.value + 1)
                          : null,
                  icon: const Icon(Icons.add),
                ),
              ],
            ),
          ),
        );
      }),
      const Section('ข้อมูลการยืม'),
      Card(
        child: ListTile(
          leading: const Icon(Icons.person_outline, color: green),
          title: const Text(
            'ชื่อผู้ยืม',
            style: TextStyle(fontSize: 10, color: muted),
          ),
          subtitle: Text(
            '${widget.user['fullName']}',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
      ),
      Card(
        child: ListTile(
          leading: const Icon(Icons.calendar_month, color: green),
          title: const Text(
            'กำหนดคืน (Return Date)',
            style: TextStyle(fontSize: 11),
          ),
          subtitle: Text(
            fmt(checkoutDue.toIso8601String()),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          trailing: const Icon(Icons.chevron_right),
          onTap: pickCheckoutDate,
        ),
      ),
      TextField(
        controller: checkoutRemark,
        minLines: 3,
        maxLines: 4,
        decoration: const InputDecoration(
          labelText: 'หมายเหตุ',
          hintText: 'ระบุรายละเอียดเพิ่มเติม (ถ้ามี)',
        ),
      ),
      const SizedBox(height: 10),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xffeef1ff),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('จำนวนอุปกรณ์รวม'),
            Text(
              '${cart.values.fold<int>(0, (a, b) => a + b)} ชิ้น',
              style: const TextStyle(color: green, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
      const SizedBox(height: 10),
      SizedBox(
        width: double.infinity,
        child: FilledButton.icon(
          onPressed: loading || cart.isEmpty ? null : submitCart,
          icon: const Icon(Icons.check_circle),
          label: Text(loading ? 'กำลังบันทึก...' : 'ยืนยันการยืม'),
        ),
      ),
    ],
  );
  Widget returns() {
    final active = loans.where((x) => x['status'] == 'borrowed').toList();
    return page('คืนอุปกรณ์', 'เลือกอุปกรณ์ที่ต้องการคืน', [
      TextField(
        onChanged:
            (value) => setState(() => loanQuery = value.trim().toLowerCase()),
        decoration: const InputDecoration(
          hintText: 'ค้นหาอุปกรณ์ที่กำลังยืม...',
          prefixIcon: Icon(Icons.search),
        ),
      ),
      const SizedBox(height: 10),
      if (active.isEmpty) const Empty(text: 'ไม่มีอุปกรณ์ที่กำลังยืม'),
      ...active
          .where(
            (x) =>
                loanQuery.isEmpty ||
                '${x['equipmentName']} ${x['equipmentCode']}'
                    .toLowerCase()
                    .contains(loanQuery),
          )
          .map((x) => loanCard(x, canReturn: true)),
    ]);
  }

  Widget tracking() => page(
    admin ? 'ติดตามการยืม' : 'ประวัติการใช้อุปกรณ์',
    admin ? 'ตรวจสอบว่าใครกำลังยืมอุปกรณ์' : 'รายการยืม-คืนของคุณ',
    [
      if (!admin) historyStats(),
      if (admin)
        Align(
          alignment: Alignment.centerRight,
          child: FilledButton.icon(
            onPressed: exportLoans,
            icon: const Icon(Icons.file_download_outlined),
            label: Text(tr('ส่งออก Excel', 'Export Excel')),
          ),
        ),
      TextField(
        onChanged:
            (value) => setState(() => loanQuery = value.trim().toLowerCase()),
        decoration: InputDecoration(
          hintText:
              admin
                  ? 'ค้นหาผู้ยืม รหัสนิสิต หรืออุปกรณ์...'
                  : 'ค้นหาด้วยรหัสหรือชื่ออุปกรณ์...',
          prefixIcon: const Icon(Icons.search),
        ),
      ),
      const SizedBox(height: 9),
      SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            filterChip('all', 'ทั้งหมด'),
            filterChip('borrowed', 'กำลังยืม'),
            filterChip('returned', 'คืนแล้ว'),
            if (!admin) filterChip('issue', 'แจ้งซ่อม'),
          ],
        ),
      ),
      const SizedBox(height: 4),
      ...filteredLoans().map((x) => loanCard(x, showBorrower: admin)),
      if (filteredLoans().isEmpty) const Empty(text: 'ไม่พบรายการยืม'),
    ],
  );

  Widget historyStats() {
    final active = loans.where((x) => x['status'] == 'borrowed').length;
    final returned = loans.where((x) => x['status'] == 'returned').length;
    final issues =
        loans
            .where(
              (x) => [
                'damaged',
                'lost',
                'abnormal',
              ].contains(x['returnCondition']),
            )
            .length;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(child: stat('กำลังยืม', active, green)),
          Expanded(child: stat('คืนแล้ว', returned)),
          Expanded(child: stat('แจ้งซ่อม', issues, red)),
        ],
      ),
    );
  }

  Widget filterChip(String value, String text) => Padding(
    padding: const EdgeInsets.only(right: 6),
    child: ChoiceChip(
      label: Text(text),
      selected: loanFilter == value,
      onSelected: (_) => setState(() => loanFilter = value),
      selectedColor: green,
      labelStyle: TextStyle(
        color: loanFilter == value ? Colors.white : muted,
        fontSize: 11,
      ),
      showCheckmark: false,
    ),
  );

  List filteredLoans() =>
      loans.where((x) {
        final issue = [
          'damaged',
          'lost',
          'abnormal',
        ].contains(x['returnCondition']);
        if (loanFilter == 'issue' && !issue) return false;
        if (loanFilter != 'all' &&
            loanFilter != 'issue' &&
            x['status'] != loanFilter) {
          return false;
        }
        if (loanQuery.isEmpty) return true;
        return '${x['equipmentName']} ${x['equipmentCode']} ${x['borrowerName'] ?? ''} ${x['studentId'] ?? ''}'
            .toLowerCase()
            .contains(loanQuery);
      }).toList();
  Widget loanCard(
    dynamic x, {
    bool showBorrower = false,
    bool canReturn = false,
  }) => Card(
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 52,
                height: 58,
                decoration: BoxDecoration(
                  color: const Color(0xfff3f6f4),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: equipmentImage(x),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${x['equipmentName']}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      '${x['equipmentCode']} · จำนวน ${x['quantity']} ชิ้น',
                      style: const TextStyle(fontSize: 10, color: muted),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              status('${x['status']}'),
            ],
          ),
          if (showBorrower)
            Container(
              margin: const EdgeInsets.only(top: 9),
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(
                color: const Color(0xfff4f7f5),
                borderRadius: BorderRadius.circular(7),
              ),
              child: Row(
                children: [
                  avatar(x['borrowerAvatar'], radius: 16),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ผู้ยืม',
                        style: TextStyle(fontSize: 9, color: muted),
                      ),
                      Text(
                        '${x['borrowerName']}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'รหัสนิสิต: ${x['studentId'] ?? '-'}',
                        style: const TextStyle(fontSize: 10, color: muted),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          const Divider(),
          Text(
            'วันที่ยืม ${fmt(x['borrowedAt'])}  ·  กำหนดคืน ${fmt(x['dueAt'])}',
            style: const TextStyle(fontSize: 10),
          ),
          if (x['returnedAt'] != null)
            Text(
              'วันที่คืนจริง ${fmt(x['returnedAt'])}',
              style: const TextStyle(fontSize: 10, color: green),
            ),
          if (canReturn)
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => returnItem(x),
                child: const Text('คืนอุปกรณ์'),
              ),
            ),
        ],
      ),
    ),
  );
  Widget maintenance() {
    final issues =
        loans.where((x) {
          final hasBorrowRemark =
              (x['borrowRemark'] ?? '').toString().isNotEmpty;
          final hasReturnRemark =
              (x['returnRemark'] ?? '').toString().isNotEmpty;
          final hasDamage = [
            'damaged',
            'abnormal',
            'lost',
          ].contains(x['returnCondition']);
          final repairable = [
            'damaged',
            'abnormal',
          ].contains(x['returnCondition']);
          return (!repairable || x['repairedAt'] == null) &&
              (hasBorrowRemark || hasReturnRemark || hasDamage);
        }).toList();
    final cards =
        issues
            .where(
              (x) =>
                  maintenanceQuery.isEmpty ||
                  '${x['equipmentName']} ${x['equipmentCode']} ${x['borrowerName']} ${x['borrowRemark'] ?? ''} ${x['returnRemark'] ?? ''}'
                      .toLowerCase()
                      .contains(maintenanceQuery),
            )
            .map<Widget>((x) {
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${x['equipmentName']}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          status('${x['returnCondition'] ?? 'มีหมายเหตุ'}'),
                        ],
                      ),
                      Text(
                        'แจ้งโดย ${x['borrowerName']}',
                        style: const TextStyle(fontSize: 10, color: muted),
                      ),
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(top: 8),
                        padding: const EdgeInsets.all(9),
                        color: const Color(0xfffff8eb),
                        child: Text(
                          '${x['returnRemark'] ?? x['borrowRemark']}',
                        ),
                      ),
                      if ([
                        'damaged',
                        'abnormal',
                      ].contains(x['returnCondition']))
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: () => completeRepair(x),
                            icon: const Icon(Icons.check),
                            label: const Text('เสร็จสิ้น'),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            })
            .toList();
    return page('ซ่อมบำรุง', 'เฉพาะอุปกรณ์ที่มีหมายเหตุหรือระบุว่าชำรุด', [
      TextField(
        onChanged:
            (value) =>
                setState(() => maintenanceQuery = value.trim().toLowerCase()),
        decoration: const InputDecoration(
          hintText: 'ค้นหาอุปกรณ์หรือผู้แจ้ง...',
          prefixIcon: Icon(Icons.search),
        ),
      ),
      const SizedBox(height: 8),
      if (cards.isEmpty) const Empty(text: 'ไม่มีอุปกรณ์รอซ่อม') else ...cards,
    ]);
  }

  Widget avatar(dynamic value, {double radius = 24}) {
    final data = value?.toString() ?? '';
    final bytes = decodedImage(data);
    if (bytes != null) {
      return CircleAvatar(
        radius: radius,
        backgroundImage: ResizeImage(
          MemoryImage(bytes),
          width: (radius * 4).round(),
          height: (radius * 4).round(),
        ),
      );
    }
    return CircleAvatar(
      radius: radius,
      backgroundColor: const Color(0xffe7f3ed),
      child: Icon(Icons.person, size: radius, color: green),
    );
  }

  Widget accounts() =>
      page('จัดการบัญชีผู้ใช้', 'ตรวจสอบสิทธิ์ สถานะ และรายการยืมของสมาชิก', [
        TextField(
          onChanged:
              (value) =>
                  setState(() => accountQuery = value.trim().toLowerCase()),
          decoration: const InputDecoration(
            hintText: 'ค้นหาชื่อ ชื่อผู้ใช้ หรือรหัสนิสิต...',
            prefixIcon: Icon(Icons.search),
          ),
        ),
        const SizedBox(height: 10),
        ...users
            .where(
              (u) => '${u['fullName']} ${u['username']} ${u['studentId'] ?? ''}'
                  .toLowerCase()
                  .contains(accountQuery),
            )
            .map(accountCard),
        if (users.isEmpty) const Empty(text: 'ไม่พบบัญชีผู้ใช้'),
      ]);

  String accountQuery = '';

  Widget accountCard(dynamic u) => Card(
    color: u['active'] == false ? const Color(0xfff1f1f1) : Colors.white,
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              avatar(u['avatarUrl']),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${u['fullName']}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      'อีเมล/ชื่อผู้ใช้: ${u['username']}',
                      style: const TextStyle(color: muted, fontSize: 12),
                    ),
                    Text(
                      'รหัสนิสิต: ${u['studentId'] ?? '-'}',
                      style: const TextStyle(fontSize: 11),
                    ),
                    Text(
                      'สิทธิ์: ${u['role'] == 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}',
                      style: const TextStyle(fontSize: 11),
                    ),
                  ],
                ),
              ),
              status(u['active'] == false ? 'inactive' : 'active'),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'กำลังยืม ${u['activeLoans'] ?? 0} · เกินกำหนด ${u['overdueLoans'] ?? 0}',
            style: TextStyle(
              color: number(u['overdueLoans']) > 0 ? red : muted,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 6),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => showUserLoans(u),
              icon: const Icon(Icons.receipt_long_outlined),
              label: const Text('ดูอุปกรณ์และประวัติการยืม'),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => editAccount(u),
                  child: const Text('แก้ไขข้อมูล'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton.tonal(
                  onPressed: () => toggleAccount(u),
                  child: Text(u['active'] == false ? 'เปิดบัญชี' : 'ปิดบัญชี'),
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );

  Future<void> showUserLoans(dynamic user) async {
    final items =
        loans.where((loan) => '${loan['userId']}' == '${user['id']}').toList();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder:
          (sheetContext) => DraggableScrollableSheet(
            expand: false,
            initialChildSize: .85,
            minChildSize: .5,
            maxChildSize: .95,
            builder:
                (context, controller) => ListView(
                  controller: controller,
                  padding: const EdgeInsets.all(16),
                  children: [
                    Row(
                      children: [
                        avatar(user['avatarUrl'], radius: 28),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${user['fullName']}',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text('อีเมล/ชื่อผู้ใช้: ${user['username']}'),
                              Text('รหัสนิสิต: ${user['studentId'] ?? '-'}'),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(sheetContext),
                          icon: const Icon(Icons.close),
                        ),
                      ],
                    ),
                    const Divider(height: 28),
                    Text(
                      'ประวัติการยืมทั้งหมด ${items.length} รายการ',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    if (items.isEmpty)
                      const Empty(text: 'ผู้ใช้ยังไม่มีประวัติการยืม')
                    else
                      ...items.map(loanCard),
                  ],
                ),
          ),
    );
  }

  Future<void> editAccount(dynamic u) async {
    final name = TextEditingController(text: '${u['fullName']}');
    final accountEmail = TextEditingController(text: '${u['email'] ?? ''}');
    final student = TextEditingController(text: '${u['studentId'] ?? ''}');
    String role = u['role'] == 'admin' ? 'admin' : 'user';
    bool active = u['active'] != false;
    final save = await showDialog<bool>(
      context: context,
      builder:
          (ctx) => StatefulBuilder(
            builder:
                (ctx, setModal) => AlertDialog(
                  title: const Text('แก้ไขบัญชีผู้ใช้'),
                  content: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        TextField(
                          controller: name,
                          decoration: const InputDecoration(
                            labelText: 'ชื่อ-นามสกุล',
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: accountEmail,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'อีเมลสำหรับกู้คืนรหัสผ่าน',
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: student,
                          decoration: const InputDecoration(
                            labelText: 'รหัสนิสิต',
                          ),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: role,
                          decoration: const InputDecoration(
                            labelText: 'สิทธิ์',
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'user',
                              child: Text('ผู้ใช้งาน'),
                            ),
                            DropdownMenuItem(
                              value: 'admin',
                              child: Text('ผู้ดูแลระบบ'),
                            ),
                          ],
                          onChanged: (v) => role = v!,
                        ),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('อนุญาตให้เข้าสู่ระบบ'),
                          value: active,
                          onChanged: (v) => setModal(() => active = v),
                        ),
                      ],
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('ยกเลิก'),
                    ),
                    FilledButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('บันทึก'),
                    ),
                  ],
                ),
          ),
    );
    if (save == true) {
      await updateAccount(
        u,
        name.text.trim(),
        accountEmail.text.trim(),
        student.text.trim(),
        role,
        active,
      );
    }
  }

  Future<void> toggleAccount(dynamic u) async => updateAccount(
    u,
    '${u['fullName']}',
    '${u['email'] ?? ''}',
    '${u['studentId'] ?? ''}',
    '${u['role']}',
    u['active'] == false,
  );

  Future<void> updateAccount(
    dynamic u,
    String name,
    String email,
    String student,
    String role,
    bool active,
  ) async {
    try {
      await widget.api.call(
        '/users/${u['id']}',
        method: 'PUT',
        body: {
          'fullName': name,
          'email': email,
          'studentId': student,
          'role': role,
          'active': active,
        },
      );
      await load();
    } catch (e) {
      error(e);
    }
  }

  Future<void> changeAvatar() async {
    try {
      final imageUrl = await pickEquipmentImage();
      if (imageUrl == null) return;
      final result = await widget.api.call(
        '/auth/avatar',
        method: 'PUT',
        body: {'avatarUrl': imageUrl},
      );
      setState(() => widget.user['avatarUrl'] = result['avatarUrl']);
    } catch (e) {
      error(e);
    }
  }

  void notice(String text) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  Future<void> changePasswordWithOtp() async {
    final emailController = TextEditingController(
      text: '${widget.user['email'] ?? ''}',
    );
    final address = await showDialog<String>(
      context: context,
      builder:
          (ctx) => AlertDialog(
            icon: const Icon(Icons.mark_email_read_outlined, color: green),
            title: Text(tr('เปลี่ยนรหัสผ่าน', 'Change password')),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  tr(
                    'กรอกอีเมลที่ผูกกับบัญชี ระบบจะส่งรหัส OTP 6 หลักให้คุณ',
                    'Enter the email linked to your account to receive a 6-digit OTP.',
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: tr('อีเมล', 'Email'),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(tr('ยกเลิก', 'Cancel')),
              ),
              FilledButton(
                onPressed:
                    () => Navigator.pop(ctx, emailController.text.trim()),
                child: Text(tr('ส่งรหัส OTP', 'Send OTP')),
              ),
            ],
          ),
    );
    emailController.dispose();
    if (address == null) return;
    if (!address.contains('@')) {
      notice(tr('กรุณากรอกอีเมลให้ถูกต้อง', 'Enter a valid email address.'));
      return;
    }
    try {
      final result = await widget.api.call(
        '/auth/forgot-password',
        method: 'POST',
        body: {'email': address},
      );
      notice('${result['message']}');
    } catch (e) {
      error(e);
      return;
    }
    if (!context.mounted) return;

    final otp = TextEditingController();
    final newPassword = TextEditingController();
    final confirmPassword = TextEditingController();
    var showPassword = false;
    while (context.mounted) {
      final values = await showDialog<Map<String, String>>(
        // Guarded by context.mounted at the start of every loop iteration.
        // ignore: use_build_context_synchronously
        context: context,
        barrierDismissible: false,
        builder:
            (ctx) => StatefulBuilder(
              builder:
                  (ctx, setModal) => AlertDialog(
                    icon: const Icon(Icons.lock_reset, color: green),
                    title: Text(tr('ยืนยัน OTP', 'Verify OTP')),
                    content: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            tr(
                              'กรอกรหัสจากอีเมล รหัสมีอายุ 5 นาที',
                              'Enter the code from your email. It expires in 5 minutes.',
                            ),
                          ),
                          const SizedBox(height: 14),
                          TextField(
                            controller: otp,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            decoration: InputDecoration(
                              labelText: tr('รหัส OTP 6 หลัก', '6-digit OTP'),
                              counterText: '',
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: newPassword,
                            obscureText: !showPassword,
                            decoration: InputDecoration(
                              labelText: tr('รหัสผ่านใหม่', 'New password'),
                              suffixIcon: IconButton(
                                onPressed:
                                    () => setModal(
                                      () => showPassword = !showPassword,
                                    ),
                                icon: Icon(
                                  showPassword
                                      ? Icons.visibility_off
                                      : Icons.visibility,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: confirmPassword,
                            obscureText: !showPassword,
                            decoration: InputDecoration(
                              labelText: tr(
                                'ยืนยันรหัสผ่านใหม่',
                                'Confirm new password',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: Text(tr('ยกเลิก', 'Cancel')),
                      ),
                      FilledButton(
                        onPressed:
                            () => Navigator.pop(ctx, {
                              'otp': otp.text.trim(),
                              'password': newPassword.text,
                              'confirm': confirmPassword.text,
                            }),
                        child: Text(
                          tr('ตั้งรหัสผ่านใหม่', 'Set new password'),
                        ),
                      ),
                    ],
                  ),
            ),
      );
      if (values == null) break;
      if (values['otp']?.length != 6 ||
          (values['password']?.length ?? 0) < 8 ||
          values['password'] != values['confirm']) {
        notice(
          tr(
            'ตรวจสอบ OTP และรหัสผ่านอย่างน้อย 8 ตัวอักษรให้ตรงกัน',
            'Check the OTP and ensure both passwords match and contain at least 8 characters.',
          ),
        );
        continue;
      }
      try {
        final result = await widget.api.call(
          '/auth/reset-password',
          method: 'POST',
          body: {
            'email': address,
            'otp': values['otp'],
            'password': values['password'],
          },
        );
        notice('${result['message']}');
        widget.onLogout();
        break;
      } catch (e) {
        error(e);
      }
    }
    otp.dispose();
    newPassword.dispose();
    confirmPassword.dispose();
  }

  Widget profile() => page(
    tr('บัญชี${admin ? ' Admin' : ''}', admin ? 'Admin account' : 'Account'),
    tr('จัดการข้อมูลและการตั้งค่าบัญชี', 'Manage your profile and preferences'),
    [
      Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            children: [
              Row(
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      avatar(widget.user['avatarUrl'], radius: 43),
                      Positioned(
                        right: -4,
                        bottom: -4,
                        child: IconButton.filled(
                          visualDensity: VisualDensity.compact,
                          onPressed: changeAvatar,
                          icon: const Icon(Icons.camera_alt_outlined, size: 17),
                          tooltip: tr('เปลี่ยนรูปโปรไฟล์', 'Change photo'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          admin ? 'ADMINISTRATOR' : 'MEMBER',
                          style: const TextStyle(
                            color: green,
                            fontSize: 9,
                            letterSpacing: 1.1,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '${widget.user['fullName']}',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          admin
                              ? tr('ผู้ดูแลระบบ', 'System administrator')
                              : tr('ผู้ใช้งาน', 'User'),
                          style: const TextStyle(color: muted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 30),
              profileDetail(
                tr('ชื่อผู้ใช้หรืออีเมล', 'Username or email'),
                '${widget.user['username']}',
                Icons.alternate_email,
              ),
              const SizedBox(height: 10),
              profileDetail(
                tr('อีเมล', 'Email'),
                '${widget.user['email'] ?? '-'}',
                Icons.email_outlined,
              ),
              const SizedBox(height: 10),
              profileDetail(
                tr('รหัสนิสิต', 'Student ID'),
                '${widget.user['studentId'] ?? '-'}',
                Icons.badge_outlined,
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: changeAvatar,
                  icon: const Icon(Icons.add_a_photo_outlined),
                  label: Text(tr('เปลี่ยนรูปโปรไฟล์', 'Change profile photo')),
                ),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 5),
      Card(
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 6,
          ),
          leading: const CircleAvatar(
            backgroundColor: Color(0xffe7f3ed),
            child: Icon(Icons.lock_reset, color: green),
          ),
          title: Text(
            tr('เปลี่ยนรหัสผ่าน', 'Change password'),
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          subtitle: Text(
            tr(
              'ยืนยันตัวตนด้วย OTP ทางอีเมล',
              'Verify your identity with an email OTP',
            ),
            style: const TextStyle(fontSize: 11),
          ),
          trailing: const Icon(Icons.chevron_right),
          onTap: changePasswordWithOtp,
        ),
      ),
      Card(
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 6,
          ),
          leading: const CircleAvatar(
            backgroundColor: Color(0xffe7f3ed),
            child: Icon(Icons.settings_outlined, color: green),
          ),
          title: Text(
            tr('ตั้งค่าระบบ', 'Settings'),
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          subtitle: Text(
            tr('ธีม ภาษา และการใช้งาน', 'Theme, language and application'),
            style: const TextStyle(fontSize: 11),
          ),
          trailing: const Icon(Icons.chevron_right),
          onTap: openSettings,
        ),
      ),
      Card(
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 6,
          ),
          leading: const CircleAvatar(
            backgroundColor: Color(0xffffe9e7),
            child: Icon(Icons.logout, color: red),
          ),
          title: Text(
            tr('ออกจากระบบ', 'Sign out'),
            style: const TextStyle(color: red, fontWeight: FontWeight.w700),
          ),
          subtitle: Text(
            tr('ออกจากบัญชีบนอุปกรณ์นี้', 'Sign out from this device'),
            style: const TextStyle(fontSize: 11),
          ),
          trailing: const Icon(Icons.chevron_right, color: red),
          onTap: requestLogout,
        ),
      ),
    ],
  );

  Widget profileDetail(String title, String value, IconData icon) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(13),
    decoration: BoxDecoration(
      color:
          Theme.of(context).brightness == Brightness.dark
              ? const Color(0xff1b2923)
              : const Color(0xfff3f6f4),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(
      children: [
        Icon(icon, color: green, size: 20),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: muted, fontSize: 9)),
              Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    ),
  );

  Future<void> openSettings() async {
    ThemeMode selectedTheme = widget.themeMode;
    String selectedLanguage = widget.language;
    await showDialog<void>(
      context: context,
      builder:
          (dialogContext) => StatefulBuilder(
            builder:
                (context, setModal) => AlertDialog(
                  title: Row(
                    children: [
                      const Icon(Icons.settings_outlined, color: green),
                      const SizedBox(width: 10),
                      Text(tr('ตั้งค่าระบบ', 'Settings')),
                    ],
                  ),
                  content: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tr('รูปแบบการแสดงผล', 'Appearance'),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        RadioListTile<ThemeMode>(
                          value: ThemeMode.light,
                          groupValue: selectedTheme,
                          title: Text(tr('สว่าง', 'Light')),
                          secondary: const Icon(Icons.light_mode_outlined),
                          onChanged: (value) {
                            if (value == null) return;
                            setModal(() => selectedTheme = value);
                            widget.onThemeChanged(value);
                          },
                        ),
                        RadioListTile<ThemeMode>(
                          value: ThemeMode.dark,
                          groupValue: selectedTheme,
                          title: Text(tr('มืด', 'Dark')),
                          secondary: const Icon(Icons.dark_mode_outlined),
                          onChanged: (value) {
                            if (value == null) return;
                            setModal(() => selectedTheme = value);
                            widget.onThemeChanged(value);
                          },
                        ),
                        RadioListTile<ThemeMode>(
                          value: ThemeMode.system,
                          groupValue: selectedTheme,
                          title: Text(tr('ตามระบบ', 'System default')),
                          secondary: const Icon(Icons.brightness_auto_outlined),
                          onChanged: (value) {
                            if (value == null) return;
                            setModal(() => selectedTheme = value);
                            widget.onThemeChanged(value);
                          },
                        ),
                        const Divider(),
                        Text(
                          tr('ภาษา', 'Language'),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        DropdownButtonFormField<String>(
                          value: selectedLanguage,
                          items: const [
                            DropdownMenuItem(value: 'th', child: Text('ไทย')),
                            DropdownMenuItem(
                              value: 'en',
                              child: Text('English'),
                            ),
                          ],
                          onChanged: (value) {
                            if (value == null) return;
                            setModal(() => selectedLanguage = value);
                            widget.onLanguageChanged(value);
                          },
                        ),
                      ],
                    ),
                  ),
                  actions: [
                    FilledButton(
                      onPressed: () => Navigator.pop(dialogContext),
                      child: Text(tr('เสร็จสิ้น', 'Done')),
                    ),
                  ],
                ),
          ),
    );
  }

  Future<void> requestLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder:
          (context) => AlertDialog(
            title: Text(tr('ออกจากระบบ', 'Sign out')),
            content: Text(
              tr('ต้องการออกจากระบบใช่หรือไม่?', 'Do you want to sign out?'),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: Text(tr('ยกเลิก', 'Cancel')),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(context, true),
                child: Text(tr('ออกจากระบบ', 'Sign out')),
              ),
            ],
          ),
    );
    if (confirmed == true) widget.onLogout();
  }

  Future<void> exportLoans() async {
    DateTime from = DateTime.now().subtract(const Duration(days: 30));
    DateTime to = DateTime.now();
    final accepted = await showDialog<bool>(
      context: context,
      builder:
          (dialogContext) => StatefulBuilder(
            builder:
                (context, setModal) => AlertDialog(
                  title: Text(tr('ส่งออกข้อมูลการยืม', 'Export loan data')),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.calendar_today_outlined),
                        title: Text(tr('ตั้งแต่วันที่', 'From')),
                        subtitle: Text(fmt(from.toIso8601String())),
                        onTap: () async {
                          final value = await showDatePicker(
                            context: context,
                            initialDate: from,
                            firstDate: DateTime(2020),
                            lastDate: DateTime.now().add(
                              const Duration(days: 3650),
                            ),
                          );
                          if (value != null) setModal(() => from = value);
                        },
                      ),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.event_available_outlined),
                        title: Text(tr('ถึงวันที่', 'To')),
                        subtitle: Text(fmt(to.toIso8601String())),
                        onTap: () async {
                          final value = await showDatePicker(
                            context: context,
                            initialDate: to,
                            firstDate: DateTime(2020),
                            lastDate: DateTime.now().add(
                              const Duration(days: 3650),
                            ),
                          );
                          if (value != null) setModal(() => to = value);
                        },
                      ),
                    ],
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(dialogContext, false),
                      child: Text(tr('ยกเลิก', 'Cancel')),
                    ),
                    FilledButton.icon(
                      onPressed:
                          () => Navigator.pop(dialogContext, !from.isAfter(to)),
                      icon: const Icon(Icons.download_outlined),
                      label: Text(tr('สร้างไฟล์', 'Create file')),
                    ),
                  ],
                ),
          ),
    );
    if (accepted != true) {
      if (from.isAfter(to)) error('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด');
      return;
    }

    final end = DateTime(to.year, to.month, to.day, 23, 59, 59, 999);
    final selected =
        loans.where((loan) {
          final date = DateTime.tryParse('${loan['borrowedAt']}')?.toLocal();
          return date != null && !date.isBefore(from) && !date.isAfter(end);
        }).toList();
    if (selected.isEmpty) {
      error(tr('ไม่พบข้อมูลในช่วงวันที่เลือก', 'No data in this date range'));
      return;
    }

    final usersById = {for (final item in users) '${item['id']}': item};
    final rows = <List<dynamic>>[
      [
        'Loan ID',
        'ชื่อผู้ใช้',
        'รหัสนิสิต',
        'อีเมล/Username',
        'สิทธิ์',
        'รหัสอุปกรณ์',
        'อุปกรณ์',
        'จำนวน',
        'วันที่ยืม',
        'กำหนดคืน',
        'วันที่คืนจริง',
        'สถานะ',
        'สภาพเมื่อคืน',
        'หมายเหตุการยืม',
        'หมายเหตุการคืน',
      ],
      ...selected.map((loan) {
        final account = usersById['${loan['userId']}'];
        return [
          loan['id'],
          loan['borrowerName'],
          loan['studentId'],
          account?['username'],
          account?['role'],
          loan['equipmentCode'],
          loan['equipmentName'],
          loan['quantity'],
          fmt(loan['borrowedAt']),
          fmt(loan['dueAt']),
          fmt(loan['returnedAt']),
          label('${loan['status']}'),
          label('${loan['returnCondition'] ?? ''}'),
          loan['borrowRemark'],
          loan['returnRemark'],
        ];
      }),
    ];
    final csv =
        '\ufeff${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}';
    final directory = await getTemporaryDirectory();
    final filename =
        'iot-loans-${from.year}-${from.month.toString().padLeft(2, '0')}-${from.day.toString().padLeft(2, '0')}-to-${to.year}-${to.month.toString().padLeft(2, '0')}-${to.day.toString().padLeft(2, '0')}.csv';
    final file = File('${directory.path}${Platform.pathSeparator}$filename');
    await file.writeAsString(csv, encoding: utf8, flush: true);
    await Share.shareXFiles(
      [XFile(file.path, mimeType: 'text/csv')],
      subject: filename,
      text: tr('ข้อมูลการยืมอุปกรณ์', 'Equipment loan data'),
    );
  }

  String csvCell(dynamic value) {
    final text = value?.toString() ?? '';
    return '"${text.replaceAll('"', '""')}"';
  }

  Widget status(String value) {
    final bad = [
          'damaged',
          'lost',
          'abnormal',
          'maintenance',
          'outOfStock',
          'inactive',
        ].contains(value),
        warn = value == 'borrowed';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color:
            bad
                ? const Color(0xffffe9e7)
                : warn
                ? const Color(0xfffff0d9)
                : const Color(0xffe7f3ed),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label(value),
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.bold,
          color:
              bad
                  ? red
                  : warn
                  ? orange
                  : green,
        ),
      ),
    );
  }

  String label(String v) =>
      {
        'available': 'พร้อมยืม',
        'outOfStock': 'หมด',
        'maintenance': 'ซ่อมบำรุง',
        'retired': 'เลิกใช้งาน',
        'borrowed': 'กำลังยืม',
        'returned': 'คืนแล้ว',
        'normal': 'ปกติ',
        'damaged': 'ชำรุด',
        'lost': 'สูญหาย',
        'abnormal': 'ผิดปกติ',
        'active': 'ใช้งานได้',
        'inactive': 'ปิดใช้งาน',
      }[v] ??
      v;
  String fmt(dynamic v) {
    if (v == null) return '-';
    final d = DateTime.tryParse('$v')?.toLocal();
    return d == null ? '-' : '${d.day}/${d.month}/${d.year + 543}';
  }

  Future<void> borrowItem(dynamic x) async {
    try {
      await widget.api.call(
        '/loans',
        method: 'POST',
        body: {'equipmentId': x['id'], 'quantity': 1},
      );
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('บันทึกการยืมแล้ว')));
      }
      load();
    } catch (e) {
      error(e);
    }
  }

  void setCart(dynamic item, int quantity) {
    final id = number(item['id']);
    final maximum = number(item['availableQuantity']);
    setState(() {
      if (quantity <= 0) {
        cart.remove(id);
        if (cart.isEmpty) reviewingCart = false;
      } else {
        cart[id] = quantity.clamp(1, maximum).toInt();
      }
    });
  }

  Future<void> pickCheckoutDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: checkoutDue,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null && mounted) {
      setState(() => checkoutDue = picked);
    }
  }

  Future<void> submitCart() async {
    if (cart.isEmpty) return;
    setState(() => loading = true);
    try {
      for (final entry in cart.entries.toList()) {
        await widget.api.call(
          '/loans',
          method: 'POST',
          body: {
            'equipmentId': entry.key,
            'quantity': entry.value,
            'dueAt': checkoutDue.toIso8601String(),
            'remark': checkoutRemark.text.trim(),
          },
        );
      }
      if (!mounted) return;
      setState(() {
        cart.clear();
        checkoutRemark.clear();
        reviewingCart = false;
        index = 3;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('บันทึกการยืมอุปกรณ์เรียบร้อยแล้ว')),
      );
      await load();
    } catch (e) {
      error(e);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> checkout() async {
    DateTime due = DateTime.now().add(const Duration(days: 7));
    final remark = TextEditingController();
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder:
          (sheetContext) => StatefulBuilder(
            builder:
                (context, setSheetState) => SafeArea(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      20,
                      18,
                      20,
                      20 + MediaQuery.viewInsetsOf(context).bottom,
                    ),
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ตะกร้าอุปกรณ์',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          for (final entry in cart.entries)
                            ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: const Icon(Icons.memory, color: green),
                              title: Text(
                                '${equipment.firstWhere((x) => x['id'] == entry.key)['name']}',
                              ),
                              subtitle: Text(
                                '${equipment.firstWhere((x) => x['id'] == entry.key)['code']}',
                              ),
                              trailing: Text(
                                '${entry.value} ชิ้น',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          const Divider(),
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: const Icon(Icons.calendar_month),
                            title: const Text('กำหนดคืน'),
                            subtitle: Text(fmt(due.toIso8601String())),
                            trailing: const Icon(Icons.edit_calendar_outlined),
                            onTap: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: due,
                                firstDate: DateTime.now(),
                                lastDate: DateTime.now().add(
                                  const Duration(days: 365),
                                ),
                              );
                              if (picked != null) {
                                setSheetState(() => due = picked);
                              }
                            },
                          ),
                          TextField(
                            controller: remark,
                            maxLines: 2,
                            decoration: const InputDecoration(
                              labelText: 'หมายเหตุ (ถ้ามี)',
                              prefixIcon: Icon(Icons.notes),
                            ),
                          ),
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                              onPressed:
                                  () => Navigator.pop(sheetContext, true),
                              icon: const Icon(Icons.check_circle_outline),
                              label: const Text('ยืนยันการยืม'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
          ),
    );
    if (confirmed != true) return;
    setState(() => loading = true);
    try {
      for (final entry in cart.entries) {
        await widget.api.call(
          '/loans',
          method: 'POST',
          body: {
            'equipmentId': entry.key,
            'quantity': entry.value,
            'dueAt': due.toIso8601String(),
            'remark': remark.text.trim(),
          },
        );
      }
      if (!mounted) return;
      setState(() {
        cart.clear();
        index = 3;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('บันทึกการยืมอุปกรณ์เรียบร้อยแล้ว')),
      );
      await load();
    } catch (e) {
      error(e);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> completeRepair(dynamic x) async {
    try {
      final result = await widget.api.call(
        '/loans/${x['id']}/repair',
        method: 'POST',
      );
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('${result['message']}')));
      }
      await load();
    } catch (e) {
      error(e);
    }
  }

  Future<void> returnItem(dynamic x) async {
    String condition = 'normal';
    final remark = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder:
          (dialogContext) => StatefulBuilder(
            builder:
                (context, setDialogState) => AlertDialog(
                  title: const Text('คืนอุปกรณ์'),
                  content: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${x['equipmentName']} · ${x['quantity']} ชิ้น',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 12),
                        const Text('สภาพอุปกรณ์เมื่อคืน'),
                        for (final value in [
                          'normal',
                          'damaged',
                          'abnormal',
                          'lost',
                        ])
                          RadioListTile<String>(
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                            value: value,
                            groupValue: condition,
                            title: Text(label(value)),
                            onChanged:
                                (v) => setDialogState(() => condition = v!),
                          ),
                        TextField(
                          controller: remark,
                          maxLines: 3,
                          decoration: const InputDecoration(
                            labelText: 'หมายเหตุ/รายละเอียดเพิ่มเติม',
                          ),
                        ),
                      ],
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(dialogContext, false),
                      child: const Text('ยกเลิก'),
                    ),
                    FilledButton(
                      onPressed: () => Navigator.pop(dialogContext, true),
                      child: const Text('ยืนยันการคืน'),
                    ),
                  ],
                ),
          ),
    );
    if (confirmed != true) return;
    try {
      await widget.api.call(
        '/loans/${x['id']}/return',
        method: 'POST',
        body: {'condition': condition, 'remark': remark.text.trim()},
      );
      load();
    } catch (e) {
      error(e);
    }
  }

  Future<void> editEquipment(dynamic item) async {
    final name = TextEditingController(text: '${item['name'] ?? ''}');
    final code = TextEditingController(text: '${item['code'] ?? ''}');
    final category = TextEditingController(text: '${item['category'] ?? ''}');
    final quantity = TextEditingController(
      text: '${item['totalQuantity'] ?? 1}',
    );
    final description = TextEditingController(
      text: '${item['description'] ?? ''}',
    );
    String selectedStatus = '${item['status'] ?? 'available'}';
    final saved = await showDialog<bool>(
      context: context,
      builder:
          (dialogContext) => StatefulBuilder(
            builder:
                (context, setDialogState) => AlertDialog(
                  title: const Text('แก้ไขอุปกรณ์'),
                  content: SizedBox(
                    width: 420,
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ปรับข้อมูลอุปกรณ์และสถานะการใช้งาน',
                            style: TextStyle(color: muted, fontSize: 12),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: name,
                            decoration: const InputDecoration(
                              labelText: 'ชื่ออุปกรณ์',
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: code,
                            decoration: const InputDecoration(
                              labelText: 'รหัสอุปกรณ์',
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: category,
                            decoration: const InputDecoration(
                              labelText: 'หมวดหมู่',
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: quantity,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'จำนวนทั้งหมด',
                            ),
                          ),
                          const SizedBox(height: 10),
                          DropdownButtonFormField<String>(
                            value: selectedStatus,
                            decoration: const InputDecoration(
                              labelText: 'สถานะ',
                            ),
                            items: const [
                              DropdownMenuItem(
                                value: 'available',
                                child: Text('พร้อมใช้งาน'),
                              ),
                              DropdownMenuItem(
                                value: 'maintenance',
                                child: Text('ซ่อมบำรุง'),
                              ),
                              DropdownMenuItem(
                                value: 'retired',
                                child: Text('เลิกใช้งาน'),
                              ),
                            ],
                            onChanged:
                                (value) => setDialogState(
                                  () => selectedStatus = value ?? 'available',
                                ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: description,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              labelText: 'รายละเอียด',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(dialogContext, false),
                      child: const Text('ยกเลิก'),
                    ),
                    FilledButton(
                      onPressed: () {
                        if (name.text.trim().isEmpty ||
                            code.text.trim().isEmpty ||
                            category.text.trim().isEmpty ||
                            (int.tryParse(quantity.text) ?? 0) < 1) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('กรุณากรอกข้อมูลให้ครบถ้วน'),
                            ),
                          );
                          return;
                        }
                        Navigator.pop(dialogContext, true);
                      },
                      child: const Text('บันทึกการแก้ไข'),
                    ),
                  ],
                ),
          ),
    );
    if (saved != true) return;
    try {
      await widget.api.call(
        '/equipment/${item['id']}',
        method: 'PUT',
        body: {
          'name': name.text.trim(),
          'code': code.text.trim(),
          'category': category.text.trim(),
          'totalQuantity': int.parse(quantity.text),
          'description': description.text.trim(),
          'status': selectedStatus,
          'imageUrl': item['imageUrl'],
        },
      );
      await load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('แก้ไขอุปกรณ์เรียบร้อยแล้ว')),
        );
      }
    } catch (e) {
      error(e);
    }
  }

  Future<void> addEquipment() async {
    String? imageUrl;
    final n = TextEditingController(),
        c = TextEditingController(),
        cat = TextEditingController(),
        q = TextEditingController(text: '1'),
        description = TextEditingController();
    await showDialog(
      context: context,
      builder:
          (ctx) => AlertDialog(
            title: const Text('เพิ่มอุปกรณ์'),
            content: SingleChildScrollView(
              child: Column(
                children: [
                  TextField(
                    controller: n,
                    decoration: const InputDecoration(labelText: 'ชื่ออุปกรณ์'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: c,
                    decoration: const InputDecoration(labelText: 'รหัสอุปกรณ์'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: cat,
                    decoration: const InputDecoration(labelText: 'หมวดหมู่'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: q,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'จำนวน'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: description,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'รายละเอียด'),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        try {
                          imageUrl = await pickEquipmentImage();
                          if (imageUrl != null && ctx.mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              const SnackBar(
                                content: Text('เลือกรูปอุปกรณ์แล้ว'),
                              ),
                            );
                          }
                        } catch (e) {
                          error(e);
                        }
                      },
                      icon: const Icon(Icons.add_a_photo_outlined),
                      label: const Text('เลือกรูปอุปกรณ์'),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('ยกเลิก'),
              ),
              FilledButton(
                onPressed: () async {
                  try {
                    await widget.api.call(
                      '/equipment',
                      method: 'POST',
                      body: {
                        'name': n.text,
                        'code': c.text,
                        'category': cat.text,
                        'totalQuantity': int.tryParse(q.text) ?? 1,
                        'description': description.text.trim(),
                        'status': 'available',
                        'imageUrl': imageUrl,
                      },
                    );
                    if (ctx.mounted) Navigator.pop(ctx);
                    load();
                  } catch (e) {
                    error(e);
                  }
                },
                child: const Text('บันทึก'),
              ),
            ],
          ),
    );
  }

  Future<void> deleteEquipment(dynamic item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder:
          (dialogContext) => AlertDialog(
            title: const Text('ลบอุปกรณ์'),
            content: Text(
              'ต้องการลบ ${item['name']} (${item['code']}) หรือไม่?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext, false),
                child: const Text('ยกเลิก'),
              ),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: red),
                onPressed: () => Navigator.pop(dialogContext, true),
                child: const Text('ยืนยันการลบ'),
              ),
            ],
          ),
    );
    if (confirmed != true) {
      return;
    }
    try {
      await widget.api.call('/equipment/${item['id']}', method: 'DELETE');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('ลบอุปกรณ์เรียบร้อยแล้ว')));
      }
      await load();
    } catch (e) {
      error(e);
    }
  }

  void error(Object e) => ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
  );
}

class Section extends StatelessWidget {
  final String text;
  const Section(this.text, {super.key});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 20, bottom: 8),
    child: Text(text, style: const TextStyle(fontWeight: FontWeight.bold)),
  );
}

class Empty extends StatelessWidget {
  final String text;
  const Empty({super.key, required this.text});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(40),
    child: Column(
      children: [
        const Icon(Icons.inbox_outlined, size: 35, color: muted),
        Text(text, style: const TextStyle(color: muted)),
      ],
    ),
  );
}
