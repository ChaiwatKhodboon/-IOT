-- รหัสผ่านบัญชีตัวอย่างทั้งสองบัญชีคือ Admin123!
INSERT INTO users (username, password_hash, full_name, student_id, role) VALUES
('admin', '$2b$10$bGJt5viwIpT/cQow58O7eOjaFSAp5JzlWvhXYKXgDLXdHBMQXdR7K', 'ผู้ดูแลระบบ', NULL, 'admin'),
('student', '$2b$10$bGJt5viwIpT/cQow58O7eOjaFSAp5JzlWvhXYKXgDLXdHBMQXdR7K', 'นักศึกษาทดลอง', '6621600801', 'user');

INSERT INTO equipment (code, name, category, description, total_quantity, available_quantity) VALUES
('IOT-ESP32-001', 'ESP32 DevKit V1', 'ไมโครคอนโทรลเลอร์', 'บอร์ดพัฒนา Wi-Fi และ Bluetooth', 12, 12),
('IOT-ARD-001', 'Arduino Uno R3', 'ไมโครคอนโทรลเลอร์', 'บอร์ด Arduino สำหรับงานทดลอง', 10, 10),
('IOT-RPI-001', 'Raspberry Pi 4', 'คอมพิวเตอร์บอร์ดเดี่ยว', 'RAM 4 GB พร้อมอะแดปเตอร์', 4, 4),
('IOT-SEN-001', 'DHT22', 'เซ็นเซอร์', 'เซ็นเซอร์อุณหภูมิและความชื้น', 20, 20),
('IOT-SEN-002', 'HC-SR04', 'เซ็นเซอร์', 'เซ็นเซอร์วัดระยะอัลตราโซนิก', 15, 15);
