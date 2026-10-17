import {readFile,writeFile,readdir,stat,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),dist=join(root,'dist');
const py=['pyodide.mjs','pyodide.asm.mjs','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'];
const refs=['System.Private.CoreLib','System.Runtime','System.Console','System.Collections','System.Linq','System.Linq.Expressions','System.Memory','netstandard','System.Text.Json','CodeQuest.Runtime'].map(x=>x+'.dll');
await writeFile(join(dist,'runtimes/csharp/references.json'),JSON.stringify(refs));
const cs=(await readdir(join(dist,'runtimes/csharp'))).filter(n=>/\.dll$|^dotnet\.(boot\.js|js|runtime\.js|native\.js|native\.wasm|native\.js\.symbols)$|\.dat$|^references\.json$/.test(n));
async function item(name,path){const {size}=await stat(join(dist,path));return {name,path:'./'+path,size};}
const common=await item('world.js','world.js');
const manifest={python:[common,...await Promise.all(py.map(n=>item(n,'runtimes/python/'+n))),await item('python-runner.py','python-runner.py')],csharp:[common,...await Promise.all(cs.map(n=>item(n,'runtimes/csharp/'+n))),await item('csharp-api.txt','csharp-api.txt')]};
await writeFile(join(dist,'runtime-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(Object.entries(manifest).map(([key,files])=>`${key}: ${files.length} assets, ${(files.reduce((n,f)=>n+f.size,0)/1e6).toFixed(2)} MB uncompressed`).join('\n'));
