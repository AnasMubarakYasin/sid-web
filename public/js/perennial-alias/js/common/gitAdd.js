// Copyright 2017-2026, University of Colorado Boulder
/**
 * git add
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const winston = require('winston');
/**
 * Executes git add
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} file - The file to be added
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */ module.exports = function(repo, file) {
    winston.info(`git add ${file} on ${repo}`);
    return execute('git', [
        'add',
        file
    ], `../${repo}`);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0QWRkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIGdpdCBhZGRcbiAqXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICovXG5cbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApLmRlZmF1bHQ7XG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XG5cbi8qKlxuICogRXhlY3V0ZXMgZ2l0IGFkZFxuICogQHB1YmxpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGUgLSBUaGUgZmlsZSB0byBiZSBhZGRlZFxuICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gU3Rkb3V0XG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvLCBmaWxlICkge1xuICB3aW5zdG9uLmluZm8oIGBnaXQgYWRkICR7ZmlsZX0gb24gJHtyZXBvfWAgKTtcblxuICByZXR1cm4gZXhlY3V0ZSggJ2dpdCcsIFsgJ2FkZCcsIGZpbGUgXSwgYC4uLyR7cmVwb31gICk7XG59OyJdLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ3aW5zdG9uIiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJmaWxlIiwiaW5mbyJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7O0NBSUMsR0FFRCxNQUFNQSxVQUFVQyxRQUFTLGFBQWNDLE9BQU87QUFDOUMsTUFBTUMsVUFBVUYsUUFBUztBQUV6Qjs7Ozs7Ozs7Q0FRQyxHQUNERyxPQUFPQyxPQUFPLEdBQUcsU0FBVUMsSUFBSSxFQUFFQyxJQUFJO0lBQ25DSixRQUFRSyxJQUFJLENBQUUsQ0FBQyxRQUFRLEVBQUVELEtBQUssSUFBSSxFQUFFRCxNQUFNO0lBRTFDLE9BQU9OLFFBQVMsT0FBTztRQUFFO1FBQU9PO0tBQU0sRUFBRSxDQUFDLEdBQUcsRUFBRUQsTUFBTTtBQUN0RCJ9