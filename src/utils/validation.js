function positiveInteger(value) { return Number.isInteger(Number(value)) && Number(value) > 0; }
function cleanText(value, max = 500) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function equipmentInput(body) {
  const data = { code: cleanText(body.code, 30).toUpperCase(), name: cleanText(body.name, 120), category: cleanText(body.category, 80), description: cleanText(body.description, 1000), totalQuantity: Number(body.totalQuantity), status: body.status || 'available' };
  const validStatuses = ['available', 'maintenance', 'retired'];
  if (!data.code || !data.name || !data.category || !positiveInteger(data.totalQuantity) || !validStatuses.includes(data.status)) return { error: 'กรุณากรอกข้อมูลอุปกรณ์ให้ถูกต้อง' };
  return { data };
}
module.exports = { positiveInteger, cleanText, equipmentInput };
