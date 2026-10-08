# ผลตรวจ UML ระบบยืม–คืนอุปกรณ์ IoT เทียบเอกสารเรียน

ตรวจวันที่ 2 ตุลาคม 2569 โดยถือไฟล์ PDF เป็น **แหล่งอ้างอิงวิธีเขียน UML** ไม่ถือข้อความในสไลด์เป็นคำสั่งให้เปลี่ยนฟังก์ชันของระบบ ข้อเท็จจริงเกี่ยวกับระบบตรวจจาก `src/routes`, `database/schema.sql` และ migration ที่เกี่ยวข้อง เอกสารที่ตรวจคือ `docs/uml-system.md` กับไฟล์ `.puml` ใน `docs`

## คำตอบ

**ฉบับแรกทำครบทั้ง 5 ประเภทและแนวคิดกระบวนการหลักถูกต้อง แต่ยังขาดรูปแบบบางจุดของงาน OOA/OOD; ฉบับปรับปรุงแก้จุดนั้นและจัดภาพพร้อมวางรายงานแล้ว** ปัญหาเดิมคือ Class Diagram แสดงแต่ข้อมูลโดยไม่มีพฤติกรรม และ Sequence Diagram ลงรายละเอียด API/DB โดยยังไม่มีภาพระบบกล่องเดียวในระดับ OOA อีกทั้งตาราง Use Case แบบรวม 22 แถวสั้นกว่ารูปแบบ Flow of Event ในสไลด์บทที่ 8

หลังการตรวจได้เพิ่มพฤติกรรมเชิงแนวคิดใน Class Diagram, เพิ่ม System Sequence Diagram และจัดทำ `docs/uml-use-case-specifications.md` แบบเต็มทั้ง 22 รายการตามหัวข้อบทที่ 8 รวมทั้งเรนเดอร์ PlantUML เป็นภาพ SVG/PNG สำหรับนำไปวางรายงาน ดัชนีภาพและคำบรรยายอยู่ใน `docs/uml-ready-to-paste.md`

## เทียบกับไฟล์เรียนทุกไฟล์

| ไฟล์เรียน | ประเด็นที่ใช้ตรวจ | ผลต่อ UML ที่ทำ |
|---|---|---|
| `4.Aggregation_Abstraction.pdf` หน้า 3–8, 16–18 | whole–part, aggregation เทียบ composition, lifecycle, cardinality | `Loan` กับ `PendingReturn` ใช้ composition เหมาะกับข้อมูล JSONB ที่ฝังใน loan; ไม่ควรเปลี่ยนทุก association เป็น aggregation เพียงเพราะมี FK |
| `5.Generalization_Abstraction.pdf` หน้า 10–16 | is-a, ลูกศรหัวโปร่ง, การสืบทอดต้องมีความหมายจริง | Actor `User` และ `Admin` เป็นชนิดของสมาชิกที่เข้าสู่ระบบ จึงใช้ generalization ได้; **ไม่สร้าง subclass `Admin` ใน Class Diagram** เพราะข้อมูลจริงมี `users.role` ในแถวเดียว |
| `6.Association Abstraction.pdf` หน้า 3, 5–7, 11 | ชื่อความสัมพันธ์, multiplicity, navigability | Class Diagram ระบุจำนวนและบทบาทความสัมพันธ์หลักแล้ว แต่ยังไม่แสดง navigability ทุกเส้น หากอาจารย์กำหนดตามสไลด์อย่างเคร่งครัดควรเติมลูกศรการเข้าถึงของแต่ละเส้น |
| `7.หลักการและแผนภาพสำหรับOOA.pdf` หน้า 22–24 | Problem Domain, Use Case, conceptual Class, SSD, Activity, State | เอกสารเดิมมีชนิดแผนภาพครบ แต่ Sequence แรกเป็นระดับภายใน จึงเพิ่ม SSD 5.4 เพื่อสื่อเหตุการณ์ระหว่าง Actor กับระบบ |
| `บทที่8.pdf` หน้า 8, 18, 20–22 | ชื่อ Use Case เป็นการกระทำ, actor connection, Main/Exceptional Flow, Primary/Stakeholder Actor | ชื่อ Use Case และ Actor ส่วนใหญ่ถูก ตารางรวมแยกทางปกติ/ผิดพลาดแล้ว แต่ยังไม่แจก Trigger และ Main/Exceptional Flow แบบราย Use Case ทุกตัว; UC07/08/14 มีตัวอย่างละเอียดกว่าแถวอื่น |
| `9.pdf` หน้า 1–2, 17–23 | แบบฝึก Class และ Sequence จาก problem domain | Domain Class มีโครงสร้างและ multiplicity สอดคล้อง ตัวอย่างสไลด์เน้นการส่งข้อความระหว่าง object จึงต้องระบุว่า 5.1–5.3 เป็นภาพ OOD ของ UI/API/DB |
| `10.Sequence_Diagram.pdf` หน้า 5 และ 15–23 | lifeline, link, ลำดับ message และความสัมพันธ์กับ Class Diagram | เดิมสื่อเวลาและทางเลือกได้ แต่ API/DB lifeline ไม่ปรากฏใน Domain Class Diagram; จึงเพิ่ม SSD แยกมุมมอง OOA และอธิบายว่าแผนเดิมเป็นมุม OOD/implementation |
| `11.State_Diagram.pdf` หน้า 6–8, 23–25 | state, transition, event/guard, จุดเริ่ม–จุดจบ; Activity เป็น workflow | State ของ loan และส่วนคืนแยกกันถูกต้อง `pending_return` คือสถานะเชิงธุรกิจจาก field ไม่ใช่ enum ใหม่; Activity มีจุดเริ่ม/จบ ผู้รับผิดชอบ และทางเลือก |
| `12.Priciples_of_OOD_n_its_diagrams.pdf` หน้า 1–12 | การออกแบบเชิงวัตถุและการแยกมุมมองออกแบบ | เติมพฤติกรรมเชิงแนวคิดใน Class Diagram พร้อมคำเตือนว่าโค้ด Express ปัจจุบันไม่ได้ประกาศ class/เมธอดเหล่านั้น |
| `13.pdf` หน้า 5–18 | การ refine Use Case, Class, Sequence และ State | ใช้เป็นเกณฑ์ตรวจความสอดคล้องข้ามแผนภาพ: UC08→UC14→state `Pending`/`Returned` และ sequence ตรงกัน; รายละเอียดเพิ่มเติมในแผนย่อยเป็น refinement ของภาพรวม |
| `14-15-16.Component_Deployment_Diagram_n_DB.pdf` หน้า 2–3, 6–10, 17–19 | component/deployment และการแปลง class เป็น table | โจทย์ครั้งนี้ไม่ขอ Component/Deployment Diagram; Class Diagram เชิงแนวคิดไม่จำเป็นต้องเหมือน table 1:1 และ `PendingReturn` ไม่ใช่ table จริง |

