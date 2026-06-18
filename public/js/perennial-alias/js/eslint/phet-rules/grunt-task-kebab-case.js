/**
 * @fileoverview no-import-from-grunt-tasks
 * Fails if a task in grunt/tasks/ doesn't use kebab case. This is because often these have camelCase counterparts
 * that are imported modules. These kebab-case tasks are just entry points, which hold a thin layer wrapping the module
 * plus option support.
 * @copyright 2024 University of Colorado Boulder
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */const isGruntTaskFileRegex=/[\\/]grunt[\\/]tasks[\\/]?/;const validKebabCase=/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;const path=require("path");const OPT_OUT=["eslint.config.mjs"];module.exports={create:function(context){return{Program:function(node){const filePath=context.filename;const parsed=path.parse(filePath);if(isGruntTaskFileRegex.test(filePath)&&parsed.dir.endsWith("tasks")&&!OPT_OUT.includes(parsed.base)&&!validKebabCase.test(parsed.name)){context.report({node:node,loc:node.loc,message:`files in "grunt/tasks/" must use kebab-case by convention (no snake or camel): ${parsed.base}`})}}}}};module.exports.schema=[];