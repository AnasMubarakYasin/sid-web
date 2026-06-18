// Copyright 2017-2026, University of Colorado Boulder
/**
 * Whether there is a remote branch for a given repo.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const winston = require('winston');
/**
 * Whether there is a remote branch for a given repo.
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} branch - The potential branch
 * @returns {Promise.<boolean>} - Whether there was the branch on the remote server
 */ module.exports = async function(repo, branch) {
    winston.debug(`checking for remote branch ${branch} for ${repo}`);
    const stdout = await execute('git', [
        'ls-remote',
        '--heads',
        `https://github.com/phetsims/${repo}.git`,
        branch
    ], `../${repo}`);
    if (stdout.trim().length === 0) {
        return false;
    } else if (stdout.indexOf(`refs/heads/${branch}`) >= 0) {
        return true;
    } else {
        throw new Error(`Failure trying to check for a remote branch ${branch} for ${repo}`);
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vaGFzUmVtb3RlQnJhbmNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIFdoZXRoZXIgdGhlcmUgaXMgYSByZW1vdGUgYnJhbmNoIGZvciBhIGdpdmVuIHJlcG8uXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xuXG4vKipcbiAqIFdoZXRoZXIgdGhlcmUgaXMgYSByZW1vdGUgYnJhbmNoIGZvciBhIGdpdmVuIHJlcG8uXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoIC0gVGhlIHBvdGVudGlhbCBicmFuY2hcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxib29sZWFuPn0gLSBXaGV0aGVyIHRoZXJlIHdhcyB0aGUgYnJhbmNoIG9uIHRoZSByZW1vdGUgc2VydmVyXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24oIHJlcG8sIGJyYW5jaCApIHtcbiAgd2luc3Rvbi5kZWJ1ZyggYGNoZWNraW5nIGZvciByZW1vdGUgYnJhbmNoICR7YnJhbmNofSBmb3IgJHtyZXBvfWAgKTtcblxuICBjb25zdCBzdGRvdXQgPSBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnbHMtcmVtb3RlJywgJy0taGVhZHMnLCBgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zLyR7cmVwb30uZ2l0YCwgYnJhbmNoIF0sIGAuLi8ke3JlcG99YCApO1xuXG4gIGlmICggc3Rkb3V0LnRyaW0oKS5sZW5ndGggPT09IDAgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGVsc2UgaWYgKCBzdGRvdXQuaW5kZXhPZiggYHJlZnMvaGVhZHMvJHticmFuY2h9YCApID49IDAgKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCBgRmFpbHVyZSB0cnlpbmcgdG8gY2hlY2sgZm9yIGEgcmVtb3RlIGJyYW5jaCAke2JyYW5jaH0gZm9yICR7cmVwb31gICk7XG4gIH1cbn07Il0sIm5hbWVzIjpbImV4ZWN1dGUiLCJyZXF1aXJlIiwiZGVmYXVsdCIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImJyYW5jaCIsImRlYnVnIiwic3Rkb3V0IiwidHJpbSIsImxlbmd0aCIsImluZGV4T2YiLCJFcnJvciJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7O0NBSUMsR0FFRCxNQUFNQSxVQUFVQyxRQUFTLGFBQWNDLE9BQU87QUFDOUMsTUFBTUMsVUFBVUYsUUFBUztBQUV6Qjs7Ozs7OztDQU9DLEdBQ0RHLE9BQU9DLE9BQU8sR0FBRyxlQUFnQkMsSUFBSSxFQUFFQyxNQUFNO0lBQzNDSixRQUFRSyxLQUFLLENBQUUsQ0FBQywyQkFBMkIsRUFBRUQsT0FBTyxLQUFLLEVBQUVELE1BQU07SUFFakUsTUFBTUcsU0FBUyxNQUFNVCxRQUFTLE9BQU87UUFBRTtRQUFhO1FBQVcsQ0FBQyw0QkFBNEIsRUFBRU0sS0FBSyxJQUFJLENBQUM7UUFBRUM7S0FBUSxFQUFFLENBQUMsR0FBRyxFQUFFRCxNQUFNO0lBRWhJLElBQUtHLE9BQU9DLElBQUksR0FBR0MsTUFBTSxLQUFLLEdBQUk7UUFDaEMsT0FBTztJQUNULE9BQ0ssSUFBS0YsT0FBT0csT0FBTyxDQUFFLENBQUMsV0FBVyxFQUFFTCxRQUFRLEtBQU0sR0FBSTtRQUN4RCxPQUFPO0lBQ1QsT0FDSztRQUNILE1BQU0sSUFBSU0sTUFBTyxDQUFDLDRDQUE0QyxFQUFFTixPQUFPLEtBQUssRUFBRUQsTUFBTTtJQUN0RjtBQUNGIn0=