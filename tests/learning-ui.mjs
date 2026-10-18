import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {LEVELS} from '../dist/levels.js';
import {lessonFor,learningCount} from '../dist/lessons.js';
import {Profiles} from '../dist/profiles.js';
const {window,document}=parseHTML(await readFile(new URL('../dist/index.html',import.meta.url),'utf8'));
const data=new Map(),timers=new Map(),fetches=[],spoken=[];let nextTimer=0,cancelled=0;
const speech={cancel:()=>cancelled++,getVoices:()=>[{lang:'en-GB'}],speak:u=>spoken.push(u)};window.speechSynthesis=speech;
const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
Object.assign(globalThis,{window,document,Event:window.Event,localStorage:storage,speechSynthesis:speech,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},matchMedia:()=>({matches:false,addEventListener(){}}),requestAnimationFrame:()=>0,cancelAnimationFrame(){},setTimeout:(fn,ms)=>{const id=++nextTimer;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)});
window.scrollTo=()=>{};document.querySelector('#dialog').showModal=function(){this.open=true;};document.querySelector('#dialog').close=function(){this.open=false;};
globalThis.fetch=(url,options)=>{fetches.push(url);return new Promise((_,reject)=>options?.signal?.addEventListener('abort',()=>reject(Error('Aborted')),{once:true}));};
await import('../dist/app.js');
const find=selector=>{const e=document.querySelector(selector);assert.ok(e,'Missing '+selector);return e;},click=selector=>find(selector).click(),text=()=>document.querySelector('#main').textContent;
const fresh=()=>new Profiles(storage);let checks=0;
for(const level of LEVELS){
 click('[data-action="map"]');click(`[data-action="path"][data-path="${level.path}"]`);const before=fetches.length;click(`[data-action="level"][data-id="${level.id}"]`);
 assert.match(text(),new RegExp(lessonFor(level.id).title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.equal(document.querySelector('#code'),null);assert.equal(fetches.length,before,'Teaching does not load a language engine');checks++;
 if(level.id==='F1'){assert.equal(spoken.length,0,'Speech never starts automatically');click('[data-action="lesson-hear"]');assert.ok(spoken.at(-1).text.includes(lessonFor('F1').idea));assert.equal(find('[data-action="lesson-quiet"]').disabled,false);const n=cancelled;click('[data-action="lesson-quiet"]');assert.ok(cancelled>n);assert.equal(find('[data-action="lesson-quiet"]').disabled,true);checks++;}
 click('[data-action="lesson-begin"]');
 for(let i=0;i<3;i++){
  const c=lessonFor(level.id).checks[i];assert.ok(text().includes(c.prompt));assert.equal(find('[data-action="lesson-next"]').disabled,true);
  if(level.id==='F1'&&i===1){click('[data-action="lesson-learn"]');click('[data-action="lesson-checks"]');assert.ok(text().includes(c.prompt),'Review keeps the current check position');click('[data-action="lesson-hear"]');assert.ok(spoken.at(-1).text.includes('Option A:'));assert.ok(spoken.at(-1).text.includes(c.options[0].text));click('[data-action="lesson-quiet"]');checks++;}
  if(level.id==='F1'&&i===0){click('[data-action="lesson-answer"][data-choice="1"]');assert.ok(find('#check-feedback').textContent.includes(c.options[1].why));assert.equal(find('[data-action="lesson-next"]').disabled,true);assert.equal(fresh().current.points,0);click('[data-action="lesson-reveal"]');assert.ok(find('#check-feedback').textContent.includes('Pip showed this answer'));}
  else click('[data-action="lesson-answer"][data-choice="0"]');
  assert.equal(find('[data-action="lesson-next"]').disabled,false);assert.ok(find('#check-feedback').textContent.includes(c.options[0].why));click('[data-action="lesson-next"]');checks++;
 }
 assert.equal(learningCount(fresh().current,level.id),3);assert.equal(fresh().current.points,0);assert.ok(document.querySelector('.editor-panel'));assert.equal(document.querySelector('.learning-check'),null);
}
// Exploring the final mission is allowed without falsely passing its checks.
click('[data-action="players"]');find('#nickname').value='Captain Fern';find('#new-player').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));click('[data-action="level"][data-id="F1"]');assert.ok(document.querySelector('.learning-intro'));assert.equal(learningCount(fresh().current,'F1'),0);click('[data-action="lesson-final"]');assert.equal(learningCount(fresh().current,'F1'),0);checks++;
// Reviewing a concept cannot replace the child's saved final program.
click('[data-action="map"]');click('[data-action="path"][data-path="csharp"]');click('[data-action="level"][data-id="C11"]');click('[data-action="lesson-final"]');find('#code').value='Console.WriteLine("Keep my idea");';find('#code').dispatchEvent(new window.Event('input',{bubbles:true}));click('[data-action="lesson-learn"]');assert.ok(document.querySelector('.learning-intro'));click('[data-action="lesson-final"]');assert.equal(find('#code').value,'Console.WriteLine("Keep my idea");');checks++;
click('[data-action="map"]');click('[data-action="adults"]');assert.ok(text().includes('Little tests'));checks++;
console.log({checks,missions:30,quickChecks:90,environment:'DOM integration: teaching, feedback, final entry, lazy runtime, profiles and saved code; no device/layout claim'});
