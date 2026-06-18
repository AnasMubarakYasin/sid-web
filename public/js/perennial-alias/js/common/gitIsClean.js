// Copyright 2017-2026, University of Colorado Boulder
/**
 * Checks to see if the git state/status is clean
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const winston = require('winston');
/**
 * Checks to see if the git state/status is clean
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} [file] - Optional file or path if you only want to check state of a single file or subdirectory
 * @returns {Promise.<boolean>} - Whether it is clean or not
 * @rejects {ExecuteError}
 */ module.exports = function gitIsClean(repo, file) {
    winston.debug(`git status check on ${repo}`);
    const gitArgs = [
        'status',
        '--porcelain'
    ];
    if (file) {
        gitArgs.push(file);
    }
    return execute('git', gitArgs, `../${repo}`).then((stdout)=>Promise.resolve(stdout.length === 0));
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0SXNDbGVhbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBDaGVja3MgdG8gc2VlIGlmIHRoZSBnaXQgc3RhdGUvc3RhdHVzIGlzIGNsZWFuXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xuXG4vKipcbiAqIENoZWNrcyB0byBzZWUgaWYgdGhlIGdpdCBzdGF0ZS9zdGF0dXMgaXMgY2xlYW5cbiAqIEBwdWJsaWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZmlsZV0gLSBPcHRpb25hbCBmaWxlIG9yIHBhdGggaWYgeW91IG9ubHkgd2FudCB0byBjaGVjayBzdGF0ZSBvZiBhIHNpbmdsZSBmaWxlIG9yIHN1YmRpcmVjdG9yeVxuICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fSAtIFdoZXRoZXIgaXQgaXMgY2xlYW4gb3Igbm90XG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdpdElzQ2xlYW4oIHJlcG8sIGZpbGUgKSB7XG4gIHdpbnN0b24uZGVidWcoIGBnaXQgc3RhdHVzIGNoZWNrIG9uICR7cmVwb31gICk7XG5cbiAgY29uc3QgZ2l0QXJncyA9IFsgJ3N0YXR1cycsICctLXBvcmNlbGFpbicgXTtcblxuICBpZiAoIGZpbGUgKSB7XG4gICAgZ2l0QXJncy5wdXNoKCBmaWxlICk7XG4gIH1cbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBnaXRBcmdzLCBgLi4vJHtyZXBvfWAgKS50aGVuKCBzdGRvdXQgPT4gUHJvbWlzZS5yZXNvbHZlKCBzdGRvdXQubGVuZ3RoID09PSAwICkgKTtcbn07Il0sIm5hbWVzIjpbImV4ZWN1dGUiLCJyZXF1aXJlIiwiZGVmYXVsdCIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwiZ2l0SXNDbGVhbiIsInJlcG8iLCJmaWxlIiwiZGVidWciLCJnaXRBcmdzIiwicHVzaCIsInRoZW4iLCJzdGRvdXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImxlbmd0aCJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7O0NBSUMsR0FFRCxNQUFNQSxVQUFVQyxRQUFTLGFBQWNDLE9BQU87QUFDOUMsTUFBTUMsVUFBVUYsUUFBUztBQUV6Qjs7Ozs7Ozs7Q0FRQyxHQUNERyxPQUFPQyxPQUFPLEdBQUcsU0FBU0MsV0FBWUMsSUFBSSxFQUFFQyxJQUFJO0lBQzlDTCxRQUFRTSxLQUFLLENBQUUsQ0FBQyxvQkFBb0IsRUFBRUYsTUFBTTtJQUU1QyxNQUFNRyxVQUFVO1FBQUU7UUFBVTtLQUFlO0lBRTNDLElBQUtGLE1BQU87UUFDVkUsUUFBUUMsSUFBSSxDQUFFSDtJQUNoQjtJQUNBLE9BQU9SLFFBQVMsT0FBT1UsU0FBUyxDQUFDLEdBQUcsRUFBRUgsTUFBTSxFQUFHSyxJQUFJLENBQUVDLENBQUFBLFNBQVVDLFFBQVFDLE9BQU8sQ0FBRUYsT0FBT0csTUFBTSxLQUFLO0FBQ3BHIn0=