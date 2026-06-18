// Copyright 2017-2026, University of Colorado Boulder
/**
 * git cherry-pick (but if it fails, it will back out of the cherry-pick)
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const winston = require('winston');
/**
 * Executes git cherry-pick (but if it fails, it will back out of the cherry-pick)
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} target - The SHA/branch/whatnot to check out
 * @returns {Promise.<boolean>} - Resolves to whether the cherry-pick worked or not. If aborting fails, will reject.
 */ module.exports = function(repo, target) {
    winston.info(`git cherry-pick ${target} on ${repo}`);
    return execute('git', [
        'cherry-pick',
        target
    ], `../${repo}`).then((stdout)=>Promise.resolve(true), (cherryPickError)=>{
        winston.info(`git cherry-pick failed (aborting): ${target} on ${repo}`);
        return execute('git', [
            'cherry-pick',
            '--abort'
        ], `../${repo}`).then((stdout)=>Promise.resolve(false), (abortError)=>{
            winston.error(`git cherry-pick --abort failed: ${target} on ${repo}`);
            return Promise.reject(abortError);
        });
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0Q2hlcnJ5UGljay5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBnaXQgY2hlcnJ5LXBpY2sgKGJ1dCBpZiBpdCBmYWlscywgaXQgd2lsbCBiYWNrIG91dCBvZiB0aGUgY2hlcnJ5LXBpY2spXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xuXG4vKipcbiAqIEV4ZWN1dGVzIGdpdCBjaGVycnktcGljayAoYnV0IGlmIGl0IGZhaWxzLCBpdCB3aWxsIGJhY2sgb3V0IG9mIHRoZSBjaGVycnktcGljaylcbiAqIEBwdWJsaWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXQgLSBUaGUgU0hBL2JyYW5jaC93aGF0bm90IHRvIGNoZWNrIG91dFxuICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fSAtIFJlc29sdmVzIHRvIHdoZXRoZXIgdGhlIGNoZXJyeS1waWNrIHdvcmtlZCBvciBub3QuIElmIGFib3J0aW5nIGZhaWxzLCB3aWxsIHJlamVjdC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcmVwbywgdGFyZ2V0ICkge1xuICB3aW5zdG9uLmluZm8oIGBnaXQgY2hlcnJ5LXBpY2sgJHt0YXJnZXR9IG9uICR7cmVwb31gICk7XG5cbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdjaGVycnktcGljaycsIHRhcmdldCBdLCBgLi4vJHtyZXBvfWAgKS50aGVuKCBzdGRvdXQgPT4gUHJvbWlzZS5yZXNvbHZlKCB0cnVlICksIGNoZXJyeVBpY2tFcnJvciA9PiB7XG4gICAgd2luc3Rvbi5pbmZvKCBgZ2l0IGNoZXJyeS1waWNrIGZhaWxlZCAoYWJvcnRpbmcpOiAke3RhcmdldH0gb24gJHtyZXBvfWAgKTtcblxuICAgIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnY2hlcnJ5LXBpY2snLCAnLS1hYm9ydCcgXSwgYC4uLyR7cmVwb31gICkudGhlbiggc3Rkb3V0ID0+IFByb21pc2UucmVzb2x2ZSggZmFsc2UgKSwgYWJvcnRFcnJvciA9PiB7XG4gICAgICB3aW5zdG9uLmVycm9yKCBgZ2l0IGNoZXJyeS1waWNrIC0tYWJvcnQgZmFpbGVkOiAke3RhcmdldH0gb24gJHtyZXBvfWAgKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCggYWJvcnRFcnJvciApO1xuICAgIH0gKTtcbiAgfSApO1xufTsiXSwibmFtZXMiOlsiZXhlY3V0ZSIsInJlcXVpcmUiLCJkZWZhdWx0Iiwid2luc3RvbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwidGFyZ2V0IiwiaW5mbyIsInRoZW4iLCJzdGRvdXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImNoZXJyeVBpY2tFcnJvciIsImFib3J0RXJyb3IiLCJlcnJvciIsInJlamVjdCJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7O0NBSUMsR0FFRCxNQUFNQSxVQUFVQyxRQUFTLGFBQWNDLE9BQU87QUFDOUMsTUFBTUMsVUFBVUYsUUFBUztBQUV6Qjs7Ozs7OztDQU9DLEdBQ0RHLE9BQU9DLE9BQU8sR0FBRyxTQUFVQyxJQUFJLEVBQUVDLE1BQU07SUFDckNKLFFBQVFLLElBQUksQ0FBRSxDQUFDLGdCQUFnQixFQUFFRCxPQUFPLElBQUksRUFBRUQsTUFBTTtJQUVwRCxPQUFPTixRQUFTLE9BQU87UUFBRTtRQUFlTztLQUFRLEVBQUUsQ0FBQyxHQUFHLEVBQUVELE1BQU0sRUFBR0csSUFBSSxDQUFFQyxDQUFBQSxTQUFVQyxRQUFRQyxPQUFPLENBQUUsT0FBUUMsQ0FBQUE7UUFDeEdWLFFBQVFLLElBQUksQ0FBRSxDQUFDLG1DQUFtQyxFQUFFRCxPQUFPLElBQUksRUFBRUQsTUFBTTtRQUV2RSxPQUFPTixRQUFTLE9BQU87WUFBRTtZQUFlO1NBQVcsRUFBRSxDQUFDLEdBQUcsRUFBRU0sTUFBTSxFQUFHRyxJQUFJLENBQUVDLENBQUFBLFNBQVVDLFFBQVFDLE9BQU8sQ0FBRSxRQUFTRSxDQUFBQTtZQUM1R1gsUUFBUVksS0FBSyxDQUFFLENBQUMsZ0NBQWdDLEVBQUVSLE9BQU8sSUFBSSxFQUFFRCxNQUFNO1lBQ3JFLE9BQU9LLFFBQVFLLE1BQU0sQ0FBRUY7UUFDekI7SUFDRjtBQUNGIn0=