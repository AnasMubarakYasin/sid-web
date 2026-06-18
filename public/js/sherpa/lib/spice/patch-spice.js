import fs from"fs";const inputFile="./spice.js";const outputFile="./spice-patched.js";let code=fs.readFileSync(inputFile,"utf8");code=code.replace('result=window.prompt("Input: ")',"result=getInput()");code=code.replace(/var _emscripten_sleep=ms=>Asyncify\.handleSleep\(wakeUp=>safeSetTimeout\(wakeUp,ms\)\)/,"var _emscripten_sleep=ms=>handleThings()");code=code.replace("if(globalThis.window?.prompt){","if(true){");const exportMatch=code.match(/return moduleRtn\s*}\s*export default Module/);if(exportMatch){const insertPoint=code.indexOf(exportMatch[0]);const hooks=`
// PhET/EEsim hooks
var getInput = () => ' ';
Module["setGetInput"] = function(f) { getInput = f; };

var handleThings = () => {};
Module["setHandleThings"] = function(f) { handleThings = f; };

Module["runThings"] = function() { callMain(arguments_); };

`;code=code.slice(0,insertPoint)+hooks+code.slice(insertPoint)}fs.writeFileSync(outputFile,code,"utf8");console.log(`Patched ${inputFile} -> ${outputFile}`);