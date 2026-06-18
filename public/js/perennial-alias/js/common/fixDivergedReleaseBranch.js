// Copyright 2023-2026, University of Colorado Boulder
/**
 * Does some branch changes so that a releaseBranch's dependency SHA matches a named branch
 *
 * For example, gravity-and-orbits 1.6 has a dependencies.json that says joist is at X. If there is a joist branch
 * named 'gravity-and-orbits-1.6', it SHOULD point at X. If it doesn't, we'll change it to point at X. If we change it,
 * we also want to not have the old SHAs garbage collected, so we create 'gravity-and-orbits-1.6-old' to point to it.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const getBranchDependencies = require('./getBranchDependencies');
const getBranches = require('./getBranches');
const gitCheckout = require('./gitCheckout');
const gitCreateBranch = require('./gitCreateBranch');
const gitPush = require('./gitPush');
const gitRevParse = require('./gitRevParse');
const winston = require('winston');
const buildLocal = require('./buildLocal');
const Octokit = require('@octokit/rest'); // eslint-disable-line phet/require-statement-match
/**
 * Does some branch changes so that a releaseBranch's dependency SHA matches a named branch
 * @public
 *
 * @param {string} repo - The simulation's repository
 * @param {string} branch - The branch name
 * @param {string} commonRepo
 * @returns {Promise}
 */ module.exports = async function(repo, branch, commonRepo) {
    const commonBranch = `${repo}-${branch}`;
    const commonOldBranch = `${commonBranch}-old`;
    const commonRepoBranches = await getBranches(commonRepo);
    if (!commonRepoBranches.includes(commonBranch)) {
        throw new Error(`Branch ${commonBranch} does not exist in ${commonRepo}`);
    }
    if (commonRepoBranches.includes(commonOldBranch)) {
        throw new Error(`Branch ${commonOldBranch} already exists in ${commonRepo}. This happened twice, please manually fix`);
    }
    const dependencies = await getBranchDependencies(repo, branch);
    const sha = dependencies[commonRepo].sha;
    if (!sha) {
        throw new Error('We do not have a working SHA');
    }
    const octokit = new Octokit({
        auth: buildLocal.developerGithubAccessToken
    });
    const canForcePush = (await octokit.request(`GET /repos/phetsims/${commonRepo}/branches/${commonBranch}/protection`, {
        owner: 'phetsims',
        repo: commonRepo,
        branch: commonBranch,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })).data.allow_force_pushes.enabled;
    const protectionSettings = {
        owner: 'phetsims',
        repo: commonRepo,
        branch: commonBranch,
        required_status_checks: null,
        enforce_admins: null,
        required_pull_request_reviews: null,
        restrictions: null,
        allow_force_pushes: false,
        allow_deletions: false,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    };
    if (!canForcePush) {
        winston.info('Disabling force push prevention');
        protectionSettings.allow_force_pushes = true;
        await octokit.request(`PUT /repos/phetsims/${commonRepo}/branches/${commonBranch}/protection`, protectionSettings);
    }
    // Set up 'old' branch, in order to save history
    await gitCheckout(commonRepo, commonBranch);
    winston.info(`Creating ${commonOldBranch} in ${commonRepo} with ${await gitRevParse(commonRepo, 'HEAD')}`);
    await gitCreateBranch(commonRepo, commonOldBranch);
    await gitPush(commonRepo, commonOldBranch);
    // Fix the branch with the proper name
    await gitCheckout(commonRepo, commonBranch);
    winston.info(`Moving ${commonBranch} in ${commonRepo} to ${sha}`);
    await execute('git', [
        'reset',
        '--hard',
        sha
    ], `../${commonRepo}`);
    await execute('git', [
        'push',
        '-f',
        '-u',
        'origin',
        commonBranch
    ], `../${commonRepo}`);
    if (!canForcePush) {
        winston.info('Enabling force push prevention');
        protectionSettings.allow_force_pushes = false;
        await octokit.request(`PUT /repos/phetsims/${commonRepo}/branches/${commonBranch}/protection`, protectionSettings);
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZml4RGl2ZXJnZWRSZWxlYXNlQnJhbmNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIERvZXMgc29tZSBicmFuY2ggY2hhbmdlcyBzbyB0aGF0IGEgcmVsZWFzZUJyYW5jaCdzIGRlcGVuZGVuY3kgU0hBIG1hdGNoZXMgYSBuYW1lZCBicmFuY2hcbiAqXG4gKiBGb3IgZXhhbXBsZSwgZ3Jhdml0eS1hbmQtb3JiaXRzIDEuNiBoYXMgYSBkZXBlbmRlbmNpZXMuanNvbiB0aGF0IHNheXMgam9pc3QgaXMgYXQgWC4gSWYgdGhlcmUgaXMgYSBqb2lzdCBicmFuY2hcbiAqIG5hbWVkICdncmF2aXR5LWFuZC1vcmJpdHMtMS42JywgaXQgU0hPVUxEIHBvaW50IGF0IFguIElmIGl0IGRvZXNuJ3QsIHdlJ2xsIGNoYW5nZSBpdCB0byBwb2ludCBhdCBYLiBJZiB3ZSBjaGFuZ2UgaXQsXG4gKiB3ZSBhbHNvIHdhbnQgdG8gbm90IGhhdmUgdGhlIG9sZCBTSEFzIGdhcmJhZ2UgY29sbGVjdGVkLCBzbyB3ZSBjcmVhdGUgJ2dyYXZpdHktYW5kLW9yYml0cy0xLjYtb2xkJyB0byBwb2ludCB0byBpdC5cbiAqXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICovXG5cbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApLmRlZmF1bHQ7XG5jb25zdCBnZXRCcmFuY2hEZXBlbmRlbmNpZXMgPSByZXF1aXJlKCAnLi9nZXRCcmFuY2hEZXBlbmRlbmNpZXMnICk7XG5jb25zdCBnZXRCcmFuY2hlcyA9IHJlcXVpcmUoICcuL2dldEJyYW5jaGVzJyApO1xuY29uc3QgZ2l0Q2hlY2tvdXQgPSByZXF1aXJlKCAnLi9naXRDaGVja291dCcgKTtcbmNvbnN0IGdpdENyZWF0ZUJyYW5jaCA9IHJlcXVpcmUoICcuL2dpdENyZWF0ZUJyYW5jaCcgKTtcbmNvbnN0IGdpdFB1c2ggPSByZXF1aXJlKCAnLi9naXRQdXNoJyApO1xuY29uc3QgZ2l0UmV2UGFyc2UgPSByZXF1aXJlKCAnLi9naXRSZXZQYXJzZScgKTtcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcbmNvbnN0IGJ1aWxkTG9jYWwgPSByZXF1aXJlKCAnLi9idWlsZExvY2FsJyApO1xuY29uc3QgT2N0b2tpdCA9IHJlcXVpcmUoICdAb2N0b2tpdC9yZXN0JyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHBoZXQvcmVxdWlyZS1zdGF0ZW1lbnQtbWF0Y2hcblxuLyoqXG4gKiBEb2VzIHNvbWUgYnJhbmNoIGNoYW5nZXMgc28gdGhhdCBhIHJlbGVhc2VCcmFuY2gncyBkZXBlbmRlbmN5IFNIQSBtYXRjaGVzIGEgbmFtZWQgYnJhbmNoXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgc2ltdWxhdGlvbidzIHJlcG9zaXRvcnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBicmFuY2ggLSBUaGUgYnJhbmNoIG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb21tb25SZXBvXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggcmVwbywgYnJhbmNoLCBjb21tb25SZXBvICkge1xuXG4gIGNvbnN0IGNvbW1vbkJyYW5jaCA9IGAke3JlcG99LSR7YnJhbmNofWA7XG4gIGNvbnN0IGNvbW1vbk9sZEJyYW5jaCA9IGAke2NvbW1vbkJyYW5jaH0tb2xkYDtcblxuICBjb25zdCBjb21tb25SZXBvQnJhbmNoZXMgPSBhd2FpdCBnZXRCcmFuY2hlcyggY29tbW9uUmVwbyApO1xuXG4gIGlmICggIWNvbW1vblJlcG9CcmFuY2hlcy5pbmNsdWRlcyggY29tbW9uQnJhbmNoICkgKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCBgQnJhbmNoICR7Y29tbW9uQnJhbmNofSBkb2VzIG5vdCBleGlzdCBpbiAke2NvbW1vblJlcG99YCApO1xuICB9XG4gIGlmICggY29tbW9uUmVwb0JyYW5jaGVzLmluY2x1ZGVzKCBjb21tb25PbGRCcmFuY2ggKSApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoIGBCcmFuY2ggJHtjb21tb25PbGRCcmFuY2h9IGFscmVhZHkgZXhpc3RzIGluICR7Y29tbW9uUmVwb30uIFRoaXMgaGFwcGVuZWQgdHdpY2UsIHBsZWFzZSBtYW51YWxseSBmaXhgICk7XG4gIH1cblxuICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXRCcmFuY2hEZXBlbmRlbmNpZXMoIHJlcG8sIGJyYW5jaCApO1xuICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXNbIGNvbW1vblJlcG8gXS5zaGE7XG4gIGlmICggIXNoYSApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoICdXZSBkbyBub3QgaGF2ZSBhIHdvcmtpbmcgU0hBJyApO1xuICB9XG5cbiAgY29uc3Qgb2N0b2tpdCA9IG5ldyBPY3Rva2l0KCB7XG4gICAgYXV0aDogYnVpbGRMb2NhbC5kZXZlbG9wZXJHaXRodWJBY2Nlc3NUb2tlblxuICB9ICk7XG5cbiAgY29uc3QgY2FuRm9yY2VQdXNoID0gKCBhd2FpdCBvY3Rva2l0LnJlcXVlc3QoIGBHRVQgL3JlcG9zL3BoZXRzaW1zLyR7Y29tbW9uUmVwb30vYnJhbmNoZXMvJHtjb21tb25CcmFuY2h9L3Byb3RlY3Rpb25gLCB7XG4gICAgb3duZXI6ICdwaGV0c2ltcycsXG4gICAgcmVwbzogY29tbW9uUmVwbyxcbiAgICBicmFuY2g6IGNvbW1vbkJyYW5jaCxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnWC1HaXRIdWItQXBpLVZlcnNpb24nOiAnMjAyMi0xMS0yOCdcbiAgICB9XG4gIH0gKSApLmRhdGEuYWxsb3dfZm9yY2VfcHVzaGVzLmVuYWJsZWQ7XG5cbiAgY29uc3QgcHJvdGVjdGlvblNldHRpbmdzID0ge1xuICAgIG93bmVyOiAncGhldHNpbXMnLFxuICAgIHJlcG86IGNvbW1vblJlcG8sXG4gICAgYnJhbmNoOiBjb21tb25CcmFuY2gsXG4gICAgcmVxdWlyZWRfc3RhdHVzX2NoZWNrczogbnVsbCxcbiAgICBlbmZvcmNlX2FkbWluczogbnVsbCxcbiAgICByZXF1aXJlZF9wdWxsX3JlcXVlc3RfcmV2aWV3czogbnVsbCxcbiAgICByZXN0cmljdGlvbnM6IG51bGwsXG4gICAgYWxsb3dfZm9yY2VfcHVzaGVzOiBmYWxzZSxcbiAgICBhbGxvd19kZWxldGlvbnM6IGZhbHNlLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdYLUdpdEh1Yi1BcGktVmVyc2lvbic6ICcyMDIyLTExLTI4J1xuICAgIH1cbiAgfTtcblxuICBpZiAoICFjYW5Gb3JjZVB1c2ggKSB7XG4gICAgd2luc3Rvbi5pbmZvKCAnRGlzYWJsaW5nIGZvcmNlIHB1c2ggcHJldmVudGlvbicgKTtcbiAgICBwcm90ZWN0aW9uU2V0dGluZ3MuYWxsb3dfZm9yY2VfcHVzaGVzID0gdHJ1ZTtcbiAgICBhd2FpdCBvY3Rva2l0LnJlcXVlc3QoIGBQVVQgL3JlcG9zL3BoZXRzaW1zLyR7Y29tbW9uUmVwb30vYnJhbmNoZXMvJHtjb21tb25CcmFuY2h9L3Byb3RlY3Rpb25gLCBwcm90ZWN0aW9uU2V0dGluZ3MgKTtcbiAgfVxuXG4gIC8vIFNldCB1cCAnb2xkJyBicmFuY2gsIGluIG9yZGVyIHRvIHNhdmUgaGlzdG9yeVxuICBhd2FpdCBnaXRDaGVja291dCggY29tbW9uUmVwbywgY29tbW9uQnJhbmNoICk7XG4gIHdpbnN0b24uaW5mbyggYENyZWF0aW5nICR7Y29tbW9uT2xkQnJhbmNofSBpbiAke2NvbW1vblJlcG99IHdpdGggJHthd2FpdCBnaXRSZXZQYXJzZSggY29tbW9uUmVwbywgJ0hFQUQnICl9YCApO1xuICBhd2FpdCBnaXRDcmVhdGVCcmFuY2goIGNvbW1vblJlcG8sIGNvbW1vbk9sZEJyYW5jaCApO1xuICBhd2FpdCBnaXRQdXNoKCBjb21tb25SZXBvLCBjb21tb25PbGRCcmFuY2ggKTtcblxuICAvLyBGaXggdGhlIGJyYW5jaCB3aXRoIHRoZSBwcm9wZXIgbmFtZVxuICBhd2FpdCBnaXRDaGVja291dCggY29tbW9uUmVwbywgY29tbW9uQnJhbmNoICk7XG4gIHdpbnN0b24uaW5mbyggYE1vdmluZyAke2NvbW1vbkJyYW5jaH0gaW4gJHtjb21tb25SZXBvfSB0byAke3NoYX1gICk7XG4gIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdyZXNldCcsICctLWhhcmQnLCBzaGEgXSwgYC4uLyR7Y29tbW9uUmVwb31gICk7XG4gIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdwdXNoJywgJy1mJywgJy11JywgJ29yaWdpbicsIGNvbW1vbkJyYW5jaCBdLCBgLi4vJHtjb21tb25SZXBvfWAgKTtcblxuICBpZiAoICFjYW5Gb3JjZVB1c2ggKSB7XG4gICAgd2luc3Rvbi5pbmZvKCAnRW5hYmxpbmcgZm9yY2UgcHVzaCBwcmV2ZW50aW9uJyApO1xuICAgIHByb3RlY3Rpb25TZXR0aW5ncy5hbGxvd19mb3JjZV9wdXNoZXMgPSBmYWxzZTtcbiAgICBhd2FpdCBvY3Rva2l0LnJlcXVlc3QoIGBQVVQgL3JlcG9zL3BoZXRzaW1zLyR7Y29tbW9uUmVwb30vYnJhbmNoZXMvJHtjb21tb25CcmFuY2h9L3Byb3RlY3Rpb25gLCBwcm90ZWN0aW9uU2V0dGluZ3MgKTtcbiAgfVxufTsiXSwibmFtZXMiOlsiZXhlY3V0ZSIsInJlcXVpcmUiLCJkZWZhdWx0IiwiZ2V0QnJhbmNoRGVwZW5kZW5jaWVzIiwiZ2V0QnJhbmNoZXMiLCJnaXRDaGVja291dCIsImdpdENyZWF0ZUJyYW5jaCIsImdpdFB1c2giLCJnaXRSZXZQYXJzZSIsIndpbnN0b24iLCJidWlsZExvY2FsIiwiT2N0b2tpdCIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwiYnJhbmNoIiwiY29tbW9uUmVwbyIsImNvbW1vbkJyYW5jaCIsImNvbW1vbk9sZEJyYW5jaCIsImNvbW1vblJlcG9CcmFuY2hlcyIsImluY2x1ZGVzIiwiRXJyb3IiLCJkZXBlbmRlbmNpZXMiLCJzaGEiLCJvY3Rva2l0IiwiYXV0aCIsImRldmVsb3BlckdpdGh1YkFjY2Vzc1Rva2VuIiwiY2FuRm9yY2VQdXNoIiwicmVxdWVzdCIsIm93bmVyIiwiaGVhZGVycyIsImRhdGEiLCJhbGxvd19mb3JjZV9wdXNoZXMiLCJlbmFibGVkIiwicHJvdGVjdGlvblNldHRpbmdzIiwicmVxdWlyZWRfc3RhdHVzX2NoZWNrcyIsImVuZm9yY2VfYWRtaW5zIiwicmVxdWlyZWRfcHVsbF9yZXF1ZXN0X3Jldmlld3MiLCJyZXN0cmljdGlvbnMiLCJhbGxvd19kZWxldGlvbnMiLCJpbmZvIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Ozs7O0NBUUMsR0FFRCxNQUFNQSxVQUFVQyxRQUFTLGFBQWNDLE9BQU87QUFDOUMsTUFBTUMsd0JBQXdCRixRQUFTO0FBQ3ZDLE1BQU1HLGNBQWNILFFBQVM7QUFDN0IsTUFBTUksY0FBY0osUUFBUztBQUM3QixNQUFNSyxrQkFBa0JMLFFBQVM7QUFDakMsTUFBTU0sVUFBVU4sUUFBUztBQUN6QixNQUFNTyxjQUFjUCxRQUFTO0FBQzdCLE1BQU1RLFVBQVVSLFFBQVM7QUFDekIsTUFBTVMsYUFBYVQsUUFBUztBQUM1QixNQUFNVSxVQUFVVixRQUFTLGtCQUFtQixtREFBbUQ7QUFFL0Y7Ozs7Ozs7O0NBUUMsR0FDRFcsT0FBT0MsT0FBTyxHQUFHLGVBQWdCQyxJQUFJLEVBQUVDLE1BQU0sRUFBRUMsVUFBVTtJQUV2RCxNQUFNQyxlQUFlLEdBQUdILEtBQUssQ0FBQyxFQUFFQyxRQUFRO0lBQ3hDLE1BQU1HLGtCQUFrQixHQUFHRCxhQUFhLElBQUksQ0FBQztJQUU3QyxNQUFNRSxxQkFBcUIsTUFBTWYsWUFBYVk7SUFFOUMsSUFBSyxDQUFDRyxtQkFBbUJDLFFBQVEsQ0FBRUgsZUFBaUI7UUFDbEQsTUFBTSxJQUFJSSxNQUFPLENBQUMsT0FBTyxFQUFFSixhQUFhLG1CQUFtQixFQUFFRCxZQUFZO0lBQzNFO0lBQ0EsSUFBS0csbUJBQW1CQyxRQUFRLENBQUVGLGtCQUFvQjtRQUNwRCxNQUFNLElBQUlHLE1BQU8sQ0FBQyxPQUFPLEVBQUVILGdCQUFnQixtQkFBbUIsRUFBRUYsV0FBVywwQ0FBMEMsQ0FBQztJQUN4SDtJQUVBLE1BQU1NLGVBQWUsTUFBTW5CLHNCQUF1QlcsTUFBTUM7SUFDeEQsTUFBTVEsTUFBTUQsWUFBWSxDQUFFTixXQUFZLENBQUNPLEdBQUc7SUFDMUMsSUFBSyxDQUFDQSxLQUFNO1FBQ1YsTUFBTSxJQUFJRixNQUFPO0lBQ25CO0lBRUEsTUFBTUcsVUFBVSxJQUFJYixRQUFTO1FBQzNCYyxNQUFNZixXQUFXZ0IsMEJBQTBCO0lBQzdDO0lBRUEsTUFBTUMsZUFBZSxBQUFFLENBQUEsTUFBTUgsUUFBUUksT0FBTyxDQUFFLENBQUMsb0JBQW9CLEVBQUVaLFdBQVcsVUFBVSxFQUFFQyxhQUFhLFdBQVcsQ0FBQyxFQUFFO1FBQ3JIWSxPQUFPO1FBQ1BmLE1BQU1FO1FBQ05ELFFBQVFFO1FBQ1JhLFNBQVM7WUFDUCx3QkFBd0I7UUFDMUI7SUFDRixFQUFFLEVBQUlDLElBQUksQ0FBQ0Msa0JBQWtCLENBQUNDLE9BQU87SUFFckMsTUFBTUMscUJBQXFCO1FBQ3pCTCxPQUFPO1FBQ1BmLE1BQU1FO1FBQ05ELFFBQVFFO1FBQ1JrQix3QkFBd0I7UUFDeEJDLGdCQUFnQjtRQUNoQkMsK0JBQStCO1FBQy9CQyxjQUFjO1FBQ2ROLG9CQUFvQjtRQUNwQk8saUJBQWlCO1FBQ2pCVCxTQUFTO1lBQ1Asd0JBQXdCO1FBQzFCO0lBQ0Y7SUFFQSxJQUFLLENBQUNILGNBQWU7UUFDbkJsQixRQUFRK0IsSUFBSSxDQUFFO1FBQ2ROLG1CQUFtQkYsa0JBQWtCLEdBQUc7UUFDeEMsTUFBTVIsUUFBUUksT0FBTyxDQUFFLENBQUMsb0JBQW9CLEVBQUVaLFdBQVcsVUFBVSxFQUFFQyxhQUFhLFdBQVcsQ0FBQyxFQUFFaUI7SUFDbEc7SUFFQSxnREFBZ0Q7SUFDaEQsTUFBTTdCLFlBQWFXLFlBQVlDO0lBQy9CUixRQUFRK0IsSUFBSSxDQUFFLENBQUMsU0FBUyxFQUFFdEIsZ0JBQWdCLElBQUksRUFBRUYsV0FBVyxNQUFNLEVBQUUsTUFBTVIsWUFBYVEsWUFBWSxTQUFVO0lBQzVHLE1BQU1WLGdCQUFpQlUsWUFBWUU7SUFDbkMsTUFBTVgsUUFBU1MsWUFBWUU7SUFFM0Isc0NBQXNDO0lBQ3RDLE1BQU1iLFlBQWFXLFlBQVlDO0lBQy9CUixRQUFRK0IsSUFBSSxDQUFFLENBQUMsT0FBTyxFQUFFdkIsYUFBYSxJQUFJLEVBQUVELFdBQVcsSUFBSSxFQUFFTyxLQUFLO0lBQ2pFLE1BQU12QixRQUFTLE9BQU87UUFBRTtRQUFTO1FBQVV1QjtLQUFLLEVBQUUsQ0FBQyxHQUFHLEVBQUVQLFlBQVk7SUFDcEUsTUFBTWhCLFFBQVMsT0FBTztRQUFFO1FBQVE7UUFBTTtRQUFNO1FBQVVpQjtLQUFjLEVBQUUsQ0FBQyxHQUFHLEVBQUVELFlBQVk7SUFFeEYsSUFBSyxDQUFDVyxjQUFlO1FBQ25CbEIsUUFBUStCLElBQUksQ0FBRTtRQUNkTixtQkFBbUJGLGtCQUFrQixHQUFHO1FBQ3hDLE1BQU1SLFFBQVFJLE9BQU8sQ0FBRSxDQUFDLG9CQUFvQixFQUFFWixXQUFXLFVBQVUsRUFBRUMsYUFBYSxXQUFXLENBQUMsRUFBRWlCO0lBQ2xHO0FBQ0YifQ==