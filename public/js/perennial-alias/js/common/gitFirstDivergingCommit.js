// Copyright 2021-2026, University of Colorado Boulder
/**
 * Provides the SHA of the first SHA from a target that diverges from the second target
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const assert = require('assert');
/**
 * Provides the SHA of the first SHA from a target that diverges from the second target
 * @public
 *
 * e.g. to get the first commit of acid-base-solutions' 1.2 branch that does not exist in main:
 *
 *   gitFirstDivergingCommit( 'acid-base-solutions', '1.2', 'main' )
 *
 * @param {string} repo - The repository name
 * @param {string} primaryTarget - Branch/SHA
 * @param {string} secondaryTarget - Branch/SHA
 * @returns {Promise.<string>} - Resolves to the SHA
 */ module.exports = function(repo, primaryTarget, secondaryTarget) {
    assert(typeof repo === 'string');
    assert(typeof primaryTarget === 'string');
    assert(typeof secondaryTarget === 'string');
    return execute('git', [
        'log',
        `${secondaryTarget}...${primaryTarget}`,
        '--reverse',
        '--pretty=oneline'
    ], `../${repo}`).then((stdout)=>{
        return Promise.resolve(stdout.trim().split('\n')[0].trim().split(' ')[0]);
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0Rmlyc3REaXZlcmdpbmdDb21taXQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogUHJvdmlkZXMgdGhlIFNIQSBvZiB0aGUgZmlyc3QgU0hBIGZyb20gYSB0YXJnZXQgdGhhdCBkaXZlcmdlcyBmcm9tIHRoZSBzZWNvbmQgdGFyZ2V0XG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcblxuLyoqXG4gKiBQcm92aWRlcyB0aGUgU0hBIG9mIHRoZSBmaXJzdCBTSEEgZnJvbSBhIHRhcmdldCB0aGF0IGRpdmVyZ2VzIGZyb20gdGhlIHNlY29uZCB0YXJnZXRcbiAqIEBwdWJsaWNcbiAqXG4gKiBlLmcuIHRvIGdldCB0aGUgZmlyc3QgY29tbWl0IG9mIGFjaWQtYmFzZS1zb2x1dGlvbnMnIDEuMiBicmFuY2ggdGhhdCBkb2VzIG5vdCBleGlzdCBpbiBtYWluOlxuICpcbiAqICAgZ2l0Rmlyc3REaXZlcmdpbmdDb21taXQoICdhY2lkLWJhc2Utc29sdXRpb25zJywgJzEuMicsICdtYWluJyApXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJpbWFyeVRhcmdldCAtIEJyYW5jaC9TSEFcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWNvbmRhcnlUYXJnZXQgLSBCcmFuY2gvU0hBXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn0gLSBSZXNvbHZlcyB0byB0aGUgU0hBXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHJlcG8sIHByaW1hcnlUYXJnZXQsIHNlY29uZGFyeVRhcmdldCApIHtcbiAgYXNzZXJ0KCB0eXBlb2YgcmVwbyA9PT0gJ3N0cmluZycgKTtcbiAgYXNzZXJ0KCB0eXBlb2YgcHJpbWFyeVRhcmdldCA9PT0gJ3N0cmluZycgKTtcbiAgYXNzZXJ0KCB0eXBlb2Ygc2Vjb25kYXJ5VGFyZ2V0ID09PSAnc3RyaW5nJyApO1xuXG4gIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnbG9nJywgYCR7c2Vjb25kYXJ5VGFyZ2V0fS4uLiR7cHJpbWFyeVRhcmdldH1gLCAnLS1yZXZlcnNlJywgJy0tcHJldHR5PW9uZWxpbmUnIF0sIGAuLi8ke3JlcG99YCApLnRoZW4oIHN0ZG91dCA9PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSggc3Rkb3V0LnRyaW0oKS5zcGxpdCggJ1xcbicgKVsgMCBdLnRyaW0oKS5zcGxpdCggJyAnIClbIDAgXSApO1xuICB9ICk7XG59OyJdLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImRlZmF1bHQiLCJhc3NlcnQiLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsInByaW1hcnlUYXJnZXQiLCJzZWNvbmRhcnlUYXJnZXQiLCJ0aGVuIiwic3Rkb3V0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0cmltIiwic3BsaXQiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7OztDQUlDLEdBRUQsTUFBTUEsVUFBVUMsUUFBUyxhQUFjQyxPQUFPO0FBQzlDLE1BQU1DLFNBQVNGLFFBQVM7QUFFeEI7Ozs7Ozs7Ozs7OztDQVlDLEdBQ0RHLE9BQU9DLE9BQU8sR0FBRyxTQUFVQyxJQUFJLEVBQUVDLGFBQWEsRUFBRUMsZUFBZTtJQUM3REwsT0FBUSxPQUFPRyxTQUFTO0lBQ3hCSCxPQUFRLE9BQU9JLGtCQUFrQjtJQUNqQ0osT0FBUSxPQUFPSyxvQkFBb0I7SUFFbkMsT0FBT1IsUUFBUyxPQUFPO1FBQUU7UUFBTyxHQUFHUSxnQkFBZ0IsR0FBRyxFQUFFRCxlQUFlO1FBQUU7UUFBYTtLQUFvQixFQUFFLENBQUMsR0FBRyxFQUFFRCxNQUFNLEVBQUdHLElBQUksQ0FBRUMsQ0FBQUE7UUFDL0gsT0FBT0MsUUFBUUMsT0FBTyxDQUFFRixPQUFPRyxJQUFJLEdBQUdDLEtBQUssQ0FBRSxLQUFNLENBQUUsRUFBRyxDQUFDRCxJQUFJLEdBQUdDLEtBQUssQ0FBRSxJQUFLLENBQUUsRUFBRztJQUNuRjtBQUNGIn0=