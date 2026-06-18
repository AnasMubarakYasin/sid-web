// Copyright 2017-2026, University of Colorado Boulder
/**
 * retrieve the contents of a file without changing the git tree via checkouts.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const assert = require('assert');
const execute = require('./execute').default;
/**
 * Gets the contents of the file at a given state in the git tree
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} file - Path to the file from the repo root, like js/myFile.js
 * @param {string} branchOrSha - what revision to get the contents of the file at. "buoyancy-1.0" or "main" or
 *                               "{{SHA}}". Defaults to the current checkout (HEAD)
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */ module.exports = async function gitCatFile(repo, file, branchOrSha = 'HEAD') {
    assert(typeof repo === 'string');
    assert(typeof file === 'string');
    assert(typeof branchOrSha === 'string');
    return execute('git', [
        'cat-file',
        'blob',
        `${branchOrSha}:${file}`
    ], `../${repo}`);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0Q2F0RmlsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiByZXRyaWV2ZSB0aGUgY29udGVudHMgb2YgYSBmaWxlIHdpdGhvdXQgY2hhbmdpbmcgdGhlIGdpdCB0cmVlIHZpYSBjaGVja291dHMuXG4gKlxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcblxuLyoqXG4gKiBHZXRzIHRoZSBjb250ZW50cyBvZiB0aGUgZmlsZSBhdCBhIGdpdmVuIHN0YXRlIGluIHRoZSBnaXQgdHJlZVxuICogQHB1YmxpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGUgLSBQYXRoIHRvIHRoZSBmaWxlIGZyb20gdGhlIHJlcG8gcm9vdCwgbGlrZSBqcy9teUZpbGUuanNcbiAqIEBwYXJhbSB7c3RyaW5nfSBicmFuY2hPclNoYSAtIHdoYXQgcmV2aXNpb24gdG8gZ2V0IHRoZSBjb250ZW50cyBvZiB0aGUgZmlsZSBhdC4gXCJidW95YW5jeS0xLjBcIiBvciBcIm1haW5cIiBvclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ7e1NIQX19XCIuIERlZmF1bHRzIHRvIHRoZSBjdXJyZW50IGNoZWNrb3V0IChIRUFEKVxuICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gU3Rkb3V0XG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIGdpdENhdEZpbGUoIHJlcG8sIGZpbGUsIGJyYW5jaE9yU2hhID0gJ0hFQUQnICkge1xuICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJyApO1xuICBhc3NlcnQoIHR5cGVvZiBmaWxlID09PSAnc3RyaW5nJyApO1xuICBhc3NlcnQoIHR5cGVvZiBicmFuY2hPclNoYSA9PT0gJ3N0cmluZycgKTtcblxuICByZXR1cm4gZXhlY3V0ZSggJ2dpdCcsIFsgJ2NhdC1maWxlJywgJ2Jsb2InLCBgJHticmFuY2hPclNoYX06JHtmaWxlfWAgXSwgYC4uLyR7cmVwb31gICk7XG59OyJdLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiZXhlY3V0ZSIsImRlZmF1bHQiLCJtb2R1bGUiLCJleHBvcnRzIiwiZ2l0Q2F0RmlsZSIsInJlcG8iLCJmaWxlIiwiYnJhbmNoT3JTaGEiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7Ozs7Q0FLQyxHQUVELE1BQU1BLFNBQVNDLFFBQVM7QUFDeEIsTUFBTUMsVUFBVUQsUUFBUyxhQUFjRSxPQUFPO0FBRTlDOzs7Ozs7Ozs7O0NBVUMsR0FDREMsT0FBT0MsT0FBTyxHQUFHLGVBQWVDLFdBQVlDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxjQUFjLE1BQU07SUFDMUVULE9BQVEsT0FBT08sU0FBUztJQUN4QlAsT0FBUSxPQUFPUSxTQUFTO0lBQ3hCUixPQUFRLE9BQU9TLGdCQUFnQjtJQUUvQixPQUFPUCxRQUFTLE9BQU87UUFBRTtRQUFZO1FBQVEsR0FBR08sWUFBWSxDQUFDLEVBQUVELE1BQU07S0FBRSxFQUFFLENBQUMsR0FBRyxFQUFFRCxNQUFNO0FBQ3ZGIn0=