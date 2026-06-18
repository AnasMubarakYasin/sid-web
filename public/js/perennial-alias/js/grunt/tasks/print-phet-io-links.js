import getPhetioLinks from"../../common/getPhetioLinks.js";(async()=>{const phetioLinks=await getPhetioLinks();console.log("Latest Links:");console.log(`
${phetioLinks.join("\n")}`)})();