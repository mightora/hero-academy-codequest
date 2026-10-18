import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS} from '../dist/levels.js';
import {LESSONS,CHECK_IDS,lessonFor,learningCount,learningState,choiceOrder} from '../dist/lessons.js';
import {Profiles,validateBackup} from '../dist/profiles.js';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};

test('every mission teaches its concept with a worked example and three explained checks',()=>{
 assert.deepEqual(Object.keys(LESSONS).sort(),LEVELS.map(l=>l.id).sort());
 for(const level of LEVELS){const l=lessonFor(level.id);assert.ok(l.title&&l.idea&&l.connection&&l.example&&l.output);assert.ok(l.notes.length>=2);assert.deepEqual(l.checks.map(c=>c.id),CHECK_IDS);for(const c of l.checks){assert.ok(c.prompt&&c.code);assert.equal(c.options.length,3);assert.equal(new Set(c.options.map(o=>o.text)).size,3);assert.ok(c.options[c.correct]);for(const o of c.options)assert.ok(o.why.length>=15);}}
 assert.equal(lessonFor('sandbox-csharp'),null);
});
test('answer order is stable for a hero and varies the position of the correct answer',()=>{
 const check=lessonFor('F1').checks[0],positions=new Set();for(let i=0;i<30;i++){const seed='hero-'+i,a=choiceOrder(check,seed);assert.deepEqual(a,choiceOrder(check,seed));assert.deepEqual(a.map(o=>o.index).sort(),[0,1,2]);positions.add(a.findIndex(o=>o.index===check.correct));}assert.equal(positions.size,3);
});
test('old backups gain empty learning progress without losing programs, rewards or completions',()=>{
 const p=new Profiles(storage());p.save('C11',{variant:0,code:'Console.WriteLine("Saved");',blocks:[],hintStage:1,exampleUsed:false,baseline:''});p.record('C11',0,{complete:true,goal:true,missing:[]},'hints');const old=JSON.parse(p.export());delete old.players[0].learning;const restored=validateBackup(old);assert.deepEqual(restored.players[0].learning,{});assert.equal(restored.players[0].saved.C11.code,'Console.WriteLine("Saved");');assert.equal(restored.players[0].points,100);assert.equal(restored.players[0].completed.C11.support,'hints');
});
test('quick-check feedback and support are separate from final mission evidence and rewards',()=>{
 const p=new Profiles(storage());p.answer('F1','predict',1,false);p.answer('F1','predict',0,true);p.answer('F1','complete',0,true,true);assert.equal(learningCount(p.current,'F1'),2);assert.equal(p.current.learning.F1.answers.predict.attempts,2);assert.equal(p.current.learning.F1.answers.complete.assisted,true);assert.equal(p.current.points,0);assert.deepEqual(p.current.completed,{});assert.deepEqual(p.current.practice,[]);p.record('F1',0,{complete:true,goal:true,missing:[]},'independent');assert.equal(p.current.completed.F1.support,'independent');assert.equal(p.current.points,100);
});
test('solved checks keep their original assistance record when revisited',()=>{
 const p=new Profiles(storage());p.answer('P12','debug',0,true,true);p.answer('P12','debug',2,false);assert.deepEqual(p.current.learning.P12.answers.debug,{choice:0,solved:true,assisted:true,attempts:1});
});
test('teaching progress, position and final code survive reload, backup and hero switching',()=>{
 const s=storage(),p=new Profiles(s),first=p.current.id;p.lesson('C18',l=>{l.introduced=true;l.index=1;l.stage='check';});p.answer('C18','predict',0,true);p.save('C18',{variant:0,code:'// My own method',blocks:[],hintStage:0,exampleUsed:false,baseline:''});const reload=new Profiles(s);assert.equal(learningState(reload.current,'C18').index,1);p.add('Nova');assert.equal(learningCount(p.current,'C18'),0);assert.deepEqual(p.current.saved,{});p.answer('C18','predict',2,false);p.switch(first);assert.equal(learningCount(p.current,'C18'),1);assert.equal(p.current.saved.C18.code,'// My own method');const restored=new Profiles(storage());restored.restore(p.export());assert.deepEqual(restored.data,p.data);
});
test('malformed learning backups are rejected rather than trusted or executed',()=>{
 const p=new Profiles(storage());for(const learning of [null,[],{Unknown:{stage:'learn',index:0,introduced:false,answers:{}}},{F1:{stage:'check',index:3,introduced:false,answers:{}}},{F1:{stage:'check',index:0,introduced:true,answers:{eval:{choice:0,attempts:1,solved:true,assisted:false}}}},{F1:{stage:'check',index:0,introduced:true,answers:{predict:{choice:0,attempts:-1,solved:true,assisted:false}}}}]){const d=JSON.parse(p.export());d.players[0].learning=learning;assert.throws(()=>validateBackup(d));}assert.throws(()=>p.answer('F1','unknown',0,true));
});
