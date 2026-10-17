// Pure, shared simulation. The page replays and validates the same commands as the runtime.
export const LIMITS = Object.freeze({code:32768, commands:256, output:8192, runMs:5000, compileMs:30000});
export const DIRECTIONS={right:[1,0],left:[-1,0],up:[0,-1],down:[0,1]};
const clone=x=>JSON.parse(JSON.stringify(x));
export function createWorld(config){
  return {...clone(config),x:config.start?.[0]??0,y:config.start?.[1]??2,steps:0,
    power:config.initialPower??0,robotName:'?',robotEnergy:0,robotReady:false,
    supplies:0,gateOpen:false,bridgeStage:0,route:'',floor:0,message:'',
    watered:[],lit:[],repaired:[],delivered:[],collected:0,events:[],features:[]};
}
export function validateCommand(c){
  if(!c||typeof c!=='object'||typeof c.op!=='string'||!Array.isArray(c.args)||c.args.length>3)throw Error('That game command is not recognised.');
  const arities={move:1,brace:0,build:0,open_bridge:0,store:1,collect:0,gate:1,route:1,water:1,light:1,charge:1,repair:1,deliver:1,supply:1,robot:3,lift:2,message:1};
  if(!(c.op in arities)||c.args.length!==arities[c.op])throw Error('Try a command from Pip’s command guide.');
  for(const a of c.args)if(!['string','number','boolean'].includes(typeof a)||(typeof a==='number'&&(!Number.isFinite(a)||Math.abs(a)>10000))||(typeof a==='string'&&a.length>240))throw Error('Keep game values small: numbers up to 10,000 or short messages.');
  return {op:c.op,args:[...c.args],line:Number.isInteger(c.line)&&c.line>0&&c.line<2000?c.line:0};
}
const integer=(n,min=0,max=100)=>{if(!Number.isInteger(n)||n<min||n>max)throw Error(`Use a whole number from ${min} to ${max}.`);return n;};
const text=(s)=>{if(typeof s!=='string')throw Error('Use text in quotes for this command.');return s;};
export function applyCommand(w,input){
  const c=validateCommand(input),[a,b,d]=c.args;
  if(w.events.length>=LIMITS.commands)throw Error('Pip has enough instructions for one run. Try a shorter program.');
  switch(c.op){
    case 'move': {
      if(!DIRECTIONS[a])throw Error('Choose right, left, up or down.');
      const [dx,dy]=DIRECTIONS[a],x=w.x+dx,y=w.y+dy;
      if(x<0||x>=8||y<0||y>=5||w.blocked?.some(p=>p[0]===x&&p[1]===y))throw Error('There is water in that direction. Try another instruction.');
      w.x=x;w.y=y;w.steps++;break;
    }
    case 'brace': if(w.bridgeStage!==0)throw Error('The supports are already ready.');w.bridgeStage=1;break;
    case 'build': if(w.bridgeStage!==1)throw Error('Add the supports before the bridge deck.');w.bridgeStage=2;break;
    case 'open_bridge': if(w.bridgeStage!==2)throw Error('The bridge needs supports and a deck first.');w.bridgeStage=3;break;
    case 'store': w.power=integer(a);break;
    case 'collect': if(w.collected>=(w.stock??20))throw Error('All the cells have been collected.');w.collected++;break;
    case 'gate':
      if(typeof a!=='boolean')throw Error('The gate needs True/False in Python, or true/false in C#.');
      if(a&&w.power<(w.targetPower??0))throw Error('The gate needs more power first.');w.gateOpen=a;break;
    case 'route': w.route=text(a);w.x=({hospital:2,school:4,workshop:6,left:w.leftX??1,right:w.rightX??6})[a]??w.x;w.y=1;break;
    case 'water': {const i=integer(a,0,7);if(i>=(w.count??8))throw Error('That plant is outside the garden.');if(!w.watered.includes(i))w.watered.push(i);w.x=i;w.y=3;break;}
    case 'light': {const i=integer(a,0,7);if(i>=(w.count??8))throw Error('That signal is outside the row.');if(!w.lit.includes(i))w.lit.push(i);w.x=i;w.y=3;break;}
    case 'charge': w.power=integer(w.power+integer(a,1,10));break;
    case 'repair': {
      const requested=text(a),name=requested==='next'?(w.parts?.find(p=>!w.repaired.includes(p))??''):requested;
      if(!w.parts?.includes(name)&&w.kind!=='sandbox')throw Error('Try a repair shown in the world.');
      if(w.kind==='workshop'&&(!w.gateOpen||w.power<w.targetPower))throw Error('Power the gate before repairing the workshop.');
      if(!w.repaired.includes(name))w.repaired.push(name);w.x=Math.max(0,(w.parts??[]).indexOf(name))*2+1;break;
    }
    case 'deliver': {const name=text(a);if(!w.items?.includes(name)&&w.kind!=='sandbox')throw Error('That item is not on the delivery list.');w.delivered.push(name);w.x=(w.delivered.length*2)%8;break;}
    case 'supply': w.supplies=integer(a,0,1000);break;
    case 'robot': w.robotName=text(a);w.robotEnergy=integer(b);if(typeof d!=='boolean')throw Error('Ready needs a boolean: true or false.');w.robotReady=d;break;
    case 'lift': if(typeof b!=='boolean')throw Error('The lift’s ready value needs to be true or false.');if(b&&w.power<w.targetPower)throw Error('Charge the lift first.');if(b)w.floor=integer(a,0,5);break;
    case 'message': w.message=(w.message+(w.message?'\n':'')+text(a)).slice(-1024);break;
  }
  w.events.push(c);return w;
}
export function sense(w,key){
  switch(key){
    case 'energy':return w.power;
    case 'needed':return w.targetPower??0;
    case 'destination':return w.destination??'workshop';
    case 'sensor':return w.sensor??'clear';
    case 'count':return w.count??4;
    case 'delivery_list':return [...(w.items??['cells','tools','seeds'])];
    case 'district':return [...(w.parts??['bridge','garden','beacon'])];
    default:throw Error('Choose a sensor in Pip’s guide.');
  }
}
export function outcome(w){
  switch(w.kind){
    case 'route':return w.x===w.goal[0]&&w.y===w.goal[1];
    case 'bridge':return w.bridgeStage===3;
    case 'cells':return w.power===w.targetPower;
    case 'gate':return w.gateOpen;
    case 'branch':return w.route===w.expectedRoute;
    case 'repair':case 'district':return w.parts.every(x=>w.repaired.includes(x))&&(w.kind!=='district'||w.power>=w.targetPower);
    case 'workshop':return w.parts.every(x=>w.repaired.includes(x))&&w.gateOpen&&w.power===w.targetPower;
    case 'message':return w.message.includes(w.phrase);
    case 'robot':return w.robotName===w.expectedName&&w.robotEnergy===w.expectedEnergy&&w.robotReady;
    case 'arithmetic':return w.supplies===w.expectedSupplies&&(!w.checkEnergy||w.robotEnergy===w.expectedEnergy);
    case 'lift':return w.floor===w.targetFloor;
    case 'garden':return w.watered.length===w.count;
    case 'beacon':return w.power===w.targetPower;
    case 'signals':return w.lit.length===w.count;
    case 'delivery':return [...w.delivered].sort().join('|')===[...w.items].sort().join('|');
    case 'sandbox':return false;
    default:return false;
  }
}
export function assess(config,actions,features=[]){
  const w=createWorld(config);let error='';
  try{for(const c of actions)applyCommand(w,c);}catch(e){error=e.message;}
  const missing=(config.requires??[]).filter(x=>!features.includes(x));
  const goal=outcome(w);
  return {world:w,goal,missing,error,complete:goal&&!missing.length&&!error,
    feedback:error||(goal?(missing.length?`The world is ready! Now try ${missing.map(featureName).join(' and ')}.`:'You brought the instructions back!'):(config.retry??'Look at the goal, change a step, and try again.'))};
}
export const featureName=x=>({loop:'a repeat or loop',variable:'a variable',condition:'a condition',function:'a function you call',parameter:'a parameter in your routine',list:'a list or collection',class:'a robot class',arithmetic:'a calculation',comparison:'a comparison',while:'a while loop',for:'a for loop',foreach:'a foreach loop',types:'typed variables',else:'an else choice'})[x]??x;
export function makeBridge(config,onCommand=()=>{}){
  const world=createWorld(config),actions=[],features=new Set();
  return {world,actions,features,
    command(op,args,line=0){const c=validateCommand({op,args,line});applyCommand(world,c);actions.push(c);onCommand(c);return null;},
    sense(key){return sense(world,key);},
    trace(feature){if(typeof feature==='string'&&feature.length<24)features.add(feature);},
    result(){return {actions:[...actions],features:[...features]};}
  };
}
