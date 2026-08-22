export const API_URL=process.env.EXPO_PUBLIC_API_URL||'http://192.168.1.187:3000/api';

export type User={id:number;username:string;fullName:string;studentId?:string;role:'admin'|'user'};
export type Equipment={id:number;code:string;name:string;category:string;description?:string;totalQuantity:number;availableQuantity:number;status:'available'|'maintenance'|'retired'};
export type Loan={id:number;quantity:number;borrowedAt:string;dueAt?:string;returnedAt?:string;status:'borrowed'|'returned';borrowRemark?:string;returnRemark?:string;returnCondition?:'normal'|'damaged'|'lost'|'abnormal';equipmentId:number;equipmentCode:string;equipmentName:string;userId:number;borrowerName:string;studentId?:string};

export async function request<T>(path:string,token?:string,options:RequestInit={}):Promise<T>{
  const response=await fetch(`${API_URL}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...options.headers}});
  const data=response.status===204?null:await response.json();
  if(!response.ok)throw new Error(data?.message||'ไม่สามารถเชื่อมต่อระบบได้');
  return data as T;
}
