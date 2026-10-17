import { dotnet } from './_framework/dotnet.js';
const runtime=await dotnet.create();
const exports=await runtime.getAssemblyExports('CodeQuest.Runtime.dll');
console.log(exports.QuestRuntime.Hello());
