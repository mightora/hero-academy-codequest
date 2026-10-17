import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {dotnet} from '../dist/runtimes/csharp/dotnet.js';
import {makeBridge,assess} from '../dist/world.js';
import {challenge} from '../dist/levels.js';
const start=performance.now();let bridge,output='',phase='';
const runtime=await dotnet.create();
runtime.setModuleImports('codequest',{dispatch(op,json){const a=JSON.parse(json);if(op==='__trace'){bridge.trace(a[0]);return '';}if(op==='__sense')return JSON.stringify(bridge.sense(a[0]));if(op==='__phase'){phase=a[0];return '';}if(op==='__output'){output+=a[0]+'\n';for(let i=0;i<a[0].length||i===0;i+=240)bridge.command('message',[a[0].slice(i,i+240)]);return '';}bridge.command(op,a);return '';}});
const exports=(await runtime.getAssemblyExports('CodeQuest.Runtime.dll')).QuestRuntime;
const names=JSON.parse(await readFile(new URL('../dist/runtimes/csharp/references.json',import.meta.url),'utf8'));
const refs=await Promise.all(names.map(n=>readFile(new URL('../dist/runtimes/csharp/'+n,import.meta.url)).then(x=>x.toString('base64'))));
const version=exports.Init(JSON.stringify(refs)),startup=performance.now()-start;
const api=await readFile(new URL('../dist/csharp-api.txt',import.meta.url),'utf8');
let count=0,firstRunMs;
for(let n=11;n<=20;n++)for(let variant=0;variant<4;variant++){
 const c=challenge('C'+n,variant);bridge=makeBridge(c);output='';const time=performance.now();const {error}=JSON.parse(exports.Execute(c.example,api));if(firstRunMs===undefined)firstRunMs=performance.now()-time;assert.equal(error,'',`C${n} v${variant}: ${error}`);const a=assess(c,bridge.actions,[...bridge.features]);assert.ok(a.complete,`C${n} v${variant}: ${a.feedback}, missing ${a.missing}`);count++;
}
for(const [id,code]of [['C11','Console.WriteLine(string.Concat("Hello, ", "Academy!"));'],['C13','int supplies = 0;\nfor (int i = 0; i < 3; i++) { supplies = supplies + 2; }\nGame.Supply(supplies);\nGame.Robot("Pip", 20 - supplies, true);'],['C14','Game.Lift(1, Game.Energy() >= Game.Needed());'],['C16','int i = 0;\nfor (; i != Game.Count(); ++i) { Game.Light(i); }'],['C18','void Fix(string location) { Game.Repair(location); }\nFix("bridge");\nFix("workshop");'],['C18','void Fix(string location) => Game.Repair(location);\nFix("bridge");\nFix("workshop");']]){
 const c=challenge(id);bridge=makeBridge(c);const {error}=JSON.parse(exports.Execute(code,api));assert.equal(error,'');const a=assess(c,bridge.actions,[...bridge.features]);assert.ok(a.complete,`${id} alternative: ${a.feedback}`);count++;
}
bridge=makeBridge(challenge('C11'));assert.match(JSON.parse(exports.Execute('Console.WriteLine("hello")',api)).error,/expected|CS1002/);count++;
bridge=makeBridge(challenge('C16'));exports.Execute('if(false){for(int i=0;i<3;i++){Game.Light(i);}}\nGame.Light(0);Game.Light(1);Game.Light(2);',api);assert.equal(assess(challenge('C16'),bridge.actions,[...bridge.features]).complete,false);count++;
bridge=makeBridge(challenge('C11'));assert.match(JSON.parse(exports.Execute('Console.WriteLine(new string(\'x\',9000));',api)).error,/Output limit/);count++;
const report={version,startupMs:Math.round(startup),firstCompileAndRunMs:Math.round(firstRunMs),checks:count,environment:'Node.js .NET WebAssembly + Roslyn; not a browser or physical iPhone'};
await writeFile(new URL('./csharp-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);
