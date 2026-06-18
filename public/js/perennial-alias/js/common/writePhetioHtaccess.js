import{buildLocal}from"./buildLocal.js";import axios from"axios";import fs from"graceful-fs";import winston from"winston";const PASSWORD_PROTECTED_SUB_DIRS=["wrappers","doc"];const htaccessFilename=".htaccess";export const writePhetioHtaccess=async(simName,passwordProtectPath,latestOption)=>{const authFilepath="/etc/httpd/conf/phet-io_pw";const isProductionDeploy=latestOption.isProductionDeploy;const simPackage=JSON.parse(fs.readFileSync(`${latestOption.checkoutDir}/${simName}/package.json`,"utf-8"));const phetioPackage=JSON.parse(fs.readFileSync(`${latestOption.checkoutDir}/phet-io/package.json`,"utf-8"));let commentSymbol="#";const phetioPackageBlock=simPackage?.phet&&simPackage.phet["phet-io"];if(isProductionDeploy&&phetioPackageBlock?.allowPublicAccess){commentSymbol=""}const publicAccessDirective=getPublicAccessDirective(commentSymbol,"allowPublicAccess");const basePasswordProtectContents=`
AuthType Basic
AuthName "PhET-iO Password Protected Area"
AuthUserFile ${authFilepath}
<LimitExcept OPTIONS>
  Require valid-user
</LimitExcept>
`;const passwordProtectWrapperContents=`
${basePasswordProtectContents}

${publicAccessDirective}
`;const cachingDirective=!isProductionDeploy?"":`
# If the request is for a SIM, anything in the /lib or /xhtml dirs, or is the api.json file, then allow it to be cached
<If "-f %{REQUEST_FILENAME} && %{REQUEST_FILENAME} =~ m#(${simName}_all.*\\.html|api\\.json|/lib/.*|/xhtml/.*)$#">
  ExpiresActive on
  ExpiresDefault "access plus 1 day"
  Header append Cache-Control "public"
  Header append Cache-Control "stale-while-revalidate=5184000"
  Header append Cache-Control "stale-if-error=5184000"
</If>
`;const rootHtaccessContent=`<FilesMatch "(index\\.\\w+)$">
${basePasswordProtectContents}</FilesMatch>
      
${cachingDirective}

${publicAccessDirective}
`;try{if(phetioPackage.phet&&phetioPackage.phet.addRootHTAccessFile){for(const subdir of PASSWORD_PROTECTED_SUB_DIRS){const fullSubdirPath=`${passwordProtectPath}/${subdir}`;fs.existsSync(fullSubdirPath)&&await fs.promises.writeFile(`${fullSubdirPath}/${htaccessFilename}`,passwordProtectWrapperContents);if(subdir==="wrappers"&&phetioPackageBlock?.publicWrappers){const publicWrapperContents=getPublicAccessDirective("","publicWrappers");for(const publicWrapper of phetioPackageBlock.publicWrappers){const publicWrapperPath=`${fullSubdirPath}/${publicWrapper}`;fs.existsSync(publicWrapperPath)&&await fs.promises.writeFile(`${publicWrapperPath}/${htaccessFilename}`,publicWrapperContents)}const commonWrapperPaths=[`${fullSubdirPath}/common/css`,`${fullSubdirPath}/common/js/codap`];for(let i=0;i<commonWrapperPaths.length;i++){const commonWrapperPath=commonWrapperPaths[i];fs.existsSync(commonWrapperPath)&&await fs.promises.writeFile(`${commonWrapperPath}/${htaccessFilename}`,publicWrapperContents)}}}await fs.promises.writeFile(`${passwordProtectPath}/${htaccessFilename}`,rootHtaccessContent)}winston.debug("phetio authentication htaccess written")}catch(err){winston.debug("phetio authentication htaccess not written");throw err}if(isProductionDeploy){if(simName&&latestOption.version&&latestOption.directory&&latestOption.checkoutDir){const redirectFilepath=`${latestOption.directory+simName}/${htaccessFilename}`;let latestRedirectContents="RewriteEngine on\n"+`RewriteBase /sims/${simName}/
`;const versions=(await axios(`${buildLocal.productionServerURL}/services/metadata/phetio?name=${simName}&latest=true`)).data;for(const v of versions){latestRedirectContents+=`RewriteRule ^${v.versionMajor}.${v.versionMinor}$ ${v.versionMajor}.${v.versionMinor}/ [R=301,L]
`;latestRedirectContents+=`RewriteRule ^${v.versionMajor}.${v.versionMinor}/(.*) ${v.versionMajor}.${v.versionMinor}.${v.versionMaintenance}${v.versionSuffix?"-":""}${v.versionSuffix}/$1
`}latestRedirectContents+="RewriteCond %{QUERY_STRING} =download\n"+"RewriteRule ([^/]*)$ - [L,E=download:$1]\n"+'Header onsuccess set Content-disposition "attachment; filename=%{download}e" env=download\n';await fs.promises.writeFile(redirectFilepath,latestRedirectContents)}else{winston.error(`simName: ${simName}`);winston.error(`version: ${latestOption.version}`);winston.error(`directory: ${latestOption.directory}`);winston.error(`checkoutDir: ${latestOption.checkoutDir}`);throw new Error("latestOption is missing one of the required parameters (simName, version, directory, or checkoutDir)")}}};function getPublicAccessDirective(commentSymbol,packageKey){return`
# Editing these directly is not supported and will be overwritten by maintenance releases. Please change by modifying 
# the sim's package.json ${packageKey} property followed by a re-deploy.
${commentSymbol} Satisfy Any
${commentSymbol} Allow from all
`}