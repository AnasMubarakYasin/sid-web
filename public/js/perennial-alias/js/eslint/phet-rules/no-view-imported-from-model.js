/**
 * @fileoverview no-view-imported-from-model
 * Fails is you import something from /view/ inside a model file with a path like /model/
 * @copyright 2023 University of Colorado Boulder
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */const isModelFileRegex=/[\\/]model[\\/]/;const isViewFileRegex=/[\\/]view[\\/]/;const isModelScreenViewFolder=/[\\/]model[\\/]view[\\/]/;module.exports={create:context=>{const filename=context.getFilename();if(isModelFileRegex.test(filename)&&!isModelScreenViewFolder.test(filename)){return{ImportDeclaration:node=>{const importValue=node.source.value;if(isViewFileRegex.test(importValue)){if(node.importKind!=="type"&&!importValue.endsWith("Colors.js")&&!importValue.endsWith("ModelViewTransform2.js")){context.report({node:node,loc:node.loc,message:`model import statement should not import the view: ${importValue.replace("/..","")}`})}}}}}return{}}};module.exports.schema=[];