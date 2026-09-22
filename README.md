# ระบบยืมคืนอุปกรณ์ IoT

เว็บแอปพลิเคชันสำหรับจัดการคลังอุปกรณ์ IoT ตาม Proposal วิชาปัญหาพิเศษ รองรับผู้ใช้งาน 2 ระดับ ได้แก่ Administrator และ User

## ความสามารถ

- เข้าสู่ระบบด้วย JWT และรหัสผ่านแบบ bcrypt
- เข้าสู่ระบบด้วย Google Identity Services ดูการตั้งค่าใน [docs/google-login.md](docs/google-login.md)
- Admin เพิ่ม แก้ไข ลบ และเปลี่ยนสถานะอุปกรณ์
- ค้นหาอุปกรณ์และประวัติการยืม-คืน
- ผู้ใช้ยืมอุปกรณ์ตามจำนวนที่มี พร้อมกำหนดวันคืนและหมายเหตุ
- คืนอุปกรณ์โดยบันทึกสภาพ ปกติ ชำรุด สูญหาย หรือผิดปกติ
- สต็อกถูกปรับภายใน database transaction เพื่อป้องกันการยืมเกินจำนวน
- Dashboard แสดงจำนวนอุปกรณ์ รายการยืม เกินกำหนด และรายงานปัญหา
- User เห็นเฉพาะประวัติของตนเอง ส่วน Admin เห็นข้อมูลทั้งหมด
- Mobile-first UX/UI ตามต้นแบบ พร้อม bottom navigation แยกตามบทบาท
- รองรับการติดตั้งบน Android/iOS/Desktop แบบ Progressive Web App (PWA)

## ติดตั้งบนมือถือ

- Android/Chrome: เปิดเว็บไซต์ แล้วเลือก `ติดตั้งแอป` หรือ `Add to Home screen`
- iPhone/Safari: กด Share แล้วเลือก `Add to Home Screen`
- การใช้งาน API และเข้าสู่ระบบต้องเชื่อมต่อเซิร์ฟเวอร์ ส่วนหน้าจอหลักถูก cache สำหรับการเปิดครั้งถัดไป

## เริ่มใช้งานด้วย Docker (แนะนำ)

ต้องติดตั้ง Docker Desktop แล้วรันคำสั่งต่อไปนี้ในโฟลเดอร์โปรเจกต์

```bash
docker compose up --build
```

เปิด http://localhost:3000

บัญชีตัวอย่าง (ควรเปลี่ยนก่อนนำไปใช้จริง):

- Admin: `admin` / `Admin123!`
- User: `student` / `Admin123!`

หยุดระบบด้วย `docker compose down` หากต้องการลบข้อมูลทั้งหมดด้วย ให้ใช้ `docker compose down -v`

## เริ่มใช้งานแบบ Local

1. สร้างฐานข้อมูล PostgreSQL ชื่อ `iot_equipment`
2. คัดลอก `.env.example` เป็น `.env` และแก้ค่าการเชื่อมต่อ
3. ติดตั้งและเริ่มระบบ

```bash
npm install
npm run db:init
npm start
```

> `npm run db:init` ใช้กับฐานข้อมูลว่างเท่านั้น เนื่องจาก schema สร้าง enum และตารางใหม่

## ทดสอบ

```bash
npm test
```

## โครงสร้าง

```text
database/   PostgreSQL schema และข้อมูลตัวอย่าง
public/     Frontend HTML, CSS และ JavaScript
scripts/    เครื่องมือเริ่มต้นฐานข้อมูล
src/        Express API, middleware และ business logic
test/       Unit tests
```

## REST API หลัก

- `POST /api/auth/login`
- `GET|POST /api/equipment`
- `PUT|DELETE /api/equipment/:id`
- `GET|POST /api/loans`
- `POST /api/loans/:id/return`
- `PUT /api/loans/:id` (Admin)
- `GET /api/dashboard`
- `GET /api/health`
