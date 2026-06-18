import assert from"assert";import fs,{readFileSync}from"fs";import _ from"lodash";import{writeFileAndGitAdd}from"../../../../perennial-alias/js/common/writeFileAndGitAdd.js";import pascalCase from"../../common/pascalCase.js";import getCopyrightLineFromFileContents from"../getCopyrightLineFromFileContents.js";import{replace}from"./modulify.js";const OFF="off";export default(async repo=>{const stringModuleName=`${pascalCase(repo)}Strings`;const relativeStringModuleFile=`js/${stringModuleName}.ts`;await writeFileAndGitAdd(`${repo}/${relativeStringModuleFile}`,(await getStringModuleContents(repo)).content)});export const getStringModuleContents=async repo=>{const packageObject=JSON.parse(readFileSync(`../${repo}/package.json`,"utf8"));const stringModuleName=`${pascalCase(repo)}Strings`;const relativeStringModuleFile=`js/${stringModuleName}.ts`;const stringModuleFileJS=`../${repo}/js/${stringModuleName}.js`;const namespace=_.camelCase(repo);if(fs.existsSync(stringModuleFileJS)){console.log("Found JS string file in TS repo.  It should be deleted manually.  "+stringModuleFileJS)}const copyrightLine=await getCopyrightLineFromFileContents(repo,relativeStringModuleFile);return{content:`${copyrightLine}

/* eslint-disable */
/* @formatter:${OFF} */

/**
 * Auto-generated from modulify, DO NOT manually modify.
 */

import getStringModule from '../../chipper/js/browser/getStringModule.js';
import type LocalizedStringProperty from '../../chipper/js/browser/LocalizedStringProperty.js';
import ${namespace} from './${namespace}.js';

type StringsType = ${getStringTypes(repo)};

const ${stringModuleName} = getStringModule( '${packageObject.phet.requirejsNamespace}' ) as StringsType;

${namespace}.register( '${stringModuleName}', ${stringModuleName} );

export default ${stringModuleName};
`,usedRelativeFiles:[`${repo}/package.json`]}};const getStringTypes=repo=>{const packageObject=JSON.parse(readFileSync(`../${repo}/package.json`,"utf8"));const json=JSON.parse(readFileSync(`../${repo}/${repo}-strings_en.json`,"utf8"));const all=[];const visit=(level,path)=>{Object.keys(level).forEach(key=>{if(key!=="_comment"){if(level[key].value&&typeof level[key].value==="string"){if(!level[key].deprecated){all.push({path:[...path,key],value:level[key].value})}}else{visit(level[key],[...path,key])}}})};visit(json,[]);const structure={};for(let i=0;i<all.length;i++){const allElement=all[i];const path=allElement.path;let level=structure;for(let k=0;k<path.length;k++){const pathElement=path[k];const tokens=pathElement.split(".");for(let m=0;m<tokens.length;m++){const token=tokens[m];assert(!token.includes(";"),`Token ${token} cannot include forbidden characters`);assert(!token.includes(","),`Token ${token} cannot include forbidden characters`);assert(!token.includes(" "),`Token ${token} cannot include forbidden characters`);if(k===path.length-1&&m===tokens.length-1){if(!(packageObject.phet&&packageObject.phet.simFeatures&&packageObject.phet.simFeatures.supportsDynamicLocale)){level[token]="{{STRING}}"}level[`${token}StringProperty`]="{{STRING_PROPERTY}}"}else{level[token]=level[token]||{};level=level[token]}}}}let text=JSON.stringify(structure,null,2);text=replace(text,'"',"'");text=replace(text,"'{{STRING}}'","string");text=replace(text,"'{{STRING_PROPERTY}}'","LocalizedStringProperty");text=replace(text,": string\n",": string;\n");text=replace(text,": LocalizedStringProperty\n",": LocalizedStringProperty;\n");text=replace(text,",",";");return text};