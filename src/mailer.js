const nodemailer = require('nodemailer');
const { smtp } = require('./config');

let transporter;

function getTransporter() {
  if (!smtp.user || !smtp.pass) throw new Error('ยังไม่ได้ตั้งค่า SMTP_USER และ SMTP_PASS');
  transporter ||= nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtp.user, pass: smtp.pass }
  });
  return transporter;
}

async function sendPasswordResetOtp({ to, name, otp }) {
  const safeName = String(name || 'ผู้ใช้งาน').replace(/[<>&"']/g, '');
  await getTransporter().sendMail({
    from: `"${smtp.from.replace(/["\r\n]/g, '')}" <${smtp.user}>`,
    to,
    subject: 'รหัส OTP สำหรับตั้งรหัสผ่านใหม่',
    text: `เรียน ${safeName}\n\nรหัส OTP ของคุณคือ ${otp}\nรหัสนี้มีอายุ 5 นาทีและใช้ได้เพียงครั้งเดียว\n\nหากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลนี้`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#15231e"><div style="border-top:5px solid #087458;border-radius:12px;box-shadow:0 8px 28px #00000018;padding:28px"><p style="color:#087458;font-weight:700">ระบบยืม-คืน อุปกรณ์ IoT</p><h2>ตั้งรหัสผ่านใหม่</h2><p>เรียน ${safeName}</p><p>กรอกรหัสต่อไปนี้ในหน้าตั้งรหัสผ่านใหม่</p><div style="font-size:34px;letter-spacing:9px;font-weight:700;text-align:center;background:#edf7f2;border-radius:10px;padding:18px;color:#075f49">${otp}</div><p style="color:#66756f">รหัสมีอายุ 5 นาทีและใช้ได้เพียงครั้งเดียว หากคุณไม่ได้เป็นผู้ดำเนินการ สามารถเพิกเฉยต่ออีเมลนี้ได้</p></div></div>`
  });
}

module.exports = { sendPasswordResetOtp };
