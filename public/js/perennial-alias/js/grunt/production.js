// Copyright 2017-2026, University of Colorado Boulder
/**
 * Deploys a production version after incrementing the test version number.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const SimVersion = require('../browser-and-node/SimVersion').default;
const booleanPrompt = require('../common/booleanPrompt');
const build = require('../common/build');
const buildServerRequest = require('../common/buildServerRequest');
const checkoutMain = require('../common/checkoutMain');
const checkoutTarget = require('../common/checkoutTarget');
const execute = require('../common/execute').default;
const getDependencies = require('../common/getDependencies');
const getRepoVersion = require('../common/getRepoVersion');
const gitAdd = require('../common/gitAdd');
const gitCommit = require('../common/gitCommit');
const gitIsClean = require('../common/gitIsClean');
const gitPush = require('../common/gitPush');
const grunt = require('grunt');
const gruntCommand = require('../common/gruntCommand');
const hasRemoteBranch = require('../common/hasRemoteBranch');
const isPublished = require('../common/isPublished');
const npmUpdate = require('../common/npmUpdate');
const setRepoVersion = require('../common/setRepoVersion');
const simMetadata = require('../common/simMetadata').default;
const updateDependenciesJSON = require('../common/updateDependenciesJSON');
const vpnCheck = require('../common/vpnCheck');
const buildLocal = require('../common/buildLocal');
const assert = require('assert');
const cancelLog = (problem)=>grunt.log.writeln('Cancelling production deployment: ' + problem);
function handleError(problem) {
    cancelLog(problem);
    throw new Error('Aborted production deployment: ' + problem);
}
/**
 * Deploys a production version after incrementing the test version number.
 * @public
 *
 * @param {string} repo
 * @param {string} branch
 * @param {Array.<string>} brands
 * @param {boolean} noninteractive
 * @param {boolean} redeploy
 * @param {string} [message] - Optional message to append to the version-increment commit.
 * @returns {Promise.<SimVersion>}
 */ module.exports = async function production(repo, branch, brands, noninteractive, redeploy, message) {
    SimVersion.ensureReleaseBranch(branch);
    if (!await vpnCheck()) {
        handleError('VPN or being on campus is required for this build. Ensure VPN is enabled, or that you have access to phet-server2.int.colorado.edu');
    }
    const isClean = await gitIsClean(repo);
    if (!isClean) {
        handleError(`Unclean status in ${repo}, cannot create release branch`);
    }
    if (!await hasRemoteBranch(repo, branch)) {
        handleError(`Cannot find release branch ${branch} for ${repo}`);
    }
    if (!grunt.file.exists(`../${repo}/assets/${repo}-screenshot.png`) && brands.includes('phet')) {
        handleError(`Missing screenshot file (${repo}/assets/${repo}-screenshot.png)`);
    }
    if (!await booleanPrompt('Are QA credits up-to-date?', noninteractive)) {
        handleError('QA credits not up-to-date');
    }
    if (!await booleanPrompt('Have all maintenance patches that need spot checks been tested? (An issue would be created in the sim repo)', noninteractive)) {
        handleError('Maintenance patches are not tested');
    }
    const isFirstVersion = !(await simMetadata({
        simulation: repo
    })).projects;
    // Initial deployment nags
    if (isFirstVersion) {
        if (!await booleanPrompt('Is the main checklist complete (e.g. are screenshots added to assets, etc.)', noninteractive)) {
            handleError('Main checklist not complete');
        }
    }
    redeploy && assert(noninteractive, 'redeploy can only be specified with noninteractive:true');
    const published = await isPublished(repo);
    // npm updates are below, after all interactive prompts
    await checkoutTarget(repo, branch, false);
    try {
        const previousVersion = await getRepoVersion(repo);
        let version;
        let versionChanged;
        if (previousVersion.testType === null) {
            // redeploy flag can bypass this prompt and error
            if (!redeploy && (noninteractive || !await booleanPrompt(`The last deployment was a production deployment (${previousVersion.toString()}) and an RC version is required between production versions. Would you like to redeploy ${previousVersion.toString()} (y) or cancel this process and revert to main (N)`, false))) {
                handleError('It appears that the last deployment was for production');
            }
            version = previousVersion;
            versionChanged = false;
        } else if (previousVersion.testType === 'rc') {
            version = new SimVersion(previousVersion.major, previousVersion.minor, previousVersion.maintenance);
            versionChanged = true;
        } else {
            handleError(`The version number cannot be incremented safely: ${previousVersion}`);
        }
        const versionString = version.toString();
        // caps-lock should hopefully shout this at people. do we have a text-to-speech synthesizer we can shout out of their speakers?
        // SECOND THOUGHT: this would be horrible during automated maintenance releases.
        if (!await booleanPrompt(`DEPLOY ${repo} ${versionString} (brands: ${brands.join(',')}) to PRODUCTION`, noninteractive)) {
            handleError('"DEPLOY" user request');
        }
        if (versionChanged) {
            await setRepoVersion(repo, version, message);
            await gitPush(repo, branch);
        }
        // Make sure our correct npm dependencies are set
        await npmUpdate(repo);
        await npmUpdate('chipper');
        await npmUpdate('perennial-alias');
        // Update the README on the branch
        if (published) {
            grunt.log.writeln('Updating branch README');
            try {
                await execute(gruntCommand, [
                    'published-readme'
                ], `../${repo}`);
            } catch (e) {
                grunt.log.writeln('published-readme error, may not exist, will try generate-published-README');
                try {
                    await execute(gruntCommand, [
                        'generate-published-README'
                    ], `../${repo}`);
                } catch (e) {
                    grunt.log.writeln('No published README generation found');
                }
            }
            await gitAdd(repo, 'README.md');
            try {
                await gitCommit(repo, `Generated published README.md as part of a production deploy for ${versionString}`);
                await gitPush(repo, branch);
            } catch (e) {
                grunt.log.writeln('Production README is already up-to-date');
            }
        }
        // No special options required here, as we send the main request to the build server
        grunt.log.writeln(await build(repo, {
            brands: brands,
            minify: !noninteractive
        }));
        /**
     * The necessary clean up steps to do if aborting after the build
     */ const postBuildAbort = async (problem)=>{
            cancelLog(problem);
            // Abort version update
            if (versionChanged) {
                await setRepoVersion(repo, previousVersion, message);
                await gitPush(repo, branch);
            }
            // Abort checkout, (will be caught and main will be checked out)
            handleError(problem);
        };
        if (!await booleanPrompt(`Please test the built version of ${repo}.\nIs it ready to deploy?`, noninteractive)) {
            await postBuildAbort(`Built sim test, reverting back to ${previousVersion}`);
        }
        // Move over dependencies.json and commit/push
        await updateDependenciesJSON(repo, brands, versionString, branch);
        // Send the build request
        await buildServerRequest(repo, version, branch, await getDependencies(repo), {
            locales: '*',
            brands: brands,
            servers: [
                'dev',
                'production'
            ]
        });
        // Move back to main
        await checkoutMain(repo, true);
        if (brands.includes('phet')) {
            grunt.log.writeln(`Deployed: https://phet.colorado.edu/sims/html/${repo}/latest/${repo}_all.html`);
        }
        if (brands.includes('phet-io')) {
            grunt.log.writeln(`Deployed: https://phet-io.colorado.edu/sims/${repo}/${versionString}/`);
        }
        grunt.log.writeln('Please wait for the build-server to complete the deployment, and then test!');
        grunt.log.writeln(`To view the current build status, visit ${buildLocal.productionServerURL}/deploy-status`);
        if (isFirstVersion && brands.includes('phet')) {
            grunt.log.writeln('After testing, let the simulation lead know it has been deployed, so they can edit metadata on the website');
            // Update the README on main
            if (published) {
                grunt.log.writeln('Updating main README');
                await execute(gruntCommand, [
                    'published-readme'
                ], `../${repo}`);
                await gitAdd(repo, 'README.md');
                try {
                    await gitCommit(repo, `Generated published README.md as part of a production deploy for ${versionString}`);
                    await gitPush(repo, 'main');
                } catch (e) {
                    grunt.log.writeln('Production README is already up-to-date');
                }
            }
        }
        // phet-io nags from the checklist
        if (brands.includes('phet-io')) {
            const phetioLogText = 'PhET-iO deploys involve a couple of extra steps after production. Create an issue in the ' + 'phet-io repo using the "New or Republished PhET-iO Simulation Publication" issue template ' + 'to make sure these are accomplished. Assign yourself for "developer" steps.';
            grunt.log.writeln(phetioLogText);
        }
        return version;
    } catch (e) {
        grunt.log.warn('Detected failure during deploy, reverting to main');
        await checkoutMain(repo, true);
        throw e;
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9ncnVudC9wcm9kdWN0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIERlcGxveXMgYSBwcm9kdWN0aW9uIHZlcnNpb24gYWZ0ZXIgaW5jcmVtZW50aW5nIHRoZSB0ZXN0IHZlcnNpb24gbnVtYmVyLlxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgU2ltVmVyc2lvbiA9IHJlcXVpcmUoICcuLi9icm93c2VyLWFuZC1ub2RlL1NpbVZlcnNpb24nICkuZGVmYXVsdDtcbmNvbnN0IGJvb2xlYW5Qcm9tcHQgPSByZXF1aXJlKCAnLi4vY29tbW9uL2Jvb2xlYW5Qcm9tcHQnICk7XG5jb25zdCBidWlsZCA9IHJlcXVpcmUoICcuLi9jb21tb24vYnVpbGQnICk7XG5jb25zdCBidWlsZFNlcnZlclJlcXVlc3QgPSByZXF1aXJlKCAnLi4vY29tbW9uL2J1aWxkU2VydmVyUmVxdWVzdCcgKTtcbmNvbnN0IGNoZWNrb3V0TWFpbiA9IHJlcXVpcmUoICcuLi9jb21tb24vY2hlY2tvdXRNYWluJyApO1xuY29uc3QgY2hlY2tvdXRUYXJnZXQgPSByZXF1aXJlKCAnLi4vY29tbW9uL2NoZWNrb3V0VGFyZ2V0JyApO1xuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuLi9jb21tb24vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3QgZ2V0RGVwZW5kZW5jaWVzID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXREZXBlbmRlbmNpZXMnICk7XG5jb25zdCBnZXRSZXBvVmVyc2lvbiA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2V0UmVwb1ZlcnNpb24nICk7XG5jb25zdCBnaXRBZGQgPSByZXF1aXJlKCAnLi4vY29tbW9uL2dpdEFkZCcgKTtcbmNvbnN0IGdpdENvbW1pdCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0Q29tbWl0JyApO1xuY29uc3QgZ2l0SXNDbGVhbiA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0SXNDbGVhbicgKTtcbmNvbnN0IGdpdFB1c2ggPSByZXF1aXJlKCAnLi4vY29tbW9uL2dpdFB1c2gnICk7XG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcbmNvbnN0IGdydW50Q29tbWFuZCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ3J1bnRDb21tYW5kJyApO1xuY29uc3QgaGFzUmVtb3RlQnJhbmNoID0gcmVxdWlyZSggJy4uL2NvbW1vbi9oYXNSZW1vdGVCcmFuY2gnICk7XG5jb25zdCBpc1B1Ymxpc2hlZCA9IHJlcXVpcmUoICcuLi9jb21tb24vaXNQdWJsaXNoZWQnICk7XG5jb25zdCBucG1VcGRhdGUgPSByZXF1aXJlKCAnLi4vY29tbW9uL25wbVVwZGF0ZScgKTtcbmNvbnN0IHNldFJlcG9WZXJzaW9uID0gcmVxdWlyZSggJy4uL2NvbW1vbi9zZXRSZXBvVmVyc2lvbicgKTtcbmNvbnN0IHNpbU1ldGFkYXRhID0gcmVxdWlyZSggJy4uL2NvbW1vbi9zaW1NZXRhZGF0YScgKS5kZWZhdWx0O1xuY29uc3QgdXBkYXRlRGVwZW5kZW5jaWVzSlNPTiA9IHJlcXVpcmUoICcuLi9jb21tb24vdXBkYXRlRGVwZW5kZW5jaWVzSlNPTicgKTtcbmNvbnN0IHZwbkNoZWNrID0gcmVxdWlyZSggJy4uL2NvbW1vbi92cG5DaGVjaycgKTtcbmNvbnN0IGJ1aWxkTG9jYWwgPSByZXF1aXJlKCAnLi4vY29tbW9uL2J1aWxkTG9jYWwnICk7XG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xuXG5jb25zdCBjYW5jZWxMb2cgPSBwcm9ibGVtID0+IGdydW50LmxvZy53cml0ZWxuKCAnQ2FuY2VsbGluZyBwcm9kdWN0aW9uIGRlcGxveW1lbnQ6ICcgKyBwcm9ibGVtICk7XG5cbmZ1bmN0aW9uIGhhbmRsZUVycm9yKCBwcm9ibGVtICkge1xuICBjYW5jZWxMb2coIHByb2JsZW0gKTtcbiAgdGhyb3cgbmV3IEVycm9yKCAnQWJvcnRlZCBwcm9kdWN0aW9uIGRlcGxveW1lbnQ6ICcgKyBwcm9ibGVtICk7XG59XG5cbi8qKlxuICogRGVwbG95cyBhIHByb2R1Y3Rpb24gdmVyc2lvbiBhZnRlciBpbmNyZW1lbnRpbmcgdGhlIHRlc3QgdmVyc2lvbiBudW1iZXIuXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9cbiAqIEBwYXJhbSB7c3RyaW5nfSBicmFuY2hcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGJyYW5kc1xuICogQHBhcmFtIHtib29sZWFufSBub25pbnRlcmFjdGl2ZVxuICogQHBhcmFtIHtib29sZWFufSByZWRlcGxveVxuICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIE9wdGlvbmFsIG1lc3NhZ2UgdG8gYXBwZW5kIHRvIHRoZSB2ZXJzaW9uLWluY3JlbWVudCBjb21taXQuXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48U2ltVmVyc2lvbj59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gcHJvZHVjdGlvbiggcmVwbywgYnJhbmNoLCBicmFuZHMsIG5vbmludGVyYWN0aXZlLCByZWRlcGxveSwgbWVzc2FnZSApIHtcbiAgU2ltVmVyc2lvbi5lbnN1cmVSZWxlYXNlQnJhbmNoKCBicmFuY2ggKTtcblxuICBpZiAoICEoIGF3YWl0IHZwbkNoZWNrKCkgKSApIHtcbiAgICBoYW5kbGVFcnJvciggJ1ZQTiBvciBiZWluZyBvbiBjYW1wdXMgaXMgcmVxdWlyZWQgZm9yIHRoaXMgYnVpbGQuIEVuc3VyZSBWUE4gaXMgZW5hYmxlZCwgb3IgdGhhdCB5b3UgaGF2ZSBhY2Nlc3MgdG8gcGhldC1zZXJ2ZXIyLmludC5jb2xvcmFkby5lZHUnICk7XG4gIH1cblxuICBjb25zdCBpc0NsZWFuID0gYXdhaXQgZ2l0SXNDbGVhbiggcmVwbyApO1xuICBpZiAoICFpc0NsZWFuICkge1xuICAgIGhhbmRsZUVycm9yKCBgVW5jbGVhbiBzdGF0dXMgaW4gJHtyZXBvfSwgY2Fubm90IGNyZWF0ZSByZWxlYXNlIGJyYW5jaGAgKTtcbiAgfVxuXG4gIGlmICggISggYXdhaXQgaGFzUmVtb3RlQnJhbmNoKCByZXBvLCBicmFuY2ggKSApICkge1xuICAgIGhhbmRsZUVycm9yKCBgQ2Fubm90IGZpbmQgcmVsZWFzZSBicmFuY2ggJHticmFuY2h9IGZvciAke3JlcG99YCApO1xuICB9XG5cbiAgaWYgKCAhZ3J1bnQuZmlsZS5leGlzdHMoIGAuLi8ke3JlcG99L2Fzc2V0cy8ke3JlcG99LXNjcmVlbnNob3QucG5nYCApICYmIGJyYW5kcy5pbmNsdWRlcyggJ3BoZXQnICkgKSB7XG4gICAgaGFuZGxlRXJyb3IoIGBNaXNzaW5nIHNjcmVlbnNob3QgZmlsZSAoJHtyZXBvfS9hc3NldHMvJHtyZXBvfS1zY3JlZW5zaG90LnBuZylgICk7XG4gIH1cblxuICBpZiAoICFhd2FpdCBib29sZWFuUHJvbXB0KCAnQXJlIFFBIGNyZWRpdHMgdXAtdG8tZGF0ZT8nLCBub25pbnRlcmFjdGl2ZSApICkge1xuICAgIGhhbmRsZUVycm9yKCAnUUEgY3JlZGl0cyBub3QgdXAtdG8tZGF0ZScgKTtcbiAgfVxuXG4gIGlmICggIWF3YWl0IGJvb2xlYW5Qcm9tcHQoICdIYXZlIGFsbCBtYWludGVuYW5jZSBwYXRjaGVzIHRoYXQgbmVlZCBzcG90IGNoZWNrcyBiZWVuIHRlc3RlZD8gKEFuIGlzc3VlIHdvdWxkIGJlIGNyZWF0ZWQgaW4gdGhlIHNpbSByZXBvKScsIG5vbmludGVyYWN0aXZlICkgKSB7XG4gICAgaGFuZGxlRXJyb3IoICdNYWludGVuYW5jZSBwYXRjaGVzIGFyZSBub3QgdGVzdGVkJyApO1xuICB9XG5cbiAgY29uc3QgaXNGaXJzdFZlcnNpb24gPSAhKCBhd2FpdCBzaW1NZXRhZGF0YSgge1xuICAgIHNpbXVsYXRpb246IHJlcG9cbiAgfSApICkucHJvamVjdHM7XG5cbiAgLy8gSW5pdGlhbCBkZXBsb3ltZW50IG5hZ3NcbiAgaWYgKCBpc0ZpcnN0VmVyc2lvbiApIHtcbiAgICBpZiAoICFhd2FpdCBib29sZWFuUHJvbXB0KCAnSXMgdGhlIG1haW4gY2hlY2tsaXN0IGNvbXBsZXRlIChlLmcuIGFyZSBzY3JlZW5zaG90cyBhZGRlZCB0byBhc3NldHMsIGV0Yy4pJywgbm9uaW50ZXJhY3RpdmUgKSApIHtcbiAgICAgIGhhbmRsZUVycm9yKCAnTWFpbiBjaGVja2xpc3Qgbm90IGNvbXBsZXRlJyApO1xuICAgIH1cbiAgfVxuXG4gIHJlZGVwbG95ICYmIGFzc2VydCggbm9uaW50ZXJhY3RpdmUsICdyZWRlcGxveSBjYW4gb25seSBiZSBzcGVjaWZpZWQgd2l0aCBub25pbnRlcmFjdGl2ZTp0cnVlJyApO1xuXG4gIGNvbnN0IHB1Ymxpc2hlZCA9IGF3YWl0IGlzUHVibGlzaGVkKCByZXBvICk7XG5cbiAgLy8gbnBtIHVwZGF0ZXMgYXJlIGJlbG93LCBhZnRlciBhbGwgaW50ZXJhY3RpdmUgcHJvbXB0c1xuICBhd2FpdCBjaGVja291dFRhcmdldCggcmVwbywgYnJhbmNoLCBmYWxzZSApO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcHJldmlvdXNWZXJzaW9uID0gYXdhaXQgZ2V0UmVwb1ZlcnNpb24oIHJlcG8gKTtcbiAgICBsZXQgdmVyc2lvbjtcbiAgICBsZXQgdmVyc2lvbkNoYW5nZWQ7XG5cbiAgICBpZiAoIHByZXZpb3VzVmVyc2lvbi50ZXN0VHlwZSA9PT0gbnVsbCApIHtcblxuICAgICAgLy8gcmVkZXBsb3kgZmxhZyBjYW4gYnlwYXNzIHRoaXMgcHJvbXB0IGFuZCBlcnJvclxuICAgICAgaWYgKCAhcmVkZXBsb3kgJiYgKCBub25pbnRlcmFjdGl2ZSB8fCAhYXdhaXQgYm9vbGVhblByb21wdCggYFRoZSBsYXN0IGRlcGxveW1lbnQgd2FzIGEgcHJvZHVjdGlvbiBkZXBsb3ltZW50ICgke3ByZXZpb3VzVmVyc2lvbi50b1N0cmluZygpfSkgYW5kIGFuIFJDIHZlcnNpb24gaXMgcmVxdWlyZWQgYmV0d2VlbiBwcm9kdWN0aW9uIHZlcnNpb25zLiBXb3VsZCB5b3UgbGlrZSB0byByZWRlcGxveSAke3ByZXZpb3VzVmVyc2lvbi50b1N0cmluZygpfSAoeSkgb3IgY2FuY2VsIHRoaXMgcHJvY2VzcyBhbmQgcmV2ZXJ0IHRvIG1haW4gKE4pYCwgZmFsc2UgKSApICkge1xuICAgICAgICBoYW5kbGVFcnJvciggJ0l0IGFwcGVhcnMgdGhhdCB0aGUgbGFzdCBkZXBsb3ltZW50IHdhcyBmb3IgcHJvZHVjdGlvbicgKTtcbiAgICAgIH1cblxuICAgICAgdmVyc2lvbiA9IHByZXZpb3VzVmVyc2lvbjtcbiAgICAgIHZlcnNpb25DaGFuZ2VkID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKCBwcmV2aW91c1ZlcnNpb24udGVzdFR5cGUgPT09ICdyYycgKSB7XG4gICAgICB2ZXJzaW9uID0gbmV3IFNpbVZlcnNpb24oIHByZXZpb3VzVmVyc2lvbi5tYWpvciwgcHJldmlvdXNWZXJzaW9uLm1pbm9yLCBwcmV2aW91c1ZlcnNpb24ubWFpbnRlbmFuY2UgKTtcbiAgICAgIHZlcnNpb25DaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBoYW5kbGVFcnJvciggYFRoZSB2ZXJzaW9uIG51bWJlciBjYW5ub3QgYmUgaW5jcmVtZW50ZWQgc2FmZWx5OiAke3ByZXZpb3VzVmVyc2lvbn1gICk7XG4gICAgfVxuXG4gICAgY29uc3QgdmVyc2lvblN0cmluZyA9IHZlcnNpb24udG9TdHJpbmcoKTtcblxuICAgIC8vIGNhcHMtbG9jayBzaG91bGQgaG9wZWZ1bGx5IHNob3V0IHRoaXMgYXQgcGVvcGxlLiBkbyB3ZSBoYXZlIGEgdGV4dC10by1zcGVlY2ggc3ludGhlc2l6ZXIgd2UgY2FuIHNob3V0IG91dCBvZiB0aGVpciBzcGVha2Vycz9cbiAgICAvLyBTRUNPTkQgVEhPVUdIVDogdGhpcyB3b3VsZCBiZSBob3JyaWJsZSBkdXJpbmcgYXV0b21hdGVkIG1haW50ZW5hbmNlIHJlbGVhc2VzLlxuICAgIGlmICggIWF3YWl0IGJvb2xlYW5Qcm9tcHQoIGBERVBMT1kgJHtyZXBvfSAke3ZlcnNpb25TdHJpbmd9IChicmFuZHM6ICR7YnJhbmRzLmpvaW4oICcsJyApfSkgdG8gUFJPRFVDVElPTmAsIG5vbmludGVyYWN0aXZlICkgKSB7XG4gICAgICBoYW5kbGVFcnJvciggJ1wiREVQTE9ZXCIgdXNlciByZXF1ZXN0JyApO1xuICAgIH1cblxuICAgIGlmICggdmVyc2lvbkNoYW5nZWQgKSB7XG4gICAgICBhd2FpdCBzZXRSZXBvVmVyc2lvbiggcmVwbywgdmVyc2lvbiwgbWVzc2FnZSApO1xuICAgICAgYXdhaXQgZ2l0UHVzaCggcmVwbywgYnJhbmNoICk7XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIG91ciBjb3JyZWN0IG5wbSBkZXBlbmRlbmNpZXMgYXJlIHNldFxuICAgIGF3YWl0IG5wbVVwZGF0ZSggcmVwbyApO1xuICAgIGF3YWl0IG5wbVVwZGF0ZSggJ2NoaXBwZXInICk7XG4gICAgYXdhaXQgbnBtVXBkYXRlKCAncGVyZW5uaWFsLWFsaWFzJyApO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBSRUFETUUgb24gdGhlIGJyYW5jaFxuICAgIGlmICggcHVibGlzaGVkICkge1xuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICdVcGRhdGluZyBicmFuY2ggUkVBRE1FJyApO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZXhlY3V0ZSggZ3J1bnRDb21tYW5kLCBbICdwdWJsaXNoZWQtcmVhZG1lJyBdLCBgLi4vJHtyZXBvfWAgKTtcbiAgICAgIH1cbiAgICAgIGNhdGNoKCBlICkge1xuICAgICAgICBncnVudC5sb2cud3JpdGVsbiggJ3B1Ymxpc2hlZC1yZWFkbWUgZXJyb3IsIG1heSBub3QgZXhpc3QsIHdpbGwgdHJ5IGdlbmVyYXRlLXB1Ymxpc2hlZC1SRUFETUUnICk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgZXhlY3V0ZSggZ3J1bnRDb21tYW5kLCBbICdnZW5lcmF0ZS1wdWJsaXNoZWQtUkVBRE1FJyBdLCBgLi4vJHtyZXBvfWAgKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCggZSApIHtcbiAgICAgICAgICBncnVudC5sb2cud3JpdGVsbiggJ05vIHB1Ymxpc2hlZCBSRUFETUUgZ2VuZXJhdGlvbiBmb3VuZCcgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgZ2l0QWRkKCByZXBvLCAnUkVBRE1FLm1kJyApO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZ2l0Q29tbWl0KCByZXBvLCBgR2VuZXJhdGVkIHB1Ymxpc2hlZCBSRUFETUUubWQgYXMgcGFydCBvZiBhIHByb2R1Y3Rpb24gZGVwbG95IGZvciAke3ZlcnNpb25TdHJpbmd9YCApO1xuICAgICAgICBhd2FpdCBnaXRQdXNoKCByZXBvLCBicmFuY2ggKTtcbiAgICAgIH1cbiAgICAgIGNhdGNoKCBlICkge1xuICAgICAgICBncnVudC5sb2cud3JpdGVsbiggJ1Byb2R1Y3Rpb24gUkVBRE1FIGlzIGFscmVhZHkgdXAtdG8tZGF0ZScgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBObyBzcGVjaWFsIG9wdGlvbnMgcmVxdWlyZWQgaGVyZSwgYXMgd2Ugc2VuZCB0aGUgbWFpbiByZXF1ZXN0IHRvIHRoZSBidWlsZCBzZXJ2ZXJcbiAgICBncnVudC5sb2cud3JpdGVsbiggYXdhaXQgYnVpbGQoIHJlcG8sIHtcbiAgICAgIGJyYW5kczogYnJhbmRzLFxuICAgICAgbWluaWZ5OiAhbm9uaW50ZXJhY3RpdmVcbiAgICB9ICkgKTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBuZWNlc3NhcnkgY2xlYW4gdXAgc3RlcHMgdG8gZG8gaWYgYWJvcnRpbmcgYWZ0ZXIgdGhlIGJ1aWxkXG4gICAgICovXG4gICAgY29uc3QgcG9zdEJ1aWxkQWJvcnQgPSBhc3luYyBwcm9ibGVtID0+IHtcbiAgICAgIGNhbmNlbExvZyggcHJvYmxlbSApO1xuXG4gICAgICAvLyBBYm9ydCB2ZXJzaW9uIHVwZGF0ZVxuICAgICAgaWYgKCB2ZXJzaW9uQ2hhbmdlZCApIHtcbiAgICAgICAgYXdhaXQgc2V0UmVwb1ZlcnNpb24oIHJlcG8sIHByZXZpb3VzVmVyc2lvbiwgbWVzc2FnZSApO1xuICAgICAgICBhd2FpdCBnaXRQdXNoKCByZXBvLCBicmFuY2ggKTtcbiAgICAgIH1cblxuICAgICAgLy8gQWJvcnQgY2hlY2tvdXQsICh3aWxsIGJlIGNhdWdodCBhbmQgbWFpbiB3aWxsIGJlIGNoZWNrZWQgb3V0KVxuICAgICAgaGFuZGxlRXJyb3IoIHByb2JsZW0gKTtcbiAgICB9O1xuXG5cbiAgICBpZiAoICFhd2FpdCBib29sZWFuUHJvbXB0KCBgUGxlYXNlIHRlc3QgdGhlIGJ1aWx0IHZlcnNpb24gb2YgJHtyZXBvfS5cXG5JcyBpdCByZWFkeSB0byBkZXBsb3k/YCwgbm9uaW50ZXJhY3RpdmUgKSApIHtcbiAgICAgIGF3YWl0IHBvc3RCdWlsZEFib3J0KCBgQnVpbHQgc2ltIHRlc3QsIHJldmVydGluZyBiYWNrIHRvICR7cHJldmlvdXNWZXJzaW9ufWAgKTtcbiAgICB9XG5cbiAgICAvLyBNb3ZlIG92ZXIgZGVwZW5kZW5jaWVzLmpzb24gYW5kIGNvbW1pdC9wdXNoXG4gICAgYXdhaXQgdXBkYXRlRGVwZW5kZW5jaWVzSlNPTiggcmVwbywgYnJhbmRzLCB2ZXJzaW9uU3RyaW5nLCBicmFuY2ggKTtcblxuICAgIC8vIFNlbmQgdGhlIGJ1aWxkIHJlcXVlc3RcbiAgICBhd2FpdCBidWlsZFNlcnZlclJlcXVlc3QoIHJlcG8sIHZlcnNpb24sIGJyYW5jaCwgYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCByZXBvICksIHtcbiAgICAgIGxvY2FsZXM6ICcqJyxcbiAgICAgIGJyYW5kczogYnJhbmRzLFxuICAgICAgc2VydmVyczogWyAnZGV2JywgJ3Byb2R1Y3Rpb24nIF1cbiAgICB9ICk7XG5cbiAgICAvLyBNb3ZlIGJhY2sgdG8gbWFpblxuICAgIGF3YWl0IGNoZWNrb3V0TWFpbiggcmVwbywgdHJ1ZSApO1xuXG4gICAgaWYgKCBicmFuZHMuaW5jbHVkZXMoICdwaGV0JyApICkge1xuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIGBEZXBsb3llZDogaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdS9zaW1zL2h0bWwvJHtyZXBvfS9sYXRlc3QvJHtyZXBvfV9hbGwuaHRtbGAgKTtcbiAgICB9XG4gICAgaWYgKCBicmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApICkge1xuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIGBEZXBsb3llZDogaHR0cHM6Ly9waGV0LWlvLmNvbG9yYWRvLmVkdS9zaW1zLyR7cmVwb30vJHt2ZXJzaW9uU3RyaW5nfS9gICk7XG4gICAgfVxuXG4gICAgZ3J1bnQubG9nLndyaXRlbG4oICdQbGVhc2Ugd2FpdCBmb3IgdGhlIGJ1aWxkLXNlcnZlciB0byBjb21wbGV0ZSB0aGUgZGVwbG95bWVudCwgYW5kIHRoZW4gdGVzdCEnICk7XG4gICAgZ3J1bnQubG9nLndyaXRlbG4oIGBUbyB2aWV3IHRoZSBjdXJyZW50IGJ1aWxkIHN0YXR1cywgdmlzaXQgJHtidWlsZExvY2FsLnByb2R1Y3Rpb25TZXJ2ZXJVUkx9L2RlcGxveS1zdGF0dXNgICk7XG5cbiAgICBpZiAoIGlzRmlyc3RWZXJzaW9uICYmIGJyYW5kcy5pbmNsdWRlcyggJ3BoZXQnICkgKSB7XG4gICAgICBncnVudC5sb2cud3JpdGVsbiggJ0FmdGVyIHRlc3RpbmcsIGxldCB0aGUgc2ltdWxhdGlvbiBsZWFkIGtub3cgaXQgaGFzIGJlZW4gZGVwbG95ZWQsIHNvIHRoZXkgY2FuIGVkaXQgbWV0YWRhdGEgb24gdGhlIHdlYnNpdGUnICk7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgUkVBRE1FIG9uIG1haW5cbiAgICAgIGlmICggcHVibGlzaGVkICkge1xuICAgICAgICBncnVudC5sb2cud3JpdGVsbiggJ1VwZGF0aW5nIG1haW4gUkVBRE1FJyApO1xuICAgICAgICBhd2FpdCBleGVjdXRlKCBncnVudENvbW1hbmQsIFsgJ3B1Ymxpc2hlZC1yZWFkbWUnIF0sIGAuLi8ke3JlcG99YCApO1xuICAgICAgICBhd2FpdCBnaXRBZGQoIHJlcG8sICdSRUFETUUubWQnICk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgZ2l0Q29tbWl0KCByZXBvLCBgR2VuZXJhdGVkIHB1Ymxpc2hlZCBSRUFETUUubWQgYXMgcGFydCBvZiBhIHByb2R1Y3Rpb24gZGVwbG95IGZvciAke3ZlcnNpb25TdHJpbmd9YCApO1xuICAgICAgICAgIGF3YWl0IGdpdFB1c2goIHJlcG8sICdtYWluJyApO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoKCBlICkge1xuICAgICAgICAgIGdydW50LmxvZy53cml0ZWxuKCAnUHJvZHVjdGlvbiBSRUFETUUgaXMgYWxyZWFkeSB1cC10by1kYXRlJyApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcGhldC1pbyBuYWdzIGZyb20gdGhlIGNoZWNrbGlzdFxuICAgIGlmICggYnJhbmRzLmluY2x1ZGVzKCAncGhldC1pbycgKSApIHtcbiAgICAgIGNvbnN0IHBoZXRpb0xvZ1RleHQgPSAnUGhFVC1pTyBkZXBsb3lzIGludm9sdmUgYSBjb3VwbGUgb2YgZXh0cmEgc3RlcHMgYWZ0ZXIgcHJvZHVjdGlvbi4gQ3JlYXRlIGFuIGlzc3VlIGluIHRoZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAncGhldC1pbyByZXBvIHVzaW5nIHRoZSBcIk5ldyBvciBSZXB1Ymxpc2hlZCBQaEVULWlPIFNpbXVsYXRpb24gUHVibGljYXRpb25cIiBpc3N1ZSB0ZW1wbGF0ZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndG8gbWFrZSBzdXJlIHRoZXNlIGFyZSBhY2NvbXBsaXNoZWQuIEFzc2lnbiB5b3Vyc2VsZiBmb3IgXCJkZXZlbG9wZXJcIiBzdGVwcy4nO1xuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIHBoZXRpb0xvZ1RleHQgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmVyc2lvbjtcbiAgfVxuICBjYXRjaCggZSApIHtcbiAgICBncnVudC5sb2cud2FybiggJ0RldGVjdGVkIGZhaWx1cmUgZHVyaW5nIGRlcGxveSwgcmV2ZXJ0aW5nIHRvIG1haW4nICk7XG4gICAgYXdhaXQgY2hlY2tvdXRNYWluKCByZXBvLCB0cnVlICk7XG4gICAgdGhyb3cgZTtcbiAgfVxufTsiXSwibmFtZXMiOlsiU2ltVmVyc2lvbiIsInJlcXVpcmUiLCJkZWZhdWx0IiwiYm9vbGVhblByb21wdCIsImJ1aWxkIiwiYnVpbGRTZXJ2ZXJSZXF1ZXN0IiwiY2hlY2tvdXRNYWluIiwiY2hlY2tvdXRUYXJnZXQiLCJleGVjdXRlIiwiZ2V0RGVwZW5kZW5jaWVzIiwiZ2V0UmVwb1ZlcnNpb24iLCJnaXRBZGQiLCJnaXRDb21taXQiLCJnaXRJc0NsZWFuIiwiZ2l0UHVzaCIsImdydW50IiwiZ3J1bnRDb21tYW5kIiwiaGFzUmVtb3RlQnJhbmNoIiwiaXNQdWJsaXNoZWQiLCJucG1VcGRhdGUiLCJzZXRSZXBvVmVyc2lvbiIsInNpbU1ldGFkYXRhIiwidXBkYXRlRGVwZW5kZW5jaWVzSlNPTiIsInZwbkNoZWNrIiwiYnVpbGRMb2NhbCIsImFzc2VydCIsImNhbmNlbExvZyIsInByb2JsZW0iLCJsb2ciLCJ3cml0ZWxuIiwiaGFuZGxlRXJyb3IiLCJFcnJvciIsIm1vZHVsZSIsImV4cG9ydHMiLCJwcm9kdWN0aW9uIiwicmVwbyIsImJyYW5jaCIsImJyYW5kcyIsIm5vbmludGVyYWN0aXZlIiwicmVkZXBsb3kiLCJtZXNzYWdlIiwiZW5zdXJlUmVsZWFzZUJyYW5jaCIsImlzQ2xlYW4iLCJmaWxlIiwiZXhpc3RzIiwiaW5jbHVkZXMiLCJpc0ZpcnN0VmVyc2lvbiIsInNpbXVsYXRpb24iLCJwcm9qZWN0cyIsInB1Ymxpc2hlZCIsInByZXZpb3VzVmVyc2lvbiIsInZlcnNpb24iLCJ2ZXJzaW9uQ2hhbmdlZCIsInRlc3RUeXBlIiwidG9TdHJpbmciLCJtYWpvciIsIm1pbm9yIiwibWFpbnRlbmFuY2UiLCJ2ZXJzaW9uU3RyaW5nIiwiam9pbiIsImUiLCJtaW5pZnkiLCJwb3N0QnVpbGRBYm9ydCIsImxvY2FsZXMiLCJzZXJ2ZXJzIiwicHJvZHVjdGlvblNlcnZlclVSTCIsInBoZXRpb0xvZ1RleHQiLCJ3YXJuIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLGFBQWFDLFFBQVMsa0NBQW1DQyxPQUFPO0FBQ3RFLE1BQU1DLGdCQUFnQkYsUUFBUztBQUMvQixNQUFNRyxRQUFRSCxRQUFTO0FBQ3ZCLE1BQU1JLHFCQUFxQkosUUFBUztBQUNwQyxNQUFNSyxlQUFlTCxRQUFTO0FBQzlCLE1BQU1NLGlCQUFpQk4sUUFBUztBQUNoQyxNQUFNTyxVQUFVUCxRQUFTLHFCQUFzQkMsT0FBTztBQUN0RCxNQUFNTyxrQkFBa0JSLFFBQVM7QUFDakMsTUFBTVMsaUJBQWlCVCxRQUFTO0FBQ2hDLE1BQU1VLFNBQVNWLFFBQVM7QUFDeEIsTUFBTVcsWUFBWVgsUUFBUztBQUMzQixNQUFNWSxhQUFhWixRQUFTO0FBQzVCLE1BQU1hLFVBQVViLFFBQVM7QUFDekIsTUFBTWMsUUFBUWQsUUFBUztBQUN2QixNQUFNZSxlQUFlZixRQUFTO0FBQzlCLE1BQU1nQixrQkFBa0JoQixRQUFTO0FBQ2pDLE1BQU1pQixjQUFjakIsUUFBUztBQUM3QixNQUFNa0IsWUFBWWxCLFFBQVM7QUFDM0IsTUFBTW1CLGlCQUFpQm5CLFFBQVM7QUFDaEMsTUFBTW9CLGNBQWNwQixRQUFTLHlCQUEwQkMsT0FBTztBQUM5RCxNQUFNb0IseUJBQXlCckIsUUFBUztBQUN4QyxNQUFNc0IsV0FBV3RCLFFBQVM7QUFDMUIsTUFBTXVCLGFBQWF2QixRQUFTO0FBQzVCLE1BQU13QixTQUFTeEIsUUFBUztBQUV4QixNQUFNeUIsWUFBWUMsQ0FBQUEsVUFBV1osTUFBTWEsR0FBRyxDQUFDQyxPQUFPLENBQUUsdUNBQXVDRjtBQUV2RixTQUFTRyxZQUFhSCxPQUFPO0lBQzNCRCxVQUFXQztJQUNYLE1BQU0sSUFBSUksTUFBTyxvQ0FBb0NK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