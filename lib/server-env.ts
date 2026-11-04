// Server runtime for Node.js hosting (Akamai Cloud). Supplies the same `env` shape the
// app was written against: configuration from process.env, `DB` (SQLite with a
// D1-style prepare/bind/first/all/run/batch API) and `BUCKET` (private files on disk).
import {DatabaseSync} from 'node:sqlite';
import {createReadStream,existsSync} from 'node:fs';
import {mkdir,stat,writeFile} from 'node:fs/promises';
import {dirname,resolve,sep} from 'node:path';
import {Readable} from 'node:stream';

type Value=string|number|bigint|null|Uint8Array;
export type RunResult={success:true;meta:{changes:number;last_row_id:number}};
export interface Statement{bind(...values:unknown[]):Statement;run():Promise<RunResult>;all<T=Record<string,any>>():Promise<{results:T[]}>;first<T=Record<string,any>>():Promise<T|null>}
export interface Database{prepare(sql:string):Statement;batch(statements:Statement[]):Promise<RunResult[]>}
export interface FileStore{head(key:string):Promise<{size:number}|null>;get(key:string):Promise<{body:ReadableStream}|null>;put(key:string,value:Uint8Array|ArrayBuffer|string,options?:unknown):Promise<void>}

// Local development reads .env.local; production gets variables from the systemd unit.
try{process.loadEnvFile('.env.local')}catch{}

const toValue=(v:unknown):Value=>v===undefined?null:typeof v==='boolean'?(v?1:0):v as Value;

let db:Database|undefined;
function openDatabase():Database{
  const path=resolve(process.env.DATABASE_PATH||'.data/law-girl.sqlite');
  if(!existsSync(dirname(path)))throw new Error('Database folder does not exist: '+dirname(path));
  const sqlite=new DatabaseSync(path);
  sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
  const prepare=(sql:string):Statement=>{
    let values:Value[]=[];
    const api:Statement={
      bind(...v){values=v.map(toValue);return api},
      async run(){const r=sqlite.prepare(sql).run(...values);return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}},
      async all<T>(){return {results:sqlite.prepare(sql).all(...values) as T[]}},
      async first<T>(){return (sqlite.prepare(sql).get(...values) as T)??null},
    };
    return api;
  };
  return {prepare,async batch(statements){
    // D1 runs a batch as one transaction; SQLite calls are synchronous so nothing interleaves.
    sqlite.exec('BEGIN');
    try{const results:RunResult[]=[];for(const q of statements)results.push(await q.run());sqlite.exec('COMMIT');return results}
    catch(error){sqlite.exec('ROLLBACK');throw error}
  }};
}

let bucket:FileStore|undefined;
function openFileStore():FileStore{
  const root=resolve(process.env.FILES_DIR||'.data/files');
  const pathFor=(key:string)=>{const path=resolve(root,key);if(!key||!path.startsWith(root+sep))throw new Error('Invalid file key.');return path};
  return {
    async head(key){try{const s=await stat(pathFor(key));return s.isFile()?{size:s.size}:null}catch{return null}},
    async get(key){const path=pathFor(key);try{if(!(await stat(path)).isFile())return null}catch{return null}return {body:Readable.toWeb(createReadStream(path)) as ReadableStream}},
    async put(key,value){const path=pathFor(key);await mkdir(dirname(path),{recursive:true});await writeFile(path,typeof value==='string'?value:new Uint8Array(value))},
  };
}

export interface Env{DB:Database;BUCKET:FileStore;[name:string]:any}
export const env=new Proxy({} as Env,{get(_,key){
  if(key==='DB')return db??=openDatabase();
  if(key==='BUCKET')return bucket??=openFileStore();
  return typeof key==='string'?process.env[key]:undefined;
}});
