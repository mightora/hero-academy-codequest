import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import * as css from 'css-tree';
import {LEVELS,challenge} from '../dist/levels.js';
const root=resolve(import.meta.dirname,'..'),dist=join(root,'dist');
for(const file of await readdir(dist))if(file.endsWith('.js')){const r=spawnSync(process.execPath,['--check',join(dist,file)],{encoding:'utf8'});assert.equal(r.status,0,file+': '+r.stderr);}
const errors=[];css.parse(await readFile(join(dist,'style.css'),'utf8'),{onParseError:e=>errors.push(e.formattedMessage)});assert.deepEqual(errors,[]);
const html=await readFile(join(dist,'index.html'),'utf8'),isolate=await readFile(join(dist,'isolate.html'),'utf8');assert.ok(html.includes('viewport-fit=cover'));assert.ok(!html.includes('user-scalable=no'));assert.ok(isolate.includes("connect-src 'none'"));assert.ok(!isolate.includes('allow-same-origin'));assert.ok(!isolate.includes("'unsafe-eval'"));
const manifest=JSON.parse(await readFile(join(dist,'runtime-manifest.json'),'utf8'));
for(const files of Object.values(manifest))for(const item of files){const size=(await stat(resolve(dist,item.path))).size;assert.equal(size,item.size,'Manifest size drift: '+item.path);assert.ok(size<25*1024*1024,'Static asset too large: '+item.path);}
for(const level of LEVELS)for(let v=0;v<4;v++){const c=challenge(level.id,v);assert.ok(c.goalText&&c.clue&&c.explanation&&c.example);assert.ok(level.path==='foundation'?Array.isArray(c.example):typeof c.example==='string');}
const style=await readFile(join(dist,'style.css'),'utf8');for(const width of [380,700,900,1150])assert.ok(style.includes(`max-width:${width}px`));assert.ok(style.includes('prefers-reduced-motion'));assert.ok(style.includes('env(safe-area-inset-bottom)'));assert.ok(style.includes('focus-visible'));
console.log('Source, CSS, all 120 challenge definitions, runtime asset manifest, static asset sizes and accessibility configuration checked. Layout rendering and real devices are not asserted.');
