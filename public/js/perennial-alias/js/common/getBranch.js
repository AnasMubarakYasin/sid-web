// Copyright 2017-2026, University of Colorado Boulder
/**
 * Returns the branch (if any) that the repository is on.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
/**
 * Returns the branch (if any) that the repository is on.
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise<string>} - Resolves to the branch name (or the empty string if not on a branch)
 */ module.exports = function(repo) {
    return execute('git', [
        'symbolic-ref',
        '-q',
        'HEAD'
    ], `../${repo}`).then((stdout)=>stdout.trim().replace('refs/heads/', ''));
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2V0QnJhbmNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIFJldHVybnMgdGhlIGJyYW5jaCAoaWYgYW55KSB0aGF0IHRoZSByZXBvc2l0b3J5IGlzIG9uLlxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBicmFuY2ggKGlmIGFueSkgdGhhdCB0aGUgcmVwb3NpdG9yeSBpcyBvbi5cbiAqIEBwdWJsaWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcbiAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59IC0gUmVzb2x2ZXMgdG8gdGhlIGJyYW5jaCBuYW1lIChvciB0aGUgZW1wdHkgc3RyaW5nIGlmIG5vdCBvbiBhIGJyYW5jaClcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcmVwbyApIHtcbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdzeW1ib2xpYy1yZWYnLCAnLXEnLCAnSEVBRCcgXSwgYC4uLyR7cmVwb31gICkudGhlbiggc3Rkb3V0ID0+IHN0ZG91dC50cmltKCkucmVwbGFjZSggJ3JlZnMvaGVhZHMvJywgJycgKSApO1xufTsiXSwibmFtZXMiOlsiZXhlY3V0ZSIsInJlcXVpcmUiLCJkZWZhdWx0IiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJ0aGVuIiwic3Rkb3V0IiwidHJpbSIsInJlcGxhY2UiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7OztDQUlDLEdBRUQsTUFBTUEsVUFBVUMsUUFBUyxhQUFjQyxPQUFPO0FBRTlDOzs7Ozs7Q0FNQyxHQUNEQyxPQUFPQyxPQUFPLEdBQUcsU0FBVUMsSUFBSTtJQUM3QixPQUFPTCxRQUFTLE9BQU87UUFBRTtRQUFnQjtRQUFNO0tBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRUssTUFBTSxFQUFHQyxJQUFJLENBQUVDLENBQUFBLFNBQVVBLE9BQU9DLElBQUksR0FBR0MsT0FBTyxDQUFFLGVBQWU7QUFDaEkifQ==