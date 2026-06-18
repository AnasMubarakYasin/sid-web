import*as fs from"node:fs";import path from"path";import bundle from"../../../chipper/js/common/bundle.js";import dirname from"../../../perennial-alias/js/common/dirname.js";const __dirname=dirname(import.meta.url);(async()=>{const bundledResult=await bundle(path.join(__dirname,"../../../query-string-machine/js/preload-main.ts"));let bundled=bundledResult.outputFiles[0].text;bundled=bundled.replace(/^[ /]*eslint-disable-(next-)?line.*$\n/gm,"");fs.writeFileSync(path.join(__dirname,"../../../query-string-machine/js/QueryStringMachine.js"),`// Copyright 2025, University of Colorado Boulder
// @author Michael Kauzmann (PhET Interactive Simulations)
// AUTO GENERATED: DO NOT EDIT!!!! See QueryStringMachineModule.ts and chipper/js/scripts/build-qsm.ts
/* eslint-disable */

${bundled}`)})();