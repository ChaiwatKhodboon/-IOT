const conditions=['normal','damaged','lost','abnormal'];
function parseReturn(body,remaining){
  const quantities=body.quantities;
  // Retain compatibility with older clients submitting a single condition.
  const values=quantities??(conditions.includes(body.condition)?{[body.condition]:body.quantity??remaining}:null);
  if(!values||typeof values!=='object'||Array.isArray(values)||Object.keys(values).some(key=>!conditions.includes(key)))throw Error('กรุณาระบุจำนวนแยกตามสภาพอุปกรณ์');
  const parts=conditions.map(condition=>{
    const raw=values[condition]??0;
    if(!['string','number'].includes(typeof raw)||String(raw).trim()==='')throw Error('จำนวนคืนต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป');
    const quantity=Number(raw);
    if(!Number.isSafeInteger(quantity)||quantity<0)throw Error('จำนวนคืนต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป');
    return {condition,quantity};
  }).filter(part=>part.quantity>0);
  const total=parts.reduce((sum,part)=>sum+part.quantity,0);
  if(!Number.isSafeInteger(total)||total<1||total>remaining)throw Error('จำนวนคืนรวมต้องไม่น้อยกว่า 1 และไม่เกินจำนวนที่ค้างคืน');
  return {parts,total,remaining:remaining-total};
}
module.exports={parseReturn};
