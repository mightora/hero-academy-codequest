// DOM integration, not layout rendering or a substitute for real browser QA.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
const {window,document}=parseHTML(await readFile(new URL('../dist/index.html',import.meta.url),'utf8'));
const map=new Map(),timers=new Map();let timerId=0,exported;
const clock={set:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;},clear:id=>timers.delete(id)};
Object.assign(globalThis,{window,document,Event:window.Event,localStorage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)},matchMedia:()=>({matches:false,addEventListener:()=>{}}),setTimeout:clock.set,clearTimeout:clock.clear,requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{}});
window.scrollTo=()=>{};window.matchMedia=globalThis.matchMedia;document.querySelector('#dialog').showModal=function(){this.open=true;};document.querySelector('#dialog').close=function(){this.open=false;};
const originalFetch=globalThis.fetch;
globalThis.fetch=(_url,options)=>new Promise((_,reject)=>{options?.signal?.addEventListener('abort',()=>reject(Error('Aborted')),{once:true});});
URL.createObjectURL=blob=>{exported=blob;return 'blob:test-backup';};URL.revokeObjectURL=()=>{};
await import('../dist/app.js');
const find=s=>{const e=document.querySelector(s);assert.ok(e,'Missing '+s);return e;},click=s=>find(s).click(),tick=()=>new Promise(resolve=>queueMicrotask(resolve));
let checks=0;
assert.match(document.body.textContent,/The islands need a hero/);assert.equal(document.querySelectorAll('.mission-card').length,10);checks++;
for(const path of ['python','csharp','foundation']){click(`[data-action="path"][data-path="${path}"]`);assert.equal(document.querySelectorAll('.mission-card').length,10);assert.equal(document.querySelectorAll('.map-marker').length,10);checks++;}
click('[data-action="level"][data-id="F1"]');click('[data-action="add-block"][data-index="0"]');assert.equal(document.querySelectorAll('.program-block').length,1);click('[data-action="run"]');await tick();assert.match(document.body.textContent,/Place restored!/);checks++;
click('[data-action="back"]');assert.match(document.body.textContent,/The islands need a hero/);assert.equal(document.querySelector('.mini-shell'),null);assert.ok(![...timers.values()].some(t=>t.ms===1000),'Back cancelled automatic transition');checks++;
click('[data-action="level"][data-id="F5"]');click('[data-action="add-block"][data-index="0"]');click('.block-nest [data-action="slot"]');click('[data-action="add-block"][data-index="1"]');assert.equal(document.querySelectorAll('.program-block').length,2);click('[data-action="step"]');await tick();assert.match(find('#action-readout').textContent,/1 \/ 3/);click('[data-action="reset-world"]');assert.match(find('#action-readout').textContent,/World reset/);assert.equal(document.querySelectorAll('.program-block').length,2);checks++;
click('[data-action="back"]');click('[data-action="path"][data-path="csharp"]');click('[data-action="level"][data-id="C11"]');let textarea=find('#code');textarea.value='Console.WriteLine("My saved idea");';textarea.dispatchEvent(new window.Event('input',{bubbles:true}));click('[data-action="stop"]');click('[data-action="back"]');click('[data-action="level"][data-id="C11"]');assert.equal(find('#code').value,'Console.WriteLine("My saved idea");');checks++;
click('[data-action="players"]');find('#nickname').value='Captain Fern';find('#new-player').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));assert.match(find('.player-button').textContent,/Captain Fern/);click('[data-action="path"][data-path="csharp"]');click('[data-action="level"][data-id="C11"]');assert.notEqual(find('#code').value,'Console.WriteLine("My saved idea");');checks++;
click('[data-action="back"]');click('[data-action="adults"]');click('[data-action="export"]');const backup=await exported.text();assert.equal(JSON.parse(backup).players.length,2);checks++;
const input=find('#backup-input');Object.defineProperty(input,'files',{configurable:true,value:[{size:backup.length,text:async()=>backup}]});input.dispatchEvent(new window.Event('change',{bubbles:true}));await tick();await tick();assert.match(find('#dialog').textContent,/Restore this adventure/);click('#restore-backup');assert.match(find('.player-button').textContent,/Captain Fern/);checks++;
click('[data-action="fun"]');assert.equal(document.querySelectorAll('.fun-card').length,4);click('[data-action="game"][data-id="memory"]');assert.equal(document.querySelectorAll('.memory-card').length,12);checks++;
click('[data-action="back"]');click('[data-action="branch"]');assert.equal(document.querySelectorAll('.branch-card').length,2);checks++;
click('[data-action="sandbox"]');assert.equal(document.querySelectorAll('.branch-card').length,3);checks++;
const report={checks,environment:'LinkeDOM DOM integration; no visual layout, native keyboard, CSP or physical device assertions'};await writeFile(new URL('./dom-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);globalThis.fetch=originalFetch;
