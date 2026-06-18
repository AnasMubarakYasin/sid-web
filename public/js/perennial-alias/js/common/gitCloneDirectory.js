// Copyright 2017-2026, University of Colorado Boulder
/**
 * git clones one of our repositories
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const winston = require('winston');
const execute = require('./execute').default;
const getActiveSceneryStackRepos = require('./getActiveSceneryStackRepos');
/**
 * @public
 *
 * @param {string} repo
 * @param {string} directory
 * @returns {Promise}
 */ module.exports = async function gitCloneDirectory(repo, directory) {
    winston.info(`cloning repo ${repo} in ${directory}`);
    if (getActiveSceneryStackRepos().includes(repo)) {
        await execute('git', [
            'clone',
            `https://github.com/scenerystack/${repo}.git`
        ], directory);
    } else if (repo === 'perennial-alias') {
        await execute('git', [
            'clone',
            'https://github.com/phetsims/perennial.git',
            repo
        ], directory);
    } else {
        await execute('git', [
            'clone',
            `https://github.com/phetsims/${repo}.git`
        ], directory);
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0Q2xvbmVEaXJlY3RvcnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogZ2l0IGNsb25lcyBvbmUgb2Ygb3VyIHJlcG9zaXRvcmllc1xuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcbmNvbnN0IGdldEFjdGl2ZVNjZW5lcnlTdGFja1JlcG9zID0gcmVxdWlyZSggJy4vZ2V0QWN0aXZlU2NlbmVyeVN0YWNrUmVwb3MnICk7XG5cbi8qKlxuICogQHB1YmxpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXG4gKiBAcGFyYW0ge3N0cmluZ30gZGlyZWN0b3J5XG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBnaXRDbG9uZURpcmVjdG9yeSggcmVwbywgZGlyZWN0b3J5ICkge1xuICB3aW5zdG9uLmluZm8oIGBjbG9uaW5nIHJlcG8gJHtyZXBvfSBpbiAke2RpcmVjdG9yeX1gICk7XG4gIGlmICggZ2V0QWN0aXZlU2NlbmVyeVN0YWNrUmVwb3MoKS5pbmNsdWRlcyggcmVwbyApICkge1xuICAgIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdjbG9uZScsIGBodHRwczovL2dpdGh1Yi5jb20vc2NlbmVyeXN0YWNrLyR7cmVwb30uZ2l0YCBdLCBkaXJlY3RvcnkgKTtcbiAgfVxuICBlbHNlIGlmICggcmVwbyA9PT0gJ3BlcmVubmlhbC1hbGlhcycgKSB7XG4gICAgYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFsgJ2Nsb25lJywgJ2h0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9wZXJlbm5pYWwuZ2l0JywgcmVwbyBdLCBkaXJlY3RvcnkgKTtcbiAgfVxuICBlbHNlIHtcbiAgICBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnY2xvbmUnLCBgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zLyR7cmVwb30uZ2l0YCBdLCBkaXJlY3RvcnkgKTtcbiAgfVxufTsiXSwibmFtZXMiOlsid2luc3RvbiIsInJlcXVpcmUiLCJleGVjdXRlIiwiZGVmYXVsdCIsImdldEFjdGl2ZVNjZW5lcnlTdGFja1JlcG9zIiwibW9kdWxlIiwiZXhwb3J0cyIsImdpdENsb25lRGlyZWN0b3J5IiwicmVwbyIsImRpcmVjdG9yeSIsImluZm8iLCJpbmNsdWRlcyJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7O0NBSUMsR0FFRCxNQUFNQSxVQUFVQyxRQUFTO0FBQ3pCLE1BQU1DLFVBQVVELFFBQVMsYUFBY0UsT0FBTztBQUM5QyxNQUFNQyw2QkFBNkJILFFBQVM7QUFFNUM7Ozs7OztDQU1DLEdBQ0RJLE9BQU9DLE9BQU8sR0FBRyxlQUFlQyxrQkFBbUJDLElBQUksRUFBRUMsU0FBUztJQUNoRVQsUUFBUVUsSUFBSSxDQUFFLENBQUMsYUFBYSxFQUFFRixLQUFLLElBQUksRUFBRUMsV0FBVztJQUNwRCxJQUFLTCw2QkFBNkJPLFFBQVEsQ0FBRUgsT0FBUztRQUNuRCxNQUFNTixRQUFTLE9BQU87WUFBRTtZQUFTLENBQUMsZ0NBQWdDLEVBQUVNLEtBQUssSUFBSSxDQUFDO1NBQUUsRUFBRUM7SUFDcEYsT0FDSyxJQUFLRCxTQUFTLG1CQUFvQjtRQUNyQyxNQUFNTixRQUFTLE9BQU87WUFBRTtZQUFTO1lBQTZDTTtTQUFNLEVBQUVDO0lBQ3hGLE9BQ0s7UUFDSCxNQUFNUCxRQUFTLE9BQU87WUFBRTtZQUFTLENBQUMsNEJBQTRCLEVBQUVNLEtBQUssSUFBSSxDQUFDO1NBQUUsRUFBRUM7SUFDaEY7QUFDRiJ9