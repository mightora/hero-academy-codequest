import {icon,esc,tree} from './scenery.js';
import {robot,hero} from './art.js';
export const ACTIVITIES=[{id:'stars',title:'Star catcher',task:'Catch five golden stars.',icon:'star'},{id:'trail',title:'Robot trail',task:'Explore. Find three treasures.',icon:'map'},{id:'memory',title:'Memory garden',task:'Find the matching pairs.',icon:'plant'},{id:'glider',title:'Sky glider',task:'Glide through six clear gaps.',icon:'cape'}];
export class MemoryGame{
 constructor(random=Math.random,schedule=setTimeout){this.cards=[0,0,1,1,2,2,3,3,4,4,5,5].map((value,id)=>({id,value,matched:false}));for(let i=this.cards.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[this.cards[i],this.cards[j]]=[this.cards[j],this.cards[i]];}this.open=[];this.locked=false;this.schedule=schedule;this.timer=null;this.onchange=()=>{};}
 flip(index){const card=this.cards[index];if(!card||card.matched||this.locked||this.open.includes(index))return;this.open.push(index);if(this.open.length===2){const [a,b]=this.open;if(this.cards[a].value===this.cards[b].value){this.cards[a].matched=this.cards[b].matched=true;this.open=[];}else{this.locked=true;this.timer=this.schedule(()=>{this.open=[];this.locked=false;this.onchange();},3000);}}this.onchange();}
 get done(){return this.cards.every(c=>c.matched);}
 dispose(){clearTimeout(this.timer);this.onchange=()=>{};}
}
export function trailRoute(start,target,blocked=[]){const queue=[[start]],seen=new Set([start.join(',')]);while(queue.length){const route=queue.shift(),[x,y]=route.at(-1);if(x===target[0]&&y===target[1])return route.slice(1);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const p=[x+dx,y+dy],key=p.join(',');if(p[0]<0||p[0]>7||p[1]<0||p[1]>4||seen.has(key)||blocked.some(b=>b.join(',')===key))continue;seen.add(key);queue.push([...route,p]);}}return [];}
export function mountGame(root,id,{appearance,reducedMotion=false,onComplete}){
 const activity=ACTIVITIES.find(x=>x.id===id),abort=new AbortController(),signal=abort.signal;let done=false,raf,timer,hold,dir=0;
 const q=s=>root.querySelector(s),status=text=>{const x=q('.mini-status');if(x)x.textContent=text;};
 function finish(){if(done)return;done=true;cancelAnimationFrame(raf);clearInterval(hold);clearTimeout(timer);onComplete(id);}
 const controls=(vertical=false)=>`<div class="movement" aria-label="Movement controls"><button class="game-control" data-dir="-1" aria-label="${vertical?'Fly up':'Move left'}">${icon(vertical?'up':'left')}</button><button class="game-control" data-dir="1" aria-label="${vertical?'Fly down':'Move right'}">${icon(vertical?'down':'right')}</button></div>`;
 root.innerHTML=`<div class="mini-heading"><span class="eyebrow">Just for fun</span><h1>${esc(activity.title)}</h1><p>${esc(activity.task)}</p></div><div class="mini-stage" tabindex="0" role="group" aria-label="${esc(activity.title)} game"><div class="mini-scene"></div></div><div class="mini-status" role="status"></div><div class="mini-controls"></div>`;
 const stage=q('.mini-stage'),scene=q('.mini-scene'),control=q('.mini-controls');
 function holdButtons(change){root.querySelectorAll('[data-dir]').forEach(button=>{
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);dir=Number(button.dataset.dir);change?.(dir);},{signal});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>dir=0,{signal});
  button.addEventListener('click',e=>{if(e.detail===0){dir=Number(button.dataset.dir);change?.(dir);timer=setTimeout(()=>dir=0,180);}},{signal});
 });}
 if(id==='memory'){
  const memory=new MemoryGame(),symbols=['star','robot','plant','cape','lamp','kit'];
  const draw=()=>{scene.innerHTML=`<div class="memory-grid">${memory.cards.map((c,i)=>{const open=c.matched||memory.open.includes(i);return `<button class="memory-card ${open?'flipped':''} ${c.matched?'matched':''}" data-card="${i}" aria-label="Card ${i+1}${open?', '+symbols[c.value]:', face down'}${c.matched?', matched':''}" aria-pressed="${open}" ${c.matched?'disabled':''}>${icon(open?symbols[c.value]:'plant')}${!open?'<span>?</span>':''}</button>`;}).join('')}</div>`;status(`${memory.cards.filter(c=>c.matched).length/2} / 6 pairs${memory.locked?' · Watch, then try again.':''}`);if(memory.done)finish();};
  memory.onchange=draw;draw();scene.addEventListener('click',e=>{const b=e.target.closest('[data-card]');if(b){const i=Number(b.dataset.card);memory.flip(i);root.querySelector(`[data-card="${i}"]`)?.focus({preventScroll:true});}},{signal});
  control.innerHTML='<p class="quiet">Tap two cards. Unmatched cards turn back after 3 seconds.</p>';
  return ()=>{memory.dispose();abort.abort();};
 }
 if(id==='trail'){
  let pos=[0,2],treasures=[[3,1],[6,3],[2,4]],collected=0,walking=false;
  const blocked=[[2,1],[2,2],[4,3],[5,1],[6,1]];
  const draw=()=>{scene.innerHTML=`<svg viewBox="0 0 640 360" aria-hidden="true"><rect width="640" height="360" rx="20" fill="#CBDCC0"/>${Array.from({length:5},(_,y)=>Array.from({length:8},(_,x)=>`<rect x="${x*76+16}" y="${y*64+15}" width="62" height="52" rx="12" fill="${blocked.some(p=>p[0]===x&&p[1]===y)?'#8CAA83':'#E8DFB9'}"/>`).join('')).join('')}${blocked.map(([x,y])=>tree(x*76+47,y*64+44,.5)).join('')}${treasures.map(([x,y])=>`<path d="m${x*76+47} ${y*64+20} 7 13 15 2-11 10 3 15-14-7-14 7 3-15-11-10 15-2z" fill="#F6D46C" stroke="#91661E" stroke-width="2"/>`).join('')}${robot().replace('<svg ',`<svg x="${pos[0]*76+21}" y="${pos[1]*64-8}" width="58" height="72" `).replace('role="img"','aria-hidden="true"')}</svg><div class="trail-taps">${Array.from({length:40},(_,i)=>`<button data-tile="${i}" aria-label="Walk to column ${i%8}, row ${Math.floor(i/8)}${treasures.some(p=>p[0]===i%8&&p[1]===Math.floor(i/8))?', treasure':''}" ${blocked.some(p=>p[0]===i%8&&p[1]===Math.floor(i/8))?'disabled':''}></button>`).join('')}</div>`;status(`${collected} / 3 treasures · Pip is at ${pos[0]}, ${pos[1]}.`);};
  function move(x,y){if(x<0||x>7||y<0||y>4||blocked.some(p=>p[0]===x&&p[1]===y))return;pos=[x,y];const t=treasures.findIndex(p=>p[0]===x&&p[1]===y);if(t>=0){treasures.splice(t,1);collected++;}draw();if(collected===3)finish();}
  function one(d){const delta=({left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]})[d];if(delta)move(pos[0]+delta[0],pos[1]+delta[1]);}
  control.innerHTML=`<div class="movement trail-movement">${['left','right','up','down'].map(d=>`<button class="game-control" data-walk="${d}" aria-label="Walk ${d}">${icon(d)}</button>`).join('')}</div><p class="quiet">Hold arrows, use your keyboard, or tap a place.</p>`;
  control.querySelectorAll('[data-walk]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);clearInterval(hold);one(b.dataset.walk);hold=setInterval(()=>one(b.dataset.walk),160);},{signal});for(const evt of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(evt,()=>clearInterval(hold),{signal});b.addEventListener('click',e=>{if(e.detail===0)one(b.dataset.walk);},{signal});});
  scene.addEventListener('click',e=>{const b=e.target.closest('[data-tile]');if(!b||walking||done)return;const i=Number(b.dataset.tile),route=trailRoute(pos,[i%8,Math.floor(i/8)],blocked);walking=true;const step=()=>{const p=route.shift();if(!p||done){walking=false;return;}move(...p);timer=setTimeout(step,reducedMotion?70:180);};step();},{signal});
  stage.addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')){e.preventDefault();one(e.key.slice(5).toLowerCase());}},{signal});draw();
  return ()=>{done=true;clearTimeout(timer);clearInterval(hold);abort.abort();};
 }
 let x=320,y=180,starX=180,starY=-20,caught=0,obstacle=650,passed=0,index=0,gap=100,last=0;
 const vertical=id==='glider';
 control.innerHTML=`${controls(vertical)}<label class="movement-track ${vertical?'vertical-track':''}">${vertical?'Height':'Move'}<input type="range" min="${vertical?35:30}" max="${vertical?325:610}" value="${vertical?180:320}" aria-label="${vertical?'Glider height':'Catcher position'}"></label><p class="quiet">Hold the arrows or slide the track.${vertical?'':' You can also tap a star.'}</p>`;
 const range=q('input[type=range]');range.addEventListener('input',()=>{if(vertical)y=Number(range.value);else x=Number(range.value);},{signal});holdButtons();
 stage.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)){e.preventDefault();dir=['ArrowLeft','ArrowUp','a','w'].includes(e.key)?-1:1;}},{signal});
 stage.addEventListener('keyup',()=>dir=0,{signal});stage.addEventListener('blur',()=>dir=0,{signal});
 window.addEventListener('blur',()=>dir=0,{signal});
 function nextStar(){index++;starX=45+(index*137)%550;starY=-25;}
 function catchStar(){if(done)return;caught++;nextStar();status(`${caught} / 5 stars`);if(caught>=5)finish();}
 scene.addEventListener('click',e=>{if(e.target.closest('[data-catch]'))catchStar();},{signal});
 function draw(now){if(done)return;const dt=Math.min((now-(last||now))/1000,.05);last=now;
  if(vertical){
   y=Math.max(35,Math.min(325,y+dir*170*dt));obstacle-=(reducedMotion?70:95)*dt;
   if(obstacle<105&&obstacle>65&&Math.abs(y-gap)>57){obstacle=650;status('Glide through the clear gap. Try again.');}
   if(obstacle<-45){passed++;index++;gap=[100,250,150,90,240,170][index%6];obstacle=650;status(`${passed} / 6 gaps`);if(passed>=6){finish();return;}}
   scene.innerHTML=`<svg viewBox="0 0 640 360" aria-hidden="true"><rect width="640" height="360" rx="20" fill="#BDD7D4"/><circle cx="540" cy="68" r="35" fill="#F6D46C"/><path d="M0 310q130-75 260-20t380-10v80H0Z" fill="#8CAA83"/><g fill="#F8F5EC" opacity=".8"><ellipse cx="130" cy="65" rx="63" ry="15"/><ellipse cx="390" cy="210" rx="45" ry="12"/></g><rect x="${obstacle}" y="0" width="42" height="${Math.max(0,gap-78)}" rx="16" fill="#547762"/><rect x="${obstacle}" y="${gap+78}" width="42" height="${360-gap-78}" rx="16" fill="#547762"/><g transform="translate(100 ${y})"><path d="m-42 0 42-17 42 17-42 12Z" fill="#EF733E" stroke="#14353B" stroke-width="3"/><path d="M0-17v34m-12-3h24" stroke="#14353B" stroke-width="4"/><circle cy="0" r="7" fill="#F6D46C"/></g></svg>`;
  }else{
   x=Math.max(30,Math.min(610,x+dir*270*dt));starY+=(reducedMotion?85:115)*dt;
   if(starY>279&&starY<330&&Math.abs(x-starX)<45){catchStar();if(done)return;}
   if(starY>365)nextStar();
   scene.innerHTML=`<svg viewBox="0 0 640 360" aria-hidden="true"><rect width="640" height="360" rx="20" fill="#DCEADD"/><circle cx="540" cy="68" r="35" fill="#F6D46C"/><path d="M0 305q180-35 350-4t290-5v64H0Z" fill="#8CAA83"/>${tree(60,245,.7)}${tree(580,251,.85)}<g transform="translate(${x} 307)"><path d="m-35-3 7 26h56l7-26" fill="#EF733E" stroke="#14353B" stroke-width="3"/><path d="M-23-4q23-24 46 0" fill="none" stroke="#14353B" stroke-width="4"/></g></svg><button class="falling-star" data-catch aria-label="Catch the falling star" style="left:${starX/640*100}%;top:${starY/360*100}%">${icon('star')}</button>`;
  }
  if(document.activeElement!==range)range.value=String(vertical?y:x);
  raf=requestAnimationFrame(draw);
 }
 status(vertical?'0 / 6 gaps':'0 / 5 stars');raf=requestAnimationFrame(draw);
 return ()=>{done=true;cancelAnimationFrame(raf);clearTimeout(timer);clearInterval(hold);abort.abort();};
}
