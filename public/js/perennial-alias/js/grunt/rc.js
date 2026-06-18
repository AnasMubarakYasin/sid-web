// Copyright 2017-2026, University of Colorado Boulder
/**
 * Deploys an rc version after incrementing the test version number.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const SimVersion = require('../browser-and-node/SimVersion').default;
const booleanPrompt = require('../common/booleanPrompt');
const build = require('../common/build');
const buildLocal = require('../common/buildLocal');
const buildServerRequest = require('../common/buildServerRequest');
const checkoutMain = require('../common/checkoutMain');
const checkoutTarget = require('../common/checkoutTarget');
const devDirectoryExists = require('../common/devDirectoryExists');
const getDependencies = require('../common/getDependencies');
const getRepoVersion = require('../common/getRepoVersion');
const gitCheckout = require('../common/gitCheckout');
const gitIsClean = require('../common/gitIsClean');
const gitPush = require('../common/gitPush');
const hasRemoteBranch = require('../common/hasRemoteBranch');
const loadJSON = require('../common/loadJSON');
const npmUpdate = require('../common/npmUpdate');
const setRepoVersion = require('../common/setRepoVersion');
const updateDependenciesJSON = require('../common/updateDependenciesJSON');
const vpnCheck = require('../common/vpnCheck');
const createRelease = require('./createRelease');
const grunt = require('grunt');
const cancelLog = (problem)=>grunt.log.writeln('Cancelling RC deployment: ' + problem);
const handleError = (problem)=>{
    cancelLog(problem);
    throw new Error('Aborted RC deployment: ' + problem);
};
/**
 * Deploys an rc version after incrementing the test version number.
 * @public
 *
 * @param {string} repo
 * @param {string} branch
 * @param {Array.<string>} brands
 * @param {boolean} noninteractive
 * @param {string} [message] - Optional message to append to the version-increment commit.
 * @returns {Promise.<SimVersion>}
 */ module.exports = async function rc(repo, branch, brands, noninteractive, message) {
    SimVersion.ensureReleaseBranch(branch);
    if (!await vpnCheck()) {
        handleError('VPN or being on campus is required for this build. Ensure VPN is enabled, or that you have access to phet-server2.int.colorado.edu');
    }
    const isClean = await gitIsClean(repo);
    if (!isClean) {
        handleError(`Unclean status in ${repo}, cannot create release branch`);
    }
    if (!await hasRemoteBranch(repo, branch)) {
        if (noninteractive || !await booleanPrompt(`Release branch ${branch} does not exist. Create it?`, false)) {
            handleError('Release branch does not exist');
        }
        await createRelease(repo, branch, brands);
    }
    // PhET-iO simulations require validation for RCs. Error out if "phet.phet-io.validation=false" is in package.json.
    await gitCheckout(repo, branch);
    if (brands.includes('phet-io')) {
        const packageObject = await loadJSON(`../${repo}/package.json`);
        if (packageObject.phet['phet-io'] && packageObject.phet['phet-io'].hasOwnProperty('validation') && !packageObject.phet['phet-io'].validation) {
            handleError('PhET-iO simulations require validation for RCs');
        }
    }
    // npm updates are below, after all interactive prompts
    await checkoutTarget(repo, branch, false);
    try {
        const previousVersion = await getRepoVersion(repo);
        if (previousVersion.testType !== 'rc' && previousVersion.testType !== null) {
            handleError(`RC version number cannot be incremented safely: ${previousVersion}`);
        }
        const version = new SimVersion(previousVersion.major, previousVersion.minor, previousVersion.maintenance + (previousVersion.testType === null ? 1 : 0), {
            testType: 'rc',
            testNumber: previousVersion.testNumber ? previousVersion.testNumber + 1 : 1
        });
        const versionString = version.toString();
        const simPath = buildLocal.devDeployPath + repo;
        const versionPath = `${simPath}/${versionString}`;
        const versionPathExists = await devDirectoryExists(versionPath);
        if (versionPathExists) {
            handleError(`Directory ${versionPath} already exists.  If you intend to replace the content then remove the directory manually from ${buildLocal.devDeployServer}.`);
        }
        if (!await booleanPrompt(`Deploy ${versionString} to ${buildLocal.devDeployServer}`, noninteractive)) {
            handleError('"Deploy" user request');
        }
        await setRepoVersion(repo, version, message);
        await gitPush(repo, branch);
        // Make sure our correct npm dependencies are set
        await npmUpdate(repo);
        await npmUpdate('chipper');
        await npmUpdate('perennial-alias');
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
            await setRepoVersion(repo, previousVersion, message);
            await gitPush(repo, branch);
            // Abort checkout, (will be caught and main will be checked out)
            handleError(problem);
        };
        if (!await booleanPrompt(`Please test the built version of ${repo}.\nIs it ready to deploy`, noninteractive)) {
            await postBuildAbort(`Built sim test failed, reverting back to ${previousVersion}`);
        }
        // Move over dependencies.json and commit/push
        await updateDependenciesJSON(repo, brands, versionString, branch);
        // Send the build request
        await buildServerRequest(repo, version, branch, await getDependencies(repo), {
            locales: [
                '*'
            ],
            brands: brands,
            servers: [
                'dev'
            ]
        });
        // Move back to main
        await checkoutMain(repo, true);
        const versionURL = `https://phet-dev.colorado.edu/html/${repo}/${versionString}`;
        if (brands.includes('phet')) {
            grunt.log.writeln(`Deployed: ${versionURL}/phet/${repo}_all_phet.html`);
        }
        if (brands.includes('phet-io')) {
            grunt.log.writeln(`Deployed: ${versionURL}/phet-io/`);
        }
        grunt.log.writeln('Please wait for the build-server to complete the deployment, and then test!');
        grunt.log.writeln(`To view the current build status, visit ${buildLocal.productionServerURL}/deploy-status`);
        return version;
    } catch (e) {
        grunt.log.warn('Detected failure during deploy, reverting to main.');
        await checkoutMain(repo, true);
        throw e;
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9ncnVudC9yYy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBEZXBsb3lzIGFuIHJjIHZlcnNpb24gYWZ0ZXIgaW5jcmVtZW50aW5nIHRoZSB0ZXN0IHZlcnNpb24gbnVtYmVyLlxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgU2ltVmVyc2lvbiA9IHJlcXVpcmUoICcuLi9icm93c2VyLWFuZC1ub2RlL1NpbVZlcnNpb24nICkuZGVmYXVsdDtcbmNvbnN0IGJvb2xlYW5Qcm9tcHQgPSByZXF1aXJlKCAnLi4vY29tbW9uL2Jvb2xlYW5Qcm9tcHQnICk7XG5jb25zdCBidWlsZCA9IHJlcXVpcmUoICcuLi9jb21tb24vYnVpbGQnICk7XG5jb25zdCBidWlsZExvY2FsID0gcmVxdWlyZSggJy4uL2NvbW1vbi9idWlsZExvY2FsJyApO1xuY29uc3QgYnVpbGRTZXJ2ZXJSZXF1ZXN0ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9idWlsZFNlcnZlclJlcXVlc3QnICk7XG5jb25zdCBjaGVja291dE1haW4gPSByZXF1aXJlKCAnLi4vY29tbW9uL2NoZWNrb3V0TWFpbicgKTtcbmNvbnN0IGNoZWNrb3V0VGFyZ2V0ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9jaGVja291dFRhcmdldCcgKTtcbmNvbnN0IGRldkRpcmVjdG9yeUV4aXN0cyA9IHJlcXVpcmUoICcuLi9jb21tb24vZGV2RGlyZWN0b3J5RXhpc3RzJyApO1xuY29uc3QgZ2V0RGVwZW5kZW5jaWVzID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXREZXBlbmRlbmNpZXMnICk7XG5jb25zdCBnZXRSZXBvVmVyc2lvbiA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2V0UmVwb1ZlcnNpb24nICk7XG5jb25zdCBnaXRDaGVja291dCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0Q2hlY2tvdXQnICk7XG5jb25zdCBnaXRJc0NsZWFuID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRJc0NsZWFuJyApO1xuY29uc3QgZ2l0UHVzaCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0UHVzaCcgKTtcbmNvbnN0IGhhc1JlbW90ZUJyYW5jaCA9IHJlcXVpcmUoICcuLi9jb21tb24vaGFzUmVtb3RlQnJhbmNoJyApO1xuY29uc3QgbG9hZEpTT04gPSByZXF1aXJlKCAnLi4vY29tbW9uL2xvYWRKU09OJyApO1xuY29uc3QgbnBtVXBkYXRlID0gcmVxdWlyZSggJy4uL2NvbW1vbi9ucG1VcGRhdGUnICk7XG5jb25zdCBzZXRSZXBvVmVyc2lvbiA9IHJlcXVpcmUoICcuLi9jb21tb24vc2V0UmVwb1ZlcnNpb24nICk7XG5jb25zdCB1cGRhdGVEZXBlbmRlbmNpZXNKU09OID0gcmVxdWlyZSggJy4uL2NvbW1vbi91cGRhdGVEZXBlbmRlbmNpZXNKU09OJyApO1xuY29uc3QgdnBuQ2hlY2sgPSByZXF1aXJlKCAnLi4vY29tbW9uL3ZwbkNoZWNrJyApO1xuY29uc3QgY3JlYXRlUmVsZWFzZSA9IHJlcXVpcmUoICcuL2NyZWF0ZVJlbGVhc2UnICk7XG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcblxuY29uc3QgY2FuY2VsTG9nID0gcHJvYmxlbSA9PiBncnVudC5sb2cud3JpdGVsbiggJ0NhbmNlbGxpbmcgUkMgZGVwbG95bWVudDogJyArIHByb2JsZW0gKTtcbmNvbnN0IGhhbmRsZUVycm9yID0gcHJvYmxlbSA9PiB7XG4gIGNhbmNlbExvZyggcHJvYmxlbSApO1xuICB0aHJvdyBuZXcgRXJyb3IoICdBYm9ydGVkIFJDIGRlcGxveW1lbnQ6ICcgKyBwcm9ibGVtICk7XG59O1xuXG4vKipcbiAqIERlcGxveXMgYW4gcmMgdmVyc2lvbiBhZnRlciBpbmNyZW1lbnRpbmcgdGhlIHRlc3QgdmVyc2lvbiBudW1iZXIuXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9cbiAqIEBwYXJhbSB7c3RyaW5nfSBicmFuY2hcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGJyYW5kc1xuICogQHBhcmFtIHtib29sZWFufSBub25pbnRlcmFjdGl2ZVxuICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIE9wdGlvbmFsIG1lc3NhZ2UgdG8gYXBwZW5kIHRvIHRoZSB2ZXJzaW9uLWluY3JlbWVudCBjb21taXQuXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48U2ltVmVyc2lvbj59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gcmMoIHJlcG8sIGJyYW5jaCwgYnJhbmRzLCBub25pbnRlcmFjdGl2ZSwgbWVzc2FnZSApIHtcbiAgU2ltVmVyc2lvbi5lbnN1cmVSZWxlYXNlQnJhbmNoKCBicmFuY2ggKTtcblxuICBpZiAoICEoIGF3YWl0IHZwbkNoZWNrKCkgKSApIHtcbiAgICBoYW5kbGVFcnJvciggJ1ZQTiBvciBiZWluZyBvbiBjYW1wdXMgaXMgcmVxdWlyZWQgZm9yIHRoaXMgYnVpbGQuIEVuc3VyZSBWUE4gaXMgZW5hYmxlZCwgb3IgdGhhdCB5b3UgaGF2ZSBhY2Nlc3MgdG8gcGhldC1zZXJ2ZXIyLmludC5jb2xvcmFkby5lZHUnICk7XG4gIH1cblxuICBjb25zdCBpc0NsZWFuID0gYXdhaXQgZ2l0SXNDbGVhbiggcmVwbyApO1xuICBpZiAoICFpc0NsZWFuICkge1xuICAgIGhhbmRsZUVycm9yKCBgVW5jbGVhbiBzdGF0dXMgaW4gJHtyZXBvfSwgY2Fubm90IGNyZWF0ZSByZWxlYXNlIGJyYW5jaGAgKTtcbiAgfVxuXG4gIGlmICggISggYXdhaXQgaGFzUmVtb3RlQnJhbmNoKCByZXBvLCBicmFuY2ggKSApICkge1xuICAgIGlmICggbm9uaW50ZXJhY3RpdmUgfHwgIWF3YWl0IGJvb2xlYW5Qcm9tcHQoIGBSZWxlYXNlIGJyYW5jaCAke2JyYW5jaH0gZG9lcyBub3QgZXhpc3QuIENyZWF0ZSBpdD9gLCBmYWxzZSApICkge1xuICAgICAgaGFuZGxlRXJyb3IoICdSZWxlYXNlIGJyYW5jaCBkb2VzIG5vdCBleGlzdCcgKTtcbiAgICB9XG5cbiAgICBhd2FpdCBjcmVhdGVSZWxlYXNlKCByZXBvLCBicmFuY2gsIGJyYW5kcyApO1xuICB9XG5cbiAgLy8gUGhFVC1pTyBzaW11bGF0aW9ucyByZXF1aXJlIHZhbGlkYXRpb24gZm9yIFJDcy4gRXJyb3Igb3V0IGlmIFwicGhldC5waGV0LWlvLnZhbGlkYXRpb249ZmFsc2VcIiBpcyBpbiBwYWNrYWdlLmpzb24uXG4gIGF3YWl0IGdpdENoZWNrb3V0KCByZXBvLCBicmFuY2ggKTtcbiAgaWYgKCBicmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApICkge1xuICAgIGNvbnN0IHBhY2thZ2VPYmplY3QgPSBhd2FpdCBsb2FkSlNPTiggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xuICAgIGlmICggcGFja2FnZU9iamVjdC5waGV0WyAncGhldC1pbycgXSAmJiBwYWNrYWdlT2JqZWN0LnBoZXRbICdwaGV0LWlvJyBdLmhhc093blByb3BlcnR5KCAndmFsaWRhdGlvbicgKSAmJlxuICAgICAgICAgIXBhY2thZ2VPYmplY3QucGhldFsgJ3BoZXQtaW8nIF0udmFsaWRhdGlvbiApIHtcbiAgICAgIGhhbmRsZUVycm9yKCAnUGhFVC1pTyBzaW11bGF0aW9ucyByZXF1aXJlIHZhbGlkYXRpb24gZm9yIFJDcycgKTtcbiAgICB9XG4gIH1cblxuICAvLyBucG0gdXBkYXRlcyBhcmUgYmVsb3csIGFmdGVyIGFsbCBpbnRlcmFjdGl2ZSBwcm9tcHRzXG4gIGF3YWl0IGNoZWNrb3V0VGFyZ2V0KCByZXBvLCBicmFuY2gsIGZhbHNlICk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBwcmV2aW91c1ZlcnNpb24gPSBhd2FpdCBnZXRSZXBvVmVyc2lvbiggcmVwbyApO1xuXG4gICAgaWYgKCBwcmV2aW91c1ZlcnNpb24udGVzdFR5cGUgIT09ICdyYycgJiYgcHJldmlvdXNWZXJzaW9uLnRlc3RUeXBlICE9PSBudWxsICkge1xuICAgICAgaGFuZGxlRXJyb3IoIGBSQyB2ZXJzaW9uIG51bWJlciBjYW5ub3QgYmUgaW5jcmVtZW50ZWQgc2FmZWx5OiAke3ByZXZpb3VzVmVyc2lvbn1gICk7XG4gICAgfVxuXG4gICAgY29uc3QgdmVyc2lvbiA9IG5ldyBTaW1WZXJzaW9uKCBwcmV2aW91c1ZlcnNpb24ubWFqb3IsIHByZXZpb3VzVmVyc2lvbi5taW5vciwgcHJldmlvdXNWZXJzaW9uLm1haW50ZW5hbmNlICsgKCBwcmV2aW91c1ZlcnNpb24udGVzdFR5cGUgPT09IG51bGwgPyAxIDogMCApLCB7XG4gICAgICB0ZXN0VHlwZTogJ3JjJyxcbiAgICAgIHRlc3ROdW1iZXI6IHByZXZpb3VzVmVyc2lvbi50ZXN0TnVtYmVyID8gcHJldmlvdXNWZXJzaW9uLnRlc3ROdW1iZXIgKyAxIDogMVxuICAgIH0gKTtcblxuICAgIGNvbnN0IHZlcnNpb25TdHJpbmcgPSB2ZXJzaW9uLnRvU3RyaW5nKCk7XG4gICAgY29uc3Qgc2ltUGF0aCA9IGJ1aWxkTG9jYWwuZGV2RGVwbG95UGF0aCArIHJlcG87XG4gICAgY29uc3QgdmVyc2lvblBhdGggPSBgJHtzaW1QYXRofS8ke3ZlcnNpb25TdHJpbmd9YDtcblxuICAgIGNvbnN0IHZlcnNpb25QYXRoRXhpc3RzID0gYXdhaXQgZGV2RGlyZWN0b3J5RXhpc3RzKCB2ZXJzaW9uUGF0aCApO1xuXG4gICAgaWYgKCB2ZXJzaW9uUGF0aEV4aXN0cyApIHtcbiAgICAgIGhhbmRsZUVycm9yKCBgRGlyZWN0b3J5ICR7dmVyc2lvblBhdGh9IGFscmVhZHkgZXhpc3RzLiAgSWYgeW91IGludGVuZCB0byByZXBsYWNlIHRoZSBjb250ZW50IHRoZW4gcmVtb3ZlIHRoZSBkaXJlY3RvcnkgbWFudWFsbHkgZnJvbSAke2J1aWxkTG9jYWwuZGV2RGVwbG95U2VydmVyfS5gICk7XG4gICAgfVxuXG4gICAgaWYgKCAhYXdhaXQgYm9vbGVhblByb21wdCggYERlcGxveSAke3ZlcnNpb25TdHJpbmd9IHRvICR7YnVpbGRMb2NhbC5kZXZEZXBsb3lTZXJ2ZXJ9YCwgbm9uaW50ZXJhY3RpdmUgKSApIHtcbiAgICAgIGhhbmRsZUVycm9yKCAnXCJEZXBsb3lcIiB1c2VyIHJlcXVlc3QnICk7XG4gICAgfVxuXG4gICAgYXdhaXQgc2V0UmVwb1ZlcnNpb24oIHJlcG8sIHZlcnNpb24sIG1lc3NhZ2UgKTtcbiAgICBhd2FpdCBnaXRQdXNoKCByZXBvLCBicmFuY2ggKTtcblxuICAgIC8vIE1ha2Ugc3VyZSBvdXIgY29ycmVjdCBucG0gZGVwZW5kZW5jaWVzIGFyZSBzZXRcbiAgICBhd2FpdCBucG1VcGRhdGUoIHJlcG8gKTtcbiAgICBhd2FpdCBucG1VcGRhdGUoICdjaGlwcGVyJyApO1xuICAgIGF3YWl0IG5wbVVwZGF0ZSggJ3BlcmVubmlhbC1hbGlhcycgKTtcblxuICAgIC8vIE5vIHNwZWNpYWwgb3B0aW9ucyByZXF1aXJlZCBoZXJlLCBhcyB3ZSBzZW5kIHRoZSBtYWluIHJlcXVlc3QgdG8gdGhlIGJ1aWxkIHNlcnZlclxuICAgIGdydW50LmxvZy53cml0ZWxuKCBhd2FpdCBidWlsZCggcmVwbywge1xuICAgICAgYnJhbmRzOiBicmFuZHMsXG4gICAgICBtaW5pZnk6ICFub25pbnRlcmFjdGl2ZVxuICAgIH0gKSApO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG5lY2Vzc2FyeSBjbGVhbiB1cCBzdGVwcyB0byBkbyBpZiBhYm9ydGluZyBhZnRlciB0aGUgYnVpbGRcbiAgICAgKi9cbiAgICBjb25zdCBwb3N0QnVpbGRBYm9ydCA9IGFzeW5jIHByb2JsZW0gPT4ge1xuICAgICAgY2FuY2VsTG9nKCBwcm9ibGVtICk7XG5cbiAgICAgIC8vIEFib3J0IHZlcnNpb24gdXBkYXRlXG4gICAgICBhd2FpdCBzZXRSZXBvVmVyc2lvbiggcmVwbywgcHJldmlvdXNWZXJzaW9uLCBtZXNzYWdlICk7XG4gICAgICBhd2FpdCBnaXRQdXNoKCByZXBvLCBicmFuY2ggKTtcblxuICAgICAgLy8gQWJvcnQgY2hlY2tvdXQsICh3aWxsIGJlIGNhdWdodCBhbmQgbWFpbiB3aWxsIGJlIGNoZWNrZWQgb3V0KVxuICAgICAgaGFuZGxlRXJyb3IoIHByb2JsZW0gKTtcbiAgICB9O1xuXG4gICAgaWYgKCAhYXdhaXQgYm9vbGVhblByb21wdCggYFBsZWFzZSB0ZXN0IHRoZSBidWlsdCB2ZXJzaW9uIG9mICR7cmVwb30uXFxuSXMgaXQgcmVhZHkgdG8gZGVwbG95YCwgbm9uaW50ZXJhY3RpdmUgKSApIHtcbiAgICAgIGF3YWl0IHBvc3RCdWlsZEFib3J0KCBgQnVpbHQgc2ltIHRlc3QgZmFpbGVkLCByZXZlcnRpbmcgYmFjayB0byAke3ByZXZpb3VzVmVyc2lvbn1gICk7XG4gICAgfVxuXG4gICAgLy8gTW92ZSBvdmVyIGRlcGVuZGVuY2llcy5qc29uIGFuZCBjb21taXQvcHVzaFxuICAgIGF3YWl0IHVwZGF0ZURlcGVuZGVuY2llc0pTT04oIHJlcG8sIGJyYW5kcywgdmVyc2lvblN0cmluZywgYnJhbmNoICk7XG5cbiAgICAvLyBTZW5kIHRoZSBidWlsZCByZXF1ZXN0XG4gICAgYXdhaXQgYnVpbGRTZXJ2ZXJSZXF1ZXN0KCByZXBvLCB2ZXJzaW9uLCBicmFuY2gsIGF3YWl0IGdldERlcGVuZGVuY2llcyggcmVwbyApLCB7XG4gICAgICBsb2NhbGVzOiBbICcqJyBdLFxuICAgICAgYnJhbmRzOiBicmFuZHMsXG4gICAgICBzZXJ2ZXJzOiBbICdkZXYnIF1cbiAgICB9ICk7XG5cbiAgICAvLyBNb3ZlIGJhY2sgdG8gbWFpblxuICAgIGF3YWl0IGNoZWNrb3V0TWFpbiggcmVwbywgdHJ1ZSApO1xuXG4gICAgY29uc3QgdmVyc2lvblVSTCA9IGBodHRwczovL3BoZXQtZGV2LmNvbG9yYWRvLmVkdS9odG1sLyR7cmVwb30vJHt2ZXJzaW9uU3RyaW5nfWA7XG5cbiAgICBpZiAoIGJyYW5kcy5pbmNsdWRlcyggJ3BoZXQnICkgKSB7XG4gICAgICBncnVudC5sb2cud3JpdGVsbiggYERlcGxveWVkOiAke3ZlcnNpb25VUkx9L3BoZXQvJHtyZXBvfV9hbGxfcGhldC5odG1sYCApO1xuICAgIH1cbiAgICBpZiAoIGJyYW5kcy5pbmNsdWRlcyggJ3BoZXQtaW8nICkgKSB7XG4gICAgICBncnVudC5sb2cud3JpdGVsbiggYERlcGxveWVkOiAke3ZlcnNpb25VUkx9L3BoZXQtaW8vYCApO1xuICAgIH1cblxuICAgIGdydW50LmxvZy53cml0ZWxuKCAnUGxlYXNlIHdhaXQgZm9yIHRoZSBidWlsZC1zZXJ2ZXIgdG8gY29tcGxldGUgdGhlIGRlcGxveW1lbnQsIGFuZCB0aGVuIHRlc3QhJyApO1xuICAgIGdydW50LmxvZy53cml0ZWxuKCBgVG8gdmlldyB0aGUgY3VycmVudCBidWlsZCBzdGF0dXMsIHZpc2l0ICR7YnVpbGRMb2NhbC5wcm9kdWN0aW9uU2VydmVyVVJMfS9kZXBsb3ktc3RhdHVzYCApO1xuXG4gICAgcmV0dXJuIHZlcnNpb247XG4gIH1cbiAgY2F0Y2goIGUgKSB7XG4gICAgZ3J1bnQubG9nLndhcm4oICdEZXRlY3RlZCBmYWlsdXJlIGR1cmluZyBkZXBsb3ksIHJldmVydGluZyB0byBtYWluLicgKTtcbiAgICBhd2FpdCBjaGVja291dE1haW4oIHJlcG8sIHRydWUgKTtcbiAgICB0aHJvdyBlO1xuICB9XG59OyJdLCJuYW1lcyI6WyJTaW1WZXJzaW9uIiwicmVxdWlyZSIsImRlZmF1bHQiLCJib29sZWFuUHJvbXB0IiwiYnVpbGQiLCJidWlsZExvY2FsIiwiYnVpbGRTZXJ2ZXJSZXF1ZXN0IiwiY2hlY2tvdXRNYWluIiwiY2hlY2tvdXRUYXJnZXQiLCJkZXZEaXJlY3RvcnlFeGlzdHMiLCJnZXREZXBlbmRlbmNpZXMiLCJnZXRSZXBvVmVyc2lvbiIsImdpdENoZWNrb3V0IiwiZ2l0SXNDbGVhbiIsImdpdFB1c2giLCJoYXNSZW1vdGVCcmFuY2giLCJsb2FkSlNPTiIsIm5wbVVwZGF0ZSIsInNldFJlcG9WZXJzaW9uIiwidXBkYXRlRGVwZW5kZW5jaWVzSlNPTiIsInZwbkNoZWNrIiwiY3JlYXRlUmVsZWFzZSIsImdydW50IiwiY2FuY2VsTG9nIiwicHJvYmxlbSIsImxvZyIsIndyaXRlbG4iLCJoYW5kbGVFcnJvciIsIkVycm9yIiwibW9kdWxlIiwiZXhwb3J0cyIsInJjIiwicmVwbyIsImJyYW5jaCIsImJyYW5kcyIsIm5vbmludGVyYWN0aXZlIiwibWVzc2FnZSIsImVuc3VyZVJlbGVhc2VCcmFuY2giLCJpc0NsZWFuIiwiaW5jbHVkZXMiLCJwYWNrYWdlT2JqZWN0IiwicGhldCIsImhhc093blByb3BlcnR5IiwidmFsaWRhdGlvbiIsInByZXZpb3VzVmVyc2lvbiIsInRlc3RUeXBlIiwidmVyc2lvbiIsIm1ham9yIiwibWlub3IiLCJtYWludGVuYW5jZSIsInRlc3ROdW1iZXIiLCJ2ZXJzaW9uU3RyaW5nIiwidG9TdHJpbmciLCJzaW1QYXRoIiwiZGV2RGVwbG95UGF0aCIsInZlcnNpb25QYXRoIiwidmVyc2lvblBhdGhFeGlzdHMiLCJkZXZEZXBsb3lTZXJ2ZXIiLCJtaW5pZnkiLCJwb3N0QnVpbGRBYm9ydCIsImxvY2FsZXMiLCJzZXJ2ZXJzIiwidmVyc2lvblVSTCIsInByb2R1Y3Rpb25TZXJ2ZXJVUkwiLCJlIiwid2FybiJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7O0NBSUMsR0FFRCxNQUFNQSxhQUFhQyxRQUFTLGtDQUFtQ0MsT0FBTztBQUN0RSxNQUFNQyxnQkFBZ0JGLFFBQVM7QUFDL0IsTUFBTUcsUUFBUUgsUUFBUztBQUN2QixNQUFNSSxhQUFhSixRQUFTO0FBQzVCLE1BQU1LLHFCQUFxQkwsUUFBUztBQUNwQyxNQUFNTSxlQUFlTixRQUFTO0FBQzlCLE1BQU1PLGlCQUFpQlAsUUFBUztBQUNoQyxNQUFNUSxxQkFBcUJSLFFBQVM7QUFDcEMsTUFBTVMsa0JBQWtCVCxRQUFTO0FBQ2pDLE1BQU1VLGlCQUFpQlYsUUFBUztBQUNoQyxNQUFNVyxjQUFjWCxRQUFTO0FBQzdCLE1BQU1ZLGFBQWFaLFFBQVM7QUFDNUIs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