// Copyright 2020-2026, University of Colorado Boulder
/**
 * Updates the development/test HTML as needed for a change in the version. Updates are based on the version in the
 * package.json. This will also commit if an update occurs.
 *
 * See https://github.com/phetsims/chipper/issues/926
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const gitAdd = require('./gitAdd');
const gitCommit = require('./gitCommit');
const gitIsClean = require('./gitIsClean');
const gruntCommand = require('./gruntCommand');
const loadJSON = require('./loadJSON');
const winston = require('winston');
/**
 * Updates the development/test HTML as needed for a change in the version, and creates a commit.
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise}
 */ module.exports = async function(repo) {
    winston.info(`Updating HTML for ${repo} with the new version strings`);
    const isClean = await gitIsClean(repo);
    if (!isClean) {
        throw new Error(`Unclean status in ${repo}, cannot clean up HTML`);
    }
    // We'll want to update development/test HTML as necessary, since they'll include the version
    const packageObject = await loadJSON(`../${repo}/package.json`);
    await execute(gruntCommand, [
        'generate-development-html',
        `--repo=${repo}`
    ], '../chipper');
    await gitAdd(repo, `${repo}_en.html`);
    if (packageObject.phet.generatedUnitTests) {
        await execute(gruntCommand, [
            'generate-test-html',
            `--repo=${repo}`
        ], '../chipper');
        await gitAdd(repo, `${repo}-tests.html`);
    }
    if (!await gitIsClean(repo)) {
        await gitCommit(repo, `Bumping ${repo} dev${packageObject.phet.generatedUnitTests ? '/test' : ''} HTML with new version`);
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vdXBkYXRlSFRNTFZlcnNpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogVXBkYXRlcyB0aGUgZGV2ZWxvcG1lbnQvdGVzdCBIVE1MIGFzIG5lZWRlZCBmb3IgYSBjaGFuZ2UgaW4gdGhlIHZlcnNpb24uIFVwZGF0ZXMgYXJlIGJhc2VkIG9uIHRoZSB2ZXJzaW9uIGluIHRoZVxuICogcGFja2FnZS5qc29uLiBUaGlzIHdpbGwgYWxzbyBjb21taXQgaWYgYW4gdXBkYXRlIG9jY3Vycy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzkyNlxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcbmNvbnN0IGdpdEFkZCA9IHJlcXVpcmUoICcuL2dpdEFkZCcgKTtcbmNvbnN0IGdpdENvbW1pdCA9IHJlcXVpcmUoICcuL2dpdENvbW1pdCcgKTtcbmNvbnN0IGdpdElzQ2xlYW4gPSByZXF1aXJlKCAnLi9naXRJc0NsZWFuJyApO1xuY29uc3QgZ3J1bnRDb21tYW5kID0gcmVxdWlyZSggJy4vZ3J1bnRDb21tYW5kJyApO1xuY29uc3QgbG9hZEpTT04gPSByZXF1aXJlKCAnLi9sb2FkSlNPTicgKTtcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBkZXZlbG9wbWVudC90ZXN0IEhUTUwgYXMgbmVlZGVkIGZvciBhIGNoYW5nZSBpbiB0aGUgdmVyc2lvbiwgYW5kIGNyZWF0ZXMgYSBjb21taXQuXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggcmVwbyApIHtcbiAgd2luc3Rvbi5pbmZvKCBgVXBkYXRpbmcgSFRNTCBmb3IgJHtyZXBvfSB3aXRoIHRoZSBuZXcgdmVyc2lvbiBzdHJpbmdzYCApO1xuXG4gIGNvbnN0IGlzQ2xlYW4gPSBhd2FpdCBnaXRJc0NsZWFuKCByZXBvICk7XG4gIGlmICggIWlzQ2xlYW4gKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCBgVW5jbGVhbiBzdGF0dXMgaW4gJHtyZXBvfSwgY2Fubm90IGNsZWFuIHVwIEhUTUxgICk7XG4gIH1cblxuICAvLyBXZSdsbCB3YW50IHRvIHVwZGF0ZSBkZXZlbG9wbWVudC90ZXN0IEhUTUwgYXMgbmVjZXNzYXJ5LCBzaW5jZSB0aGV5J2xsIGluY2x1ZGUgdGhlIHZlcnNpb25cbiAgY29uc3QgcGFja2FnZU9iamVjdCA9IGF3YWl0IGxvYWRKU09OKCBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gICk7XG4gIGF3YWl0IGV4ZWN1dGUoIGdydW50Q29tbWFuZCwgWyAnZ2VuZXJhdGUtZGV2ZWxvcG1lbnQtaHRtbCcsIGAtLXJlcG89JHtyZXBvfWAgXSwgJy4uL2NoaXBwZXInICk7XG4gIGF3YWl0IGdpdEFkZCggcmVwbywgYCR7cmVwb31fZW4uaHRtbGAgKTtcblxuICBpZiAoIHBhY2thZ2VPYmplY3QucGhldC5nZW5lcmF0ZWRVbml0VGVzdHMgKSB7XG4gICAgYXdhaXQgZXhlY3V0ZSggZ3J1bnRDb21tYW5kLCBbICdnZW5lcmF0ZS10ZXN0LWh0bWwnLCBgLS1yZXBvPSR7cmVwb31gIF0sICcuLi9jaGlwcGVyJyApO1xuICAgIGF3YWl0IGdpdEFkZCggcmVwbywgYCR7cmVwb30tdGVzdHMuaHRtbGAgKTtcbiAgfVxuICBpZiAoICEoIGF3YWl0IGdpdElzQ2xlYW4oIHJlcG8gKSApICkge1xuICAgIGF3YWl0IGdpdENvbW1pdCggcmVwbywgYEJ1bXBpbmcgJHtyZXBvfSBkZXYke3BhY2thZ2VPYmplY3QucGhldC5nZW5lcmF0ZWRVbml0VGVzdHMgPyAnL3Rlc3QnIDogJyd9IEhUTUwgd2l0aCBuZXcgdmVyc2lvbmAgKTtcbiAgfVxufTsiXSwibmFtZXMiOlsiZXhlY3V0ZSIsInJlcXVpcmUiLCJkZWZhdWx0IiwiZ2l0QWRkIiwiZ2l0Q29tbWl0IiwiZ2l0SXNDbGVhbiIsImdydW50Q29tbWFuZCIsImxvYWRKU09OIiwid2luc3RvbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwiaW5mbyIsImlzQ2xlYW4iLCJFcnJvciIsInBhY2thZ2VPYmplY3QiLCJwaGV0IiwiZ2VuZXJhdGVkVW5pdFRlc3RzIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Ozs7Q0FPQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUM5QyxNQUFNQyxTQUFTRixRQUFTO0FBQ3hCLE1BQU1HLFlBQVlILFFBQVM7QUFDM0IsTUFBTUksYUFBYUosUUFBUztBQUM1QixNQUFNSyxlQUFlTCxRQUFTO0FBQzlCLE1BQU1NLFdBQVdOLFFBQVM7QUFDMUIsTUFBTU8sVUFBVVAsUUFBUztBQUV6Qjs7Ozs7O0NBTUMsR0FDRFEsT0FBT0MsT0FBTyxHQUFHLGVBQWdCQyxJQUFJO0lBQ25DSCxRQUFRSSxJQUFJLENBQUUsQ0FBQyxrQkFBa0IsRUFBRUQsS0FBSyw2QkFBNkIsQ0FBQztJQUV0RSxNQUFNRSxVQUFVLE1BQU1SLFdBQVlNO0lBQ2xDLElBQUssQ0FBQ0UsU0FBVTtRQUNkLE1BQU0sSUFBSUMsTUFBTyxDQUFDLGtCQUFrQixFQUFFSCxLQUFLLHNCQUFzQixDQUFDO0lBQ3BFO0lBRUEsNkZBQTZGO0lBQzdGLE1BQU1JLGdCQUFnQixNQUFNUixTQUFVLENBQUMsR0FBRyxFQUFFSSxLQUFLLGFBQWEsQ0FBQztJQUMvRCxNQUFNWCxRQUFTTSxjQUFjO1FBQUU7UUFBNkIsQ0FBQyxPQUFPLEVBQUVLLE1BQU07S0FBRSxFQUFFO0lBQ2hGLE1BQU1SLE9BQVFRLE1BQU0sR0FBR0EsS0FBSyxRQUFRLENBQUM7SUFFckMsSUFBS0ksY0FBY0MsSUFBSSxDQUFDQyxrQkFBa0IsRUFBRztRQUMzQyxNQUFNakIsUUFBU00sY0FBYztZQUFFO1lBQXNCLENBQUMsT0FBTyxFQUFFSyxNQUFNO1NBQUUsRUFBRTtRQUN6RSxNQUFNUixPQUFRUSxNQUFNLEdBQUdBLEtBQUssV0FBVyxDQUFDO0lBQzFDO0lBQ0EsSUFBSyxDQUFHLE1BQU1OLFdBQVlNLE9BQVc7UUFDbkMsTUFBTVAsVUFBV08sTUFBTSxDQUFDLFFBQVEsRUFBRUEsS0FBSyxJQUFJLEVBQUVJLGNBQWNDLElBQUksQ0FBQ0Msa0JBQWtCLEdBQUcsVUFBVSxHQUFHLHNCQUFzQixDQUFDO0lBQzNIO0FBQ0YifQ==