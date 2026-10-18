import {LEVELS} from './levels.js';
const KEY='hero-academy-codequest-v1',ids=new Set(LEVELS.map(l=>l.id));
export const BACKUP_MAX=64*1024*1024;
const suit=['#EC7540','#13786E','#586CCA','#AD4B7F'],emblems=['star','diamond','bolt'];
const copy=x=>JSON.parse(JSON.stringify(x));
const isObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const bounded=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max;
const cleanText=(s,n)=>typeof s==='string'&&s.length<=n&&!/[\u0000-\u0008\u000b-\u001f]/.test(s);
export function newProfile(name='Signal Scout'){
 return {id:crypto.randomUUID(),name:name.trim().slice(0,24)||'Signal Scout',points:0,collectibles:[],completed:{},saved:{},learning:{},rewards:[],practice:[],appearance:{suit:suit[0],emblem:'star',cape:true},settings:{largeText:false,reducedMotion:false},lastPath:'foundation'};
}
export function initialData(){const p=newProfile();return {format:'hero-academy-codequest',version:1,active:p.id,players:[p]};}
function validateBlocks(nodes,depth=0){
 const allowed=['move','brace','build','open_bridge','store','collect','gate','route','repair','set','add','repeat','if','ifelse','define','call'];
 if(!Array.isArray(nodes)||nodes.length>80||depth>12)throw Error('The backup has too many instruction blocks.');
 return nodes.map(n=>{if(!isObject(n)||!allowed.includes(n.op))throw Error('The backup has an unknown instruction.');const o={op:n.op};if('arg'in n){if(!['number','string','boolean'].includes(typeof n.arg)||(typeof n.arg==='number'&&(!Number.isFinite(n.arg)||Math.abs(n.arg)>10000))||(typeof n.arg==='string'&&!cleanText(n.arg,80)))throw Error('The backup has an invalid instruction value.');o.arg=n.arg;}if(n.body)o.body=validateBlocks(n.body,depth+1);if(n.otherwise)o.otherwise=validateBlocks(n.otherwise,depth+1);return o;});
}
const validLevel=id=>ids.has(id)||/^sandbox-(foundation|python|csharp)$/.test(id);
export function validateBackup(input){
 if(typeof input==='string'){if(input.length>BACKUP_MAX)throw Error('That backup is too large.');try{input=JSON.parse(input);}catch{throw Error('Choose a CodeQuest JSON backup.');}}
 if(!isObject(input)||input.format!=='hero-academy-codequest'||input.version!==1||!Array.isArray(input.players)||!input.players.length||input.players.length>20)throw Error('This is not a supported CodeQuest backup.');
 const seen=new Set(),players=input.players.map(p=>{
  if(!isObject(p)||!cleanText(p.id,64)||!/^[\w-]+$/.test(p.id)||seen.has(p.id)||!cleanText(p.name,24)||!p.name.trim()||!bounded(p.points,1e9))throw Error('The backup has an invalid player.');seen.add(p.id);
  const o={id:p.id,name:p.name,points:p.points,appearance:{suit:suit.includes(p.appearance?.suit)?p.appearance.suit:suit[0],emblem:emblems.includes(p.appearance?.emblem)?p.appearance.emblem:'star',cape:p.appearance?.cape!==false},settings:{largeText:p.settings?.largeText===true,reducedMotion:p.settings?.reducedMotion===true},lastPath:['foundation','python','csharp'].includes(p.lastPath)?p.lastPath:'foundation',collectibles:[],rewards:[],completed:{},saved:{},practice:[]};
  o.learning={};
  if(p.learning!==undefined){
   if(!isObject(p.learning)||Object.keys(p.learning).length>30)throw Error('The backup has invalid lesson progress.');
   for(const [id,l] of Object.entries(p.learning)){
    if(!ids.has(id)||!isObject(l)||!['learn','check','challenge'].includes(l.stage)||!bounded(l.index,2)||typeof l.introduced!=='boolean'||!isObject(l.answers)||Object.keys(l.answers).length>3)throw Error('The backup has invalid lesson progress.');
    const record={stage:l.stage,index:l.index,introduced:l.introduced,answers:{}};
    for(const [key,a] of Object.entries(l.answers)){
     if(!['predict','complete','debug'].includes(key)||!isObject(a)||!bounded(a.attempts,10000)||a.attempts<1||!bounded(a.choice,2)||typeof a.solved!=='boolean'||typeof a.assisted!=='boolean')throw Error('The backup has an invalid quick-check record.');
     record.answers[key]={attempts:a.attempts,choice:a.choice,solved:a.solved,assisted:a.assisted};
    }
    o.learning[id]=record;
   }
  }
  for(const field of ['collectibles','rewards']){if(!Array.isArray(p[field])||p[field].length>2000||!p[field].every(x=>cleanText(x,100)))throw Error('The backup has invalid rewards.');o[field]=[...new Set(p[field])];}
  if(!isObject(p.completed)||!isObject(p.saved)||!Array.isArray(p.practice)||p.practice.length>1000)throw Error('The backup has invalid progress.');
  for(const [id,r] of Object.entries(p.completed)){if(!ids.has(id)||!isObject(r)||!['independent','hints','example'].includes(r.support)||!bounded(r.variant,3)||!bounded(r.at,9e15))throw Error('The backup has an invalid completion record.');o.completed[id]={support:r.support,variant:r.variant,at:r.at};}
  for(const [id,s] of Object.entries(p.saved)){
   if(!validLevel(id)||!isObject(s)||!bounded(s.variant,3)||!cleanText(s.code??'',32768)||!bounded(s.hintStage??0,4))throw Error('The backup has invalid saved code.');
   o.saved[id]={variant:s.variant,code:s.code??'',blocks:validateBlocks(s.blocks??[]),hintStage:s.hintStage??0,exampleUsed:s.exampleUsed===true,baseline:cleanText(s.baseline??'',32768)?s.baseline??'':''};
  }
  for(const r of p.practice){if(!isObject(r)||!validLevel(r.level)||!bounded(r.variant,3)||!bounded(r.at,9e15)||!['independent','hints','example'].includes(r.support)||typeof r.complete!=='boolean')throw Error('The backup has an invalid practice record.');o.practice.push({level:r.level,variant:r.variant,at:r.at,support:r.support,complete:r.complete,goal:r.goal===true,concept:r.concept===true});}
  return o;
 });
 if(!seen.has(input.active))throw Error('The backup’s selected player is missing.');
 return {format:'hero-academy-codequest',version:1,active:input.active,players};
}
export class Profiles {
 constructor(storage){this.error='';try{this.storage=storage??globalThis.localStorage;const raw=this.storage.getItem(KEY);this.data=raw?validateBackup(raw):initialData();}catch(e){this.storage=storage??{getItem:()=>null,setItem:()=>{throw Error('Storage unavailable');}};this.error='Saved progress could not be read. Export a backup after this session. '+e.message;this.data=initialData();}}
 get current(){return this.data.players.find(p=>p.id===this.data.active);}
 commit(data){const safe=validateBackup(data);try{this.storage.setItem(KEY,JSON.stringify(safe));this.data=safe;this.error='';return true;}catch(e){this.data=safe;this.error='This browser could not save. Use Export backup before closing.';return false;}}
 update(fn){const data=copy(this.data);fn(data.players.find(p=>p.id===data.active),data);return this.commit(data);}
 add(name){return this.update((_,d)=>{if(d.players.length>=20)throw Error('This device already has 20 heroes. Export a backup to keep them safe.');const p=newProfile(name);d.players.push(p);d.active=p.id;});}
 switch(id){if(!this.data.players.some(p=>p.id===id))return false;return this.update((_,d)=>d.active=id);}
 save(level,saved){return this.update(p=>p.saved[level]=copy(saved));}
 lesson(level,change){if(!ids.has(level))throw Error('Unknown lesson.');return this.update(p=>{p.learning[level]??={stage:'learn',index:0,introduced:false,answers:{}};change(p.learning[level]);});}
 answer(level,check,choice,correct,assisted=false){
  if(!['predict','complete','debug'].includes(check)||!bounded(choice,2)||typeof correct!=='boolean')throw Error('Unknown quick check.');
  return this.lesson(level,l=>{const old=l.answers[check];if(old?.solved)return;l.stage='check';l.answers[check]={attempts:Math.min(10000,(old?.attempts??0)+1),choice,solved:correct,assisted:assisted||old?.assisted===true};});
 }
 reward(key,points,collectible){return this.update(p=>{if(!p.rewards.includes(key)){p.rewards.push(key);p.points+=points;if(collectible&&!p.collectibles.includes(collectible))p.collectibles.push(collectible);}});}
 record(level,variant,result,support){return this.update(p=>{p.practice.push({level,variant,at:Date.now(),complete:result.complete,goal:result.goal,concept:!result.missing?.length,support});p.practice=p.practice.slice(-1000);if(result.complete&&ids.has(level)){const old=p.completed[level],rank={independent:0,hints:1,example:2};if(!old||rank[support]<rank[old.support])p.completed[level]={variant,support,at:Date.now()};const key=`${level}:${variant}`;if(!p.rewards.includes(key)){p.rewards.push(key);p.points+=old?25:100;if(!p.collectibles.includes(level))p.collectibles.push(level);}}});}
 export(){return JSON.stringify({...this.data,exportedAt:new Date().toISOString()},null,2);}
 restore(input){return this.commit(validateBackup(input));}
}
export function progress(p,path){return LEVELS.filter(l=>l.path===path&&p.completed[l.id]).length;}
export function recommend(p){return LEVELS.find(l=>l.path===p.lastPath&&!p.completed[l.id])?.id??(progress(p,'foundation')<10?LEVELS.find(l=>l.path==='foundation'&&!p.completed[l.id])?.id:'branch');}
