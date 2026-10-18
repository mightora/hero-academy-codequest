// Real RuntimeHost + iframe bootstrap + Node worker adapter. Browser CSP remains untested.
import {readFile,writeFile} from 'node:fs/promises';
import {Worker} from 'node:worker_threads';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {RuntimeHost} from '../dist/runtime-host.js';
import {challenge} from '../dist/levels.js';
import {assess} from '../dist/world.js';
const html=await readFile(new URL('../dist/isolate.html',import.meta.url),'utf8'),bootstrap=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const workers=[];
class WorkerAdapter{
 constructor(_url,options){assert.notEqual(options?.type,'module','An opaque-origin frame cannot bootstrap a module worker in Chromium');this.queue=[];this.ready=false;this.node=new Worker(new URL('./browser-worker-vm.mjs',import.meta.url),{workerData:{bundled:true},execArgv:['--experimental-vm-modules','--disable-warning=ExperimentalWarning']});workers.push(this);this.node.on('message',m=>{if(m.type==='harness-ready'){this.ready=true;for(const q of this.queue)this.node.postMessage(q);this.queue=[];}else this.onmessage?.({data:m});});this.node.on('error',e=>this.onerror?.(e));}
 postMessage(m){if(this.ready)this.node.postMessage(m);else this.queue.push(m);}
 terminate(){this.terminated=true;this.termination=this.node.terminate();}
}
function frame(){
 const parent={},listeners=[];let loaded;
 vm.runInNewContext(bootstrap,{parent,addEventListener:(name,fn)=>listeners.push(fn),URL,Blob,TextDecoder,Worker:WorkerAdapter,console});
 return {title:'',hidden:false,setAttribute(){},addEventListener:(_name,fn)=>loaded=fn,contentWindow:{postMessage:(data,_origin,ports)=>queueMicrotask(()=>listeners.forEach(fn=>fn({source:parent,data,ports})))},load:()=>queueMicrotask(loaded),remove(){this.removed=true;}};
}
globalThis.document={createElement:()=>frame(),body:{append:el=>el.load()}};
globalThis.fetch=async(path,options)=>{if(options?.signal?.aborted)throw Error('Aborted');const b=await readFile(new URL(path,new URL('../dist/',import.meta.url)));return new Response(b,{status:200});};
const results=[];
for(const language of ['python','csharp']){
 let started;let running;let output='';
 const host=new RuntimeHost(status=>{if(status.startsWith('Running'))started?.();},text=>output+=text);
 await host.load(language);
 const config=challenge(language==='python'?'P11':'C11');const result=await host.run(config.example,config);assert.ok(assess(config,result.actions,result.features).complete);assert.ok(output.includes('Hello, Academy!'));host.stop();
 await host.load(language);running=new Promise(resolve=>started=resolve);const error=host.run(language==='python'?'while True:\n    pass':'while (true) { }',config).catch(e=>e.message);await running;
 let beats=0;const heartbeat=setInterval(()=>beats++,10);await new Promise(resolve=>setTimeout(resolve,120));
 const start=performance.now();host.stop();assert.match(await error,/Stopped/);await new Promise(resolve=>setTimeout(resolve,200));clearInterval(heartbeat);
 assert.ok(workers.at(-1).terminated,'Stop reached the actual worker terminate call');assert.ok(beats>=5);
 results.push({language,stopAndDisposalMs:Math.round(performance.now()-start),hostResponsive:true,runAndOutputValidated:true});
}
const guard=new RuntimeHost();await guard.load('python');const begin=performance.now();const timeout=await guard.run('while True:\n    pass',challenge('P11')).catch(e=>e.message);assert.match(timeout,/long program|Stopped/);assert.ok(performance.now()-begin<6500);guard.stop();await new Promise(resolve=>setTimeout(resolve,250));
for(const worker of workers)await (worker.termination??worker.node.terminate());
const report={checks:7,results,watchdogMs:Math.round(performance.now()-begin),environment:'Node adapters execute real host, opaque-frame bootstrap, browser-branch workers; no actual browser CSP or device claims'};
await writeFile(new URL('./host-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);
