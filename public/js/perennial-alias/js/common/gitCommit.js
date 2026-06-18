// Copyright 2017-2026, University of Colorado Boulder
/**
 * git commit
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const winston = require('winston');
/**
 * Executes git commit
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} message - The message to include in the commit
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */ module.exports = function(repo, message) {
    winston.info(`git commit on ${repo} with message:\n${message}`);
    return execute('git', [
        'commit',
        '--no-verify',
        '-m',
        message
    ], `../${repo}`);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0Q29tbWl0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIGdpdCBjb21taXRcbiAqXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICovXG5cbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApLmRlZmF1bHQ7XG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XG5cbi8qKlxuICogRXhlY3V0ZXMgZ2l0IGNvbW1pdFxuICogQHB1YmxpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSB0byBpbmNsdWRlIGluIHRoZSBjb21taXRcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmc+fSAtIFN0ZG91dFxuICogQHJlamVjdHMge0V4ZWN1dGVFcnJvcn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcmVwbywgbWVzc2FnZSApIHtcbiAgd2luc3Rvbi5pbmZvKCBgZ2l0IGNvbW1pdCBvbiAke3JlcG99IHdpdGggbWVzc2FnZTpcXG4ke21lc3NhZ2V9YCApO1xuXG4gIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnY29tbWl0JywgJy0tbm8tdmVyaWZ5JywgJy1tJywgbWVzc2FnZSBdLCBgLi4vJHtyZXBvfWAgKTtcbn07Il0sIm5hbWVzIjpbImV4ZWN1dGUiLCJyZXF1aXJlIiwiZGVmYXVsdCIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsIm1lc3NhZ2UiLCJpbmZvIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUM5QyxNQUFNQyxVQUFVRixRQUFTO0FBRXpCOzs7Ozs7OztDQVFDLEdBQ0RHLE9BQU9DLE9BQU8sR0FBRyxTQUFVQyxJQUFJLEVBQUVDLE9BQU87SUFDdENKLFFBQVFLLElBQUksQ0FBRSxDQUFDLGNBQWMsRUFBRUYsS0FBSyxnQkFBZ0IsRUFBRUMsU0FBUztJQUUvRCxPQUFPUCxRQUFTLE9BQU87UUFBRTtRQUFVO1FBQWU7UUFBTU87S0FBUyxFQUFFLENBQUMsR0FBRyxFQUFFRCxNQUFNO0FBQ2pGIn0=