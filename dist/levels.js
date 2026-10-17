import {block as b} from './blocks.js';
export const PATHS={foundation:{name:'First steps',island:'Workshop Island',tag:'Blocks · 1–10',colour:'#126B62',intro:'Start here. Help Pip find the missing instructions.'},python:{name:'Python',island:'Wildwood Island',tag:'Python · P11–P20',colour:'#91661E',intro:'Grow gardens, guide deliveries and restore a district.'},csharp:{name:'C#',island:'Beacon Island',tag:'C# · C11–C20',colour:'#61519A',intro:'Bring the lifts, signal towers and robot workshop to life.'}};
const foundations=[
 ['First little step','Instructions','Give Pip one instruction.','route'],
 ['Home for a charge','Sequence','Put the moves in order.','route'],
 ['The little bridge','Order matters','Supports. Deck. Then open.','bridge'],
 ['A muddled trail','Debugging','Swap the muddled move.','route'],
 ['Stepping stones','Repetition','Repeat a move to cross.','route'],
 ['Pocket power','Variables','Store power. Then add more.','cells'],
 ['The power gate','Conditions','Check the power. Open the gate.','gate'],
 ['Which way, Pip?','If/else','Let the sensor choose a route.','branch'],
 ['A handy repair','Functions','Make repair. Use it twice.','repair'],
 ['Workshop wake-up','Foundation mission','Bring the workshop back to life.','workshop']
];
const python=[
 ['Hello, Academy!','Output and basic syntax','Print the beacon’s message.','message'],
 ['Meet your robot','Variables and values','Give the robot a name and energy.','robot'],
 ['Supplies for the bridge','Arithmetic','Calculate the repair supplies.','arithmetic'],
 ['Enough power?','Comparisons and booleans','Compare the power. Open the gate.','gate'],
 ['Special delivery','If/elif/else','Send the parcel to its building.','branch'],
 ['A thirsty garden','For loops and range','Water every plant with a loop.','garden'],
 ['Beacon at sunrise','While loops','Charge until the beacon is ready.','beacon'],
 ['Repair crew','Functions and parameters','Make one function for two repairs.','repair'],
 ['The delivery list','Lists and iteration','Deliver everything on the list.','delivery'],
 ['Wildwood restored','Python final mission','Charge, check and repair the district.','district']
];
const csharp=[
 ['Hello, Academy!','Output and statements','Write the beacon’s message.','message'],
 ['Built for adventure','Variables and types','Name, energy and ready.','robot'],
 ['Repair supplies','Arithmetic','Calculate supplies and energy left.','arithmetic'],
 ['Lift off!','Comparisons and booleans','Check power. Lift to the right floor.','lift'],
 ['The rescue route','If/else','Choose a route using the sensor.','branch'],
 ['A line of lights','For loops','Light every signal with a loop.','signals'],
 ['Beacon at sunrise','While loops','Charge until the beacon is ready.','beacon'],
 ['The repair method','Methods and parameters','One method. Two different repairs.','repair'],
 ['Delivery day','Collections and foreach','Deliver everything in the collection.','delivery'],
 ['Robot builders','C# final mission','Build a robot class. Restore the district.','district']
];
export const LEVELS=[...foundations.map((x,i)=>entry(x,'foundation',i+1)),...python.map((x,i)=>entry(x,'python',i+11)),...csharp.map((x,i)=>entry(x,'csharp',i+11))];
function entry(x,path,n){return {id:path==='foundation'?`F${n}`:`${path==='python'?'P':'C'}${n}`,path,n,title:x[0],concept:x[1],task:x[2],kind:x[3]};}
export function levelById(id){return LEVELS.find(x=>x.id===id);}
export function nextLevel(id){const l=levelById(id);return l.n===10?'branch':l.n===20?'map':l.path==='foundation'?`F${l.n+1}`:`${l.path==='python'?'P':'C'}${l.n+1}`;}
export function challenge(id,variant=0){
 const l=levelById(id);if(!l)throw Error('Unknown level');const v=((variant%4)+4)%4;
 const c={...l,variant:v,seed:v,kind:l.kind,start:[0,2],leftX:[1,2,1,2][v],rightX:[6,7,7,6][v],blocked:[],requires:[],retry:'Look at Pip’s goal. Change a step and try again.'};
 let example='',starter='',partial='',clue='',explanation='';let palette=[],initial=[];
 const n=3+v,need=5+v;
 const move=d=>b('move',d),rep=(k,body)=>b('repeat',k,body);
 if(l.path==='foundation'){
  switch(l.n){
   case 1: {const d=['right','left','up','down'][v],delta={right:[1,0],left:[-1,0],up:[0,-1],down:[0,1]}[d];c.start=[3,2];c.goal=[3+delta[0],2+delta[1]];example=[move(d)];palette=['right','left','up','down'].map(move);clue='Pip is one space from the golden charger.';explanation=`An instruction tells Pip one thing to do. Tap Move ${d}, then Run.`;break;}
   case 2:c.goal=[2+v,1];c.blocked=[[0,1]];example=[...Array(2+v).fill(0).map(()=>move('right')),move('up')];palette=[move('right'),move('up'),move('left'),move('down')];clue='Follow the sandy path to the charger.';explanation='A sequence runs from top to bottom. Move right along the path before going up.';break;
   case 3: c.bridgeX=240+v*22;example=[b('brace'),b('build'),b('open_bridge')];palette=[b('brace'),b('build'),b('open_bridge')];palette=[...palette.slice(v%3),...palette.slice(0,v%3)];clue='Look under the bridge. What holds it up?';explanation='The order matters. Supports hold a deck. A finished deck makes the bridge safe to open.';break;
   case 4:c.goal=[2+v,2];initial=[...Array(2+v).fill(0).map((_,i)=>move(i===1?'down':'right'))];example=Array(2+v).fill(0).map(()=>move('right'));palette=[move('right'),move('up'),move('down')];clue='One arrow points away from the charger.';explanation='A bug is a muddled instruction. Remove the down arrow and put a right arrow in its place.';break;
   case 5:c.goal=[n,2];c.requires=['loop'];example=[rep(n,[move('right')])];palette=[rep(n,[]),move('right')];clue=`There are ${n} steps to the charger.`;explanation='Repeat uses one instruction several times. Put Move right inside Repeat.';break;
   case 6:c.targetPower=need;c.requires=['variable'];example=[b('set',2),b('add',need-2)];palette=[b('set',2),b('add',need-2),b('add',1)];clue=`The power box needs ${need} cells.`;explanation='A variable keeps a value. Store 2 in power, then add the missing cells.';break;
   case 7:c.targetPower=need;c.initialPower=need;c.requires=['condition'];example=[b('if',need,[b('gate',true)])];palette=[b('if',need),b('gate',true)];clue='The gauge has enough power.';explanation='A condition asks a question. If power is at least the goal, open the gate.';break;
   case 8:c.sensor=v%2?'blocked':'clear';c.expectedRoute=c.sensor==='clear'?'left':'right';c.requires=['condition','else'];example=[b('ifelse','clear',[b('route','left')],[b('route','right')])];palette=[b('ifelse','clear'),b('route','left'),b('route','right')];clue=c.sensor==='clear'?'The left trail is clear.':'A tree blocks the left trail.';explanation='If the left trail is clear, go left. Otherwise go right. Put one route in each choice.';break;
   case 9:c.parts=[['bridge','workshop'],['garden','beacon'],['beacon','bridge'],['workshop','garden']][v];c.requires=['function'];example=[b('define','repair',[b('repair','next')]),b('call'),b('call')];palette=[b('define','repair'),b('repair','next'),b('call')];clue='Both buildings need the same kind of help.';explanation='Make a reusable instruction called repair. Put Repair next inside it. Use repair twice.';break;
   case 10:c.parts=['workshop'];c.stock=n;c.targetPower=n;c.requires=['loop','variable','condition'];example=[b('set',0),rep(n,[b('collect'),b('add',1)]),b('if',n,[b('gate',true),b('repair','workshop')])];palette=[b('set',0),rep(n,[]),b('collect'),b('add',1),b('if',n),b('gate',true),b('repair','workshop')];clue=`Collect ${n} cells. The gate leads to the workshop.`;explanation='Start power at zero. Repeat collecting and adding one. If power is enough, open the gate and repair.';break;
  }
  partial=JSON.parse(JSON.stringify(example.slice(0,1)));if(partial[0]?.body)partial[0].body=[];
  return {...c,example,initial,palette,partial,clue,explanation,goalText:goalText(c)};
 }
 const py=l.path==='python';const k=l.n;
 switch(k){
  case 11:
   c.phrase=['Hello, Academy!','Pip is ready!','Beacon online!','We can help!'][v];
   example=py?`print("${c.phrase}")`:`Console.WriteLine("${c.phrase}");`;
   starter=py?'# Put your message between the quotes.\nprint("")':'// Put your message between the quotes.\nConsole.WriteLine("");';
   clue='The beacon shows what your program prints.';explanation=py?'print() sends text to the output. Put text inside quotes and brackets.':'Console.WriteLine() sends text to the output. Use quotes, brackets and a semicolon.';break;
  case 12:
   c.expectedName=['Pip','Moss','Nova','Fern'][v];c.expectedEnergy=need;c.requires=py?['variable']:['variable','types'];
   example=py?`name = "${c.expectedName}"\nenergy = ${need}\nready = True\ngame.robot(name, energy, ready)`:`string name = "${c.expectedName}";\nint energy = ${need};\nbool ready = true;\nGame.Robot(name, energy, ready);`;
   starter=py?'name = ""\nenergy = 0\nready = False\ngame.robot(name, energy, ready)':'string name = "";\nint energy = 0;\nbool ready = false;\nGame.Robot(name, energy, ready);';
   clue='Look at the name badge, power cells and ready tick.';explanation=py?'Keep text, numbers and True in named variables, then give the values to game.robot().':'string stores text, int stores a whole number, bool stores true or false. Give all three values to Game.Robot().';break;
  case 13:
   c.panels=n;c.perPanel=2+v%2;c.expectedSupplies=n*c.perPanel;c.expectedEnergy=20-c.expectedSupplies;c.checkEnergy=!py;c.requires=['arithmetic','variable'];
   example=py?`panels = ${n}\ncells_each = ${c.perPanel}\nsupplies = panels * cells_each\ngame.supply(supplies)`:`int panels = ${n};\nint cellsEach = ${c.perPanel};\nint supplies = panels * cellsEach;\nint remaining = 20 - supplies;\nGame.Supply(supplies);\nGame.Robot("Pip", remaining, true);`;
   starter=py?`panels = ${n}\ncells_each = ${c.perPanel}\n# Calculate supplies, then send them.\nsupplies = 0\ngame.supply(supplies)`:`int panels = ${n};\nint cellsEach = ${c.perPanel};\nint supplies = 0;\nint remaining = 0;\nGame.Supply(supplies);\nGame.Robot("Pip", remaining, true);`;
   clue=`${n} panels. ${c.perPanel} cells for each.`;explanation='Multiply panels by cells for each panel. In C#, subtract the supplies from 20 to find the remaining energy.';break;
  case 14:
   c.targetPower=need;c.initialPower=need+v%2;c.targetFloor=1+v;c.requires=['comparison'];
   example=py?'enough = game.energy() >= game.needed()\ngame.gate(enough)':`bool enough = Game.Energy() >= Game.Needed();\nGame.Lift(${c.targetFloor}, enough);`;
   starter=py?'# Compare the energy with the amount needed.\nenough = False\ngame.gate(enough)':`// Compare energy with the amount needed.\nbool enough = false;\nGame.Lift(${c.targetFloor}, enough);`;
   clue='The ≥ symbol means “at least”.';explanation='A comparison makes a boolean value. Compare the energy sensor to the needed sensor, then use that answer.';break;
  case 15:
   c.destination=['hospital','school','workshop','hospital'][v];c.sensor=v%2?'blocked':'clear';c.expectedRoute=py?c.destination:(c.sensor==='clear'?'left':'right');c.requires=['condition','else'];
   example=py?'destination = game.destination()\nif destination == "hospital":\n    game.route("hospital")\nelif destination == "school":\n    game.route("school")\nelse:\n    game.route("workshop")':'if (Game.Sensor() == "clear")\n{\n    Game.Route("left");\n}\nelse\n{\n    Game.Route("right");\n}';
   starter=py?'destination = game.destination()\n# Use if, elif and else to choose.\ngame.route("workshop")':'// If the left route is clear, use it. Otherwise go right.\nGame.Route("left");';
   clue=py?`The parcel label says ${c.destination}.`:`The left route is ${c.sensor}.`;explanation=py?'Test the hospital first, the school with elif, then the workshop with else. Indent each chosen action.':'An if chooses one branch. An else chooses the other. Use == to compare the sensor text.';break;
  case 16:
   c.count=n;c.start=[0,3];c.requires=['loop','for'];
   example=py?'for plant in range(game.count()):\n    game.water(plant)':'for (int light = 0; light < Game.Count(); light++)\n{\n    Game.Light(light);\n}';
   starter=py?'# Start counting at 0. Water every plant.\ngame.water(0)':'// Count from 0 to Game.Count() - 1.\nGame.Light(0);';
   clue=`The row has ${n} places, numbered 0 to ${n-1}.`;explanation=py?'range(count) gives 0 up to count minus 1. A for loop repeats the indented watering action.':'A for loop starts at 0, checks the end, and adds 1 each time. Light the signal using the loop variable.';break;
  case 17:
   c.targetPower=need;c.initialPower=v;c.requires=['loop','while'];
   example=py?'while game.energy() < game.needed():\n    game.charge(1)':'while (Game.Energy() < Game.Needed())\n{\n    Game.Charge(1);\n}';
   starter=py?'# Keep charging while the beacon needs power.\ngame.charge(1)':'// Keep charging while the beacon needs power.\nGame.Charge(1);';
   clue=`The gauge starts at ${v}. It needs ${need}.`;explanation='A while loop checks its question before each turn. Charging changes the energy so the loop can finish.';break;
  case 18:
   c.parts=[['bridge','workshop'],['garden','beacon'],['beacon','bridge'],['workshop','garden']][v];c.requires=['function','parameter'];
   example=py?`def repair(place):\n    game.repair(place)\n\nrepair("${c.parts[0]}")\nrepair("${c.parts[1]}")`:`void Repair(string place)\n{\n    Game.Repair(place);\n}\n\nRepair("${c.parts[0]}");\nRepair("${c.parts[1]}");`;
   starter=py?`# Write a function with a place parameter.\ndef repair(place):\n    pass\n\nrepair("${c.parts[0]}")\nrepair("${c.parts[1]}")`:`// Write a method with a place parameter.\nvoid Repair(string place)\n{\n}\n\nRepair("${c.parts[0]}");\nRepair("${c.parts[1]}");`;
   clue='One repair routine can help two places.';explanation='A parameter carries a different place into the same routine. Define the routine, then call it for each place.';break;
  case 19:
   c.items=[['cells','tools','seeds'],['seeds','tools','cells','seeds'],['tools','cells'],['cells','seeds','tools','cells']][v];c.requires=py?['list','loop']:['list','loop','foreach'];
   example=py?'deliveries = game.delivery_list()\nfor item in deliveries:\n    game.deliver(item)':'string[] deliveries = Game.DeliveryList();\nforeach (string item in deliveries)\n{\n    Game.Deliver(item);\n}';
   starter=py?'deliveries = game.delivery_list()\n# Deliver every item, including repeats.':'string[] deliveries = Game.DeliveryList();\n// Deliver every item, including repeats.';
   clue=`The list has ${c.items.length} parcels. Some may be the same.`;explanation='Keep the whole list in a variable. Visit each item with a loop, delivering each one exactly once.';break;
  case 20:
   c.parts=[['bridge','garden','beacon'],['workshop','bridge','beacon'],['garden','workshop','beacon'],['bridge','workshop','garden']][v];c.targetPower=need;c.initialPower=1;c.requires=py?['loop','variable','condition','function','list']:['class','function','loop','variable','condition'];
   example=py?'def restore(place):\n    if game.energy() >= game.needed():\n        game.repair(place)\n\nwhile game.energy() < game.needed():\n    game.charge(1)\nplaces = game.district()\nfor place in places:\n    restore(place)':`while (Game.Energy() < Game.Needed())\n{\n    Game.Charge(1);\n}\nRobot helper = new Robot("Pip", ${c.parts.length});\nforeach (string place in Game.District())\n{\n    helper.Restore(place);\n}\n\nclass Robot\n{\n    public string Name;\n    public int Energy;\n\n    public Robot(string name, int energy)\n    {\n        Name = name;\n        Energy = energy;\n    }\n\n    public void Restore(string place)\n    {\n        if (Energy > 0)\n        {\n            Game.Repair(place);\n            Energy--;\n        }\n    }\n}`;
   starter=py?'# 1. Write restore(place) with a power check.\ndef restore(place):\n    pass\n\n# 2. Charge with a while loop.\n# 3. Keep game.district() in a list.\n# 4. Call restore for each place.':`// 1. Charge the beacon with a while loop.\n// 2. Make your Robot.\n// 3. Call Restore for each place in Game.District().\n\nclass Robot\n{\n    public string Name;\n    public int Energy;\n\n    public Robot(string name, int energy)\n    {\n        Name = name;\n        Energy = energy;\n    }\n\n    public void Restore(string place)\n    {\n        // If Energy > 0, repair the place and use one energy.\n    }\n}`;
   clue='Power first. Then help every place on the map.';explanation=py?'Use a while loop to charge. Keep the district list, loop through it, and call a repair function that checks the power.':'The supplied Robot outline stores its own name and energy. Fill Restore with a condition and repair. Make a Robot object and use it in a loop.';break;
 }
 partial=k===11?(py?'print("your message")':'Console.WriteLine("your message");'):example.split('\n').slice(0,k===20?5:1).join('\n');
 return {...c,example,starter,partial,clue,explanation,goalText:goalText(c)};
}
export function goalText(c){
 switch(c.kind){
  case 'route':return `Reach the charger${c.n===5?' with Repeat':''}.`;
  case 'bridge':return 'Support → build → open the bridge.';
  case 'cells':return `Store ${c.targetPower} power cells.`;
  case 'gate':return `Open the gate. Power needed: ${c.targetPower}.`;
  case 'branch':return c.path==='python'?`Delivery: ${c.destination}.`:`Sensor: ${c.sensor}. Clear → left. Blocked → right.`;
  case 'repair':return `Repair the ${c.parts.join(' and ')}.`;
  case 'workshop':return `Collect ${c.stock} cells. Open the gate. Repair the workshop.`;
  case 'message':return `Send: “${c.phrase}”`;
  case 'robot':return `${c.expectedName} · energy ${c.expectedEnergy} · ready`;
  case 'arithmetic':return `${c.panels} panels × ${c.perPanel} cells${c.checkEnergy?' · start with 20 energy':''}.`;
  case 'lift':return `Reach floor ${c.targetFloor}. Power needed: ${c.targetPower}.`;
  case 'garden':return `Water all ${c.count} plants.`;
  case 'signals':return `Light all ${c.count} signals.`;
  case 'beacon':return `Charge to ${c.targetPower}.`;
  case 'delivery':return `Deliver: ${c.items.join(', ')}.`;
  case 'district':return `Charge to ${c.targetPower}. Restore ${c.parts.join(', ')}.`;
  default:return 'Try a command. See what happens.';
 }
}
export function sandbox(path='foundation'){
 const c={...challenge(path==='foundation'?'F10':path==='python'?'P20':'C20'),id:`sandbox-${path}`,kind:'sandbox',title:'Pip’s playground',concept:'Explore',task:'Try an idea. See what happens.',requires:[],goalText:'Your ideas belong here.',parts:['bridge','garden','beacon','workshop'],items:['cells','tools','seeds'],count:5,stock:20,targetPower:5};
 if(path==='foundation')c.palette=[...c.palette,b('move','right'),b('move','left'),b('repair','bridge'),b('repair','garden')];
 else c.starter=path==='python'?'# All game commands are available to explore.\nprint("Hello, Pip!")\ngame.move("right")':'// All game commands are available to explore.\nConsole.WriteLine("Hello, Pip!");\nGame.Move("right");';
 return c;
}
