(function setupLanguage(){
  const messages = {
    'จำนวนที่คืนครั้งนี้':'Quantity to return now',
    'แยกจำนวนตามสภาพอุปกรณ์ (รวมให้ตรงกับจำนวนคืนด้านบน)':'Break down by condition. The total must match the quantity above.',
    'จำนวนแยกตามสภาพรวม':'Condition quantities total',
    'ต้องเท่ากับจำนวนคืน':'Must equal the return quantity',
    'สูงสุด':'Maximum',
"รอตรวจรับ":"Awaiting inspection",
"รายการนี้รอเจ้าหน้าที่ตรวจรับแล้ว":"This return is already awaiting staff inspection",
"คำขอคืนเปลี่ยนแปลงแล้ว กรุณาเปิดรายการใหม่":"The return request has changed. Please reopen the loan",
"ส่งคำขอคืนแล้ว รอเจ้าหน้าที่ตรวจรับ":"Return requested. Awaiting staff inspection",
"กรุณาระบุเหตุผลที่ส่งกลับ":"Please provide a reason for rejection",
"ส่งกลับให้ผู้ยืมแก้ไขแล้ว":"Sent back to the borrower for correction",
"ตรวจรับคืน":"Inspect return",
"ตรวจรับคืนหน้าเคาน์เตอร์":"Receive return at counter",
"ส่งคำขอคืน":"Request return",
"สต็อกจะเพิ่มหลังเจ้าหน้าที่ตรวจรับเท่านั้น":"Stock increases only after staff accept the return",
"ระบุจำนวนและสภาพที่ตรวจรับจริง ส่วนที่เหลือจะยังค้างคืน":"Enter the quantities and conditions actually received. The rest remains outstanding",
"กรอกจำนวนที่ต้องการคืน สต็อกจะเพิ่มหลังเจ้าหน้าที่ตรวจรับเท่านั้น":"Enter the return quantities. Stock increases only after staff accept the return",
"เหตุผลที่ส่งกลับ":"Reason for rejection",
"ส่งกลับให้แก้ไข":"Send back for correction",
"ยืนยันตรวจรับและปรับสต็อก":"Accept return and update stock",
"ยืนยันตรวจรับและปรับสต็อกตามจำนวนที่ระบุ?":"Accept the inspected quantities and update stock?",
"ส่งคำขอคืนให้เจ้าหน้าที่ตรวจรับ?":"Submit this return for staff inspection?",
"ส่งกลับให้ผู้ยืมแก้ไขคำขอคืน?":"Send this request back to the borrower?",
"คำขอรอตรวจรับ":"Pending return request",
"วันที่แจ้งคืน":"Requested on",
    'เปลี่ยนภาษา':'Change language',
    'ติดตาม':'Tracking','ปิด':'Disable','เปิด':'Enable',
    'ระบบยืมคืนอุปกรณ์ IoT':'IoT Equipment Loan System','รหัสผ่านของระบบยืมคืน':'Loan system password',
    'ยืมได้':'Available to borrow','ชิ้น':'units',
    'หมด':'Out of stock','พร้อมยืม':'Available','เลิกใช้งาน':'Retired','ปกติ':'Normal','ชำรุด':'Damaged','สูญหาย':'Lost','ผิดปกติ':'Abnormal',
    'กรอกชื่อผู้ใช้':'Enter username','หรือ':'or','เข้าสู่ระบบด้วย Google':'Sign in with Google','กำลังตรวจสอบการเชื่อมต่อ Google…':'Checking Google connection…',
    'ครั้งแรกที่เข้าใช้ ระบบจะสร้างบัญชีผู้ใช้งานให้คุณ':'An account will be created on your first sign-in',
    'เชื่อมต่อบัญชีเดิม':'Link existing account','ใช้อีเมลเดียวกับบัญชีเดิม กรุณายืนยันรหัสผ่านของระบบยืมคืนเพื่อเก็บประวัติการใช้งานไว้ด้วยกัน':'This email matches an existing account. Confirm your loan system password to keep your history together.',
    'ยืนยันและเข้าสู่ระบบ':'Confirm and sign in','ยกเลิก':'Cancel','สำหรับผู้ใช้ที่ยังไม่มีบัญชีเข้าใช้งาน':'For users who do not have an account yet',
    'กรอกชื่อ-นามสกุล':'Enter full name','ชื่อผู้ใช้หรืออีเมล':'Username or email','อีเมลสำหรับกู้คืนรหัสผ่าน':'Recovery email','เช่น somchai.k@ku.th':'e.g. somchai.k@ku.th',
    'กรอกรหัสนิสิต (ถ้ามี)':'Enter student ID (optional)','ตั้งรหัสผ่าน':'Create password','อย่างน้อย 8 ตัวอักษร':'At least 8 characters','ยืนยันรหัสผ่าน':'Confirm password','กรอกรหัสผ่านอีกครั้ง':'Enter password again',
    'แสดงรหัสผ่าน':'Show password','ซ่อนรหัสผ่าน':'Hide password','ลงทะเบียน':'Register','ติดตั้ง':'Install',
    'ปรับรูปแบบการแสดงผลให้เหมาะกับการใช้งาน':'Customize the appearance and behavior',
    'ภาษา / Language':'Language','ไทย':'Thai','ลดเอฟเฟกต์และแอนิเมชันในหน้าจอ':'Reduce visual effects and animations','ป้องกันการกดออกจากระบบโดยไม่ตั้งใจ':'Prevent accidental sign-out','บันทึกการตั้งค่าแล้ว':'Settings saved',
    'ต้องการออกจากระบบใช่หรือไม่?':'Are you sure you want to sign out?',
    'ความเคลื่อนไหวล่าสุดของฉัน':'My recent activity','จำนวนอุปกรณ์ทั้งระบบ (หน่วย: ชิ้น)':'Equipment quantities across the system (units)',
    'ซ่อมเสร็จเมื่อ':'Repaired on','คืนเมื่อ':'Returned on','ยืมเมื่อ':'Borrowed on','ยังไม่มีประวัติการยืม–คืน':'No borrowing or return history yet',
    'ยืมอุปกรณ์':'Borrow equipment','เลือกอุปกรณ์ที่พร้อมใช้งาน แล้วกรอกข้อมูลผู้ยืมเพื่อบันทึกการยืม':'Choose available equipment and enter borrower details to record the loan',
    'อุปกรณ์ที่พร้อมให้ยืม':'Available equipment','ค้นหาอุปกรณ์':'Search equipment','เลือกแล้ว':'Selected','ยืนยันการยืม':'Confirm loan','เพิ่มในรายการ':'Add to selection','เพิ่มในรายการยืม':'Add to loan',
    'เลือกครบจำนวนที่พร้อมให้ยืมแล้ว':'All available units are selected','เพิ่มอีก 1 ชิ้น':'Add one more unit','เพิ่มในรายการยืมแล้ว':'Added to loan',
    'ตะกร้าอุปกรณ์':'Equipment cart','ตรวจสอบจำนวนและกรอกข้อมูลการยืม':'Review quantities and enter loan details','ชื่อผู้ยืม':'Borrower name','กำหนดคืน (Return Date)':'Return date',
    'วว/ดด/ปปปป':'dd/mm/yyyy','เลือกกำหนดคืนจากปฏิทิน':'Choose return date from calendar','วัน/เดือน/ปี ค.ศ. เช่น 25/09/2026':'Day/month/year (Gregorian), e.g. 25/09/2026',
    'กรุณาระบุวันที่จริงในรูปแบบ วัน/เดือน/ปี ค.ศ. เช่น 25/09/2026':'Enter a valid Gregorian date in dd/mm/yyyy format, e.g. 25/09/2026',
    'หมายเหตุ':'Notes','จำนวนอุปกรณ์รวม':'Total units','หมวดหมู่':'Category','ทำรายการสำเร็จ':'Success','บันทึกข้อมูลการยืมอุปกรณ์เรียบร้อยแล้ว':'Equipment loan recorded',
    'รายการยืมได้รับการบันทึกแล้ว':'Your loan has been recorded','สามารถตรวจสอบกำหนดคืนได้ที่หน้าประวัติ':'Check your return deadline on the history page','ดูประวัติ':'View history','กลับหน้าหลัก':'Back to home',
    'คืนอุปกรณ์':'Return equipment','เลือกอุปกรณ์ที่ต้องการคืน':'Choose equipment to return','ไม่มีอุปกรณ์ที่รอคืน':'No equipment awaiting return','เลือกอุปกรณ์และระบุสภาพ':'Select equipment and specify its condition',
    'สภาพอุปกรณ์เมื่อคืน':'Condition on return','ปกติ (Normal)':'Normal','ชำรุด (Damaged)':'Damaged','สูญหาย (Lost)':'Lost','หมายเหตุ/รายละเอียดเพิ่มเติม':'Notes / additional details',
    'ระบุรายละเอียดเพิ่มเติมหากอุปกรณ์มีปัญหา...':'Describe any problems with the equipment...','ยืนยันการคืนอุปกรณ์':'Confirm return','คืนอุปกรณ์สำเร็จ':'Equipment returned','บันทึกข้อมูลการคืนอุปกรณ์เรียบร้อยแล้ว':'Equipment return recorded',
    'ประวัติการใช้อุปกรณ์':'Equipment history','เลขแจ้งซ่อม':'Repair reports','ค้นหาด้วย ID หรือชื่ออุปกรณ์':'Search by ID or equipment name','กรองสถานะการยืม':'Filter loan status','ใกล้กำหนด':'Due soon',
    'ครบกำหนดตั้งแต่วันนี้ถึงอีก 3 วัน':'Due today or within the next 3 days','ไม่พบรายการที่ตรงกับการค้นหาหรือตัวกรอง':'No loans match your search or filter','ยังไม่มีประวัติ':'No history yet',
    'เพิ่มอุปกรณ์':'Add equipment','ชื่ออุปกรณ์':'Equipment name','รหัสอุปกรณ์':'Equipment code','เช่น ESP32':'e.g. ESP32','เช่น IOT-1234':'e.g. IOT-1234','เลือกหมวดหมู่':'Select category','จำนวนอุปกรณ์ทั้งหมด':'Total equipment quantity',
    'รายละเอียด':'Description','บันทึกข้อมูล':'Save details','บันทึกข้อมูลแล้ว':'Details saved','รูปโปรไฟล์':'Profile image','รูปโปรไฟล์ต้องเป็น JPG, PNG หรือ WebP และไม่เกิน 2 MB':'Profile image must be JPG, PNG or WebP, up to 2 MB',
    'ไม่สามารถอ่านไฟล์รูปภาพได้':'Unable to read image file','กำลังบันทึกรูปโปรไฟล์...':'Saving profile image...','เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว':'Profile image updated',
    'กรอกข้อมูลและแนบภาพอุปกรณ์เพื่อให้ผู้ใช้งานเห็นภาพจริง':'Enter equipment details and upload a photo','ยังไม่ได้เลือกภาพ':'No image selected','ภาพอุปกรณ์':'Equipment image',
    'รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 2 MB':'JPG, PNG and WebP supported, up to 2 MB','รูปภาพต้องเป็น JPG, PNG หรือ WebP และไม่เกิน 2 MB':'Image must be JPG, PNG or WebP, up to 2 MB',
    'ตัวอย่างภาพอุปกรณ์':'Equipment image preview','บันทึกข้อมูลและภาพอุปกรณ์แล้ว':'Equipment details and image saved','ค้นหาด้วย ID หรือชื่ออุปกรณ์...':'Search by ID or equipment name...',
    'ไม่พบอุปกรณ์':'No equipment found','เพิ่มหรือเปลี่ยนรูป':'Add or change image','ลบอุปกรณ์':'Delete equipment','กำลังบันทึกรูปภาพ...':'Saving image...','บันทึกภาพอุปกรณ์แล้ว':'Equipment image saved','บันทึกรูปภาพไม่สำเร็จ':'Unable to save image',
    'ยืนยันการลบอุปกรณ์รายการนี้?':'Delete this equipment?','ลบอุปกรณ์เรียบร้อยแล้ว':'Equipment deleted','ค้นหาชื่อผู้ยืม รหัสนิสิต หรืออุปกรณ์...':'Search borrower, student ID or equipment...',
    'ไม่พบรายการยืม':'No loans found','ไม่มีรหัสนิสิต':'No student ID','แสดงเฉพาะอุปกรณ์ที่มีหมายเหตุหรือถูกระบุว่าชำรุด':'Equipment with notes or reported damage',
    'ค้นหาอุปกรณ์หรือผู้แจ้ง...':'Search equipment or reporter...','ไม่มีอุปกรณ์รอซ่อม':'No equipment awaiting repair','รายการที่มีหมายเหตุหรือระบุว่าชำรุดจะแสดงที่นี่':'Equipment with notes or damage reports will appear here',
    'มีหมายเหตุ':'Has notes','ไม่ได้ระบุรายละเอียด':'No details provided','วันที่แจ้ง/คืน':'Reported / returned date','เสร็จสิ้น':'Complete',
    'ยืนยันว่าซ่อมอุปกรณ์รายการนี้เสร็จแล้วและพร้อมให้ยืม?':'Confirm this equipment has been repaired and is available for borrowing?',
    'ตรวจสอบและติดตามการคืนอุปกรณ์':'Review and follow up equipment returns','ลองเปลี่ยนคำค้นหา หรือเพิ่มอุปกรณ์รายการใหม่':'Try another search or add new equipment',
    'แก้ไขอุปกรณ์':'Edit equipment','ปรับข้อมูลอุปกรณ์และสถานะการใช้งาน':'Update equipment details and status','จำนวนทั้งหมด':'Total quantity','สถานะ':'Status','บันทึกการแก้ไข':'Save changes','แก้ไขอุปกรณ์เรียบร้อยแล้ว':'Equipment updated',
    'ตรวจสอบสิทธิ์ สถานะ และรายการยืมของสมาชิก':'Review member access, status and loans','ค้นหาชื่อ ชื่อผู้ใช้ อีเมล หรือรหัสนิสิต...':'Search name, username, email or student ID...',
    'ใช้งานได้':'Active','ปิดใช้งาน':'Disabled','ยังไม่ผูกอีเมล':'No email linked','ไม่พบบัญชีผู้ใช้':'No account found','แก้ไขบัญชีผู้ใช้':'Edit account','สิทธิ์':'Role','อนุญาตให้เข้าสู่ระบบ':'Allow sign-in',
    'บันทึกบัญชี':'Save account','บันทึกบัญชีเรียบร้อยแล้ว':'Account saved','ปิดบัญชีเรียบร้อยแล้ว':'Account disabled','เปิดบัญชีเรียบร้อยแล้ว':'Account enabled','กลับหน้าผู้ใช้งาน':'Back to users',
    'ดาวน์โหลดข้อมูล Excel':'Download loan report','เลือกช่วงตามวันที่ยืม ระบบจะส่งออกทุกสถานะในช่วงที่เลือก':'Choose borrowing dates. All loan statuses within the range will be exported.',
    'ตั้งแต่วันที่':'From date','ถึงวันที่':'To date','ข้อมูลที่ได้: ผู้ยืม รหัสนิสิต อีเมล อุปกรณ์ จำนวน สถานะ วันยืม กำหนดคืน วันคืน สภาพและหมายเหตุ':'Includes borrower, student ID, email, equipment, quantity, status, loan date, due date, return date, condition and notes',
    'ดาวน์โหลดข้อมูล':'Download data','กรุณาเลือกช่วงวันที่ให้ถูกต้อง':'Select a valid date range','ไม่พบข้อมูลในช่วงวันที่ที่เลือก':'No data found in the selected date range','ดาวน์โหลดไม่สำเร็จ':'Download failed',
    'ลำดับ':'No.','รหัสรายการ':'Loan ID','อีเมล/ชื่อผู้ใช้':'Email / username','จำนวน':'Quantity','สภาพตอนคืน':'Return condition','หมายเหตุการยืม':'Loan notes','หมายเหตุการคืน':'Return notes',
    'ผู้คืน (อ้างอิงชื่อผู้ยืมในรายการ)':'Returned by (borrower on record)','จำนวน (ชิ้น)':'Quantity (units)','วันที่แจ้งซ่อม/แจ้งหมายเหตุ':'Report date','วันที่คืน':'Return date','วันที่ซ่อมเสร็จ':'Repair completion date','สถานะการซ่อม':'Repair status','หมายเหตุการคืน/แจ้งซ่อม':'Return / repair notes',
    'ซ่อมเสร็จแล้ว':'Repaired','รอซ่อม':'Awaiting repair','ไม่ระบุ':'Not specified','ยังไม่คืน':'Not returned','ดาวน์โหลดรายงานซ่อมบำรุง':'Download maintenance report',
    'รวมรายการรอซ่อม ซ่อมเสร็จ สูญหาย และรายการที่มีหมายเหตุ':'Includes pending repairs, completed repairs, lost equipment and records with notes','ข้อมูลที่ต้องการ':'Report scope','เลือกช่วงวันที่แจ้งซ่อม/แจ้งหมายเหตุ':'Select report date range',
    'ไฟล์ CSV เปิดด้วย Excel ได้ รวมชื่อผู้คืน อุปกรณ์ จำนวน วันที่แจ้ง วันที่คืน วันที่ซ่อมเสร็จ สถานะ และหมายเหตุ':'CSV file for Excel, including returner, equipment, quantity, report date, return date, repair completion date, status and notes',
    'ชื่อผู้คืนอ้างอิงชื่อผู้ยืมในรายการ ระบบยังไม่ได้เก็บชื่อผู้ที่นำมาคืนแยกต่างหาก':'The returner name uses the borrower on record; the actual returner is not recorded separately.',
    'ช่วงวันที่อิงวันที่คืน หรือวันที่ยืมสำหรับรายการที่ยังไม่คืน และรวมวันเริ่มต้นกับวันสิ้นสุด':'The range includes both boundary dates and uses the return date, or borrowing date for unreturned loans.',
    'ไม่พบข้อมูลซ่อมบำรุงในช่วงที่เลือก':'No maintenance records found in the selected range','บันทึก':'Save','บันทึกข้อมูลเรียบร้อยแล้ว':'Details saved','แก้ไขชื่อผู้ใช้':'Edit username','แก้ไขรหัสนิสิต':'Edit student ID',
    'เปลี่ยนรหัสผ่าน':'Change password','ยืนยันตัวตนด้วย OTP ทางอีเมล':'Verify your identity with an email OTP','อีเมล':'Email','ลืมรหัสผ่าน':'Forgot password',
    'กรอกอีเมลที่ผูกกับบัญชี ระบบจะส่งรหัส OTP 6 หลักให้คุณ':'Enter your account email to receive a 6-digit OTP','ส่งรหัส OTP':'Send OTP','กำลังส่ง...':'Sending...','ตรวจสอบอีเมล':'Check your email','รหัส OTP 6 หลัก':'6-digit OTP',
    'รหัสผ่านใหม่':'New password','ยืนยันรหัสผ่านใหม่':'Confirm new password','ตั้งรหัสผ่านใหม่':'Reset password','ส่ง OTP ใหม่':'Resend OTP','รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน':'New passwords do not match','กำลังบันทึก...':'Saving...',
    'รหัสผ่านทั้งสองช่องไม่ตรงกัน':'Passwords do not match','กำลังลงทะเบียน...':'Registering...','สมัครสมาชิกเรียบร้อย กรุณาเข้าสู่ระบบ':'Registration complete. Please sign in.',
    'โหลด Google ไม่สำเร็จ กรุณารีเฟรชหน้าเว็บแล้วลองใหม่':'Unable to load Google. Refresh the page and try again.',
    'เชื่อมต่อ Google ไม่สำเร็จ คุณยังเข้าสู่ระบบด้วยรหัสผ่านได้':'Unable to connect to Google. You can sign in with your password.',
    'กำลังยืนยันบัญชี Google…':'Verifying Google account…','เข้าสู่ระบบด้วย Google ไม่สำเร็จ':'Google sign-in failed','ตรวจสอบการเข้าสู่ระบบด้วย Google ไม่สำเร็จ':'Unable to check Google sign-in','การเข้าสู่ระบบด้วย Google ยังไม่เปิดใช้งาน':'Google sign-in is not enabled',
    'เกิดข้อผิดพลาด':'An error occurred','เกิดข้อผิดพลาดภายในระบบ':'An internal error occurred','กรุณาเข้าสู่ระบบ':'Please sign in','เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่':'Session expired. Please sign in again.','เฉพาะผู้ดูแลระบบเท่านั้น':'Administrator access required',
    'ไม่สามารถปิดใช้งานหรือลดสิทธิ์บัญชีที่กำลังใช้งานอยู่':'You cannot disable or downgrade the account currently in use','รูปแบบอีเมลไม่ถูกต้อง':'Invalid email format','กรุณาระบุชื่อผู้ใช้':'Enter a user name','อีเมลนี้ถูกใช้งานแล้ว':'This email is already in use',
    'กรุณาระบุอุปกรณ์และจำนวนให้ถูกต้อง':'Enter valid equipment and quantity','ไม่พบอุปกรณ์ที่พร้อมให้ยืม':'No available equipment found','กรุณาระบุสภาพอุปกรณ์':'Specify equipment condition','ไม่พบรายการยืมที่คืนได้':'No returnable loan found','บันทึกการคืนเรียบร้อยแล้ว':'Return recorded',
    'ไม่พบรายการชำรุดที่รอซ่อม หรือรายการนี้เสร็จสิ้นแล้ว':'No pending repair found, or this repair is already complete','จำนวนอุปกรณ์รอซ่อมไม่ตรงกับรายการ กรุณาตรวจสอบข้อมูล':'Pending repair quantity does not match the record. Please review the data.',
    'รหัสอุปกรณ์นี้มีอยู่แล้ว':'This equipment code already exists','จำนวนรวมต้องไม่น้อยกว่าจำนวนที่กำลังถูกยืม':'Total quantity cannot be less than the quantity on loan','ลบไม่ได้ เนื่องจากอุปกรณ์กำลังถูกยืม':'Cannot delete equipment that is on loan',
    'อุปกรณ์มีประวัติการใช้งาน จึงไม่สามารถลบได้ (เปลี่ยนสถานะเป็นเลิกใช้งานแทน)':'Equipment with usage history cannot be deleted. Change its status to retired.',
    'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง':'Incorrect username or password','กรุณาระบุชื่อผู้ใช้ อีเมลที่ถูกต้อง และรหัสผ่านอย่างน้อย 8 ตัวอักษร':'Enter a username, valid email and password of at least 8 characters','สมัครสมาชิกเรียบร้อยแล้ว':'Registration complete','ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว':'This username or email is already in use',
    'กรุณากรอกอีเมลให้ถูกต้อง':'Enter a valid email','ไม่สามารถส่งอีเมลได้ กรุณาตรวจสอบการตั้งค่าอีเมลแล้วลองใหม่':'Unable to send email. Check email settings and try again.',
    'กรุณากรอกอีเมล รหัส OTP 6 หลัก และรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร':'Enter your email, 6-digit OTP and a new password of at least 8 characters','รหัส OTP ไม่ถูกต้อง หมดอายุ หรือถูกใช้งานแล้ว':'OTP is invalid, expired or already used',
    'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบ':'Password reset. Please sign in.','บัญชีนี้ไม่สามารถใช้งานได้':'This account is unavailable','รูปโปรไฟล์ต้องเป็น JPG, PNG หรือ WebP และมีขนาดไม่เกิน 2 MB':'Profile image must be JPG, PNG or WebP, up to 2 MB',
    'ชื่อผู้ใช้ต้องมี 4-50 ตัวอักษร และใช้ได้เฉพาะ a-z, 0-9, จุด, ขีดกลาง หรือขีดล่าง':'Username must be 4–50 characters using only a–z, 0–9, dots, hyphens or underscores','ชื่อผู้ใช้นี้ถูกใช้งานแล้ว':'This username is already in use',
    'กรุณารอสักครู่แล้วลองใหม่':'Please wait a moment and try again','ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 10 นาที':'Too many sign-in attempts. Please wait 10 minutes.',
    'อีเมลนี้ไม่ได้ให้บริการโดย Gmail หรือ Google Workspace กรุณาสมัครด้วยอีเมลและรหัสผ่านก่อน แล้วเชื่อมต่อ Google':'This email is not hosted by Gmail or Google Workspace. Register with email and password before linking Google.',
    'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ':'This account is disabled. Contact an administrator.','บัญชีนี้ผูกกับ Google บัญชีอื่นแล้ว':'This account is linked to a different Google account',
    'พบบัญชีเดิม กรุณายืนยันรหัสผ่านของระบบเพื่อเชื่อมต่อ Google':'An existing account was found. Confirm your system password to link Google.','รหัสผ่านบัญชีเดิมไม่ถูกต้อง':'Incorrect existing account password',
    'ยังไม่เปิดใช้งานการเข้าสู่ระบบด้วย Google':'Google sign-in is not enabled','คำขอเข้าสู่ระบบไม่ถูกต้อง':'Invalid sign-in request','ยืนยัน Google ไม่สำเร็จหรือหมดเวลา กรุณาเลือกบัญชีใหม่':'Google verification failed or expired. Select your account again.',
    'บัญชีเพิ่งถูกสร้างหรือเชื่อมต่อ กรุณาลองเข้าสู่ระบบอีกครั้ง':'The account was just created or linked. Try signing in again.','กรุณากรอกข้อมูลอุปกรณ์ให้ถูกต้อง':'Enter valid equipment details','รูปภาพต้องเป็น JPG, PNG หรือ WebP และมีขนาดไม่เกิน 2 MB':'Image must be JPG, PNG or WebP, up to 2 MB',
    'หากอีเมลนี้มีบัญชีอยู่ ระบบจะส่งรหัส OTP ให้ กรุณาตรวจสอบกล่องจดหมายและจดหมายขยะ':'If an account exists for this email, an OTP will be sent. Check your inbox and spam folder.',
    'STAFF SIGN IN':'STAFF SIGN IN','ACCOUNT MANAGEMENT':'ACCOUNT MANAGEMENT'
  };
  const baseMessages={
    'ยืม':'Borrow','คืน':'Return','ประวัติ':'History','บัญชี':'Account',
    'ภาพรวมอุปกรณ์':'Equipment overview','จัดการอุปกรณ์ทั้งหมด':'Manage all equipment','ตรวจสอบกำหนดคืน':'Review return deadlines','ดูแลและติดตามการซ่อม':'Track equipment repairs','ค้นหาอุปกรณ์ที่ต้องการ':'Find equipment to borrow','จัดการรายการที่ยืมไว้':'Manage borrowed equipment','ดูรายการใช้งานที่ผ่านมา':'View borrowing history','ข้อมูลส่วนตัวและตั้งค่า':'Profile and preferences',
    'ระบบยืม-คืน อุปกรณ์ IoT':'IOT Equipment Loan System','ระบบยืม-คืน อุปกรณ์ IOT':'IOT Equipment Loan System','สาขาเทคโนโลยีสารสนเทศ':'Information Technology','เมนูจัดการระบบ':'SYSTEM MENU',
    'ตรวจเช็ค':'Dashboard','คลังอุปกรณ์':'Equipment','ติดตามการยืม':'Loan Tracking','ซ่อมบำรุง':'Maintenance','ผู้ใช้งาน':'Users','บัญชีของฉัน':'My Account','บัญชีAdmin':'Admin Account','บัญชีผู้ใช้งาน':'User Account',
    'เข้าสู่ระบบ':'Sign in','ลงชื่อเข้าใช้ระบบ':'Sign in to continue','ชื่อผู้ใช้':'Username','รหัสผ่าน':'Password','ลืมรหัสผ่าน?':'Forgot password?','สมัครสมาชิกสำหรับผู้ใช้งาน':'Create a user account','สมัครสมาชิก':'Create account','ลงทะเบียนผู้ใช้ใหม่':'New user registration','มีบัญชีอยู่แล้ว / กลับเข้าสู่ระบบ':'Already registered? Sign in',
    'ภาพรวมสถานะอุปกรณ์ทั้งหมดและความเคลื่อนไหวล่าสุด':'Overview of equipment status and recent activity','อุปกรณ์ทั้งหมด':'Total equipment','พร้อมใช้งาน':'Available','ถูกยืมอยู่':'On loan','ชำรุด/รอซ่อม':'Damaged / maintenance','ความเคลื่อนไหวล่าสุด':'Recent activity','ดูทั้งหมด':'View all',
    'คลัง':'Equipment','จัดการข้อมูลอุปกรณ์ทั้งหมด':'Manage all equipment','เพิ่ม':'Add','แก้ไข':'Edit','ลบ':'Delete','เพิ่มรูป':'Add image','เปลี่ยนรูป':'Change image','รวมอุปกรณ์':'Total','ต้องซ่อม':'Needs repair',
    'ตรวจสอบว่าใครกำลังยืมอุปกรณ์และกำหนดคืน':'Review borrowers and return deadlines','ดาวน์โหลด Excel':'Download Excel','ทั้งหมด':'All','กำลังยืม':'Borrowed','คืนแล้ว':'Returned','ผู้ยืม':'Borrower','วันที่ยืม':'Borrowed date','กำหนดคืน':'Due date','วันที่คืนจริง':'Returned date',
    'จัดการบัญชีผู้ใช้':'User Management','แก้ไขข้อมูล':'Edit details','ดูการยืม':'View loans','ปิดบัญชี':'Disable account','เปิดบัญชี':'Enable account','ผู้ดูแลระบบ':'Administrator','นักศึกษา':'Student','รหัสนิสิต':'Student ID','เปลี่ยนรูปโปรไฟล์':'Change profile image','เพิ่มรูปโปรไฟล์':'Add profile image','ออกจากระบบ':'Sign out',
    'ตั้งค่าระบบ':'Settings','ธีมหน้าจอและการใช้งาน':'Appearance and preferences','รูปแบบหน้าจอ':'Appearance','สว่าง':'Light','มืด':'Dark','ตามระบบ':'System','การใช้งาน':'Behavior','ลดการเคลื่อนไหว':'Reduce motion','ยืนยันก่อนออกจากระบบ':'Confirm before signing out','บันทึกการตั้งค่า':'Save settings',
    'บัญชีผู้ใช้':'User Account','จัดการข้อมูลส่วนตัว รูปโปรไฟล์ และการตั้งค่าบัญชี':'Manage personal information, profile image and account preferences','บัญชีใช้งานอยู่':'Account active','ชื่อ-นามสกุล':'Full name','ชื่อผู้ใช้ / อีเมล':'Username / Email','สิทธิ์การใช้งาน':'Access level','ผู้ใช้งานทั่วไป':'Standard user','ธีม ภาษา และการใช้งาน':'Theme, language and preferences','สิ้นสุดเซสชันการใช้งานบนอุปกรณ์นี้':'End the session on this device'
  };
  Object.assign(messages,baseMessages);
  Object.assign(messages,{
    'ปรับสต็อกจากการคืน':'Stock updated after return','ปรับสต็อกจากการยืม':'Stock updated after borrowing','ปรับสต็อกจากการซ่อมเสร็จ':'Stock updated after repair',
    'ตรวจสอบว่าใครทำอะไรกับอุปกรณ์ พร้อมรายละเอียดและวันเวลา (เวลาประเทศไทย)':'See who changed equipment, with details and timestamps in Thailand time',
    'ค้นหาชื่อคน ชื่ออุปกรณ์ หรือรหัส':'Search person, equipment or code','เช่น ชื่อผู้ยืม, DHT22, IOT-SEN-001':'For example: borrower name, DHT22, IOT-SEN-001',
    'ผู้ทำรายการ':'Performed by','รหัสอ้างอิง':'Reference ID','เปลี่ยนเป็น':'Changed to','รายการยืม':'Loan','ปิดใช้งาน':'Disabled','ใช่':'Yes','ไม่ใช่':'No',
    'ประวัติการทำงาน':'Activity log','ผู้ทำรายการและการเปลี่ยนแปลง':'Actors and changes','ค้างคืน':'Outstanding','ยืมเดิม':'Originally borrowed','ชิ้น':'units',
    'รหัสคำขอไม่ถูกต้อง':'Invalid request ID','คำขอนี้ถูกใช้แล้ว กรุณาเปิดหน้าคืนอุปกรณ์ใหม่':'This request was already used. Reopen the return form.',
    'กรุณาระบุจำนวนแยกตามสภาพอุปกรณ์':'Enter the quantities for each condition','จำนวนคืนต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป':'Return quantities must be whole numbers of zero or more','จำนวนคืนรวมต้องไม่น้อยกว่า 1 และไม่เกินจำนวนที่ค้างคืน':'Return at least one unit, without exceeding the outstanding quantity',
    'กรอกเฉพาะจำนวนที่คืนครั้งนี้ แยกตามสภาพ ส่วนที่เหลือจะยังค้างคืน':'Enter quantities for this return by condition. The remaining units stay on loan.',
    'ยืนยันการบันทึกจำนวนคืนตามสภาพที่ระบุ?':'Confirm the return quantities and conditions?',
    'บันทึกการคืน':'Record return','บันทึกคืน':'Record return','คืนบางส่วน':'Partial return','ปิดงานซ่อม':'Complete repair','เพิ่มข้อมูล':'Create record','ลบข้อมูล':'Delete record','การยืม–คืน':'Loans and returns',
    'ผู้ทำรายการ เวลา และข้อมูลก่อน–หลัง เริ่มบันทึกตั้งแต่เปิดใช้ฟังก์ชันนี้':'Actors, times and changes recorded since this feature was enabled',
    'ค้นหาผู้ทำรายการหรือรหัส':'Search actor or record ID','ประเภทข้อมูล':'Record type','โหลดเพิ่มเติม':'Load more','ยังไม่มีประวัติที่ตรงกับการค้นหา':'No matching activity yet','ผู้ทำรายการ:':'Actor:',
    'ข้อมูล':'Field','ก่อน':'Before','หลัง':'After','จำนวนยืมเดิม':'Original quantity','รายการยืมต้นทาง':'Original loan','ผู้บันทึกการคืน':'Return recorded by','ผู้ปิดงานซ่อม':'Repair completed by',
    'ผู้บันทึกการคืน:':'Return recorded by:','ไม่ระบุ (รายการเดิม)':'Unknown (legacy record)',
    'รหัส':'ID','รหัสผู้ยืม':'Borrower ID','วันยืม':'Borrowed at','วันคืน':'Returned at','วันซ่อมเสร็จ':'Repaired at','ผู้บันทึกคืน (รหัส)':'Return actor ID','ผู้ปิดงานซ่อม (รหัส)':'Repair actor ID','เปิดใช้งาน':'Active','เปลี่ยนรูปอุปกรณ์':'Equipment image changed',
    'เลือกผู้ทำรายการ':'Filter by actor',
    'แยกตามผู้ทำรายการ ไม่ใช่ผู้ยืมที่เกี่ยวข้อง':'Filter by the person who performed the action, rather than the related borrower',
    'ส่งคำขอคืนกลับให้แก้ไข':'Send return request back for correction',
    'ส่งคำขอคืนอุปกรณ์':'Submit return request',
    'หมายเลขรายการยืมต้นทาง':'Original loan ID'
  });
  const patterns = [
    [/^ดูรายละเอียดการเปลี่ยนแปลง \((\d+)\)$/, 'View all changes ($1)'],
    [/^รายการยืมต้นทาง #(\d+)$/, 'Original loan #$1'],
    [/^ค้างคืน (\d+) \/ ยืมเดิม (\d+) ชิ้น$/, 'Outstanding $1 / originally borrowed $2 units'],
    [/^ดูข้อมูลก่อน–หลัง \((\d+)\)$/, 'View changes ($1)'],
    [/^จำนวน (\d+) ชิ้น$/, '$1 units'], [/^(\d+) ชิ้น$/, '$1 units'], [/^(\d+) รายการ$/, '$1 items'], [/^(\d+) บัญชี$/, '$1 accounts'],
    [/^ชำรุด (\d+) ชิ้น$/, '$1 damaged units'], [/^ยืมได้ (\d+) ชิ้น$/, '$1 available units'], [/^เพิ่มแล้ว$/, 'Added'],
    [/^เกินกำหนด (\d+) วัน$/, '$1 days overdue'], [/^เกินกำหนด (\d+)$/, '$1 overdue'], [/^กำลังยืม (\d+)$/, '$1 on loan'],
    [/^มีรายการเกินกำหนด (\d+) รายการ$/, '$1 overdue loans'], [/^ประวัติทั้งหมด (\d+) รายการ$/, '$1 history records'],
    [/^ดาวน์โหลดแล้ว (\d+) รายการ$/, 'Downloaded $1 records'], [/^อุปกรณ์คงเหลือเพียง (\d+) ชิ้น$/, 'Only $1 units available'],
    [/^ซ่อมเสร็จแล้ว (\d+) ชิ้น และพร้อมให้ยืม$/, '$1 units repaired and available'],
    [/^ยืนยันการปิดบัญชีของ (.+)\?$/, 'Disable the account for $1?'], [/^ยืนยันการเปิดบัญชีของ (.+)\?$/, 'Enable the account for $1?'],
    [/^รายการยืมของ (.+)$/, 'Loans for $1'], [/^แจ้งโดย (.+)$/, 'Reported by $1'], [/^รูปโปรไฟล์ (.+)$/, 'Profile image of $1'],
    [/^เพิ่มหรือเปลี่ยนรูป (.+)$/, 'Add or change image for $1'], [/^ลบ (.+)$/, 'Delete $1']
  ];
  function language(){try{return JSON.parse(localStorage.getItem('preferences')||'{}').language==='en'?'en':'th'}catch{return 'th'}}
  const thaiLabels={'STAFF SIGN IN':'เข้าสู่ระบบเจ้าหน้าที่','ACCOUNT MANAGEMENT':'จัดการบัญชี','INFORMATION TECHNOLOGY':'เทคโนโลยีสารสนเทศ','IOT EQUIPMENT MANAGEMENT':'ระบบจัดการอุปกรณ์ IoT'};
  function translate(source, target=language()){
    if(typeof source!=='string')return source;
    if(target!=='en')return thaiLabels[source.trim()]?source.replace(source.trim(),thaiLabels[source.trim()]):source;
    const text=source.trim();
    if(Object.hasOwn(messages,text))return source.replace(text,messages[text]);
    const action=/^(.+): (.+) — (.+)$/.exec(text);
    if(action)return `${action[1]}: ${translate(action[2],target)} — ${translate(action[3],target)}`;
    for(const [pattern,replacement] of patterns)if(pattern.test(text))return source.replace(text,text.replace(pattern,replacement));
    if(source.includes(' · '))return source.split(' · ').map(part=>translate(part,target)).join(' · ');
    // Decorations and counters are separate UI fragments, never substring-replace names.
    const decorated=/^([✓＋●▣▤⇥⭳⚠✎⌫←⌕□\s]*)(.+?)([→\s]*)$/s.exec(source);
    if(decorated&&(decorated[1]||decorated[3]))return decorated[1]+translate(decorated[2],target)+decorated[3];
    return source;
  }
  const textState=new WeakMap(), attributeState=new WeakMap();
  const ignored='script,style,textarea,[translate="no"],[data-no-translate],#googleButton iframe,h3,.code,.profile-primary h2,.profile-primary p,.profile-value-row b,.borrower-row b,.account-avatar,.borrower-avatar,.profile-avatar-large';
  function translatedState(previous,current){return !previous||current!==previous.output?{source:current}:previous}
  function updateText(node){
    if(node.parentElement?.closest(ignored))return;
    const record=translatedState(textState.get(node),node.nodeValue);
    record.output=translate(record.source);textState.set(node,record);
    if(node.nodeValue!==record.output)node.nodeValue=record.output;
  }
  function updateAttributes(element){
    if(element.closest?.('script,style,textarea,[translate="no"],[data-no-translate]')||element.matches('.device-image'))return;
    const records=attributeState.get(element)||{};
    for(const name of ['placeholder','title','aria-label','alt']){
      const value=element.getAttribute(name);
      if(value===null){delete records[name];continue;}
      const record=translatedState(records[name],value);
      record.output=translate(record.source);records[name]=record;
      if(value!==record.output)element.setAttribute(name,record.output);
    }
    attributeState.set(element,records);
    if(element.matches('time[data-date]')){const formatted=formatDate(element.dataset.date);if(element.textContent!==formatted)element.textContent=formatted;}
  }
  function formatDate(value){return new Intl.DateTimeFormat(language()==='en'?'en-GB':'th-TH',{dateStyle:'medium'}).format(new Date(value))}
  function apply(root=document.body){
    if(root.nodeType===Node.TEXT_NODE){updateText(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE)return;
    updateAttributes(root);
    root.querySelectorAll('*').forEach(updateAttributes);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))updateText(node);
  }
  let appliedLanguage;
  window.applyLanguage=function(){
    const next=language();
    document.documentElement.lang=next;
    document.title=next==='en'?'IoT Equipment Loan System':'ระบบยืมคืนอุปกรณ์ IoT';
    apply();
    document.body.querySelectorAll('[data-language]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.language===next));
    });
    if(next!==appliedLanguage){appliedLanguage=next;window.dispatchEvent(new Event('languagechange'));}
  };
  function setLanguage(value){
    if(!['th','en'].includes(value))return;
    let preferences={};
    try{preferences=JSON.parse(localStorage.getItem('preferences')||'{}')||{}}catch{}
    localStorage.setItem('preferences',JSON.stringify({...preferences,language:value}));
    window.applyLanguage();
  }
  window.I18n={messages,translate,language,formatDate,apply,setLanguage};
  window.confirmLocalized=message=>window.showNotification(translate(message),{confirm:true});
  const observer=new MutationObserver(records=>{
    const roots=new Set();
    for(const record of records){
      if(record.type==='childList')record.addedNodes.forEach(node=>roots.add(node));
      else roots.add(record.target);
    }
    for(const root of roots)if(root.isConnected)apply(root);
  });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label','alt']});
  window.addEventListener('storage',event=>{if(event.key==='preferences')window.applyPreferences?.()});
  window.applyLanguage();
})();
