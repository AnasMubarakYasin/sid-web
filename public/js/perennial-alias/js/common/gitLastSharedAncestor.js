// Copyright 2021-2026, University of Colorado Boulder
/**
 * Provides the SHA of the last shared ancestor commit between two targets (branches/SHAs)
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const assert = require('assert');
/**
 * Provides the SHA of the last shared ancestor commit between two targets (branches/SHAs)
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} targetA - Branch/SHA
 * @param {string} targetB - Branch/SHA
 * @returns {Promise.<string>} - Resolves to the SHA
 */ module.exports = function(repo, targetA, targetB) {
    assert(typeof repo === 'string');
    assert(typeof targetA === 'string');
    assert(typeof targetB === 'string');
    return execute('git', [
        'merge-base',
        targetA,
        targetB
    ], `../${repo}`).then((stdout)=>{
        return Promise.resolve(stdout.trim());
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0TGFzdFNoYXJlZEFuY2VzdG9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIFByb3ZpZGVzIHRoZSBTSEEgb2YgdGhlIGxhc3Qgc2hhcmVkIGFuY2VzdG9yIGNvbW1pdCBiZXR3ZWVuIHR3byB0YXJnZXRzIChicmFuY2hlcy9TSEFzKVxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XG5cbi8qKlxuICogUHJvdmlkZXMgdGhlIFNIQSBvZiB0aGUgbGFzdCBzaGFyZWQgYW5jZXN0b3IgY29tbWl0IGJldHdlZW4gdHdvIHRhcmdldHMgKGJyYW5jaGVzL1NIQXMpXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFyZ2V0QSAtIEJyYW5jaC9TSEFcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRCIC0gQnJhbmNoL1NIQVxuICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gUmVzb2x2ZXMgdG8gdGhlIFNIQVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvLCB0YXJnZXRBLCB0YXJnZXRCICkge1xuICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJyApO1xuICBhc3NlcnQoIHR5cGVvZiB0YXJnZXRBID09PSAnc3RyaW5nJyApO1xuICBhc3NlcnQoIHR5cGVvZiB0YXJnZXRCID09PSAnc3RyaW5nJyApO1xuXG4gIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnbWVyZ2UtYmFzZScsIHRhcmdldEEsIHRhcmdldEIgXSwgYC4uLyR7cmVwb31gICkudGhlbiggc3Rkb3V0ID0+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCBzdGRvdXQudHJpbSgpICk7XG4gIH0gKTtcbn07Il0sIm5hbWVzIjpbImV4ZWN1dGUiLCJyZXF1aXJlIiwiZGVmYXVsdCIsImFzc2VydCIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwidGFyZ2V0QSIsInRhcmdldEIiLCJ0aGVuIiwic3Rkb3V0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0cmltIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUM5QyxNQUFNQyxTQUFTRixRQUFTO0FBRXhCOzs7Ozs7OztDQVFDLEdBQ0RHLE9BQU9DLE9BQU8sR0FBRyxTQUFVQyxJQUFJLEVBQUVDLE9BQU8sRUFBRUMsT0FBTztJQUMvQ0wsT0FBUSxPQUFPRyxTQUFTO0lBQ3hCSCxPQUFRLE9BQU9JLFlBQVk7SUFDM0JKLE9BQVEsT0FBT0ssWUFBWTtJQUUzQixPQUFPUixRQUFTLE9BQU87UUFBRTtRQUFjTztRQUFTQztLQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUVGLE1BQU0sRUFBR0csSUFBSSxDQUFFQyxDQUFBQTtRQUM5RSxPQUFPQyxRQUFRQyxPQUFPLENBQUVGLE9BQU9HLElBQUk7SUFDckM7QUFDRiJ9