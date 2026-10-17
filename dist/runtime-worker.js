// Loaded as a module Blob inside an opaque-origin sandbox. Network is forbidden by CSP.
let bridge,runner,language,assets,assetURLs,outputCount=0;
const decoder=new TextDecoder();
const send=m=>postMessage(m);
const virtual='https://codequest.invalid/';
function keyOf(input){const s=String(input instanceof Request?input.url:input);if(!s.startsWith(virtual))return null;return s.slice(virtual.length).split('?')[0];}
function bytes(name){const b=assets[name];if(!b)throw Error('Missing runtime asset: '+name);return b;}
function source(name){return decoder.decode(bytes(name));}
function url(name){
 if(!assets[name])throw Error('Missing runtime asset: '+name);
 if(/\.(mjs|js)$/.test(name)){if(!assetURLs[name])throw Error('Missing isolated module: '+name);return assetURLs[name];}
 return virtual+name;
}
globalThis.fetch=async(input,options)=>{
 const key=keyOf(input);
 if(key&&assets[key])return new Response(bytes(key),{status:200,headers:{'Content-Type':key.endsWith('.wasm')?'application/wasm':'application/octet-stream'}});
 throw Error('CodeQuest programs cannot use the network.');
};
function output(text){
 text=String(text);outputCount+=text.length+1;if(outputCount>8192)throw Error('Output limit reached. Try fewer messages.');
 // The actual executed print/WriteLine output powers the beacon.
 for(let i=0;i<text.length||i===0;i+=240)bridge.command('message',[text.slice(i,i+240)]);
 send({type:'output',text});
}
function dispatch(op,json){
 const args=JSON.parse(json);
 if(op==='__trace'){bridge.trace(args[0]);return '';}
 if(op==='__sense')return JSON.stringify(bridge.sense(args[0]));
 if(op==='__phase'){send({type:'running'});return '';}
 if(op==='__output'){output(args[0]);return '';}
 bridge.command(op,args);return '';
}
async function boot(m){
 language=m.language;assets=m.assets;assetURLs=m.assetURLs;
 const {makeBridge}=await import(url('world.js'));runner={makeBridge};
 if(language==='python'){
  const {loadPyodide}=await import(url('pyodide.mjs'));
  const createPyodideModule=(await import(url('pyodide.asm.mjs'))).default;
  const py=await loadPyodide({indexURL:virtual,createPyodideModule,lockFileContents:JSON.parse(source('pyodide-lock.json')),stdLibURL:url('python_stdlib.zip'),stdout:()=>{},stderr:()=>{}});
  py.registerJsModule('academy_bridge',{command:(op,json,line)=>bridge.command(op,JSON.parse(json),line),sensor:key=>JSON.stringify(bridge.sense(key)),trace:f=>bridge.trace(f),output});
  py.runPython(source('python-runner.py'));runner.py=py;
  send({type:'ready',version:'Python '+py.runPython('import sys; sys.version.split()[0]')+' · Pyodide 314.0.7'});
 }else{
  const {dotnet}=await import(url('dotnet.js'));
  const {config}=await import(url('dotnet.boot.js'));
  const runtime=await dotnet.withConfig(config).withApplicationCulture('en-GB').withResourceLoader((_type,name)=>url(name)).create();
  runtime.setModuleImports('codequest',{dispatch});
  const exports=await runtime.getAssemblyExports('CodeQuest.Runtime.dll');runner.cs=exports.QuestRuntime;
  const names=JSON.parse(source('references.json'));
  const refs=names.map(name=>{const a=new Uint8Array(bytes(name));let s='';for(let i=0;i<a.length;i+=16384)s+=String.fromCharCode(...a.subarray(i,i+16384));return btoa(s);});
  const version=runner.cs.Init(JSON.stringify(refs));send({type:'ready',version});
 }
}
self.onmessage=async e=>{
 const m=e.data;
 try{
  if(m.type==='boot')await boot(m);
  else if(m.type==='run'){
   if(typeof m.code!=='string'||m.code.length>32768)throw Error('Keep your program under 32,768 characters.');
   bridge=runner.makeBridge(m.config);outputCount=0;let error='';
   if(language==='python'){send({type:'running'});error=runner.py.globals.get('_run_child')(m.code);}
   else {send({type:'compiling'});error=JSON.parse(runner.cs.Execute(m.code,source('csharp-api.txt'))).error??'';}
   send({type:'result',...bridge.result(),error:String(error).slice(0,3000)});
  }
 }catch(error){send({type:'error',error:String(error.message||error).slice(0,3000)});}
};
