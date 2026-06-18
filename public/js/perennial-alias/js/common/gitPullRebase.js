// Copyright 2017-2026, University of Colorado Boulder
/**
 * git pull --rebase
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const winston = require('winston');
/**
 * Executes git pull
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */ module.exports = function gitPullRebase(repo) {
    winston.info(`git pull --rebase on ${repo}`);
    return execute('git', [
        'pull',
        '--rebase'
    ], `../${repo}`);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0UHVsbFJlYmFzZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBnaXQgcHVsbCAtLXJlYmFzZVxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcblxuLyoqXG4gKiBFeGVjdXRlcyBnaXQgcHVsbFxuICogQHB1YmxpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxuICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gU3Rkb3V0XG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdpdFB1bGxSZWJhc2UoIHJlcG8gKSB7XG4gIHdpbnN0b24uaW5mbyggYGdpdCBwdWxsIC0tcmViYXNlIG9uICR7cmVwb31gICk7XG5cbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdwdWxsJywgJy0tcmViYXNlJyBdLCBgLi4vJHtyZXBvfWAgKTtcbn07Il0sIm5hbWVzIjpbImV4ZWN1dGUiLCJyZXF1aXJlIiwiZGVmYXVsdCIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwiZ2l0UHVsbFJlYmFzZSIsInJlcG8iLCJpbmZvIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUM5QyxNQUFNQyxVQUFVRixRQUFTO0FBRXpCOzs7Ozs7O0NBT0MsR0FDREcsT0FBT0MsT0FBTyxHQUFHLFNBQVNDLGNBQWVDLElBQUk7SUFDM0NKLFFBQVFLLElBQUksQ0FBRSxDQUFDLHFCQUFxQixFQUFFRCxNQUFNO0lBRTVDLE9BQU9QLFFBQVMsT0FBTztRQUFFO1FBQVE7S0FBWSxFQUFFLENBQUMsR0FBRyxFQUFFTyxNQUFNO0FBQzdEIn0=