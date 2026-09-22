const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: Number(process.env.PORT || 3000),
  googleClientId: String(process.env.GOOGLE_CLIENT_ID || '').trim(),
  databaseUrl: process.env.DATABASE_URL || 'postgres://iot_user:iot_password@localhost:5432/iot_equipment',
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret',
  isProduction: process.env.NODE_ENV === 'production',
  smtp: {
    user: String(process.env.SMTP_USER || '').trim(),
    pass: String(process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    from: String(process.env.MAIL_FROM || 'ระบบยืม-คืน อุปกรณ์ IoT').trim()
  },
  otpSecret: process.env.OTP_SECRET || process.env.JWT_SECRET || 'development-only-otp-secret'
};
