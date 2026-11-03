import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const output=resolve(process.argv[2]||'Law_Girl_Complete_Website_Source.zip');
const result=spawnSync('git',['archive','--format=zip','--output',output,'HEAD'],{stdio:'inherit'});
if(result.error)throw result.error;if(result.status!==0)throw new Error('Commit the tested source before exporting.');console.log(output);
