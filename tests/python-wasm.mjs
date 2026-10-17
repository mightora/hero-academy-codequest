import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {loadPyodide} from '../dist/runtimes/python/pyodide.mjs';
import {challenge} from '../dist/levels.js';
import {makeBridge,assess} from '../dist/world.js';
const start=performance.now();const py=await loadPyodide({indexURL:new URL('../dist/runtimes/python/',import.meta.url).pathname});
const startup=performance.now()-start;let bridge,output='';
py.registerJsModule('academy_bridge',{command:(op,args,line)=>bridge.command(op,JSON.parse(args),line),sensor:key=>JSON.stringify(bridge.sense(key)),trace:f=>bridge.trace(f),output:text=>{output+=text+'\n';for(let i=0;i<text.length||i===0;i+=240)bridge.command('message',[text.slice(i,i+240)]);}});
py.runPython(await readFile(new URL('../dist/python-runner.py',import.meta.url),'utf8'));
const run=py.globals.get('_run_child');let count=0;
for(let n=11;n<=20;n++)for(let variant=0;variant<4;variant++){
 const c=challenge('P'+n,variant);bridge=makeBridge(c);output='';const error=run(c.example);assert.equal(error,'',`P${n} v${variant}: ${error}`);const a=assess(c,bridge.actions,[...bridge.features]);assert.ok(a.complete,`P${n} v${variant}: ${JSON.stringify(a.missing)} ${a.feedback}`);count++;
}
const alternatives=[['P11','print("Hello, " + "Academy!")'],['P13','panels = 3\ncells = sum([2 for _ in range(panels)])\ngame.supply(cells)'],['P16','for index in range(0, game.count(), 1):\n    game.water(index)'],['P18','def fix(location):\n    game.repair(location)\nfor building in ["bridge", "workshop"]:\n    fix(building)']];
for(const [id,code]of alternatives){const c=challenge(id);bridge=makeBridge(c);const error=run(code);assert.equal(error,'');assert.ok(assess(c,bridge.actions,[...bridge.features]).complete,`${id} alternative failed`);count++;}
bridge=makeBridge(challenge('P11'));assert.match(run('print("hello"'),/SyntaxError/);count++;
bridge=makeBridge(challenge('P16'));run('if False:\n    for plant in range(3):\n        game.water(plant)\ngame.water(0)\ngame.water(1)\ngame.water(2)');assert.equal(assess(challenge('P16'),bridge.actions,[...bridge.features]).complete,false);count++;
bridge=makeBridge(challenge('P11'));assert.match(run('print("x" * 9000)'),/Output limit/);count++;
const report={runtime:py.runPython('import sys; sys.version'),startupMs:Math.round(startup),checks:count,environment:'Node.js CPython WebAssembly; not a browser or physical iPhone'};
await writeFile(new URL('./python-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);
