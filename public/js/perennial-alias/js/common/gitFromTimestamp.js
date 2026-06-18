// Copyright 2018-2026, University of Colorado Boulder
/**
 * git rev-list -1 --before="{{TIMESTAMP}}" {{BRANCH}}
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const assert = require('assert');
/**
 * Gets the best SHA from a given branch at the given timestamp
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} branch - The SHA/branch/whatnot to check out
 * @param {string} timestamp
 * @returns {Promise.<string>} - Resolves to the SHA
 */ module.exports = function(repo, branch, timestamp) {
    assert(typeof repo === 'string');
    assert(typeof branch === 'string');
    assert(typeof timestamp === 'string');
    return execute('git', [
        'rev-list',
        '-1',
        `--before="${timestamp}"`,
        branch
    ], `../${repo}`).then((stdout)=>{
        const sha = stdout.trim();
        if (sha.length === 0) {
            return Promise.reject(new Error('No matching SHA for timestamp'));
        } else {
            return Promise.resolve(sha);
        }
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0RnJvbVRpbWVzdGFtcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBnaXQgcmV2LWxpc3QgLTEgLS1iZWZvcmU9XCJ7e1RJTUVTVEFNUH19XCIge3tCUkFOQ0h9fVxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XG5cbi8qKlxuICogR2V0cyB0aGUgYmVzdCBTSEEgZnJvbSBhIGdpdmVuIGJyYW5jaCBhdCB0aGUgZ2l2ZW4gdGltZXN0YW1wXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoIC0gVGhlIFNIQS9icmFuY2gvd2hhdG5vdCB0byBjaGVjayBvdXRcbiAqIEBwYXJhbSB7c3RyaW5nfSB0aW1lc3RhbXBcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmc+fSAtIFJlc29sdmVzIHRvIHRoZSBTSEFcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcmVwbywgYnJhbmNoLCB0aW1lc3RhbXAgKSB7XG4gIGFzc2VydCggdHlwZW9mIHJlcG8gPT09ICdzdHJpbmcnICk7XG4gIGFzc2VydCggdHlwZW9mIGJyYW5jaCA9PT0gJ3N0cmluZycgKTtcbiAgYXNzZXJ0KCB0eXBlb2YgdGltZXN0YW1wID09PSAnc3RyaW5nJyApO1xuXG4gIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAncmV2LWxpc3QnLCAnLTEnLCBgLS1iZWZvcmU9XCIke3RpbWVzdGFtcH1cImAsIGJyYW5jaCBdLCBgLi4vJHtyZXBvfWAgKS50aGVuKCBzdGRvdXQgPT4ge1xuICAgIGNvbnN0IHNoYSA9IHN0ZG91dC50cmltKCk7XG4gICAgaWYgKCBzaGEubGVuZ3RoID09PSAwICkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCBuZXcgRXJyb3IoICdObyBtYXRjaGluZyBTSEEgZm9yIHRpbWVzdGFtcCcgKSApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoIHNoYSApO1xuICAgIH1cbiAgfSApO1xufTsiXSwibmFtZXMiOlsiZXhlY3V0ZSIsInJlcXVpcmUiLCJkZWZhdWx0IiwiYXNzZXJ0IiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJicmFuY2giLCJ0aW1lc3RhbXAiLCJ0aGVuIiwic3Rkb3V0Iiwic2hhIiwidHJpbSIsImxlbmd0aCIsIlByb21pc2UiLCJyZWplY3QiLCJFcnJvciIsInJlc29sdmUiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7OztDQUlDLEdBRUQsTUFBTUEsVUFBVUMsUUFBUyxhQUFjQyxPQUFPO0FBQzlDLE1BQU1DLFNBQVNGLFFBQVM7QUFFeEI7Ozs7Ozs7O0NBUUMsR0FDREcsT0FBT0MsT0FBTyxHQUFHLFNBQVVDLElBQUksRUFBRUMsTUFBTSxFQUFFQyxTQUFTO0lBQ2hETCxPQUFRLE9BQU9HLFNBQVM7SUFDeEJILE9BQVEsT0FBT0ksV0FBVztJQUMxQkosT0FBUSxPQUFPSyxjQUFjO0lBRTdCLE9BQU9SLFFBQVMsT0FBTztRQUFFO1FBQVk7UUFBTSxDQUFDLFVBQVUsRUFBRVEsVUFBVSxDQUFDLENBQUM7UUFBRUQ7S0FBUSxFQUFFLENBQUMsR0FBRyxFQUFFRCxNQUFNLEVBQUdHLElBQUksQ0FBRUMsQ0FBQUE7UUFDbkcsTUFBTUMsTUFBTUQsT0FBT0UsSUFBSTtRQUN2QixJQUFLRCxJQUFJRSxNQUFNLEtBQUssR0FBSTtZQUN0QixPQUFPQyxRQUFRQyxNQUFNLENBQUUsSUFBSUMsTUFBTztRQUNwQyxPQUNLO1lBQ0gsT0FBT0YsUUFBUUcsT0FBTyxDQUFFTjtRQUMxQjtJQUNGO0FBQ0YifQ==