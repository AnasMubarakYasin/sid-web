// Copyright 2023-2026, University of Colorado Boulder
/**
 * Gets the contents of a file at a specific git branch/SHA/object
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
/**
 * Gets the contents of a file at a specific git branch/SHA/object
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} gitObject - The branch/SHA/object name
 * @param {string} filename - The filename - relative to the root of the repository
 * @returns {Promise} - Resolves to the file content
 * @rejects {ExecuteError}
 */ module.exports = async function(repo, gitObject, filename) {
    return execute('git', [
        'show',
        `${gitObject}:./${filename}`
    ], `../${repo}`);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2V0R2l0RmlsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMy0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBHZXRzIHRoZSBjb250ZW50cyBvZiBhIGZpbGUgYXQgYSBzcGVjaWZpYyBnaXQgYnJhbmNoL1NIQS9vYmplY3RcbiAqXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICovXG5cbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApLmRlZmF1bHQ7XG5cbi8qKlxuICogR2V0cyB0aGUgY29udGVudHMgb2YgYSBmaWxlIGF0IGEgc3BlY2lmaWMgZ2l0IGJyYW5jaC9TSEEvb2JqZWN0XG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gZ2l0T2JqZWN0IC0gVGhlIGJyYW5jaC9TSEEvb2JqZWN0IG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIFRoZSBmaWxlbmFtZSAtIHJlbGF0aXZlIHRvIHRoZSByb290IG9mIHRoZSByZXBvc2l0b3J5XG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gLSBSZXNvbHZlcyB0byB0aGUgZmlsZSBjb250ZW50XG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uKCByZXBvLCBnaXRPYmplY3QsIGZpbGVuYW1lICkge1xuXG4gIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnc2hvdycsIGAke2dpdE9iamVjdH06Li8ke2ZpbGVuYW1lfWAgXSwgYC4uLyR7cmVwb31gICk7XG59OyJdLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImRlZmF1bHQiLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImdpdE9iamVjdCIsImZpbGVuYW1lIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUU5Qzs7Ozs7Ozs7O0NBU0MsR0FDREMsT0FBT0MsT0FBTyxHQUFHLGVBQWdCQyxJQUFJLEVBQUVDLFNBQVMsRUFBRUMsUUFBUTtJQUV4RCxPQUFPUCxRQUFTLE9BQU87UUFBRTtRQUFRLEdBQUdNLFVBQVUsR0FBRyxFQUFFQyxVQUFVO0tBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRUYsTUFBTTtBQUMvRSJ9