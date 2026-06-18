import fs from"fs";import fsPromises from"fs/promises";import _ from"lodash";import path from"path";import{writeFileAndGitAdd}from"../../../../perennial-alias/js/common/writeFileAndGitAdd.js";import grunt from"../../../../perennial-alias/js/npm-dependencies/grunt.js";import{asyncLoadFileAsDataURI}from"../../common/loadFileAsDataURI.js";import pascalCase from"../../common/pascalCase.js";import toLessEscapedString from"../../common/toLessEscapedString.js";import createMipmap from"../createMipmap.js";import generateDevelopmentStrings,{getDevelopmentStringsContents}from"../generateDevelopmentStrings.js";import getCopyrightLineFromFileContents from"../getCopyrightLineFromFileContents.js";import convertStringsYamlToJson,{getJSONFromYamlStrings}from"./convertStringsYamlToJson.js";import createStringModule,{getStringModuleContents}from"./createStringModule.js";import generateFluentTypes,{getFluentTypesFileContent}from"./generateFluentTypes.js";import modulifyFluentFile,{getModulifiedFluentFile}from"./modulifyFluentFile.js";const svgo=require("svgo");const OFF="off";const HEADER="/* eslint-disable */\n/* @formatter:"+OFF+" */\n";const IMAGE_SUFFIXES=[".png",".jpg",".cur",".svg"];const SVG_SUFFIXES=[".svg"];const OTHER_IMAGE_SUFFIXES=IMAGE_SUFFIXES.filter(suffix=>!SVG_SUFFIXES.includes(suffix));const SOUND_SUFFIXES=[".mp3",".wav"];const FLUENT_SUFFIXES=[".ftl"];const IMAGE_DIRECTORIES=["images","phet/images","phet-io/images","adapted-from-phet/images"];const MIPMAP_DIRECTORIES=["mipmaps","phet/mipmaps","phet-io/mipmaps","adapted-from-phet/mipmaps"];const SOUND_DIRECTORIES=["sounds"];const STRING_DIRECTORIES=["strings"];export const replace=(string,search,replacement)=>string.split(search).join(replacement);const expandDots=relativePath=>{relativePath=relativePath.replaceAll("\\","/");const depth=relativePath.split("/").length;let parentDirectory="";for(let i=0;i<depth;i++){parentDirectory=`${parentDirectory}../`}return parentDirectory};const getModulifiedImage=async(repo,relativePath)=>{const abspath=path.resolve(`../${repo}`,relativePath);const dataURI=await asyncLoadFileAsDataURI(abspath);return{content:`${HEADER}
import asyncLoader from '${expandDots(relativePath)}phet-core/js/asyncLoader.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = '${dataURI}';
export default image;`,usedRelativeFiles:[relativePath]}};const getModulifiedSVGImage=async(repo,relativePath)=>{const abspath=path.resolve(`../${repo}`,relativePath);const fileContents=await fsPromises.readFile(abspath,"utf-8");if(!fileContents.includes('width="')||!fileContents.includes('height="')){throw new Error(`SVG file ${abspath} does not contain width and height attributes`)}const optimizedContents=svgo.optimize(fileContents,{multipass:true,plugins:[{name:"preset-default",params:{overrides:{removeViewBox:false}}}]}).data;return{content:`${HEADER}
import asyncLoader from '${expandDots(relativePath)}phet-core/js/asyncLoader.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = \`data:image/svg+xml;base64,\${btoa(${toLessEscapedString(optimizedContents)})}\`;
export default image;`,usedRelativeFiles:[relativePath]}};const getModulifiedMipmap=async(repo,relativePath)=>{const config={level:4,quality:98};const abspath=path.resolve(`../${repo}`,relativePath);const mipmapLevels=await createMipmap(abspath,config.level,config.quality);const entries=mipmapLevels.map(({width,height,url})=>`  new MipmapElement( ${width}, ${height}, '${url}' )`);return{content:`${HEADER}
import MipmapElement from '${expandDots(relativePath)}chipper/js/browser/MipmapElement.js';

// The levels in the mipmap. Specify explicit types rather than inferring to assist the type checker, for this boilerplate case.
const mipmaps = [
${entries.join(",\n")}
];

export default mipmaps;`,usedRelativeFiles:[relativePath]}};const getModulifiedSound=async(repo,relativePath)=>{const abspath=path.resolve(`../${repo}`,relativePath);const dataURI=await asyncLoadFileAsDataURI(abspath);return{content:`${HEADER}
import asyncLoader from '${expandDots(relativePath)}phet-core/js/asyncLoader.js';
import base64SoundToByteArray from '${expandDots(relativePath)}tambo/js/base64SoundToByteArray.js';
import WrappedAudioBuffer from '${expandDots(relativePath)}tambo/js/WrappedAudioBuffer.js';
import phetAudioContext from '${expandDots(relativePath)}tambo/js/phetAudioContext.js';

const soundURI = '${dataURI}';
const soundByteArray = base64SoundToByteArray( phetAudioContext, soundURI );
const unlock = asyncLoader.createLock( soundURI );
const wrappedAudioBuffer = new WrappedAudioBuffer();

// safe way to unlock
let unlocked = false;
const safeUnlock = () => {
  if ( !unlocked ) {
    unlock();
    unlocked = true;
  }
};

const onDecodeSuccess = decodedAudio => {
  if ( wrappedAudioBuffer.audioBufferProperty.value === null ) {
    wrappedAudioBuffer.audioBufferProperty.set( decodedAudio );
    safeUnlock();
  }
};
const onDecodeError = decodeError => {
  console.warn( 'decode of audio data failed, using stubbed sound, error: ' + decodeError );
  wrappedAudioBuffer.audioBufferProperty.set( phetAudioContext.createBuffer( 1, 1, phetAudioContext.sampleRate ) );
  safeUnlock();
};
const decodePromise = phetAudioContext.decodeAudioData( soundByteArray.buffer, onDecodeSuccess, onDecodeError );
if ( decodePromise ) {
  decodePromise
    .then( decodedAudio => {
      if ( wrappedAudioBuffer.audioBufferProperty.value === null ) {
        wrappedAudioBuffer.audioBufferProperty.set( decodedAudio );
        safeUnlock();
      }
    } )
    .catch( e => {
      console.warn( 'promise rejection caught for audio decode, error = ' + e );
      safeUnlock();
    } );
}
export default wrappedAudioBuffer;`,usedRelativeFiles:[relativePath]}};const getImageModule=async(repo,supportedRegionsAndCultures)=>{const spec=JSON.parse(await fsPromises.readFile(`../${repo}/${repo}-images.json`,"utf8"));const namespace=_.camelCase(repo);const imageModuleName=`${pascalCase(repo)}Images`;const relativeImageModuleFile=`js/${imageModuleName}.ts`;const providedRegionsAndCultures=Object.keys(spec);supportedRegionsAndCultures.forEach(regionAndCulture=>{if(!providedRegionsAndCultures.includes(regionAndCulture)){throw new Error(`regionAndCulture '${regionAndCulture}' is required, but not found in ${repo}-images.json`)}});providedRegionsAndCultures.forEach(regionAndCulture=>{if(!supportedRegionsAndCultures.includes(regionAndCulture)){throw new Error(`regionAndCulture '${regionAndCulture}' is not supported, but found in ${repo}-images.json`)}});const imageNames=_.uniq(providedRegionsAndCultures.flatMap(regionAndCulture=>{return Object.keys(spec[regionAndCulture])})).sort();const imageFiles=_.uniq(providedRegionsAndCultures.flatMap(regionAndCulture=>{return Object.values(spec[regionAndCulture])})).sort();imageFiles.forEach(imageFile=>{if(!fs.existsSync(`../${repo}/${imageFile}`)){throw new Error(`Image file ${imageFile} is referenced in ${repo}-images.json, but does not exist`)}});providedRegionsAndCultures.forEach(regionAndCulture=>{imageNames.forEach(imageName=>{if(!spec[regionAndCulture].hasOwnProperty(imageName)){throw new Error(`Image name ${imageName} is not provided for regionAndCulture ${regionAndCulture} (but provided for others)`)}})});const getImportName=imageFile=>path.basename(imageFile,path.extname(imageFile));if(_.uniq(imageFiles.map(getImportName)).length!==imageFiles.length){const importNames=imageFiles.map(getImportName);const duplicates=importNames.filter((name,index)=>importNames.indexOf(name)!==index);if(duplicates.length){const firstDuplicate=duplicates[0];const originalNames=imageFiles.filter(imageFile=>getImportName(imageFile)===firstDuplicate);throw new Error(`Multiple images result in the same import name ${firstDuplicate}: ${originalNames.join(", ")}`)}}const copyrightLine=await getCopyrightLineFromFileContents(repo,relativeImageModuleFile);return{content:`${copyrightLine}
/* eslint-disable */
/* @formatter:${OFF} */
/**
 * Auto-generated from modulify, DO NOT manually modify.
 */
 
import LocalizedImageProperty from '../../joist/js/i18n/LocalizedImageProperty.js';
import ${namespace} from './${namespace}.js';
${imageFiles.map(imageFile=>`import ${getImportName(imageFile)} from '../${imageFile.replace(".ts",".js")}';`).join("\n")}

const ${imageModuleName} = {
  ${imageNames.map(imageName=>`${imageName}ImageProperty: new LocalizedImageProperty( '${imageName}', {
    ${supportedRegionsAndCultures.map(regionAndCulture=>`${regionAndCulture}: ${getImportName(spec[regionAndCulture][imageName])}`).join(",\n    ")}
  } )`).join(",\n  ")}
};

${namespace}.register( '${imageModuleName}', ${imageModuleName} );

export default ${imageModuleName};
`,usedRelativeFiles:[`${repo}/${repo}-images.json`,`${repo}/package.json`]}};const modulifyImage=async(repo,relativePath)=>{const contents=(await getModulifiedImage(repo,relativePath)).content;const tsFilename=convertSuffix(relativePath,".ts");await writeFileAndGitAdd(`${repo}/${tsFilename}`,contents)};const modulifySVG=async(repo,relativePath)=>{const contents=(await getModulifiedSVGImage(repo,relativePath)).content;const tsFilename=convertSuffix(relativePath,".ts");await writeFileAndGitAdd(`${repo}/${tsFilename}`,contents)};const modulifyMipmap=async(repo,relativePath)=>{const contents=(await getModulifiedMipmap(repo,relativePath)).content;const tsFilename=convertSuffix(relativePath,".ts");await writeFileAndGitAdd(`${repo}/${tsFilename}`,contents)};const modulifySound=async(repo,relativePath)=>{const contents=(await getModulifiedSound(repo,relativePath)).content;const jsFilename=convertSuffix(relativePath,".js");await writeFileAndGitAdd(`${repo}/${jsFilename}`,contents)};const convertSuffix=(abspath,suffix)=>{const lastDotIndex=abspath.lastIndexOf(".");return`${abspath.substring(0,lastDotIndex)}_${abspath.substring(lastDotIndex+1)}${suffix}`};const getSuffix=filename=>{const index=filename.lastIndexOf(".");return filename.substring(index)};const createImageModule=async(repo,supportedRegionsAndCultures)=>{const imageModuleName=`${pascalCase(repo)}Images`;const relativeImageModuleFile=`js/${imageModuleName}.ts`;await writeFileAndGitAdd(`${repo}/${relativeImageModuleFile}`,(await getImageModule(repo,supportedRegionsAndCultures)).content)};export default(async(repo,targets)=>{const targetImages=targets===null||targets.includes("images");const targetStrings=targets===null||targets.includes("strings");const targetSounds=targets===null||targets.includes("sounds");console.log(`modulifying ${repo} for targets: ${targets?targets.join(", "):"all"}`);const visitDirectories=async(dirs,suffixes,processor)=>{for(const dir of dirs){const dirPath=`../${repo}/${dir}`;if(fs.existsSync(dirPath)){const paths=[];grunt.file.recurse(dirPath,async abspath=>{if(suffixes.includes(getSuffix(abspath))){paths.push(path.relative(`../${repo}`,abspath))}});for(let i=0;i<paths.length;i++){await processor(repo,paths[i])}}}};targetImages&&await visitDirectories(IMAGE_DIRECTORIES,SVG_SUFFIXES,modulifySVG);targetImages&&await visitDirectories(IMAGE_DIRECTORIES,OTHER_IMAGE_SUFFIXES,modulifyImage);targetImages&&await visitDirectories(MIPMAP_DIRECTORIES,IMAGE_SUFFIXES,modulifyMipmap);targetSounds&&await visitDirectories(SOUND_DIRECTORIES,SOUND_SUFFIXES,modulifySound);targetStrings&&await visitDirectories(STRING_DIRECTORIES,FLUENT_SUFFIXES,modulifyFluentFile);const packageObject=JSON.parse(await fsPromises.readFile(`../${repo}/package.json`,"utf8"));if(targetStrings&&fs.existsSync(`../${repo}/${repo}-strings_en.yaml`)){await convertStringsYamlToJson(repo);await generateFluentTypes(repo)}if(targetStrings&&fs.existsSync(`../${repo}/${repo}-strings_en.json`)&&packageObject.phet&&packageObject.phet.requirejsNamespace){await createStringModule(repo);await generateDevelopmentStrings(repo)}if(targetImages&&fs.existsSync(`../${repo}/${repo}-images.json`)){const supportedRegionsAndCultures=packageObject?.phet?.simFeatures?.supportedRegionsAndCultures;if(!supportedRegionsAndCultures){throw new Error(`supportedRegionsAndCultures is not defined in package.json, but ${repo}-images.json exists`)}if(!supportedRegionsAndCultures.includes("usa")){throw new Error("regionAndCulture 'usa' is required, but not found in supportedRegionsAndCultures")}if(supportedRegionsAndCultures.includes("multi")&&supportedRegionsAndCultures.length<3){throw new Error("regionAndCulture 'multi' is supported, but there are not enough regionAndCultures to support it")}const concreteRegionsAndCultures=supportedRegionsAndCultures.filter(regionAndCulture=>regionAndCulture!=="random");await createImageModule(repo,concreteRegionsAndCultures)}});export const getModulifiedFileString=async relativePath=>{const repo=relativePath.split("/")[0];const repoRelativePath=path.relative(`${repo}/`,relativePath);const pathWithSuffix=(suffix,codeSuffix)=>{const nonDotSuffix=suffix.substring(1);return repoRelativePath.replace(`_${nonDotSuffix}${codeSuffix}`,suffix)};for(const dir of IMAGE_DIRECTORIES){if(relativePath.startsWith(`${repo}/${dir}/`)){const imageSuffix=`.${relativePath.match(/_(\w+)\.ts$/)?.[1]??""}`;if(SVG_SUFFIXES.includes(imageSuffix)){return getModulifiedSVGImage(repo,pathWithSuffix(imageSuffix,".ts"))}else if(OTHER_IMAGE_SUFFIXES.includes(imageSuffix)){return getModulifiedImage(repo,pathWithSuffix(imageSuffix,".ts"))}}}for(const dir of MIPMAP_DIRECTORIES){if(relativePath.startsWith(`${repo}/${dir}/`)){const mipmapSuffix=`.${relativePath.match(/_(\w+)\.ts$/)?.[1]??""}`;if(IMAGE_SUFFIXES.includes(mipmapSuffix)){return getModulifiedMipmap(repo,pathWithSuffix(mipmapSuffix,".ts"))}}}for(const dir of SOUND_DIRECTORIES){if(relativePath.startsWith(`${repo}/${dir}/`)){const soundSuffix=`.${relativePath.match(/_(\w+)\.js$/)?.[1]??""}`;if(SOUND_SUFFIXES.includes(soundSuffix)){return getModulifiedSound(repo,pathWithSuffix(soundSuffix,".js"))}}}if(relativePath.startsWith(`${repo}/js/strings/`)&&relativePath.endsWith("Messages.ts")){return getModulifiedFluentFile(repo,`strings/${path.basename(relativePath.replace(/Messages\.ts$/,""))}_en.ftl`)}const getEnglishStringsModulifiedFile=async requestedRepo=>{const usedRelativeFiles=[`${requestedRepo}/${requestedRepo}-strings_en.yaml`,`${requestedRepo}/${requestedRepo}-strings_en.json`];if(fs.existsSync(`../${requestedRepo}/${requestedRepo}-strings_en.yaml`)){return{content:await getJSONFromYamlStrings(requestedRepo),usedRelativeFiles:usedRelativeFiles}}else{return{content:await fsPromises.readFile(`../${requestedRepo}/${requestedRepo}-strings_en.json`,"utf8"),usedRelativeFiles:usedRelativeFiles}}};if(relativePath===`${repo}/${repo}-strings_en.json`&&fs.existsSync(`../${repo}/${repo}-strings_en.yaml`)){return getEnglishStringsModulifiedFile(repo)}if(relativePath===`${repo}/js/${_.camelCase(repo)}Strings.js`){return getStringModuleContents(repo)}if(relativePath.startsWith("babel/_generated_development_strings/")&&relativePath.endsWith("_all.json")){const requestedRepo=path.basename(relativePath).split("_")[0];return getDevelopmentStringsContents(requestedRepo,await getEnglishStringsModulifiedFile(requestedRepo))}if(relativePath===`${repo}/js/${pascalCase(repo)}Images.ts`){const packageObject=JSON.parse(await fsPromises.readFile(`../${repo}/package.json`,"utf8"));const supportedRegionsAndCultures=packageObject?.phet?.simFeatures?.supportedRegionsAndCultures;const concreteRegionsAndCultures=supportedRegionsAndCultures.filter(regionAndCulture=>regionAndCulture!=="random");return getImageModule(repo,concreteRegionsAndCultures)}if(relativePath===`${repo}/js/${pascalCase(repo)}Fluent.ts`){return getFluentTypesFileContent(repo)}return null};