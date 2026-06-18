// Copyright 2018-2026, University of Colorado Boulder
/**
 * git checkout -b {{BRANCH}}
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const assert = require('assert');
const winston = require('winston');
/**
 * Executes git checkout -b {{BRANCH}}
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} branch - The branch name to create
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */ module.exports = function(repo, branch) {
    assert(typeof repo === 'string');
    assert(typeof branch === 'string');
    winston.info(`git checkout -b ${branch} on ${repo}`);
    return execute('git', [
        'checkout',
        '-b',
        branch
    ], `../${repo}`);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0Q3JlYXRlQnJhbmNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIGdpdCBjaGVja291dCAtYiB7e0JSQU5DSH19XG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcblxuLyoqXG4gKiBFeGVjdXRlcyBnaXQgY2hlY2tvdXQgLWIge3tCUkFOQ0h9fVxuICogQHB1YmxpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IGJyYW5jaCAtIFRoZSBicmFuY2ggbmFtZSB0byBjcmVhdGVcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmc+fSAtIFN0ZG91dFxuICogQHJlamVjdHMge0V4ZWN1dGVFcnJvcn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcmVwbywgYnJhbmNoICkge1xuICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJyApO1xuICBhc3NlcnQoIHR5cGVvZiBicmFuY2ggPT09ICdzdHJpbmcnICk7XG5cbiAgd2luc3Rvbi5pbmZvKCBgZ2l0IGNoZWNrb3V0IC1iICR7YnJhbmNofSBvbiAke3JlcG99YCApO1xuXG4gIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnY2hlY2tvdXQnLCAnLWInLCBicmFuY2ggXSwgYC4uLyR7cmVwb31gICk7XG59OyJdLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImRlZmF1bHQiLCJhc3NlcnQiLCJ3aW5zdG9uIiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJicmFuY2giLCJpbmZvIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUM5QyxNQUFNQyxTQUFTRixRQUFTO0FBQ3hCLE1BQU1HLFVBQVVILFFBQVM7QUFFekI7Ozs7Ozs7O0NBUUMsR0FDREksT0FBT0MsT0FBTyxHQUFHLFNBQVVDLElBQUksRUFBRUMsTUFBTTtJQUNyQ0wsT0FBUSxPQUFPSSxTQUFTO0lBQ3hCSixPQUFRLE9BQU9LLFdBQVc7SUFFMUJKLFFBQVFLLElBQUksQ0FBRSxDQUFDLGdCQUFnQixFQUFFRCxPQUFPLElBQUksRUFBRUQsTUFBTTtJQUVwRCxPQUFPUCxRQUFTLE9BQU87UUFBRTtRQUFZO1FBQU1RO0tBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRUQsTUFBTTtBQUNuRSJ9