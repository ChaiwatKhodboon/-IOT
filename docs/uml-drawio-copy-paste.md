# ข้อความ UML สำหรับคัดลอกไปวางใน draw.io

ไฟล์ `.puml` ในรายการนี้เป็น **ข้อความ PlantUML** ที่คัดลอกได้ตั้งแต่ `@startuml` ถึง `@enduml` และทดสอบเรนเดอร์ด้วย PlantUML 1.2026.8 แล้ว

วิธีวางใน draw.io: เปิดแผนภาพ → เลือก **Arrange > Insert > Advanced > PlantUML** → เปิดไฟล์ `.puml` ที่ต้องการจากรายการด้านล่าง → คัดลอกข้อความทั้งหมด → วางในช่องด้านซ้าย → กด **Preview** แล้ว **Insert**. draw.io รองรับ PlantUML บางส่วน ถ้าภาพจากข้อความไม่ครบ ให้ใช้ **File > Import** แล้วเลือกไฟล์ SVG ที่ระบุในคอลัมน์ขวาแทน ภาพ SVG นั้นเรนเดอร์ครบจาก source เดียวกัน

| ประเภท | ข้อความสำหรับคัดลอก | ภาพ SVG สำหรับนำเข้า draw.io |
|---|---|---|
| Use Case ผู้ใช้ | [uml-use-case-member.puml](uml-use-case-member.puml) | [uml-use-case-member.svg](uml-images/uml-use-case-member.svg) |
| Use Case ผู้ดูแล | [uml-use-case-admin.puml](uml-use-case-admin.puml) | [uml-use-case-admin.svg](uml-images/uml-use-case-admin.svg) |
| Use Case รวมทั้งหมด | [uml-use-case.puml](uml-use-case.puml) | [uml-use-case.svg](uml-images/uml-use-case.svg) |
| Class | [uml-class.puml](uml-class.puml) | [uml-class.svg](uml-images/uml-class.svg) |
| Sequence ระดับระบบ | [uml-sequence-system-return.puml](uml-sequence-system-return.puml) | [uml-sequence-system-return.svg](uml-images/uml-sequence-system-return.svg) |
| Sequence ยืม | [uml-sequence-borrow.puml](uml-sequence-borrow.puml) | [uml-sequence-borrow.svg](uml-images/uml-sequence-borrow.svg) |
| Sequence คืนและตรวจรับ | [uml-sequence-return-inspection.puml](uml-sequence-return-inspection.puml) | [uml-sequence-return-inspection.svg](uml-images/uml-sequence-return-inspection.svg) |
| Sequence ซ่อม | [uml-sequence-repair.puml](uml-sequence-repair.puml) | [uml-sequence-repair.svg](uml-images/uml-sequence-repair.svg) |
| Activity | [uml-activity.puml](uml-activity.puml) | [uml-activity.svg](uml-images/uml-activity.svg) |
| State รายการยืม | [uml-state-loan.puml](uml-state-loan.puml) | [uml-state-loan.svg](uml-images/uml-state-loan.svg) |
| State ส่วนคืน | [uml-state-return.puml](uml-state-return.puml) | [uml-state-return.svg](uml-images/uml-state-return.svg) |

**ข้อความสำหรับคัดลอกลงรายงาน Word:** [คำอธิบาย Use Case รายตัว UC01–UC22](uml-use-case-specifications.md) และ [ชุดคำบรรยายภาพ UML](uml-ready-to-paste.md)

ไฟล์ SVG ที่นำเข้า draw.io จะแสดงภาพที่เรนเดอร์ไว้แล้ว หากต้องการแก้ข้อความหรือโครงสร้างแผนภาพจาก source ให้ใช้ไฟล์ `.puml` ผ่านเมนู PlantUML แทน
