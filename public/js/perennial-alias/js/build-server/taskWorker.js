// Copyright 2017-2019, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)
const constants = require('./constants');
const createTranslationsXML = require('./createTranslationsXML');
const devDeploy = require('./devDeploy');
const execute = require('../common/execute').default;
const fs = require('fs');
const getLocales = require('./getLocales');
const notifyServer = require('./notifyServer');
const rsync = require('rsync');
const SimVersion = require('../browser-and-node/SimVersion').default;
const winston = require('winston');
const writePhetHtaccess = require('./writePhetHtaccess');
const writePhetioHtaccess = require('../common/writePhetioHtaccess').default;
const deployImages = require('./deployImages');
const persistentQueue = require('./persistentQueue');
const ReleaseBranch = require('../common/ReleaseBranch').default;
const loadJSON = require('../common/loadJSON');
const sendEmail = require('./sendEmail');
/**
 * Abort build with err
 * @param {String|Error} err - error logged and sent via email
 */ const abortBuild = async (err)=>{
    winston.log('error', `BUILD ABORTED! ${err}`);
    err.stack && winston.log('error', err.stack);
    throw new Error(`Build aborted, ${err}`);
};
/**
 * Clean up after deploy. Remove tmp dir.
 */ const afterDeploy = async (buildDir)=>{
    try {
        await execute('rm', [
            '-rf',
            buildDir
        ], '.');
    } catch (err) {
        await abortBuild(err);
    }
};
/**
 * taskQueue ensures that only one build/deploy process will be happening at the same time.  The main build/deploy logic is here.
 *
 * @property {JSON} repos
 * @property {String} api
 * @property {String} locales - comma separated list of locale codes
 * @property {String} simName - lower case simulation name used for creating files/directories
 * @property {String} version - sim version identifier string
 * @property {String} servers - deployment targets, subset of [ 'dev', 'production' ]
 * @property {string[]} brands - deployment brands
 * @property {String} email - used for sending notifications about success/failure
 * @property {String} translatorId - rosetta user id for adding translators to the website
 * @property {winston} winston - logger
 * @param options
 */ async function runTask(options) {
    persistentQueue.startTask(options);
    if (options.deployImages) {
        try {
            await deployImages(options);
            return;
        } catch (e) {
            winston.error(e);
            winston.error('Deploy images failed. See previous logs for details.');
            throw e;
        }
    }
    try {
        //-------------------------------------------------------------------------------------
        // Parse and validate parameters
        //-------------------------------------------------------------------------------------
        const api = options.api;
        const dependencies = options.repos;
        let locales = options.locales;
        const simName = options.simName;
        let version = options.version;
        const email = options.email;
        const brands = options.brands;
        const servers = options.servers;
        const userId = options.userId;
        const branch = options.branch || version.match(/^(\d+\.\d+)/)[0];
        if (userId) {
            winston.log('info', `setting userId = ${userId}`);
        }
        if (branch === null) {
            await abortBuild('Branch must be provided.');
        }
        // validate simName
        const simNameRegex = /^[a-z-]+$/;
        if (!simNameRegex.test(simName)) {
            await abortBuild(`invalid simName ${simName}`);
        }
        // make sure the repos passed in validates
        for(const key in dependencies){
            if (dependencies.hasOwnProperty(key)) {
                winston.log('info', `Validating repo: ${key}`);
                // make sure all keys in dependencies object are valid sim names
                if (!simNameRegex.test(key)) {
                    await abortBuild(`invalid simName in dependencies: ${simName}`);
                }
                const value = dependencies[key];
                if (key === 'comment') {
                    if (typeof value !== 'string') {
                        await abortBuild('invalid comment in dependencies: should be a string');
                    }
                } else if (value instanceof Object && value.hasOwnProperty('sha')) {
                    if (!/^[a-f0-9]{40}$/.test(value.sha)) {
                        await abortBuild(`invalid sha in dependencies. key: ${key} value: ${value} sha: ${value.sha}`);
                    }
                } else {
                    await abortBuild(`invalid item in dependencies. key: ${key} value: ${value}`);
                }
            }
        }
        // Infer brand from version string and keep unstripped version for phet-io
        const originalVersion = version;
        if (api === '1.0') {
            // validate version and strip suffixes since just the numbers are used in the directory name on dev and production servers
            const versionMatch = version.match(/^(\d+\.\d+\.\d+)(?:-.*)?$/);
            if (versionMatch && versionMatch.length === 2) {
                if (servers.includes('dev')) {
                    // if deploying an rc version use the -rc.[number] suffix
                    version = versionMatch[0];
                } else {
                    // otherwise strip any suffix
                    version = versionMatch[1];
                }
                winston.log('info', `detecting version number: ${version}`);
            } else {
                await abortBuild(`invalid version number: ${version}`);
            }
        }
        if (api === '1.0') {
            locales = await getLocales(locales, simName);
        }
        // Git pull, git checkout, npm prune & update, etc. in parallel directory
        const releaseBranch = new ReleaseBranch(simName, branch, brands, true);
        await releaseBranch.updateCheckout(dependencies);
        const chipperVersion = releaseBranch.getChipperVersion();
        winston.debug(`Chipper version detected: ${chipperVersion.toString()}`);
        if (!(chipperVersion.major === 2 && chipperVersion.minor === 0) && !(chipperVersion.major === 0 && chipperVersion.minor === 0)) {
            await abortBuild('Unsupported chipper version');
        }
        if (chipperVersion.major !== 1) {
            const checkoutDirectory = ReleaseBranch.getCheckoutDirectory(simName, branch);
            const packageJSON = JSON.parse(fs.readFileSync(`${checkoutDirectory}/${simName}/package.json`, 'utf8'));
            const packageVersion = packageJSON.version;
            if (packageVersion !== version) {
                await abortBuild(`Version mismatch between package.json and build request: ${packageVersion} vs ${version}`);
            }
        }
        const localesArray = typeof locales === 'string' ? locales.split(',') : locales;
        // if this build request comes from rosetta it will have a userId field and only one locale
        const isTranslationRequest = userId && localesArray.length === 1 && localesArray[0] !== '*';
        await releaseBranch.build({
            clean: false,
            locales: isTranslationRequest ? '*' : locales,
            buildForServer: true,
            lint: false,
            allHTML: !(chipperVersion.major === 0 && chipperVersion.minor === 0 && brands[0] !== constants.PHET_BRAND)
        });
        winston.debug('Build finished.');
        winston.debug(`Deploying to servers: ${JSON.stringify(servers)}`);
        const checkoutDir = ReleaseBranch.getCheckoutDirectory(simName, branch);
        const simRepoDir = `${checkoutDir}/${simName}`;
        const buildDir = `${simRepoDir}/build`;
        if (servers.indexOf(constants.DEV_SERVER) >= 0) {
            winston.info('deploying to dev');
            if (brands.indexOf(constants.PHET_IO_BRAND) >= 0) {
                const htaccessLocation = chipperVersion.major === 2 && chipperVersion.minor === 0 ? `${buildDir}/phet-io` : buildDir;
                await writePhetioHtaccess(simName, htaccessLocation, {
                    checkoutDir: checkoutDir,
                    isProductionDeploy: false
                });
            }
            await devDeploy(checkoutDir, simName, version, chipperVersion, brands, buildDir);
        }
        if (servers.indexOf(constants.PRODUCTION_SERVER) >= 0) {
            winston.info('deploying to production');
            let targetVersionDir;
            let targetSimDir;
            // Loop over all brands
            for(const i in brands){
                if (brands.hasOwnProperty(i)) {
                    const brand = brands[i];
                    winston.info(`deploying brand: ${brand}`);
                    // Pre-copy steps
                    if (brand === constants.PHET_BRAND) {
                        targetSimDir = constants.HTML_SIMS_DIRECTORY + simName;
                        targetVersionDir = `${targetSimDir}/${version}/`;
                        if (chipperVersion.major === 2 && chipperVersion.minor === 0) {
                            // Remove _phet from all filenames in the phet directory
                            const phetBuildDir = `${buildDir}/phet`;
                            const files = fs.readdirSync(phetBuildDir);
                            for(const i in files){
                                if (files.hasOwnProperty(i)) {
                                    const filename = files[i];
                                    if (filename.indexOf('_phet') >= 0) {
                                        const newFilename = filename.replace('_phet', '');
                                        await execute('mv', [
                                            filename,
                                            newFilename
                                        ], phetBuildDir);
                                    }
                                }
                            }
                        }
                    } else if (brand === constants.PHET_IO_BRAND) {
                        targetSimDir = constants.PHET_IO_SIMS_DIRECTORY + simName;
                        targetVersionDir = `${targetSimDir}/${originalVersion}`;
                        // Chipper 1.0 has -phetio in the version schema for PhET-iO branded sims
                        if (chipperVersion.major === 0 && !originalVersion.match('-phetio')) {
                            targetVersionDir += '-phetio';
                        }
                        targetVersionDir += '/';
                    }
                    // Copy steps - allow EEXIST errors but reject anything else
                    winston.debug(`Creating version dir: ${targetVersionDir}`);
                    try {
                        await fs.promises.mkdir(targetVersionDir, {
                            recursive: true
                        });
                        winston.debug('Success creating sim dir');
                    } catch (err) {
                        if (err.code !== 'EEXIST') {
                            winston.error('Failure creating version dir');
                            winston.error(err);
                            throw err;
                        }
                    }
                    let sourceDir = buildDir;
                    if (chipperVersion.major === 2 && chipperVersion.minor === 0) {
                        sourceDir += `/${brand}`;
                    }
                    await new Promise((resolve, reject)=>{
                        winston.debug(`Copying recursive ${sourceDir} to ${targetVersionDir}`);
                        new rsync().flags('razpO').set('no-perms').set('exclude', '.rsync-filter').source(`${sourceDir}/`).destination(targetVersionDir).output((stdout)=>{
                            winston.debug(stdout.toString());
                        }, (stderr)=>{
                            winston.error(stderr.toString());
                        }).execute((err, code, cmd)=>{
                            if (err && code !== 23) {
                                winston.debug(code);
                                winston.debug(cmd);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                    winston.debug('Copy finished');
                    // Post-copy steps
                    if (brand === constants.PHET_BRAND) {
                        if (!isTranslationRequest) {
                            await deployImages({
                                simulation: options.simName,
                                brands: options.brands,
                                version: options.version
                            });
                        }
                        await writePhetHtaccess(simName, version);
                        await createTranslationsXML(simName, version, checkoutDir);
                        // This should be the last function called for the phet brand.
                        // This triggers an asyncronous task on the tomcat/wicket application and only waits for a response that the request was received.
                        // Do not assume that this task is complete because we use await.
                        await notifyServer({
                            simName: simName,
                            email: email,
                            brand: brand,
                            locales: locales,
                            translatorId: isTranslationRequest ? userId : undefined
                        });
                        const latestFileSystemVersion = getLatestFileSystemProductionVersion(targetSimDir);
                        // Production deploy to PhET Brand is most likely buggy if deploying a previous major.minor version. Let's
                        // tell someone.
                        if (SimVersion.parse(version).compareNumber(latestFileSystemVersion) < 0) {
                            sendEmail('PhET Production Deploy of older release', `Build server deployed ${simName} version: ${version} to phet brand production site but the latest version is ${latestFileSystemVersion}`);
                        }
                    } else if (brand === constants.PHET_IO_BRAND) {
                        const suffix = originalVersion.split('-').length >= 2 ? originalVersion.split('-')[1] : chipperVersion.major < 2 ? 'phetio' : '';
                        const parsedVersion = SimVersion.parse(version, '');
                        const simPackage = await loadJSON(`${simRepoDir}/package.json`);
                        const ignoreForAutomatedMaintenanceReleases = !!(simPackage && simPackage.phet && simPackage.phet.ignoreForAutomatedMaintenanceReleases);
                        // This triggers an asyncronous task on the tomcat/wicket application and only waits for a response that the request was received.
                        // Do not assume that this task is complete because we use await.
                        await notifyServer({
                            simName: simName,
                            email: email,
                            brand: brand,
                            phetioOptions: {
                                branch: branch,
                                suffix: suffix,
                                version: parsedVersion,
                                ignoreForAutomatedMaintenanceReleases: ignoreForAutomatedMaintenanceReleases
                            }
                        });
                        winston.debug('server notified');
                        await writePhetioHtaccess(simName, targetVersionDir, {
                            version: originalVersion,
                            directory: constants.PHET_IO_SIMS_DIRECTORY,
                            checkoutDir: checkoutDir,
                            isProductionDeploy: true
                        });
                    }
                }
            }
        }
        await afterDeploy(`${buildDir}`);
    } catch (err) {
        await abortBuild(err);
    }
}
// Look at the file system for the directory that has the latest version as its name.
function getLatestFileSystemProductionVersion(dirPath) {
    const versionDirRegex = /^\d+\.\d+\.\d+$/; // start and end markers because we only care about production deploys
    const versionStrings = fs.readdirSync(dirPath).filter((f)=>versionDirRegex.test(f));
    return versionStrings.map((f)=>SimVersion.parse(f)).sort(SimVersion.comparator).pop();
}
module.exports = function taskWorker(task, taskCallback) {
    runTask(task).then(()=>{
        taskCallback();
    }).catch((reason)=>{
        taskCallback(reason);
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvdGFza1dvcmtlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDE5LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcbi8vIEBhdXRob3IgTWF0dCBQZW5uaW5ndG9uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuXG5cbmNvbnN0IGNvbnN0YW50cyA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKTtcbmNvbnN0IGNyZWF0ZVRyYW5zbGF0aW9uc1hNTCA9IHJlcXVpcmUoICcuL2NyZWF0ZVRyYW5zbGF0aW9uc1hNTCcgKTtcbmNvbnN0IGRldkRlcGxveSA9IHJlcXVpcmUoICcuL2RldkRlcGxveScgKTtcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi4vY29tbW9uL2V4ZWN1dGUnICkuZGVmYXVsdDtcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xuY29uc3QgZ2V0TG9jYWxlcyA9IHJlcXVpcmUoICcuL2dldExvY2FsZXMnICk7XG5jb25zdCBub3RpZnlTZXJ2ZXIgPSByZXF1aXJlKCAnLi9ub3RpZnlTZXJ2ZXInICk7XG5jb25zdCByc3luYyA9IHJlcXVpcmUoICdyc3luYycgKTtcbmNvbnN0IFNpbVZlcnNpb24gPSByZXF1aXJlKCAnLi4vYnJvd3Nlci1hbmQtbm9kZS9TaW1WZXJzaW9uJyApLmRlZmF1bHQ7XG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XG5jb25zdCB3cml0ZVBoZXRIdGFjY2VzcyA9IHJlcXVpcmUoICcuL3dyaXRlUGhldEh0YWNjZXNzJyApO1xuY29uc3Qgd3JpdGVQaGV0aW9IdGFjY2VzcyA9IHJlcXVpcmUoICcuLi9jb21tb24vd3JpdGVQaGV0aW9IdGFjY2VzcycgKS5kZWZhdWx0O1xuY29uc3QgZGVwbG95SW1hZ2VzID0gcmVxdWlyZSggJy4vZGVwbG95SW1hZ2VzJyApO1xuY29uc3QgcGVyc2lzdGVudFF1ZXVlID0gcmVxdWlyZSggJy4vcGVyc2lzdGVudFF1ZXVlJyApO1xuY29uc3QgUmVsZWFzZUJyYW5jaCA9IHJlcXVpcmUoICcuLi9jb21tb24vUmVsZWFzZUJyYW5jaCcgKS5kZWZhdWx0O1xuY29uc3QgbG9hZEpTT04gPSByZXF1aXJlKCAnLi4vY29tbW9uL2xvYWRKU09OJyApO1xuY29uc3Qgc2VuZEVtYWlsID0gcmVxdWlyZSggJy4vc2VuZEVtYWlsJyApO1xuXG4vKipcbiAqIEFib3J0IGJ1aWxkIHdpdGggZXJyXG4gKiBAcGFyYW0ge1N0cmluZ3xFcnJvcn0gZXJyIC0gZXJyb3IgbG9nZ2VkIGFuZCBzZW50IHZpYSBlbWFpbFxuICovXG5jb25zdCBhYm9ydEJ1aWxkID0gYXN5bmMgZXJyID0+IHtcbiAgd2luc3Rvbi5sb2coICdlcnJvcicsIGBCVUlMRCBBQk9SVEVEISAke2Vycn1gICk7XG4gIGVyci5zdGFjayAmJiB3aW5zdG9uLmxvZyggJ2Vycm9yJywgZXJyLnN0YWNrICk7XG5cbiAgdGhyb3cgbmV3IEVycm9yKCBgQnVpbGQgYWJvcnRlZCwgJHtlcnJ9YCApO1xufTtcblxuLyoqXG4gKiBDbGVhbiB1cCBhZnRlciBkZXBsb3kuIFJlbW92ZSB0bXAgZGlyLlxuICovXG5jb25zdCBhZnRlckRlcGxveSA9IGFzeW5jIGJ1aWxkRGlyID0+IHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBleGVjdXRlKCAncm0nLCBbICctcmYnLCBidWlsZERpciBdLCAnLicgKTtcbiAgfVxuICBjYXRjaCggZXJyICkge1xuICAgIGF3YWl0IGFib3J0QnVpbGQoIGVyciApO1xuICB9XG59O1xuXG4vKipcbiAqIHRhc2tRdWV1ZSBlbnN1cmVzIHRoYXQgb25seSBvbmUgYnVpbGQvZGVwbG95IHByb2Nlc3Mgd2lsbCBiZSBoYXBwZW5pbmcgYXQgdGhlIHNhbWUgdGltZS4gIFRoZSBtYWluIGJ1aWxkL2RlcGxveSBsb2dpYyBpcyBoZXJlLlxuICpcbiAqIEBwcm9wZXJ0eSB7SlNPTn0gcmVwb3NcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBhcGlcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBsb2NhbGVzIC0gY29tbWEgc2VwYXJhdGVkIGxpc3Qgb2YgbG9jYWxlIGNvZGVzXG4gKiBAcHJvcGVydHkge1N0cmluZ30gc2ltTmFtZSAtIGxvd2VyIGNhc2Ugc2ltdWxhdGlvbiBuYW1lIHVzZWQgZm9yIGNyZWF0aW5nIGZpbGVzL2RpcmVjdG9yaWVzXG4gKiBAcHJvcGVydHkge1N0cmluZ30gdmVyc2lvbiAtIHNpbSB2ZXJzaW9uIGlkZW50aWZpZXIgc3RyaW5nXG4gKiBAcHJvcGVydHkge1N0cmluZ30gc2VydmVycyAtIGRlcGxveW1lbnQgdGFyZ2V0cywgc3Vic2V0IG9mIFsgJ2RldicsICdwcm9kdWN0aW9uJyBdXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfSBicmFuZHMgLSBkZXBsb3ltZW50IGJyYW5kc1xuICogQHByb3BlcnR5IHtTdHJpbmd9IGVtYWlsIC0gdXNlZCBmb3Igc2VuZGluZyBub3RpZmljYXRpb25zIGFib3V0IHN1Y2Nlc3MvZmFpbHVyZVxuICogQHByb3BlcnR5IHtTdHJpbmd9IHRyYW5zbGF0b3JJZCAtIHJvc2V0dGEgdXNlciBpZCBmb3IgYWRkaW5nIHRyYW5zbGF0b3JzIHRvIHRoZSB3ZWJzaXRlXG4gKiBAcHJvcGVydHkge3dpbnN0b259IHdpbnN0b24gLSBsb2dnZXJcbiAqIEBwYXJhbSBvcHRpb25zXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1blRhc2soIG9wdGlvbnMgKSB7XG4gIHBlcnNpc3RlbnRRdWV1ZS5zdGFydFRhc2soIG9wdGlvbnMgKTtcbiAgaWYgKCBvcHRpb25zLmRlcGxveUltYWdlcyApIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZGVwbG95SW1hZ2VzKCBvcHRpb25zICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNhdGNoKCBlICkge1xuICAgICAgd2luc3Rvbi5lcnJvciggZSApO1xuICAgICAgd2luc3Rvbi5lcnJvciggJ0RlcGxveSBpbWFnZXMgZmFpbGVkLiBTZWUgcHJldmlvdXMgbG9ncyBmb3IgZGV0YWlscy4nICk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuXG5cbiAgdHJ5IHtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBQYXJzZSBhbmQgdmFsaWRhdGUgcGFyYW1ldGVyc1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0IGFwaSA9IG9wdGlvbnMuYXBpO1xuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IG9wdGlvbnMucmVwb3M7XG4gICAgbGV0IGxvY2FsZXMgPSBvcHRpb25zLmxvY2FsZXM7XG4gICAgY29uc3Qgc2ltTmFtZSA9IG9wdGlvbnMuc2ltTmFtZTtcbiAgICBsZXQgdmVyc2lvbiA9IG9wdGlvbnMudmVyc2lvbjtcbiAgICBjb25zdCBlbWFpbCA9IG9wdGlvbnMuZW1haWw7XG4gICAgY29uc3QgYnJhbmRzID0gb3B0aW9ucy5icmFuZHM7XG4gICAgY29uc3Qgc2VydmVycyA9IG9wdGlvbnMuc2VydmVycztcbiAgICBjb25zdCB1c2VySWQgPSBvcHRpb25zLnVzZXJJZDtcbiAgICBjb25zdCBicmFuY2ggPSBvcHRpb25zLmJyYW5jaCB8fCB2ZXJzaW9uLm1hdGNoKCAvXihcXGQrXFwuXFxkKykvIClbIDAgXTtcblxuICAgIGlmICggdXNlcklkICkge1xuICAgICAgd2luc3Rvbi5sb2coICdpbmZvJywgYHNldHRpbmcgdXNlcklkID0gJHt1c2VySWR9YCApO1xuICAgIH1cblxuICAgIGlmICggYnJhbmNoID09PSBudWxsICkge1xuICAgICAgYXdhaXQgYWJvcnRCdWlsZCggJ0JyYW5jaCBtdXN0IGJlIHByb3ZpZGVkLicgKTtcbiAgICB9XG5cbiAgICAvLyB2YWxpZGF0ZSBzaW1OYW1lXG4gICAgY29uc3Qgc2ltTmFtZVJlZ2V4ID0gL15bYS16LV0rJC87XG4gICAgaWYgKCAhc2ltTmFtZVJlZ2V4LnRlc3QoIHNpbU5hbWUgKSApIHtcbiAgICAgIGF3YWl0IGFib3J0QnVpbGQoIGBpbnZhbGlkIHNpbU5hbWUgJHtzaW1OYW1lfWAgKTtcbiAgICB9XG5cbiAgICAvLyBtYWtlIHN1cmUgdGhlIHJlcG9zIHBhc3NlZCBpbiB2YWxpZGF0ZXNcbiAgICBmb3IgKCBjb25zdCBrZXkgaW4gZGVwZW5kZW5jaWVzICkge1xuICAgICAgaWYgKCBkZXBlbmRlbmNpZXMuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xuICAgICAgICB3aW5zdG9uLmxvZyggJ2luZm8nLCBgVmFsaWRhdGluZyByZXBvOiAke2tleX1gICk7XG5cbiAgICAgICAgLy8gbWFrZSBzdXJlIGFsbCBrZXlzIGluIGRlcGVuZGVuY2llcyBvYmplY3QgYXJlIHZhbGlkIHNpbSBuYW1lc1xuICAgICAgICBpZiAoICFzaW1OYW1lUmVnZXgudGVzdCgga2V5ICkgKSB7XG4gICAgICAgICAgYXdhaXQgYWJvcnRCdWlsZCggYGludmFsaWQgc2ltTmFtZSBpbiBkZXBlbmRlbmNpZXM6ICR7c2ltTmFtZX1gICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB2YWx1ZSA9IGRlcGVuZGVuY2llc1sga2V5IF07XG4gICAgICAgIGlmICgga2V5ID09PSAnY29tbWVudCcgKSB7XG4gICAgICAgICAgaWYgKCB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnICkge1xuICAgICAgICAgICAgYXdhaXQgYWJvcnRCdWlsZCggJ2ludmFsaWQgY29tbWVudCBpbiBkZXBlbmRlbmNpZXM6IHNob3VsZCBiZSBhIHN0cmluZycgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIHZhbHVlIGluc3RhbmNlb2YgT2JqZWN0ICYmIHZhbHVlLmhhc093blByb3BlcnR5KCAnc2hhJyApICkge1xuICAgICAgICAgIGlmICggIS9eW2EtZjAtOV17NDB9JC8udGVzdCggdmFsdWUuc2hhICkgKSB7XG4gICAgICAgICAgICBhd2FpdCBhYm9ydEJ1aWxkKCBgaW52YWxpZCBzaGEgaW4gZGVwZW5kZW5jaWVzLiBrZXk6ICR7a2V5fSB2YWx1ZTogJHt2YWx1ZX0gc2hhOiAke3ZhbHVlLnNoYX1gICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGF3YWl0IGFib3J0QnVpbGQoIGBpbnZhbGlkIGl0ZW0gaW4gZGVwZW5kZW5jaWVzLiBrZXk6ICR7a2V5fSB2YWx1ZTogJHt2YWx1ZX1gICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbmZlciBicmFuZCBmcm9tIHZlcnNpb24gc3RyaW5nIGFuZCBrZWVwIHVuc3RyaXBwZWQgdmVyc2lvbiBmb3IgcGhldC1pb1xuICAgIGNvbnN0IG9yaWdpbmFsVmVyc2lvbiA9IHZlcnNpb247XG4gICAgaWYgKCBhcGkgPT09ICcxLjAnICkge1xuICAgICAgLy8gdmFsaWRhdGUgdmVyc2lvbiBhbmQgc3RyaXAgc3VmZml4ZXMgc2luY2UganVzdCB0aGUgbnVtYmVycyBhcmUgdXNlZCBpbiB0aGUgZGlyZWN0b3J5IG5hbWUgb24gZGV2IGFuZCBwcm9kdWN0aW9uIHNlcnZlcnNcbiAgICAgIGNvbnN0IHZlcnNpb25NYXRjaCA9IHZlcnNpb24ubWF0Y2goIC9eKFxcZCtcXC5cXGQrXFwuXFxkKykoPzotLiopPyQvICk7XG4gICAgICBpZiAoIHZlcnNpb25NYXRjaCAmJiB2ZXJzaW9uTWF0Y2gubGVuZ3RoID09PSAyICkge1xuXG4gICAgICAgIGlmICggc2VydmVycy5pbmNsdWRlcyggJ2RldicgKSApIHtcbiAgICAgICAgICAvLyBpZiBkZXBsb3lpbmcgYW4gcmMgdmVyc2lvbiB1c2UgdGhlIC1yYy5bbnVtYmVyXSBzdWZmaXhcbiAgICAgICAgICB2ZXJzaW9uID0gdmVyc2lvbk1hdGNoWyAwIF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgLy8gb3RoZXJ3aXNlIHN0cmlwIGFueSBzdWZmaXhcbiAgICAgICAgICB2ZXJzaW9uID0gdmVyc2lvbk1hdGNoWyAxIF07XG4gICAgICAgIH1cbiAgICAgICAgd2luc3Rvbi5sb2coICdpbmZvJywgYGRldGVjdGluZyB2ZXJzaW9uIG51bWJlcjogJHt2ZXJzaW9ufWAgKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBhd2FpdCBhYm9ydEJ1aWxkKCBgaW52YWxpZCB2ZXJzaW9uIG51bWJlcjogJHt2ZXJzaW9ufWAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIGFwaSA9PT0gJzEuMCcgKSB7XG4gICAgICBsb2NhbGVzID0gYXdhaXQgZ2V0TG9jYWxlcyggbG9jYWxlcywgc2ltTmFtZSApO1xuICAgIH1cblxuICAgIC8vIEdpdCBwdWxsLCBnaXQgY2hlY2tvdXQsIG5wbSBwcnVuZSAmIHVwZGF0ZSwgZXRjLiBpbiBwYXJhbGxlbCBkaXJlY3RvcnlcbiAgICBjb25zdCByZWxlYXNlQnJhbmNoID0gbmV3IFJlbGVhc2VCcmFuY2goIHNpbU5hbWUsIGJyYW5jaCwgYnJhbmRzLCB0cnVlICk7XG4gICAgYXdhaXQgcmVsZWFzZUJyYW5jaC51cGRhdGVDaGVja291dCggZGVwZW5kZW5jaWVzICk7XG5cbiAgICBjb25zdCBjaGlwcGVyVmVyc2lvbiA9IHJlbGVhc2VCcmFuY2guZ2V0Q2hpcHBlclZlcnNpb24oKTtcbiAgICB3aW5zdG9uLmRlYnVnKCBgQ2hpcHBlciB2ZXJzaW9uIGRldGVjdGVkOiAke2NoaXBwZXJWZXJzaW9uLnRvU3RyaW5nKCl9YCApO1xuICAgIGlmICggISggY2hpcHBlclZlcnNpb24ubWFqb3IgPT09IDIgJiYgY2hpcHBlclZlcnNpb24ubWlub3IgPT09IDAgKSAmJiAhKCBjaGlwcGVyVmVyc2lvbi5tYWpvciA9PT0gMCAmJiBjaGlwcGVyVmVyc2lvbi5taW5vciA9PT0gMCApICkge1xuICAgICAgYXdhaXQgYWJvcnRCdWlsZCggJ1Vuc3VwcG9ydGVkIGNoaXBwZXIgdmVyc2lvbicgKTtcbiAgICB9XG5cbiAgICBpZiAoIGNoaXBwZXJWZXJzaW9uLm1ham9yICE9PSAxICkge1xuICAgICAgY29uc3QgY2hlY2tvdXREaXJlY3RvcnkgPSBSZWxlYXNlQnJhbmNoLmdldENoZWNrb3V0RGlyZWN0b3J5KCBzaW1OYW1lLCBicmFuY2ggKTtcbiAgICAgIGNvbnN0IHBhY2thZ2VKU09OID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgJHtjaGVja291dERpcmVjdG9yeX0vJHtzaW1OYW1lfS9wYWNrYWdlLmpzb25gLCAndXRmOCcgKSApO1xuICAgICAgY29uc3QgcGFja2FnZVZlcnNpb24gPSBwYWNrYWdlSlNPTi52ZXJzaW9uO1xuXG4gICAgICBpZiAoIHBhY2thZ2VWZXJzaW9uICE9PSB2ZXJzaW9uICkge1xuICAgICAgICBhd2FpdCBhYm9ydEJ1aWxkKCBgVmVyc2lvbiBtaXNtYXRjaCBiZXR3ZWVuIHBhY2thZ2UuanNvbiBhbmQgYnVpbGQgcmVxdWVzdDogJHtwYWNrYWdlVmVyc2lvbn0gdnMgJHt2ZXJzaW9ufWAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBsb2NhbGVzQXJyYXkgPSB0eXBlb2YgKCBsb2NhbGVzICkgPT09ICdzdHJpbmcnID8gbG9jYWxlcy5zcGxpdCggJywnICkgOiBsb2NhbGVzO1xuICAgIC8vIGlmIHRoaXMgYnVpbGQgcmVxdWVzdCBjb21lcyBmcm9tIHJvc2V0dGEgaXQgd2lsbCBoYXZlIGEgdXNlcklkIGZpZWxkIGFuZCBvbmx5IG9uZSBsb2NhbGVcbiAgICBjb25zdCBpc1RyYW5zbGF0aW9uUmVxdWVzdCA9IHVzZXJJZCAmJiBsb2NhbGVzQXJyYXkubGVuZ3RoID09PSAxICYmIGxvY2FsZXNBcnJheVsgMCBdICE9PSAnKic7XG5cbiAgICBhd2FpdCByZWxlYXNlQnJhbmNoLmJ1aWxkKCB7XG4gICAgICBjbGVhbjogZmFsc2UsXG4gICAgICBsb2NhbGVzOiBpc1RyYW5zbGF0aW9uUmVxdWVzdCA/ICcqJyA6IGxvY2FsZXMsXG4gICAgICBidWlsZEZvclNlcnZlcjogdHJ1ZSxcbiAgICAgIGxpbnQ6IGZhbHNlLFxuICAgICAgYWxsSFRNTDogISggY2hpcHBlclZlcnNpb24ubWFqb3IgPT09IDAgJiYgY2hpcHBlclZlcnNpb24ubWlub3IgPT09IDAgJiYgYnJhbmRzWyAwIF0gIT09IGNvbnN0YW50cy5QSEVUX0JSQU5EIClcbiAgICB9ICk7XG4gICAgd2luc3Rvbi5kZWJ1ZyggJ0J1aWxkIGZpbmlzaGVkLicgKTtcblxuICAgIHdpbnN0b24uZGVidWcoIGBEZXBsb3lpbmcgdG8gc2VydmVyczogJHtKU09OLnN0cmluZ2lmeSggc2VydmVycyApfWAgKTtcblxuICAgIGNvbnN0IGNoZWNrb3V0RGlyID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggc2ltTmFtZSwgYnJhbmNoICk7XG4gICAgY29uc3Qgc2ltUmVwb0RpciA9IGAke2NoZWNrb3V0RGlyfS8ke3NpbU5hbWV9YDtcbiAgICBjb25zdCBidWlsZERpciA9IGAke3NpbVJlcG9EaXJ9L2J1aWxkYDtcblxuICAgIGlmICggc2VydmVycy5pbmRleE9mKCBjb25zdGFudHMuREVWX1NFUlZFUiApID49IDAgKSB7XG4gICAgICB3aW5zdG9uLmluZm8oICdkZXBsb3lpbmcgdG8gZGV2JyApO1xuICAgICAgaWYgKCBicmFuZHMuaW5kZXhPZiggY29uc3RhbnRzLlBIRVRfSU9fQlJBTkQgKSA+PSAwICkge1xuICAgICAgICBjb25zdCBodGFjY2Vzc0xvY2F0aW9uID0gKCBjaGlwcGVyVmVyc2lvbi5tYWpvciA9PT0gMiAmJiBjaGlwcGVyVmVyc2lvbi5taW5vciA9PT0gMCApID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke2J1aWxkRGlyfS9waGV0LWlvYCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWlsZERpcjtcbiAgICAgICAgYXdhaXQgd3JpdGVQaGV0aW9IdGFjY2Vzcyggc2ltTmFtZSwgaHRhY2Nlc3NMb2NhdGlvbiwge1xuICAgICAgICAgIGNoZWNrb3V0RGlyOiBjaGVja291dERpcixcbiAgICAgICAgICBpc1Byb2R1Y3Rpb25EZXBsb3k6IGZhbHNlXG4gICAgICAgIH0gKTtcbiAgICAgIH1cbiAgICAgIGF3YWl0IGRldkRlcGxveSggY2hlY2tvdXREaXIsIHNpbU5hbWUsIHZlcnNpb24sIGNoaXBwZXJWZXJzaW9uLCBicmFuZHMsIGJ1aWxkRGlyICk7XG4gICAgfVxuXG4gICAgaWYgKCBzZXJ2ZXJzLmluZGV4T2YoIGNvbnN0YW50cy5QUk9EVUNUSU9OX1NFUlZFUiApID49IDAgKSB7XG4gICAgICB3aW5zdG9uLmluZm8oICdkZXBsb3lpbmcgdG8gcHJvZHVjdGlvbicgKTtcbiAgICAgIGxldCB0YXJnZXRWZXJzaW9uRGlyO1xuICAgICAgbGV0IHRhcmdldFNpbURpcjtcblxuICAgICAgLy8gTG9vcCBvdmVyIGFsbCBicmFuZHNcbiAgICAgIGZvciAoIGNvbnN0IGkgaW4gYnJhbmRzICkge1xuICAgICAgICBpZiAoIGJyYW5kcy5oYXNPd25Qcm9wZXJ0eSggaSApICkge1xuICAgICAgICAgIGNvbnN0IGJyYW5kID0gYnJhbmRzWyBpIF07XG4gICAgICAgICAgd2luc3Rvbi5pbmZvKCBgZGVwbG95aW5nIGJyYW5kOiAke2JyYW5kfWAgKTtcbiAgICAgICAgICAvLyBQcmUtY29weSBzdGVwc1xuICAgICAgICAgIGlmICggYnJhbmQgPT09IGNvbnN0YW50cy5QSEVUX0JSQU5EICkge1xuICAgICAgICAgICAgdGFyZ2V0U2ltRGlyID0gY29uc3RhbnRzLkhUTUxfU0lNU19ESVJFQ1RPUlkgKyBzaW1OYW1lO1xuICAgICAgICAgICAgdGFyZ2V0VmVyc2lvbkRpciA9IGAke3RhcmdldFNpbURpcn0vJHt2ZXJzaW9ufS9gO1xuXG4gICAgICAgICAgICBpZiAoIGNoaXBwZXJWZXJzaW9uLm1ham9yID09PSAyICYmIGNoaXBwZXJWZXJzaW9uLm1pbm9yID09PSAwICkge1xuICAgICAgICAgICAgICAvLyBSZW1vdmUgX3BoZXQgZnJvbSBhbGwgZmlsZW5hbWVzIGluIHRoZSBwaGV0IGRpcmVjdG9yeVxuICAgICAgICAgICAgICBjb25zdCBwaGV0QnVpbGREaXIgPSBgJHtidWlsZERpcn0vcGhldGA7XG4gICAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoIHBoZXRCdWlsZERpciApO1xuICAgICAgICAgICAgICBmb3IgKCBjb25zdCBpIGluIGZpbGVzICkge1xuICAgICAgICAgICAgICAgIGlmICggZmlsZXMuaGFzT3duUHJvcGVydHkoIGkgKSApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVuYW1lID0gZmlsZXNbIGkgXTtcbiAgICAgICAgICAgICAgICAgIGlmICggZmlsZW5hbWUuaW5kZXhPZiggJ19waGV0JyApID49IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0ZpbGVuYW1lID0gZmlsZW5hbWUucmVwbGFjZSggJ19waGV0JywgJycgKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZXhlY3V0ZSggJ212JywgWyBmaWxlbmFtZSwgbmV3RmlsZW5hbWUgXSwgcGhldEJ1aWxkRGlyICk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKCBicmFuZCA9PT0gY29uc3RhbnRzLlBIRVRfSU9fQlJBTkQgKSB7XG4gICAgICAgICAgICB0YXJnZXRTaW1EaXIgPSBjb25zdGFudHMuUEhFVF9JT19TSU1TX0RJUkVDVE9SWSArIHNpbU5hbWU7XG4gICAgICAgICAgICB0YXJnZXRWZXJzaW9uRGlyID0gYCR7dGFyZ2V0U2ltRGlyfS8ke29yaWdpbmFsVmVyc2lvbn1gO1xuXG4gICAgICAgICAgICAvLyBDaGlwcGVyIDEuMCBoYXMgLXBoZXRpbyBpbiB0aGUgdmVyc2lvbiBzY2hlbWEgZm9yIFBoRVQtaU8gYnJhbmRlZCBzaW1zXG4gICAgICAgICAgICBpZiAoIGNoaXBwZXJWZXJzaW9uLm1ham9yID09PSAwICYmICFvcmlnaW5hbFZlcnNpb24ubWF0Y2goICctcGhldGlvJyApICkge1xuICAgICAgICAgICAgICB0YXJnZXRWZXJzaW9uRGlyICs9ICctcGhldGlvJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhcmdldFZlcnNpb25EaXIgKz0gJy8nO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENvcHkgc3RlcHMgLSBhbGxvdyBFRVhJU1QgZXJyb3JzIGJ1dCByZWplY3QgYW55dGhpbmcgZWxzZVxuICAgICAgICAgIHdpbnN0b24uZGVidWcoIGBDcmVhdGluZyB2ZXJzaW9uIGRpcjogJHt0YXJnZXRWZXJzaW9uRGlyfWAgKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIoIHRhcmdldFZlcnNpb25EaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0gKTtcbiAgICAgICAgICAgIHdpbnN0b24uZGVidWcoICdTdWNjZXNzIGNyZWF0aW5nIHNpbSBkaXInICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhdGNoKCBlcnIgKSB7XG4gICAgICAgICAgICBpZiAoIGVyci5jb2RlICE9PSAnRUVYSVNUJyApIHtcbiAgICAgICAgICAgICAgd2luc3Rvbi5lcnJvciggJ0ZhaWx1cmUgY3JlYXRpbmcgdmVyc2lvbiBkaXInICk7XG4gICAgICAgICAgICAgIHdpbnN0b24uZXJyb3IoIGVyciApO1xuICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGxldCBzb3VyY2VEaXIgPSBidWlsZERpcjtcbiAgICAgICAgICBpZiAoIGNoaXBwZXJWZXJzaW9uLm1ham9yID09PSAyICYmIGNoaXBwZXJWZXJzaW9uLm1pbm9yID09PSAwICkge1xuICAgICAgICAgICAgc291cmNlRGlyICs9IGAvJHticmFuZH1gO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSggKCByZXNvbHZlLCByZWplY3QgKSA9PiB7XG4gICAgICAgICAgICB3aW5zdG9uLmRlYnVnKCBgQ29weWluZyByZWN1cnNpdmUgJHtzb3VyY2VEaXJ9IHRvICR7dGFyZ2V0VmVyc2lvbkRpcn1gICk7XG4gICAgICAgICAgICBuZXcgcnN5bmMoKVxuICAgICAgICAgICAgICAuZmxhZ3MoICdyYXpwTycgKVxuICAgICAgICAgICAgICAuc2V0KCAnbm8tcGVybXMnIClcbiAgICAgICAgICAgICAgLnNldCggJ2V4Y2x1ZGUnLCAnLnJzeW5jLWZpbHRlcicgKVxuICAgICAgICAgICAgICAuc291cmNlKCBgJHtzb3VyY2VEaXJ9L2AgKVxuICAgICAgICAgICAgICAuZGVzdGluYXRpb24oIHRhcmdldFZlcnNpb25EaXIgKVxuICAgICAgICAgICAgICAub3V0cHV0KCBzdGRvdXQgPT4geyB3aW5zdG9uLmRlYnVnKCBzdGRvdXQudG9TdHJpbmcoKSApOyB9LFxuICAgICAgICAgICAgICAgIHN0ZGVyciA9PiB7IHdpbnN0b24uZXJyb3IoIHN0ZGVyci50b1N0cmluZygpICk7IH0gKVxuICAgICAgICAgICAgICAuZXhlY3V0ZSggKCBlcnIsIGNvZGUsIGNtZCApID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIGVyciAmJiBjb2RlICE9PSAyMyApIHtcbiAgICAgICAgICAgICAgICAgIHdpbnN0b24uZGVidWcoIGNvZGUgKTtcbiAgICAgICAgICAgICAgICAgIHdpbnN0b24uZGVidWcoIGNtZCApO1xuICAgICAgICAgICAgICAgICAgcmVqZWN0KCBlcnIgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7IHJlc29sdmUoKTsgfVxuICAgICAgICAgICAgICB9ICk7XG4gICAgICAgICAgfSApO1xuXG4gICAgICAgICAgd2luc3Rvbi5kZWJ1ZyggJ0NvcHkgZmluaXNoZWQnICk7XG5cbiAgICAgICAgICAvLyBQb3N0LWNvcHkgc3RlcHNcbiAgICAgICAgICBpZiAoIGJyYW5kID09PSBjb25zdGFudHMuUEhFVF9CUkFORCApIHtcbiAgICAgICAgICAgIGlmICggIWlzVHJhbnNsYXRpb25SZXF1ZXN0ICkge1xuICAgICAgICAgICAgICBhd2FpdCBkZXBsb3lJbWFnZXMoIHtcbiAgICAgICAgICAgICAgICBzaW11bGF0aW9uOiBvcHRpb25zLnNpbU5hbWUsXG4gICAgICAgICAgICAgICAgYnJhbmRzOiBvcHRpb25zLmJyYW5kcyxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBvcHRpb25zLnZlcnNpb25cbiAgICAgICAgICAgICAgfSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgd3JpdGVQaGV0SHRhY2Nlc3MoIHNpbU5hbWUsIHZlcnNpb24gKTtcbiAgICAgICAgICAgIGF3YWl0IGNyZWF0ZVRyYW5zbGF0aW9uc1hNTCggc2ltTmFtZSwgdmVyc2lvbiwgY2hlY2tvdXREaXIgKTtcblxuICAgICAgICAgICAgLy8gVGhpcyBzaG91bGQgYmUgdGhlIGxhc3QgZnVuY3Rpb24gY2FsbGVkIGZvciB0aGUgcGhldCBicmFuZC5cbiAgICAgICAgICAgIC8vIFRoaXMgdHJpZ2dlcnMgYW4gYXN5bmNyb25vdXMgdGFzayBvbiB0aGUgdG9tY2F0L3dpY2tldCBhcHBsaWNhdGlvbiBhbmQgb25seSB3YWl0cyBmb3IgYSByZXNwb25zZSB0aGF0IHRoZSByZXF1ZXN0IHdhcyByZWNlaXZlZC5cbiAgICAgICAgICAgIC8vIERvIG5vdCBhc3N1bWUgdGhhdCB0aGlzIHRhc2sgaXMgY29tcGxldGUgYmVjYXVzZSB3ZSB1c2UgYXdhaXQuXG4gICAgICAgICAgICBhd2FpdCBub3RpZnlTZXJ2ZXIoIHtcbiAgICAgICAgICAgICAgc2ltTmFtZTogc2ltTmFtZSxcbiAgICAgICAgICAgICAgZW1haWw6IGVtYWlsLFxuICAgICAgICAgICAgICBicmFuZDogYnJhbmQsXG4gICAgICAgICAgICAgIGxvY2FsZXM6IGxvY2FsZXMsXG4gICAgICAgICAgICAgIHRyYW5zbGF0b3JJZDogaXNUcmFuc2xhdGlvblJlcXVlc3QgPyB1c2VySWQgOiB1bmRlZmluZWRcbiAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgY29uc3QgbGF0ZXN0RmlsZVN5c3RlbVZlcnNpb24gPSBnZXRMYXRlc3RGaWxlU3lzdGVtUHJvZHVjdGlvblZlcnNpb24oIHRhcmdldFNpbURpciApO1xuXG4gICAgICAgICAgICAvLyBQcm9kdWN0aW9uIGRlcGxveSB0byBQaEVUIEJyYW5kIGlzIG1vc3QgbGlrZWx5IGJ1Z2d5IGlmIGRlcGxveWluZyBhIHByZXZpb3VzIG1ham9yLm1pbm9yIHZlcnNpb24uIExldCdzXG4gICAgICAgICAgICAvLyB0ZWxsIHNvbWVvbmUuXG4gICAgICAgICAgICBpZiAoIFNpbVZlcnNpb24ucGFyc2UoIHZlcnNpb24gKS5jb21wYXJlTnVtYmVyKCBsYXRlc3RGaWxlU3lzdGVtVmVyc2lvbiApIDwgMCApIHtcbiAgICAgICAgICAgICAgc2VuZEVtYWlsKCAnUGhFVCBQcm9kdWN0aW9uIERlcGxveSBvZiBvbGRlciByZWxlYXNlJyxcbiAgICAgICAgICAgICAgICBgQnVpbGQgc2VydmVyIGRlcGxveWVkICR7c2ltTmFtZX0gdmVyc2lvbjogJHt2ZXJzaW9ufSB0byBwaGV0IGJyYW5kIHByb2R1Y3Rpb24gc2l0ZSBidXQgdGhlIGxhdGVzdCB2ZXJzaW9uIGlzICR7bGF0ZXN0RmlsZVN5c3RlbVZlcnNpb259YCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICggYnJhbmQgPT09IGNvbnN0YW50cy5QSEVUX0lPX0JSQU5EICkge1xuICAgICAgICAgICAgY29uc3Qgc3VmZml4ID0gb3JpZ2luYWxWZXJzaW9uLnNwbGl0KCAnLScgKS5sZW5ndGggPj0gMiA/IG9yaWdpbmFsVmVyc2lvbi5zcGxpdCggJy0nIClbIDEgXSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAoIGNoaXBwZXJWZXJzaW9uLm1ham9yIDwgMiA/ICdwaGV0aW8nIDogJycgKTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZFZlcnNpb24gPSBTaW1WZXJzaW9uLnBhcnNlKCB2ZXJzaW9uLCAnJyApO1xuICAgICAgICAgICAgY29uc3Qgc2ltUGFja2FnZSA9IGF3YWl0IGxvYWRKU09OKCBgJHtzaW1SZXBvRGlyfS9wYWNrYWdlLmpzb25gICk7XG4gICAgICAgICAgICBjb25zdCBpZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzID0gISEoIHNpbVBhY2thZ2UgJiYgc2ltUGFja2FnZS5waGV0ICYmIHNpbVBhY2thZ2UucGhldC5pZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzICk7XG5cbiAgICAgICAgICAgIC8vIFRoaXMgdHJpZ2dlcnMgYW4gYXN5bmNyb25vdXMgdGFzayBvbiB0aGUgdG9tY2F0L3dpY2tldCBhcHBsaWNhdGlvbiBhbmQgb25seSB3YWl0cyBmb3IgYSByZXNwb25zZSB0aGF0IHRoZSByZXF1ZXN0IHdhcyByZWNlaXZlZC5cbiAgICAgICAgICAgIC8vIERvIG5vdCBhc3N1bWUgdGhhdCB0aGlzIHRhc2sgaXMgY29tcGxldGUgYmVjYXVzZSB3ZSB1c2UgYXdhaXQuXG4gICAgICAgICAgICBhd2FpdCBub3RpZnlTZXJ2ZXIoIHtcbiAgICAgICAgICAgICAgc2ltTmFtZTogc2ltTmFtZSxcbiAgICAgICAgICAgICAgZW1haWw6IGVtYWlsLFxuICAgICAgICAgICAgICBicmFuZDogYnJhbmQsXG4gICAgICAgICAgICAgIHBoZXRpb09wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBicmFuY2g6IGJyYW5jaCxcbiAgICAgICAgICAgICAgICBzdWZmaXg6IHN1ZmZpeCxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBwYXJzZWRWZXJzaW9uLFxuICAgICAgICAgICAgICAgIGlnbm9yZUZvckF1dG9tYXRlZE1haW50ZW5hbmNlUmVsZWFzZXM6IGlnbm9yZUZvckF1dG9tYXRlZE1haW50ZW5hbmNlUmVsZWFzZXNcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSApO1xuXG4gICAgICAgICAgICB3aW5zdG9uLmRlYnVnKCAnc2VydmVyIG5vdGlmaWVkJyApO1xuICAgICAgICAgICAgYXdhaXQgd3JpdGVQaGV0aW9IdGFjY2Vzcyggc2ltTmFtZSwgdGFyZ2V0VmVyc2lvbkRpciwge1xuICAgICAgICAgICAgICB2ZXJzaW9uOiBvcmlnaW5hbFZlcnNpb24sXG4gICAgICAgICAgICAgIGRpcmVjdG9yeTogY29uc3RhbnRzLlBIRVRfSU9fU0lNU19ESVJFQ1RPUlksXG4gICAgICAgICAgICAgIGNoZWNrb3V0RGlyOiBjaGVja291dERpcixcbiAgICAgICAgICAgICAgaXNQcm9kdWN0aW9uRGVwbG95OiB0cnVlXG4gICAgICAgICAgICB9ICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGF3YWl0IGFmdGVyRGVwbG95KCBgJHtidWlsZERpcn1gICk7XG4gIH1cbiAgY2F0Y2goIGVyciApIHtcbiAgICBhd2FpdCBhYm9ydEJ1aWxkKCBlcnIgKTtcbiAgfVxufVxuXG4vLyBMb29rIGF0IHRoZSBmaWxlIHN5c3RlbSBmb3IgdGhlIGRpcmVjdG9yeSB0aGF0IGhhcyB0aGUgbGF0ZXN0IHZlcnNpb24gYXMgaXRzIG5hbWUuXG5mdW5jdGlvbiBnZXRMYXRlc3RGaWxlU3lzdGVtUHJvZHVjdGlvblZlcnNpb24oIGRpclBhdGggKSB7XG4gIGNvbnN0IHZlcnNpb25EaXJSZWdleCA9IC9eXFxkK1xcLlxcZCtcXC5cXGQrJC87IC8vIHN0YXJ0IGFuZCBlbmQgbWFya2VycyBiZWNhdXNlIHdlIG9ubHkgY2FyZSBhYm91dCBwcm9kdWN0aW9uIGRlcGxveXNcbiAgY29uc3QgdmVyc2lvblN0cmluZ3MgPSBmcy5yZWFkZGlyU3luYyggZGlyUGF0aCApLmZpbHRlciggZiA9PiB2ZXJzaW9uRGlyUmVnZXgudGVzdCggZiApICk7XG4gIHJldHVybiB2ZXJzaW9uU3RyaW5ncy5tYXAoIGYgPT4gU2ltVmVyc2lvbi5wYXJzZSggZiApICkuc29ydCggU2ltVmVyc2lvbi5jb21wYXJhdG9yICkucG9wKCk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0YXNrV29ya2VyKCB0YXNrLCB0YXNrQ2FsbGJhY2sgKSB7XG4gIHJ1blRhc2soIHRhc2sgKVxuICAgIC50aGVuKCAoKSA9PiB7XG4gICAgICAgIHRhc2tDYWxsYmFjaygpO1xuICAgICAgfVxuICAgICkuY2F0Y2goIHJlYXNvbiA9PiB7XG4gICAgdGFza0NhbGxiYWNrKCByZWFzb24gKTtcbiAgfSApO1xufTsiXSwibmFtZXMiOlsiY29uc3RhbnRzIiwicmVxdWlyZSIsImNyZWF0ZVRyYW5zbGF0aW9uc1hNTCIsImRldkRlcGxveSIsImV4ZWN1dGUiLCJkZWZhdWx0IiwiZnMiLCJnZXRMb2NhbGVzIiwibm90aWZ5U2VydmVyIiwicnN5bmMiLCJTaW1WZXJzaW9uIiwid2luc3RvbiIsIndyaXRlUGhldEh0YWNjZXNzIiwid3JpdGVQaGV0aW9IdGFjY2VzcyIsImRlcGxveUltYWdlcyIsInBlcnNpc3RlbnRRdWV1ZSIsIlJlbGVhc2VCcmFuY2giLCJsb2FkSlNPTiIsInNlbmRFbWFpbCIsImFib3J0QnVpbGQiLCJlcnIiLCJsb2ciLCJzdGFjayIsIkVycm9yIiwiYWZ0ZXJEZXBsb3kiLCJidWlsZERpciIsInJ1blRhc2siLCJvcHRpb25zIiwic3RhcnRUYXNrIiwiZSIsImVycm9yIiwiYXBpIiwiZGVwZW5kZW5jaWVzIiwicmVwb3MiLCJsb2NhbGVzIiwic2ltTmFtZSIsInZlcnNpb24iLCJlbWFpbCIsImJyYW5kcyIsInNlcnZlcnMiLCJ1c2VySWQiLCJicmFuY2giLCJtYXRjaCIsInNpbU5hbWVSZWdleCIsInRlc3QiLCJrZXkiLCJoYXNPd25Qcm9wZXJ0eSIsInZhbHVlIiwiT2JqZWN0Iiwic2hhIiwib3JpZ2luYWxWZXJzaW9uIiwidmVyc2lvbk1hdGNoIiwibGVuZ3RoIiwiaW5jbHVkZXMiLCJyZWxlYXNlQnJhbmNoIiwidXBkYXRlQ2hlY2tvdXQiLCJjaGlwcGVyVmVyc2lvbiIsImdldENoaXBwZXJWZXJzaW9uIiwiZGVidWciLCJ0b1N0cmluZyIsIm1ham9yIiwibWlub3IiLCJjaGVja291dERpcmVjdG9yeSIsImdldENoZWNrb3V0RGlyZWN0b3J5IiwicGFja2FnZUpTT04iLCJKU09OIiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiLCJwYWNrYWdlVmVyc2lvbiIsImxvY2FsZXNBcnJheSIsInNwbGl0IiwiaXNUcmFuc2xhdGlvblJlcXVlc3QiLCJidWlsZCIsImNsZWFuIiwiYnVpbGRGb3JTZXJ2ZXIiLCJsaW50IiwiYWxsSFRNTCIsIlBIRVRfQlJBTkQiLCJzdHJpbmdpZnkiLCJjaGVja291dERpciIsInNpbVJlcG9EaXIiLCJpbmRleE9mIiwiREVWX1NFUlZFUiIsImluZm8iLCJQSEVUX0lPX0JSQU5EIiwiaHRhY2Nlc3NMb2NhdGlvbiIsImlzUHJvZHVjdGlvbkRlcGxveSIsIlBST0RVQ1RJT05fU0VSVkVSIiwidGFyZ2V0VmVyc2lvbkRpciIsInRhcmdldFNpbURpciIsImkiLCJicmFuZCIsIkhUTUxfU0lNU19ESVJFQ1RPUlkiLCJwaGV0QnVpbGREaXIiLCJmaWxlcyIsInJlYWRkaXJTeW5jIiwiZmlsZW5hbWUiLCJuZXdGaWxlbmFtZSIsInJlcGxhY2UiLCJQSEVUX0lPX1NJTVNfRElSRUNUT1JZIiwicHJvbWlzZXMiLCJta2RpciIsInJlY3Vyc2l2ZSIsImNvZGUiLCJzb3VyY2VEaXIiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImZsYWdzIiwic2V0Iiwic291cmNlIiwiZGVzdGluYXRpb24iLCJvdXRwdXQiLCJzdGRvdXQiLCJzdGRlcnIiLCJjbWQiLCJzaW11bGF0aW9uIiwidHJhbnNsYXRvcklkIiwidW5kZWZpbmVkIiwibGF0ZXN0RmlsZVN5c3RlbVZlcnNpb24iLCJnZXRMYXRlc3RGaWxlU3lzdGVtUHJvZHVjdGlvblZlcnNpb24iLCJjb21wYXJlTnVtYmVyIiwic3VmZml4IiwicGFyc2VkVmVyc2lvbiIsInNpbVBhY2thZ2UiLCJpZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzIiwicGhldCIsInBoZXRpb09wdGlvbnMiLCJkaXJlY3RvcnkiLCJkaXJQYXRoIiwidmVyc2lvbkRpclJlZ2V4IiwidmVyc2lvblN0cmluZ3MiLCJmaWx0ZXIiLCJmIiwibWFwIiwic29ydCIsImNvbXBhcmF0b3IiLCJwb3AiLCJtb2R1bGUiLCJleHBvcnRzIiwidGFza1dvcmtlciIsInRhc2siLCJ0YXNrQ2FsbGJhY2siLCJ0aGVuIiwiY2F0Y2giLCJyZWFzb24iXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUN0RCx5REFBeUQ7QUFHekQsTUFBTUEsWUFBWUMsUUFBUztBQUMzQixNQUFNQyx3QkFBd0JELFFBQVM7QUFDdkMsTUFBTUUsWUFBWUYsUUFBUztBQUMzQixNQUFNRyxVQUFVSCxRQUFTLHFCQUFzQkksT0FBTztBQUN0RCxNQUFNQyxLQUFLTCxRQUFTO0FBQ3BCLE1BQU1NLGFBQWFOLFFBQVM7QUFDNUIsTUFBTU8sZUFBZVAsUUFBUztBQUM5QixNQUFNUSxRQUFRUixRQUFTO0FBQ3ZCLE1BQU1TLGFBQWFULFFBQVMsa0NBQW1DSSxPQUFPO0FBQ3RFLE1BQU1NLFVBQVVWLFFBQVM7QUFDekIsTUFBTVcsb0JBQW9CWCxRQUFTO0FBQ25DLE1BQU1ZLHNCQUFzQlosUUFBUyxpQ0FBa0NJLE9BQU87QUFDOUUsTUFBTVMsZUFBZWIsUUFBUztBQUM5QixNQUFNYyxrQkFBa0JkLFFBQVM7QUFDakMsTUFBTWUsZ0JBQWdCZixRQUFTLDJCQUE0QkksT0FBTztBQUNsRSxNQUFNWSxXQUFXaEIsUUFBUztBQUMxQixNQUFNaUIsWUFBWWpCLFFBQVM7QUFFM0I7OztDQUdDLEdBQ0QsTUFBTWtCLGFBQWEsT0FBTUM7SUFDdkJULFFBQVFVLEdBQUcsQ0FBRSxTQUFTLENBQUMsZUFBZSxFQUFFRCxLQUFLO0lBQzdD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