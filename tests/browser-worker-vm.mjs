// Exercise the browser branches of both vendor loaders without a browser.
// This does not substitute for testing CSP/worker behaviour in actual Safari/Chrome.
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {parentPort,workerData} from 'node:worker_threads';
const blobs=new Map();let next=1;
class TestURL extends URL {static createObjectURL(blob){const id='blob:codequest-test/'+next++;blobs.set(id,blob);return id;}static revokeObjectURL(id){blobs.delete(id);}}
const globals={console,TypeError,Error,RangeError,WebAssembly,TextDecoder,TextEncoder,Blob,Response,Request,Headers,URL:TestURL,URLSearchParams,Uint8Array,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array,ArrayBuffer,DataView,SharedArrayBuffer:undefined,Atomics,performance,crypto:webcrypto,setTimeout,clearTimeout,setInterval,clearInterval,queueMicrotask,btoa,atob,structuredClone,navigator:{language:'en-GB',languages:['en-GB'],userAgent:'CodeQuest test harness'},location:new URL('blob:null/worker'),crossOriginIsolated:false,WorkerGlobalScope:class{},addEventListener:()=>{},removeEventListener:()=>{},postMessage:m=>parentPort.postMessage(m),fetch:async url=>{if(blobs.has(String(url)))return new Response(await blobs.get(String(url)).arrayBuffer());throw Error('External network blocked by test harness');}};
const context=vm.createContext(globals,{codeGeneration:{strings:false,wasm:true}});
vm.runInContext('self=globalThis; Object.setPrototypeOf(globalThis,WorkerGlobalScope.prototype);',context);
const modules=new Map();
async function load(specifier){
 if(modules.has(specifier))return modules.get(specifier);
 if(!blobs.has(specifier))throw Error('Non-Blob module rejected: '+specifier);
 const source=await blobs.get(specifier).text();const mod=new vm.SourceTextModule(source,{context,identifier:specifier,initializeImportMeta:meta=>meta.url=specifier,importModuleDynamically:async s=>{const m=await load(s);if(m.status==='unlinked')await m.link(load);if(m.status!=='evaluated')await m.evaluate();return m;}});modules.set(specifier,mod);await mod.link(load);await mod.evaluate();return mod;
}
const workerSource=(await readFile(new URL('../dist/runtime-worker.js',import.meta.url),'utf8')).replaceAll('String(error.message||error)', 'String(error.stack||error)');const root=new vm.SourceTextModule(workerSource,{context,identifier:'worker',importModuleDynamically:load});await root.link(load);await root.evaluate();
parentPort.on('message',data=>{
 if(data.type==='boot'){
  // Node threads do not share a browser's Blob URL store. Recreate the frame's
  // module URL store outside the VM before handing it to the worker context.
  const assetURLs={};
  for(const [name,bytes]of Object.entries(data.assets))if(/\.(mjs|js)$/.test(name)){
   const source=new TextDecoder().decode(bytes).replaceAll('import.meta.url',JSON.stringify('https://codequest.invalid/'+name));
   assetURLs[name]=TestURL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  }
  data.assetURLs=assetURLs;
 }
 if(data.type==='probe'){
  context.fetch('https://example.invalid/').then(()=>parentPort.postMessage({type:'probe',networkBlocked:false}),()=>parentPort.postMessage({type:'probe',networkBlocked:true,documentAbsent:context.document===undefined,profilesAbsent:context.localStorage===undefined}));
 }else context.onmessage({data});
});
parentPort.postMessage({type:'harness-ready'});
