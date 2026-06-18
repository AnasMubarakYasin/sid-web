/**
 * @fileoverview Rule to check that import statements are on single lines. Automated tools
 * and processes at PhET assume that imports are on a single line so this is important to enforce.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2020 University of Colorado Boulder
 */module.exports={create:context=>{return{ImportDeclaration:node=>{if(node.loc.start.line!==node.loc.end.line){node.specifiers.forEach(specifier=>{context.report({node:node,loc:node.loc,message:`${specifier.local.name}: import statement should be on a single line.`})})}}}}};module.exports.schema=[];