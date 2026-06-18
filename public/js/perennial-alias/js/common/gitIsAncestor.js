// Copyright 2017-2026, University of Colorado Boulder
/**
 * Whether a git commit is an ancestor of another.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const winston = require('winston');
/**
 * Whether a git commit is an ancestor of another
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} possibleAncestor
 * @param {string} possibleDescendant
 * @returns {Promise.<boolean>} - Whether it is an ancestor or not
 * @rejects {ExecuteError}
 */ module.exports = function(repo, possibleAncestor, possibleDescendant) {
    winston.info(`git check (in ${repo}) for whether ${possibleAncestor} is an ancestor of ${possibleDescendant}`);
    return execute('git', [
        'merge-base',
        '--is-ancestor',
        possibleAncestor,
        possibleDescendant
    ], `../${repo}`).then((stdout)=>Promise.resolve(true), (mergeError)=>{
        if (mergeError.code === 1) {
            return Promise.resolve(false);
        } else {
            return Promise.reject(mergeError);
        }
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0SXNBbmNlc3Rvci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBXaGV0aGVyIGEgZ2l0IGNvbW1pdCBpcyBhbiBhbmNlc3RvciBvZiBhbm90aGVyLlxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcblxuLyoqXG4gKiBXaGV0aGVyIGEgZ2l0IGNvbW1pdCBpcyBhbiBhbmNlc3RvciBvZiBhbm90aGVyXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gcG9zc2libGVBbmNlc3RvclxuICogQHBhcmFtIHtzdHJpbmd9IHBvc3NpYmxlRGVzY2VuZGFudFxuICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fSAtIFdoZXRoZXIgaXQgaXMgYW4gYW5jZXN0b3Igb3Igbm90XG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvLCBwb3NzaWJsZUFuY2VzdG9yLCBwb3NzaWJsZURlc2NlbmRhbnQgKSB7XG4gIHdpbnN0b24uaW5mbyggYGdpdCBjaGVjayAoaW4gJHtyZXBvfSkgZm9yIHdoZXRoZXIgJHtwb3NzaWJsZUFuY2VzdG9yfSBpcyBhbiBhbmNlc3RvciBvZiAke3Bvc3NpYmxlRGVzY2VuZGFudH1gICk7XG5cbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdtZXJnZS1iYXNlJywgJy0taXMtYW5jZXN0b3InLCBwb3NzaWJsZUFuY2VzdG9yLCBwb3NzaWJsZURlc2NlbmRhbnQgXSwgYC4uLyR7cmVwb31gICkudGhlbiggc3Rkb3V0ID0+IFByb21pc2UucmVzb2x2ZSggdHJ1ZSApLCBtZXJnZUVycm9yID0+IHtcbiAgICBpZiAoIG1lcmdlRXJyb3IuY29kZSA9PT0gMSApIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoIGZhbHNlICk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCBtZXJnZUVycm9yICk7XG4gICAgfVxuICB9ICk7XG59OyJdLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ3aW5zdG9uIiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJwb3NzaWJsZUFuY2VzdG9yIiwicG9zc2libGVEZXNjZW5kYW50IiwiaW5mbyIsInRoZW4iLCJzdGRvdXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsIm1lcmdlRXJyb3IiLCJjb2RlIiwicmVqZWN0Il0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUM5QyxNQUFNQyxVQUFVRixRQUFTO0FBRXpCOzs7Ozs7Ozs7Q0FTQyxHQUNERyxPQUFPQyxPQUFPLEdBQUcsU0FBVUMsSUFBSSxFQUFFQyxnQkFBZ0IsRUFBRUMsa0JBQWtCO0lBQ25FTCxRQUFRTSxJQUFJLENBQUUsQ0FBQyxjQUFjLEVBQUVILEtBQUssY0FBYyxFQUFFQyxpQkFBaUIsbUJBQW1CLEVBQUVDLG9CQUFvQjtJQUU5RyxPQUFPUixRQUFTLE9BQU87UUFBRTtRQUFjO1FBQWlCTztRQUFrQkM7S0FBb0IsRUFBRSxDQUFDLEdBQUcsRUFBRUYsTUFBTSxFQUFHSSxJQUFJLENBQUVDLENBQUFBLFNBQVVDLFFBQVFDLE9BQU8sQ0FBRSxPQUFRQyxDQUFBQTtRQUN0SixJQUFLQSxXQUFXQyxJQUFJLEtBQUssR0FBSTtZQUMzQixPQUFPSCxRQUFRQyxPQUFPLENBQUU7UUFDMUIsT0FDSztZQUNILE9BQU9ELFFBQVFJLE1BQU0sQ0FBRUY7UUFDekI7SUFDRjtBQUNGIn0=