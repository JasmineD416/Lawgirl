import {database,settings,hash} from './core';

// Law Girl student accounts: email + password, server-side sessions in an HttpOnly cookie.
export type AccountUser={id:string,email:string,firstName:string,lastName:string,verified:boolean};
export const SESSION_COOKIE='lg_session';
const SESSION_DAYS=30;
const PBKDF2_ITERATIONS=100000; // Cloudflare Workers' maximum for PBKDF2
const encoder=new TextEncoder();

const toBase64Url=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const fromBase64Url=(value:string)=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export const randomToken=(bytes=32)=>toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
const now=()=>Math.floor(Date.now()/1000);

async function derive(password:string,salt:Uint8Array,iterations:number){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt),iterations},key,256))}
function sameBytes(a:Uint8Array,b:Uint8Array){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0}
export async function hashPassword(password:string){const salt=crypto.getRandomValues(new Uint8Array(16));return ['pbkdf2-sha256',PBKDF2_ITERATIONS,toBase64Url(salt),toBase64Url(await derive(password,salt,PBKDF2_ITERATIONS))].join('$')}
export async function verifyPassword(password:string,stored:string){const [scheme,iterations,salt,expected]=stored.split('$');if(scheme!=='pbkdf2-sha256'||!salt||!expected)return false;return sameBytes(await derive(password,fromBase64Url(salt),Number(iterations)),fromBase64Url(expected))}

export function passwordProblem(password:unknown){if(typeof password!=='string'||password.length<10)return 'Use a password of at least 10 characters.';if(password.length>200)return 'Use a password of 200 characters or fewer.';return null}
export const normalizeEmail=(email:unknown)=>typeof email==='string'?email.trim().toLowerCase():'';
export const validEmail=(email:string)=>email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function readCookie(header:string|null,name:string){for(const part of (header||'').split(';')){const [k,...v]=part.trim().split('=');if(k===name)return v.join('=')}return null}
function cookie(value:string,maxAge:number,secure:boolean){return SESSION_COOKIE+'='+value+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+maxAge+(secure?'; Secure':'')}
const isSecure=(request:Request)=>new URL(request.url).protocol==='https:';

export async function createSession(request:Request,userId:string){const token=randomToken();await database().prepare('INSERT INTO sessions (id_hash,user_id,created_at,expires_at) VALUES (?,?,?,?)').bind(await hash(token),userId,new Date().toISOString(),now()+SESSION_DAYS*86400).run();return cookie(token,SESSION_DAYS*86400,isSecure(request))}
export async function endSession(request:Request){const token=readCookie(request.headers.get('cookie'),SESSION_COOKIE);if(token)await database().prepare('DELETE FROM sessions WHERE id_hash=?').bind(await hash(token)).run();return cookie('',0,isSecure(request))}
export async function endAllSessions(userId:string){await database().prepare('DELETE FROM sessions WHERE user_id=?').bind(userId).run()}

async function userForToken(token:string|null):Promise<AccountUser|null>{if(!token||token.length>100)return null;const row=await database().prepare('SELECT u.id,u.email,u.first_name,u.last_name,u.email_verified_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id_hash=? AND s.expires_at>?').bind(await hash(token),now()).first<any>();return row?{id:row.id,email:row.email,firstName:row.first_name,lastName:row.last_name,verified:!!row.email_verified_at}:null}
export function userFromCookieHeader(header:string|null){return userForToken(readCookie(header,SESSION_COOKIE))}
export function requestUser(request:Request){return userFromCookieHeader(request.headers.get('cookie'))}

// The owner is the signed-in account whose verified email matches OWNER_EMAIL.
export function isOwnerUser(user:AccountUser|null){const owner=String(settings().OWNER_EMAIL||'').toLowerCase();return !!user&&user.verified&&!!owner&&user.email.toLowerCase()===owner}

export async function issueToken(userId:string,purpose:'verify'|'reset',seconds:number){const token=randomToken();if(purpose==='reset')await database().prepare("UPDATE auth_tokens SET used_at=? WHERE user_id=? AND purpose='reset' AND used_at IS NULL").bind(new Date().toISOString(),userId).run();await database().prepare('INSERT INTO auth_tokens (token_hash,user_id,purpose,expires_at,used_at) VALUES (?,?,?,?,NULL)').bind(await hash(token),userId,purpose,now()+seconds).run();return token}
export async function consumeToken(token:unknown,purpose:'verify'|'reset'){if(typeof token!=='string'||token.length<20||token.length>100)return null;const row=await database().prepare('UPDATE auth_tokens SET used_at=? WHERE token_hash=? AND purpose=? AND used_at IS NULL AND expires_at>? RETURNING user_id').bind(new Date().toISOString(),await hash(token),purpose,now()).first<{user_id:string}>();return row?.user_id||null}

export function safeReturnPath(value:unknown){if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||value.startsWith('/\\'))return '/library';try{const url=new URL(value,'https://law-girl.local');return url.origin==='https://law-girl.local'?url.pathname+url.search:'/library'}catch{return '/library'}}
