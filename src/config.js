const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || 'postgres://iot_user:iot_password@localhost:5432/iot_equipment',
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret',
  isProduction: process.env.NODE_ENV === 'production'
};