ข้อควรระวัง: ข้อความตัวอย่างหน้า 4 ของ `6.Association Abstraction.pdf` สลับคำอธิบาย is-a กับ part-of เมื่อเทียบกับคำอธิบายใน `5.Generalization_Abstraction.pdf` หน้า 14–16 และหลัก UML มาตรฐาน การตรวจนี้ใช้ความหมาย **is-a = generalization** และ **whole–part = aggregation/composition** ตามบริบทที่สอดคล้องกัน

## ผลตรวจรายแผนภาพ

| แผนภาพ | ผล | สิ่งที่ถูกต้อง | สิ่งที่แก้แล้ว/ยังต้องทำ |
|---|---|---|---|
| Use Case + ตาราง | แก้ครบแล้ว | มีขอบเขต Actor ภายนอก 22 Use Case และเส้น actor–use case; ไม่วาดฐานข้อมูลเป็น Actor | ตารางรายตัวมี Primary Actor, Stakeholder, Trigger, Main Flow, Exceptional Flow ครบ 22 กรณี |
| Class | แก้แล้วในระดับแนวคิด | User–Loan, Equipment–Loan, self association ของส่วนคืน, multiplicity และ embedded pending ตรงโมเดลข้อมูล | เพิ่มพฤติกรรมเชิงแนวคิดให้ User/Equipment/Loan แล้ว; ต้องระบุว่าไม่ใช่เมธอดใน source code |
| Sequence | แก้แล้วให้มีทั้ง OOA และ OOD | ลำดับยืม/ส่งคืน/ตรวจรับ/ซ่อมและทางเลือกตรงกับ route | เพิ่ม SSD การคืน/ตรวจรับ; sequence เดิมยังใช้เป็นภาพละเอียด OOD |
| Activity | ใช้ได้ | จุดเริ่ม–จบ, lane, เงื่อนไขและวนคืนบางส่วน | ภาพรวมเรียงซ่อมหลังคืนครบเพื่ออ่านง่าย แต่คำอธิบายชี้ว่าระบบซ่อมส่วนคืนก่อนรายการต้นทางคืนครบได้ |
| State | ใช้ได้ | แยกวงจร loan กับส่วนคืน แสดง event ของการตรวจรับและซ่อม | ไม่เขียน overdue เป็นสถานะฐานข้อมูล; `pending_return` เป็น state เชิงธุรกิจที่อนุมานจาก field |

## ความสอดคล้องกับระบบจริงที่สำคัญ

1. ยืมแล้วลด available ทันที ไม่มี Use Case อนุมัติยืม
2. User ส่งคืนแล้ว loan ยัง borrowed และจำนวนค้าง/สต็อกยังเดิมจน Admin ตรวจรับ
3. ตรวจรับบางส่วนแล้ว loan ต้นทางเก็บจำนวนค้าง ส่วนที่คืนแยกตามสภาพ
4. normal คืนเข้าพร้อมยืม, damaged/abnormal เข้ารอซ่อม, lost ไม่เพิ่มสต็อก
5. Admin ตรวจรับตรงได้โดยไม่ต้องมีคำขอ User และปฏิเสธคำขอได้พร้อมเหตุผล
6. overdue เป็นเงื่อนไขวันที่ ไม่ใช่ enum; ซ่อมเสร็จบันทึกเวลาและผู้ทำรายการในส่วนคืน

## ข้อจำกัดของการตรวจ

ตรวจข้อความและภาพตัวอย่างที่เกี่ยวข้องใน PDF โดยเฉพาะหน้าสัญลักษณ์ Use Case, Sequence, State และ Activity รวมทั้งเทียบกับโค้ดจริง เรนเดอร์ source `.puml` ทุกไฟล์ด้วย PlantUML 1.2026.8 เป็น SVG และ PNG แล้ว ตรวจภาพหลักด้วยสายตาและแยก Use Case เป็นภาพ User/Admin เพิ่มเพื่อให้อ่านง่ายในรายงาน
