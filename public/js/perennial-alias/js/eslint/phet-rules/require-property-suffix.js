/**
 * @fileoverview Lint rule to ensure that variable names of type AXON Property end in "Property"
 *
 * We used https://typescript-eslint.io/play/#showAST=es to determine which AST nodes to look for.
 *
 * This is the best documentation I could find for working with the type checker (like using getTypeAtLocation):
 * https://raw.githubusercontent.com/microsoft/TypeScript/main/src/compiler/checker.ts
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @copyright 2022 University of Colorado Boulder
 */const{ESLintUtils}=require("@typescript-eslint/utils");const visit=(context,propertyNode)=>{const parserServices=ESLintUtils.getParserServices(context);const checker=parserServices.program.getTypeChecker();const tsNode=parserServices.esTreeNodeToTSNodeMap.get(propertyNode);const variableType=checker.getTypeAtLocation(tsNode);const typeString=checker.typeToString(variableType).replace(" | undefined","");const isPropertyType=/^\w*Property(<.*>){0,1}$/.test(typeString);if(isPropertyType){const isPropertyNamed=propertyNode.name?.endsWith("Property")||propertyNode.name?.endsWith("PROPERTY")||propertyNode.name==="property"||propertyNode.name==="_property";if(!isPropertyNamed){context.report({message:"Property variable missing Property suffix.",node:propertyNode})}}};module.exports={create:context=>{return{"VariableDeclarator > Identifier":node=>{if(node){visit(context,node)}},PropertyDefinition:node=>{if(node.key){visit(context,node.key)}},TSTypeAliasDeclaration:node=>{if(node.typeAnnotation&&node.typeAnnotation.members){node.typeAnnotation.members.forEach(member=>{if(member.key){visit(context,member.key)}})}}}}};