/**
 * @fileoverview Rule to check for missing visibility annotations on method definitions.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2020 University of Colorado Boulder
 */module.exports={create:function(context){const annotations=["@private","@public","@protected"];const exemptMethods=["get","set","constructor"];const filenameLowerCase=context.getFilename().toLowerCase();const isTypeScriptFile=filenameLowerCase.endsWith(".ts")||filenameLowerCase.endsWith(".tsx");return{MethodDefinition:node=>{if(!exemptMethods.includes(node.kind)&&!isTypeScriptFile){let includesAnnotation=false;const commentsBefore=context.getSourceCode().getCommentsBefore(node);for(let i=0;i<commentsBefore.length;i++){if(annotations.some(annotation=>commentsBefore[i].value.includes(annotation))){includesAnnotation=true;break}}if(!includesAnnotation){context.report({node:node,loc:node.loc,message:`${node.key.name}: Missing visibility annotation.`})}}}}}};module.exports.schema=[];