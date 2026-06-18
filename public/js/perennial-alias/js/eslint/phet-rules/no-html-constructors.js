/**
 * @fileoverview Rule to check that we aren't using native JavaScript constructors.
 * This typically occurs when we forget an import statment for a PhET module that has the same name
 * as a native DOM interface.
 *
 * Using native JavaScript constructors for types like Image, Text, and Range will almost always result in errors
 * that can be difficult to trace. A type can be defined in a file by loading a module or by
 * defining a constructor.
 *
 * This rule works by first traversing down the AST, searching for either variable or function declarations of
 * the types that share a name with a native JavaScript constructor. We then traverse back up the AST searching
 * for nodes that represent instantiation of these types.  An error is thrown when we encounter an instantiation
 * of a type that wasn't declared.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2016-2020 University of Colorado Boulder
 */module.exports={create:function(context){const nativeConstructors=["Image","Range","Text","Node","Event"];const declaredTypes=[];function addDeclaredType(node){if(node.id&&nativeConstructors.indexOf(node.id.name)!==-1){declaredTypes.push(node.id.name)}if(node.specifiers){node.specifiers.forEach(specifier=>{if(specifier.local&&specifier.local.name){if(nativeConstructors.indexOf(specifier.local.name)!==-1){declaredTypes.push(specifier.local.name)}}})}}return{VariableDeclarator:addDeclaredType,FunctionDeclaration:addDeclaredType,ImportDeclaration:addDeclaredType,"NewExpression:exit":function(node){if(node.callee&&node.callee.name&&nativeConstructors.indexOf(node.callee.name)!==-1){const constructorName=node.callee.name;const filename=context.getFilename();const constructorUsedInOwnFile=filename.endsWith(`${constructorName}.ts`);if(!constructorUsedInOwnFile&&declaredTypes.indexOf(constructorName)===-1){context.report({node:node,loc:node.callee.loc,message:`${constructorName}: using native constructor instead of project module, did you forget an import statement?`})}}}}}};module.exports.schema=[];