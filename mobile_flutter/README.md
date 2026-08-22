# ระบบยืม-คืนอุปกรณ์ IoT (Flutter)

แอปมือถือ Flutter สำหรับ Android และ iOS เชื่อมต่อ Backend ที่โฟลเดอร์หลักของโปรเจกต์

## เปิดโปรเจกต์ใน VS Code

```powershell
code "C:\ระบบยืมคืนอุปกรณ์IOT\mobile_flutter"
```

ติดตั้งส่วนขยาย **Flutter** ใน VS Code แล้วเลือก Android Emulator หรือโทรศัพท์จากแถบสถานะด้านล่าง

## เปิด Backend

เปิด Terminal แรก:

```powershell
cd "C:\ระบบยืมคืนอุปกรณ์IOT"
npm start
```

## เปิดแอป Flutter

เปิด Terminal ที่สอง สำหรับ Android Emulator:

```powershell
cd "C:\ระบบยืมคืนอุปกรณ์IOT\mobile_flutter"
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:3000/api
```

ก่อน build Android ครั้งแรก ให้เปิด Terminal แล้วอ่านและยอมรับข้อตกลง Android SDK ด้วยตัวเอง:

```powershell
flutter doctor --android-licenses
```

หากใช้โทรศัพท์จริงใน Wi-Fi เดียวกับคอมพิวเตอร์ ให้แทน `10.0.2.2` ด้วย IP ของคอมพิวเตอร์ เช่น:

```powershell
flutter run --dart-define=API_URL=http://192.168.1.187:3000/api
```

> iOS ต้อง build และ run บน macOS ที่ติดตั้ง Xcode ส่วน Android สามารถพัฒนาบน Windows ได้

## โครงสร้างสำคัญ

- `lib/main.dart` หน้าจอ Flutter และกระบวนการใช้งาน
- `lib/api.dart` การเชื่อมต่อ Backend และ Bearer token
- `android/` โปรเจกต์ Android native
- `ios/` โปรเจกต์ iOS native

ระบบเก็บ token เฉพาะระหว่างที่แอปทำงาน เมื่อปิดและเปิดแอปใหม่จะต้องล็อกอินอีกครั้ง
