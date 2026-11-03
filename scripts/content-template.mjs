import {writeFile} from 'node:fs/promises';
const file=process.argv[2]||'law-girl-content-import.json';
const data={format:'lawgirl-content-v1',documents:[{id:'blog-your-first-post',kind:'blog',payload:{title:'Your article title',date:'YYYY-MM-DD',type:'Blog',topic:'Your topic',source:'Jasmine Daya',url:'',slug:'your-first-post',body:['First paragraph.','Second paragraph.']}}]};
await writeFile(file,JSON.stringify(data,null,2)+'\n',{flag:'wx'});console.log('Created '+file+'. Review the example and import through Owner Studio.');
