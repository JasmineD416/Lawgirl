import {env,type Database} from '../../lib/server-env';
export const settings=()=>env as unknown as Record<string,any>;
export const database=()=>{if(!settings().DB)throw new Error('Database is unavailable.');return settings().DB as Database};
export const response=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
// Signed-in account id recorded for audit entries, set after the owner check.
export const actors=new WeakMap<Request,string>();
// The app listens on localhost behind Caddy, which replaces any client-sent X-Forwarded-For.
export function clientIp(request:Request){return request.headers.get('x-forwarded-for')?.split(',')[0].trim()||'anonymous'}
export function checkOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin}
export async function readJson(request:Request,limit=262144){if(Number(request.headers.get('content-length')||0)>limit)throw new Error('Request too large.');const bytes=await readBytes(request,limit);try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw new Error('Invalid JSON.')}}
export async function readBytes(request:Request,limit:number){const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('Request too large.')}chunks.push(value)}const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length}return bytes}
export async function hash(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('')}
export async function rateLimit(scope:string,key:string,limit:number,seconds=3600){const now=Math.floor(Date.now()/1000);const bucket=Math.floor(now/seconds);const id=await hash((settings().RATE_LIMIT_SECRET||settings().SITE_URL||'lawgirl')+scope+key+bucket);const r=await database().prepare('INSERT INTO rate_limits (id,hits,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET hits=hits+1 RETURNING hits').bind(id,now+seconds).first<{hits:number}>();return !!r&&r.hits<=limit}
export async function recordAudit(request:Request,action:string,record:string){await database().prepare('INSERT INTO audit (id,actor,action,record,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),actors.get(request)||'scheduler',action,record,new Date().toISOString()).run()}
export async function hmacVerify(secret:string,message:string,signature:Uint8Array){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);return crypto.subtle.verify('HMAC',key,new Uint8Array(signature),new TextEncoder().encode(message))}
