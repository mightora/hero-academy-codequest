import {makeBridge,LIMITS} from './world.js';
export const block=(op,arg,body=[],otherwise=[])=>({op,...(arg===undefined?{}:{arg}),...(body.length?{body}:{}),...(otherwise.length?{otherwise}:{})});
export function runBlocks(program,config){
  const bridge=makeBridge(config),variables={},functions={};let steps=0;
  const val=x=>typeof x==='string'&&x in variables?variables[x]:x;
  const trace=x=>bridge.trace(x);
  function run(nodes,depth=0){
    if(depth>12)throw Error('That repeat is inside too many repeats.');
    for(const n of nodes){
      if(++steps>LIMITS.commands*3)throw Error('Try fewer repeated instructions.');
      switch(n.op){
        case 'repeat': trace('loop');for(let i=0;i<Math.min(20,Number(val(n.arg)));i++)run(n.body??[],depth+1);break;
        case 'set': trace('variable');variables.power=Number(n.arg);bridge.command('store',[variables.power]);break;
        case 'add': trace('variable');variables.power=(variables.power??0)+Number(n.arg);bridge.command('store',[variables.power]);break;
        case 'if':case 'ifelse': {
          trace('condition');if(n.op==='ifelse')trace('else');
          let ok=n.arg==='clear'?bridge.sense('sensor')==='clear':(variables.power??bridge.sense('energy'))>=Number(n.arg);
          run(ok?(n.body??[]):(n.otherwise??[]),depth+1);break;
        }
        case 'define':functions.repair=n.body??[];break;
        case 'call': if(!functions.repair)throw Error('Make a repair instruction first.');trace('function');run(functions.repair,depth+1);break;
        default:bridge.command(n.op,n.op==='gate'?[n.arg===true]:n.arg===undefined?[]:[val(n.arg)]);
      }
    }
  }
  try{run(program);return {...bridge.result(),error:''};}catch(e){return {...bridge.result(),error:e.message};}
}
export function pseudocode(nodes,depth=0){
  return nodes.flatMap(n=>{
    let line=({set:`store power = ${n.arg}`,add:`change power by ${n.arg}`,repeat:`repeat ${n.arg} times`,if:`if power is at least ${n.arg}`,ifelse:'if sensor is clear',define:'define repair',call:'use repair',gate:'open gate',open_bridge:'open bridge'})[n.op]??`${n.op.replaceAll('_',' ')}${n.arg!==undefined?' '+n.arg:''}`;
    const lines=['    '.repeat(depth)+line];
    if(n.body)lines.push(...pseudocode(n.body,depth+1));
    if(n.otherwise)lines.push('    '.repeat(depth)+'otherwise',...pseudocode(n.otherwise,depth+1));return lines;
  });
}
export const BLOCK_LABELS={move:'Move',brace:'Supports',build:'Deck',open_bridge:'Open bridge',repeat:'Repeat',set:'Store power',add:'Add power',collect:'Collect',if:'If power ≥',ifelse:'If path clear',gate:'Open gate',route:'Take route',define:'Make repair',call:'Use repair',repair:'Repair'};
