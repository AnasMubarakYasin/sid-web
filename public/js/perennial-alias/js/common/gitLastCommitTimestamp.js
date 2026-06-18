// Copyright 2020-2026, University of Colorado Boulder
/**
 * Provides the timestamp of the latest commit
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const assert = require('assert');
/**
 * Provides the timestamp of the latest commit
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise.<number>} - Resolves to the timestamp
 */ module.exports = function(repo) {
    assert(typeof repo === 'string');
    return execute('git', [
        'log',
        '-1',
        '--pretty=format:%cd',
        '--date=iso'
    ], `../${repo}`).then((stdout)=>{
        return Promise.resolve(new Date(stdout.trim()).getTime());
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0TGFzdENvbW1pdFRpbWVzdGFtcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBQcm92aWRlcyB0aGUgdGltZXN0YW1wIG9mIHRoZSBsYXRlc3QgY29tbWl0XG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcblxuLyoqXG4gKiBQcm92aWRlcyB0aGUgdGltZXN0YW1wIG9mIHRoZSBsYXRlc3QgY29tbWl0XG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48bnVtYmVyPn0gLSBSZXNvbHZlcyB0byB0aGUgdGltZXN0YW1wXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHJlcG8gKSB7XG4gIGFzc2VydCggdHlwZW9mIHJlcG8gPT09ICdzdHJpbmcnICk7XG5cbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdsb2cnLCAnLTEnLCAnLS1wcmV0dHk9Zm9ybWF0OiVjZCcsICctLWRhdGU9aXNvJyBdLCBgLi4vJHtyZXBvfWAgKS50aGVuKCBzdGRvdXQgPT4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoIG5ldyBEYXRlKCBzdGRvdXQudHJpbSgpICkuZ2V0VGltZSgpICk7XG4gIH0gKTtcbn07Il0sIm5hbWVzIjpbImV4ZWN1dGUiLCJyZXF1aXJlIiwiZGVmYXVsdCIsImFzc2VydCIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwidGhlbiIsInN0ZG91dCIsIlByb21pc2UiLCJyZXNvbHZlIiwiRGF0ZSIsInRyaW0iLCJnZXRUaW1lIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUM5QyxNQUFNQyxTQUFTRixRQUFTO0FBRXhCOzs7Ozs7Q0FNQyxHQUNERyxPQUFPQyxPQUFPLEdBQUcsU0FBVUMsSUFBSTtJQUM3QkgsT0FBUSxPQUFPRyxTQUFTO0lBRXhCLE9BQU9OLFFBQVMsT0FBTztRQUFFO1FBQU87UUFBTTtRQUF1QjtLQUFjLEVBQUUsQ0FBQyxHQUFHLEVBQUVNLE1BQU0sRUFBR0MsSUFBSSxDQUFFQyxDQUFBQTtRQUNoRyxPQUFPQyxRQUFRQyxPQUFPLENBQUUsSUFBSUMsS0FBTUgsT0FBT0ksSUFBSSxJQUFLQyxPQUFPO0lBQzNEO0FBQ0YifQ==