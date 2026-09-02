import 'package:flutter/material.dart';
import 'api.dart';

void main() => runApp(const IoTLoanApp());
const green = Color(0xff246d51),
    dark = Color(0xff17212d),
    cream = Color(0xfff3f1e9),
    bg = Color(0xfff7f8fb),
    muted = Color(0xff748078),
    red = Color(0xffd43b35),
    orange = Color(0xffdb7a14);

class IoTLoanApp extends StatefulWidget {
  const IoTLoanApp({super.key});
  @override
  State<IoTLoanApp> createState() => _IoTLoanAppState();
}

class _IoTLoanAppState extends State<IoTLoanApp> {
  final api = Api();
  Map<String, dynamic>? user;
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'ระบบยืมคืนอุปกรณ์ IoT',
    theme: ThemeData(
      fontFamily: 'sans',
      scaffoldBackgroundColor: bg,
      colorScheme: ColorScheme.fromSeed(seedColor: green),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
        filled: true,
        fillColor: Colors.white,
      ),
      useMaterial3: true,
    ),
    builder:
        (context, child) => ColoredBox(
          color: const Color(0xffe9eef2),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: ColoredBox(color: bg, child: child ?? const SizedBox()),
            ),
          ),
        ),
    home:
        user == null
            ? AuthPage(api: api, onLogin: (u) => setState(() => user = u))
            : HomePage(
              api: api,
              user: user!,
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
  final ValueChanged<Map<String, dynamic>> onLogin;
  const AuthPage({super.key, required this.api, required this.onLogin});
  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final user = TextEditingController(),
      pass = TextEditingController(),
      confirm = TextEditingController(),
      name = TextEditingController(),
      student = TextEditingController();
  bool signup = false, loading = false;
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
            padding: const EdgeInsets.all(16),
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
                Center(
                  child: Container(
                    width: 94,
                    height: 94,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(50),
                      border: Border.all(color: Colors.white, width: 7),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Image.asset(
                      'assets/IT.jpg',
                      width: 94,
                      height: 94,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
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
                  elevation: 3,
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          signup ? 'ลงทะเบียนผู้ใช้ใหม่' : 'ลงชื่อเข้าใช้ระบบ',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (signup) ...[
                          field('ชื่อ-นามสกุล', name),
                          field('รหัสนิสิต', student, number: true),
                        ],
                        field('ชื่อผู้ใช้หรืออีเมล', user),
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
      obscureText: secret,
      keyboardType: number ? TextInputType.number : TextInputType.text,
      decoration: InputDecoration(labelText: label),
    ),
  );
}

class HomePage extends StatefulWidget {
  final Api api;
  final Map<String, dynamic> user;
  final VoidCallback onLogout;
  const HomePage({
    super.key,
    required this.api,
    required this.user,
    required this.onLogout,
  });
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int index = 0;
  bool loading = false;
  Map<String, dynamic> stats = {};
  List equipment = [], loans = [];
  final Map<int, int> cart = {};
  String equipmentQuery = '', loanQuery = '';
  String loanFilter = 'all';
  String maintenanceQuery = '';
  bool reviewingCart = false;
  DateTime checkoutDue = DateTime.now().add(const Duration(days: 7));
  final checkoutRemark = TextEditingController();
  bool get admin => widget.user['role'] == 'admin';
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
      ]);
      setState(() {
        stats = Map<String, dynamic>.from(values[0]);
        equipment = List.from(values[1]);
        loans = List.from(values[2]);
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

  List<NavigationDestination> get destinations =>
      admin
          ? const [
            NavigationDestination(
              icon: Icon(Icons.grid_view),
              label: 'ตรวจเช็ค',
            ),
            NavigationDestination(
              icon: Icon(Icons.inventory_2_outlined),
              label: 'คลัง',
            ),
            NavigationDestination(
              icon: Icon(Icons.swap_horiz),
              label: 'ติดตาม',
            ),
            NavigationDestination(
              icon: Icon(Icons.build_outlined),
              label: 'ซ่อมบำรุง',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              label: 'บัญชี',
            ),
          ]
          : const [
            NavigationDestination(
              icon: Icon(Icons.grid_view),
              label: 'ตรวจเช็ค',
            ),
            NavigationDestination(
              icon: Icon(Icons.add_shopping_cart),
              label: 'ยืม',
            ),
            NavigationDestination(
              icon: Icon(Icons.assignment_return_outlined),
              label: 'คืน',
            ),
            NavigationDestination(icon: Icon(Icons.history), label: 'ประวัติ'),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              label: 'บัญชี',
            ),
          ];
  @override
  Widget build(BuildContext context) {
    final pages =
        admin
            ? [dashboard(), inventory(), tracking(), maintenance(), profile()]
            : [
              dashboard(),
              reviewingCart ? cartReviewPage() : inventory(borrow: true),
              returns(),
              tracking(),
              profile(),
            ];
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: Padding(
          padding: const EdgeInsets.all(9),
          child: ClipOval(
            child: Image.asset('assets/IT.jpg', fit: BoxFit.cover),
          ),
        ),
        title: const Text(
          'ระบบยืม-คืน อุปกรณ์ IoT',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: load,
        child:
            loading && equipment.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : pages[index],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected:
            (v) => setState(() {
              index = v;
              if (v != 1) reviewingCart = false;
            }),
        destinations: destinations,
      ),
      bottomSheet:
          !admin && index == 1 && cart.isNotEmpty && !reviewingCart
              ? cartBar()
              : null,
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
    child: Container(
      decoration: BoxDecoration(
        border: Border(left: BorderSide(color: color, width: 3)),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${value ?? 0}',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
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
                child: const Icon(Icons.memory, color: green),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    status(
                      x['status'] == 'retired'
                          ? 'retired'
                          : (x['maintenanceQuantity'] ?? 0) > 0
                          ? 'maintenance'
                          : 'available',
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
              if (admin && !borrow)
                IconButton(
                  tooltip: 'ลบอุปกรณ์',
                  onPressed: () => deleteEquipment(x),
                  icon: const Icon(Icons.delete_outline, color: red),
                ),
            ],
          ),
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  '${x['equipmentName']}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
              status('${x['status']}'),
            ],
          ),
          Text(
            '${x['equipmentCode']} · จำนวน ${x['quantity']} ชิ้น',
            style: const TextStyle(fontSize: 10, color: muted),
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
                  const CircleAvatar(
                    radius: 16,
                    backgroundColor: green,
                    child: Icon(Icons.person, color: Colors.white, size: 17),
                  ),
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
                        '${x['studentId'] ?? 'ไม่มีรหัสนิสิต'}',
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

  Widget profile() => page('บัญชี${admin ? ' Admin' : ''}', 'ข้อมูลผู้ใช้งาน', [
    const CircleAvatar(
      radius: 50,
      backgroundColor: Color(0xffe7f3ed),
      child: Icon(Icons.person, size: 48, color: green),
    ),
    Center(
      child: Text(
        '${widget.user['fullName']}',
        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
      ),
    ),
    Card(
      child: ListTile(
        title: Text('${widget.user['username']}'),
        subtitle: Text(
          '${widget.user['studentId'] ?? (admin ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน')}',
        ),
      ),
    ),
    OutlinedButton.icon(
      onPressed: widget.onLogout,
      icon: const Icon(Icons.logout, color: red),
      label: const Text('ออกจากระบบ', style: TextStyle(color: red)),
    ),
  ]);
  Widget status(String value) {
    final bad = ['damaged', 'lost', 'abnormal', 'maintenance'].contains(value),
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
        'maintenance': 'ซ่อมบำรุง',
        'retired': 'เลิกใช้งาน',
        'borrowed': 'กำลังยืม',
        'returned': 'คืนแล้ว',
        'normal': 'ปกติ',
        'damaged': 'ชำรุด',
        'lost': 'สูญหาย',
        'abnormal': 'ผิดปกติ',
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

  Future<void> addEquipment() async {
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
