import {LIMITS,validateCommand} from './world.js';
const assetCache=new Map();
export class RuntimeHost{
 constructor(onStatus=()=>{},onOutput=()=>{}){this.onStatus=onStatus;this.onOutput=onOutput;this.generation=0;this.frame=null;this.port=null;this.ready=false;this.timer=null;this.bootTimer=null;this.controller=null;this.rejectRun=null;this.rejectLoad=null;}
 async load(language){
  this.stop();const generation=++this.generation;this.language=language;this.controller=new AbortController();const signal=this.controller.signal;
  const report=(text,progress)=>{if(generation===this.generation)this.onStatus(text,progress);};
  report('Packing Pip’s '+(language==='python'?'Python':'C#')+' toolkit…',0);
  try{
   const manifest=await fetch('./runtime-manifest.json',{signal}).then(r=>{if(!r.ok)throw Error('The runtime list could not be downloaded.');return r.json();});
   const list=manifest[language];if(!Array.isArray(list))throw Error('The language toolkit is missing.');
   const total=list.reduce((sum,x)=>sum+x.size,0);let loaded=0;
   const entries=new Array(list.length);let cursor=0;
   async function download(item){
    if(assetCache.has(item.path)){loaded+=item.size;report(`Loading toolkit · ${Math.round(loaded/total*100)}%`,loaded/total);return [item.name,assetCache.get(item.path)];}
    const response=await fetch(item.path,{signal});if(!response.ok)throw Error('A toolkit file is missing. Retry or return to First steps.');
    const data=await response.arrayBuffer();assetCache.set(item.path,data);loaded+=item.size;report(`Loading toolkit · ${Math.round(loaded/total*100)}%`,loaded/total);return [item.name,data];
   }
   await Promise.all(Array.from({length:Math.min(6,list.length)},async()=>{while(cursor<list.length){const i=cursor++;entries[i]=await download(list[i]);}}));
   const workerSource=await fetch('./runtime-worker.js',{signal}).then(r=>r.text());
   if(generation!==this.generation)throw Error('Stopped');
   const frame=document.createElement('iframe');frame.title='Isolated code execution';frame.setAttribute('sandbox','allow-scripts');frame.hidden=true;
   // A real document has its own restrictive CSP. srcdoc would inherit the host
   // page's CSP and incorrectly block the isolated bootstrap script.
   frame.src=new URL('./isolate.html?v=classic-worker-1',import.meta.url).href;this.frame=frame;
   const channel=new MessageChannel();this.port=channel.port1;this.port.start();
   await new Promise((resolve,reject)=>{
    this.rejectLoad=reject;
    const timeout=this.bootTimer=setTimeout(()=>reject(Error('The toolkit took too long to start. Retry, or try First steps.')),60000);
    const receive=e=>{
     if(generation!==this.generation)return;
     const m=e.data;
     if(m?.type==='connected')this.port.postMessage({type:'boot',language,assets:Object.fromEntries(entries),workerSource});
     else if(m?.type==='ready'){clearTimeout(timeout);this.rejectLoad=null;this.ready=true;this.version=String(m.version).slice(0,200);report('Ready · '+this.version,1);resolve();}
     else if(m?.type==='error'){clearTimeout(timeout);reject(Error(String(m.error).slice(0,3000)));}
    };
    this.port.onmessage=receive;
    frame.addEventListener('load',()=>frame.contentWindow.postMessage({type:'quest-connect'},'*',[channel.port2]),{once:true});
    document.body.append(frame);
   });
  }catch(e){if(generation===this.generation){this.ready=false;report(signal.aborted?'Stopped. Your code is saved.':'Toolkit unavailable. Retry, or play First steps.',null);}throw e;}
 }
 async run(code,config){
  if(!this.ready)throw Error('Load the language toolkit first.');
  if(code.length>LIMITS.code)throw Error('Keep your program under 32,768 characters.');
  const generation=this.generation;this.ready=false;
  return new Promise((resolve,reject)=>{
   this.rejectRun=reject;
   const deadline=ms=>{clearTimeout(this.timer);this.timer=setTimeout(()=>{this.rejectRun=null;this.stop();reject(Error('Pip paused a long program. Check that your loop can finish. Your code is saved.'));},ms);};
   deadline(LIMITS.compileMs);
   let size=0,executionStarted=false;
   this.port.onmessage=e=>{
    if(generation!==this.generation)return;const m=e.data;
    if(!m||typeof m.type!=='string')return;
    if(m.type==='running'&&!executionStarted){executionStarted=true;deadline(LIMITS.runMs);this.onStatus('Running your program…',1);}
    else if(m.type==='compiling')this.onStatus('Compiling your C#…',1);
    else if(m.type==='output'){if(typeof m.text!=='string'||(size+=m.text.length)>LIMITS.output){this.rejectRun=null;this.stop();reject(Error('Output limit reached. Try fewer messages.'));return;}this.onOutput(m.text);}
    else if(m.type==='result'){
     clearTimeout(this.timer);this.rejectRun=null;
     try{
      if(!Array.isArray(m.actions)||m.actions.length>LIMITS.commands||!Array.isArray(m.features)||m.features.length>30)throw Error('The program returned too many actions.');
      const result={actions:m.actions.map(validateCommand),features:m.features.filter(x=>typeof x==='string'&&x.length<24),error:String(m.error??'').slice(0,3000)};
      this.onStatus('Ready to watch · '+result.actions.length+' game actions',1);this.stop();resolve(result);
     }catch(error){this.stop();reject(error);}
    }else if(m.type==='error'){clearTimeout(this.timer);this.rejectRun=null;this.stop();reject(Error(String(m.error).slice(0,3000)));}
   };
   this.port.postMessage({type:'run',code,config});
  });
 }
 stop(){
  this.generation++;this.controller?.abort();clearTimeout(this.timer);clearTimeout(this.bootTimer);this.rejectRun?.(Error('Stopped. Your code is saved.'));this.rejectLoad?.(Error('Stopped'));this.rejectRun=null;this.rejectLoad=null;
  const frame=this.frame,port=this.port;
  if(port){try{port.postMessage({type:'stop'});}catch{}setTimeout(()=>{port.close();frame?.remove();},150);}else frame?.remove();
  this.frame=null;this.port=null;this.ready=false;
 }
}
export function friendlyError(error,language){
 const raw=String(error?.message??error);
 let help='Change one thing, then try again. Pip can help.';
 if(/indent|expected an indented/i.test(raw))help='Indent the actions inside your loop or choice by four spaces.';
 else if(/SyntaxError|expected|CS1002|CS1513/i.test(raw))help=language==='python'?'Check the brackets, quotes and colon at the end of a loop or choice.':'Check the brackets, braces, quotes and semicolons.';
 else if(/NameError|does not exist|CS0103/i.test(raw))help='Check the spelling and capital letters of that name.';
 else if(/TypeError|cannot convert|CS0029|CS1503/i.test(raw))help='This command needs a different type of value. Check Pip’s command guide.';
 else if(/long program|Stopped|loop can finish/.test(raw))help='A loop needs a way to finish. Stop is always available.';
 return {help,raw};
}
