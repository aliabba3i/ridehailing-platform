const base=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export async function fetchApi<T>(path:string,token:string,init:RequestInit={}):Promise<T>{
 const result=await fetch(base+path,{...init,headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,...init.headers},cache:'no-store'});
 const data=await result.json().catch(()=>({}));
 if(!result.ok)throw new Error(data.error||'Request failed');
 return data as T;
}
