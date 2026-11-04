// Applies pending SQL migrations from drizzle/ to the SQLite database at DATABASE_PATH.
// Applied migrations are recorded in d1_migrations and are never re-run or edited.
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,readdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

try{process.loadEnvFile('.env.local')}catch{}
const path=resolve(process.env.DATABASE_PATH||'.data/law-girl.sqlite');
mkdirSync(dirname(path),{recursive:true});
const db=new DatabaseSync(path);
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);');
const applied=new Set(db.prepare('SELECT name FROM d1_migrations').all().map(r=>r.name));
const pending=readdirSync('drizzle').filter(f=>f.endsWith('.sql')&&!applied.has(f)).sort();
for(const name of pending){
  db.exec('BEGIN');
  try{db.exec(readFileSync('drizzle/'+name,'utf8'));db.prepare('INSERT INTO d1_migrations (name) VALUES (?)').run(name);db.exec('COMMIT')}
  catch(error){db.exec('ROLLBACK');console.error('Migration '+name+' failed; nothing from it was applied.');throw error}
  console.log('Applied '+name);
}
console.log(pending.length?pending.length+' migration(s) applied to '+path:'Database is up to date: '+path);
db.close();
