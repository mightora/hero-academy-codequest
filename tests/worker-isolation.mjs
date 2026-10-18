import {Worker} from 'node:worker_threads';
import {readFile,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {challenge} from '../dist/levels.js';
import {assess} from '../dist/world.js';
const manifest=JSON.parse(await readFile(new URL('../dist/runtime-manifest.json',import.meta.url),'utf8'));
async function boot(language){
 const worker=new Worker(new URL('./browser-worker-vm.mjs',import.meta.url),{workerData:{bundled:true},execArgv:['--experimental-vm-modules','--disable-warning=ExperimentalWarning']});
 function until(type,timeout=60000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{worker.terminate();reject(Error('Timeout waiting for '+type));},timeout);const listen=m=>{if(m.type===type||m.type==='error'){clearTimeout(timer);worker.off('message',listen);m.type==='error'?reject(Error(m.error)):resolve(m);}};worker.on('message',listen);worker.once('error',reject);});}
 await until('harness-ready');const assets=Object.fromEntries(await Promise.all(manifest[language].map(async a=>{const b=await readFile(new URL('../dist/'+a.path.slice(2),import.meta.url));return [a.name,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)];})));
 const started=performance.now(),ready=until('ready');worker.postMessage({type:'boot',language,assets});const r=await ready;
 return {worker,until,version:r.version,startupMs:Math.round(performance.now()-started)};
}
const report=[];
for(const language of ['python','csharp']){
 const h=await boot(language),c=challenge(language==='python'?'P20':'C20');let pending=h.until('result');h.worker.postMessage({type:'run',code:c.example,config:c});let r=await pending;assert.equal(r.error,'');assert.ok(assess(c,r.actions,r.features).complete);
 const probe=h.until('probe');h.worker.postMessage({type:'probe'});const isolated=await probe;assert.ok(isolated.networkBlocked&&isolated.documentAbsent&&isolated.profilesAbsent);
 pending=h.until('result');h.worker.postMessage({type:'run',code:language==='python'?'import js\nprint(hasattr(js, "document"))\nprint(hasattr(js, "localStorage"))':'Console.WriteLine("isolated");',config:challenge(language==='python'?'P11':'C11')});r=await pending;assert.equal(r.error,'');
 const phase=h.until('running');h.worker.postMessage({type:'run',code:language==='python'?'while True:\n    pass':'while (true) { }',config:c});await phase;let ticks=0;const heartbeat=setInterval(()=>ticks++,10);await new Promise(resolve=>setTimeout(resolve,150));const t=performance.now();await h.worker.terminate();clearInterval(heartbeat);assert.ok(ticks>=5,'The host event loop stayed responsive');report.push({language,version:h.version,browserBranchStartupMs:h.startupMs,stopMs:Math.round(performance.now()-t),hostResponsive:true,environment:'Node VM browser-branch worker harness; CSP enforcement and real browsers untested'});
}
await writeFile(new URL('./worker-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);
