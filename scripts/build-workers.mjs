import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const driver=await readFile(resolve(root,'dist/runtime-worker.js'),'utf8');
for(const language of ['python','csharp']){
 const names=language==='python'
  ? ['world.js','pyodide.mjs','pyodide.asm.mjs']
  : ['world.js','dotnet.js','dotnet.boot.js','dotnet.runtime.js','dotnet.native.js'];
 const imports=names.map((name,i)=>`import * as module${i} from ${JSON.stringify(resolve(root,name==='world.js'?'dist/world.js':`dist/runtimes/${language}/${name}`))};`).join('\n');
 const registry=names.map((name,i)=>`${JSON.stringify(name)}:module${i}`).join(',');
 const contents=`${imports}
const bundledModules={${registry}};
Object.defineProperty(globalThis,'__questImport',{value:async function(specifier){
 const address=String(specifier);
 const name=Object.entries(assetURLs||{}).find(([,url])=>url===address)?.[0]
  || (address.startsWith('https://codequest.invalid/')?address.slice('https://codequest.invalid/'.length).split('?')[0]:null);
 if(name&&Object.hasOwn(bundledModules,name))return bundledModules[name];
 throw Error('Only bundled toolkit modules can be loaded.');
}});
${driver.replace(/\bimport\s*\(/g,'globalThis.__questImport(')}`;
 const result=await build({stdin:{contents,resolveDir:root,sourcefile:`${language}-worker-entry.js`},bundle:true,metafile:true,
  platform:'browser',format:'iife',target:'es2022',outfile:resolve(root,`dist/runtime-worker-${language}.js`),
  legalComments:'inline',plugins:[{name:'isolated-runtime-modules',setup(builder){
   builder.onLoad({filter:/\.(mjs|js)$/},async({path})=>({loader:'js',contents:(await readFile(path,'utf8'))
    .replaceAll('import.meta.url',JSON.stringify('https://codequest.invalid/'+basename(path)))
    .replace(/\bimport\s*\(/g,'globalThis.__questImport(')}));
  }}]});
 for(const output of Object.values(result.metafile.outputs))if(output.imports.length)throw Error('Runtime bundle contains external module imports.');
 console.log(`Built ${language} classic worker with bundled engine modules.`);
}
