import fs,{readFileSync}from"fs";import _ from"lodash";import path from"path";import{writeFileAndGitAdd}from"../../../../perennial-alias/js/common/writeFileAndGitAdd.js";import FluentLibrary,{FluentBundle,FluentResource}from"../../browser-and-node/FluentLibrary.js";import getCopyrightLineFromFileContents from"../getCopyrightLineFromFileContents.js";const OFF="off";const readFluentFile=abspath=>{const fileContents=readFileSync(abspath,"utf8");return fileContents.replace(/#.*(\r?\n|$)/g,"")};export const getModulifiedFluentFile=async(repo,relativePath)=>{if(!relativePath.endsWith("_en.ftl")){throw new Error("Only english fluent files can be modulified.")}const usedRelativeFiles=[];const abspath=path.resolve(`../${repo}`,relativePath);const filename=path.basename(abspath);const nameWithoutSuffix=filename.replace("_en.ftl","");const localeToFluentFileContents={};localeToFluentFileContents.en=readFluentFile(abspath);usedRelativeFiles.push(relativePath);const babelPath=`../babel/fluent/${repo}`;let localBabelFiles=[];usedRelativeFiles.push(`babel/fluent/${repo}`);if(fs.existsSync(babelPath)){localBabelFiles=fs.readdirSync(babelPath)}localBabelFiles.forEach(babelFile=>{if(babelFile.startsWith(`${nameWithoutSuffix}_`)){const locale=babelFile.match(/_([^_]+)\.ftl/)[1];if(!locale){throw new Error(`Could not determine locale from ${babelFile}`)}usedRelativeFiles.push(`babel/fluent/${repo}/${babelFile}`);localeToFluentFileContents[locale]=readFluentFile(`${babelPath}/${babelFile}`)}});Object.values(localeToFluentFileContents).forEach(fluentFile=>{FluentLibrary.verifyFluentFile(fluentFile)});const fluentKeys=FluentLibrary.getFluentMessageKeys(localeToFluentFileContents.en);const englishBundle=new FluentBundle("en");englishBundle.addResource(new FluentResource(localeToFluentFileContents.en));let fluentKeysType=`type ${nameWithoutSuffix}FluentType = {`;fluentKeys.forEach(fluentKey=>{const isStringProperty=typeof englishBundle.getMessage(fluentKey).value==="string";fluentKeysType+=`
  '${fluentKey}MessageProperty': ${isStringProperty?"TReadOnlyProperty<string>":"LocalizedMessageProperty"};`});fluentKeysType+="\n};";const modulifiedName=`${nameWithoutSuffix}Messages`;const relativeModulifiedName=`js/strings/${modulifiedName}.ts`;const namespace=_.camelCase(repo);const copyrightLine=await getCopyrightLineFromFileContents(repo,relativeModulifiedName);return{content:`${copyrightLine}
    
/* eslint-disable */
/* @formatter:${OFF} */

/**
 * Auto-generated from modulify, DO NOT manually modify.
 */

import getFluentModule from '../../../chipper/js/browser/getFluentModule.js';
import ${namespace} from '../../js/${namespace}.js';
import LocalizedMessageProperty from '../../../chipper/js/browser/LocalizedMessageProperty.js';
import type { TReadOnlyProperty } from '../../../axon/js/TReadOnlyProperty.js';

${fluentKeysType}

const ${modulifiedName} = getFluentModule( ${JSON.stringify(localeToFluentFileContents,null,2).replaceAll("\\r\\n","\\n")} ) as unknown as ${nameWithoutSuffix}FluentType;

${namespace}.register( '${modulifiedName}', ${modulifiedName} );

export default ${modulifiedName};
`,usedRelativeFiles:usedRelativeFiles}};const modulifyFluentFile=async(repo,relativePath)=>{if(!relativePath.endsWith("_en.ftl")){throw new Error("Only english fluent files can be modulified.")}const abspath=path.resolve(`../${repo}`,relativePath);const filename=path.basename(abspath);const nameWithoutSuffix=filename.replace("_en.ftl","");const modulifiedName=`${nameWithoutSuffix}Messages`;const relativeModulifiedName=`js/strings/${modulifiedName}.ts`;const contents=(await getModulifiedFluentFile(repo,relativePath)).content;await writeFileAndGitAdd(`${repo}/${relativeModulifiedName}`,contents)};export default modulifyFluentFile;