# เข้าสู่ระบบด้วย Google

ฟีเจอร์นี้เพิ่ม Google Login เฉพาะเว็บ ไม่ได้เปลี่ยนแอป Flutter หรือระบบ SMTP/OTP

## ตั้งค่าที่ Google

1. เปิด Google Cloud Console และเลือกโปรเจกต์ของระบบ
2. ตั้งค่า Google Auth Platform: Branding, Audience และข้อมูลติดต่อ หากอยู่ในโหมดทดสอบ ให้เพิ่มบัญชีทดสอบตามที่หน้าจอกำหนด
3. สร้าง OAuth Client ชนิด **Web application**
4. ใน Authorized JavaScript origins เพิ่ม `http://localhost` และ `http://localhost:3000` สำหรับทดสอบ เพิ่ม HTTPS origin ของเว็บจริงเมื่อเปิดใช้งานจริง โดยไม่ใส่ path เช่น `/login`
5. ตั้งค่าใน `.env` ของเซิร์ฟเวอร์:

```env
GOOGLE_CLIENT_ID=ค่าจากGoogle.apps.googleusercontent.com
```

ใช้ Client ID เท่านั้น ไม่ใช้ Client Secret, รหัสผ่าน Gmail หรือ App Password

เอกสารทางการ: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid

## ติดตั้งและเปิดใช้งาน

หลังตั้งค่า `.env` ให้รัน `npm test` และเริ่มเซิร์ฟเวอร์ใหม่ด้วย `npm start`
เซิร์ฟเวอร์เดิมมี migration runner ซึ่งจะเพิ่ม `google_sub` และ unique index ผ่าน `008_google_login.sql` อัตโนมัติเมื่อเริ่มระบบ
ไม่ต้องรัน `db:init` กับฐานข้อมูลที่มีข้อมูลอยู่แล้ว

สำหรับ Docker ใช้ `docker compose up -d --build app` หลังตั้งค่า `.env`
ระบบไม่เพิ่ม dependency ใหม่ ใช้ `jsonwebtoken` ที่โปรเจกต์มีอยู่ตรวจลายเซ็น RS256 กับ public keys ของ Google

## พฤติกรรม

- หากยังไม่ตั้งค่า Client ID ปุ่มจะปิดใช้งานพร้อมข้อความบอกสถานะ และการล็อกอินด้วยรหัสผ่านยังใช้ได้
- บัญชีใหม่จาก Gmail หรือ Google Workspace ที่ยืนยันอีเมลแล้ว จะได้รับสิทธิ์ `user` เท่านั้น
- บัญชี Google ที่ใช้อีเมลจากผู้ให้บริการอื่น ให้สมัครบัญชีในระบบก่อน แล้วเชื่อมต่อด้วยรหัสผ่านเดิม
- เมื่ออีเมลตรงกับบัญชีเดิม จะต้องยืนยันรหัสผ่านระบบก่อนเชื่อมต่อ รักษา ID สิทธิ์และประวัติของบัญชีเดิม
- หลังผูกแล้วใช้ Google `sub` เป็นตัวระบุบัญชี ไม่เปลี่ยนบัญชีตามอีเมล
- บัญชีที่ถูกปิดใช้งานเข้าระบบไม่ได้
- โทเคนต้องมีลายเซ็น Google ที่ถูกต้อง audience ตรงกับ Client ID issuer ถูกต้อง ไม่หมดอายุ อีเมลยืนยันแล้ว และ nonce ตรงกับ cookie ของหน้าล็อกอิน
- challenge มีอายุ 10 นาทีและล้าง cookie เมื่อเข้าสู่ระบบสำเร็จ หากหมดเวลาให้เลือก Google ใหม่
- จำกัดการส่ง Google login 20 ครั้งต่อ 10 นาทีต่อ IP ต่อ process หากมีหลายเซิร์ฟเวอร์ควรใช้ตัวจำกัดแบบแชร์และตั้งค่า proxy ให้เหมาะสมก่อนเปิดใช้งานขนาดใหญ่
- ใน production ใช้ HTTPS เพราะ challenge cookie เป็น Secure
- ไม่ขอสิทธิ์อ่าน Gmail หรือส่งอีเมล และไม่เก็บ Google access token

## การทดสอบ

เพิ่มการทดสอบลายเซ็น RSA จริงด้วยกุญแจจำลอง และ route tests ที่จำลองฐานข้อมูล
ครอบคลุม token ปลอม/หมดอายุ/audience ผิด, nonce ผิด, cookie หาย, บัญชีใหม่, ผูกบัญชีเดิม, รหัสผ่านผิด, บัญชีถูกปิด, Google subject เปลี่ยน และการจำกัดความถี่

ยังต้องทดสอบกับ Google Client ID จริงและ PostgreSQL ของระบบก่อนถือว่าเปิดใช้งานจริงสำเร็จ
