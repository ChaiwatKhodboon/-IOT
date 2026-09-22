# ตรวจสอบโค้ดด้วย SonarQube

## เปิดระบบตรวจสอบ

```powershell
docker compose -f docker-compose.sonar.yml up -d sonar-db sonarqube
```

รอให้ `http://localhost:9000` พร้อมใช้งาน แล้วเข้าสู่ระบบครั้งแรกด้วยชื่อผู้ใช้ `admin` และรหัสผ่าน `admin` ระบบจะให้ตั้งรหัสผ่านใหม่

## สร้าง Token

ไปที่ **My Account > Security > Generate Tokens** แล้วสร้าง token สำหรับโครงการนี้

## สแกนโครงการ

```powershell
$env:SONAR_TOKEN = "วาง-token-ที่นี่"
docker compose -f docker-compose.sonar.yml run --rm sonar-scanner
```

ดูผลที่ `http://localhost:9000/dashboard?id=iot-equipment-loan`

## ปิดระบบตรวจสอบ

```powershell
docker compose -f docker-compose.sonar.yml down
```

ข้อมูลผลตรวจเก็บใน Docker volumes และจะไม่หายเมื่อปิด container