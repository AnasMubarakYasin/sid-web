// Copyright 2021-2026, University of Colorado Boulder
/**
 * Checks whether a git commit exists (locally) in a repo
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
/**
 * Executes git commit
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} sha - The SHA of the commit
 * @returns {Promise.<boolean>}
 */ module.exports = async function(repo, sha) {
    const result = await execute('git', [
        'cat-file',
        '-e',
        sha
    ], `../${repo}`, {
        errors: 'resolve'
    });
    if (result.code === 0) {
        return true;
    } else if (result.code === 1) {
        return false;
    } else {
        throw new Error(`Non-zero and non-one exit code from git cat-file: ${result}`);
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0RG9lc0NvbW1pdEV4aXN0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgZ2l0IGNvbW1pdCBleGlzdHMgKGxvY2FsbHkpIGluIGEgcmVwb1xuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcblxuLyoqXG4gKiBFeGVjdXRlcyBnaXQgY29tbWl0XG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gc2hhIC0gVGhlIFNIQSBvZiB0aGUgY29tbWl0XG4gKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24oIHJlcG8sIHNoYSApIHtcblxuICBjb25zdCByZXN1bHQgPSBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnY2F0LWZpbGUnLCAnLWUnLCBzaGEgXSwgYC4uLyR7cmVwb31gLCB7XG4gICAgZXJyb3JzOiAncmVzb2x2ZSdcbiAgfSApO1xuXG4gIGlmICggcmVzdWx0LmNvZGUgPT09IDAgKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgZWxzZSBpZiAoIHJlc3VsdC5jb2RlID09PSAxICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoIGBOb24temVybyBhbmQgbm9uLW9uZSBleGl0IGNvZGUgZnJvbSBnaXQgY2F0LWZpbGU6ICR7cmVzdWx0fWAgKTtcbiAgfVxufTsiXSwibmFtZXMiOlsiZXhlY3V0ZSIsInJlcXVpcmUiLCJkZWZhdWx0IiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJzaGEiLCJyZXN1bHQiLCJlcnJvcnMiLCJjb2RlIiwiRXJyb3IiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7OztDQUlDLEdBRUQsTUFBTUEsVUFBVUMsUUFBUyxhQUFjQyxPQUFPO0FBRTlDOzs7Ozs7O0NBT0MsR0FDREMsT0FBT0MsT0FBTyxHQUFHLGVBQWdCQyxJQUFJLEVBQUVDLEdBQUc7SUFFeEMsTUFBTUMsU0FBUyxNQUFNUCxRQUFTLE9BQU87UUFBRTtRQUFZO1FBQU1NO0tBQUssRUFBRSxDQUFDLEdBQUcsRUFBRUQsTUFBTSxFQUFFO1FBQzVFRyxRQUFRO0lBQ1Y7SUFFQSxJQUFLRCxPQUFPRSxJQUFJLEtBQUssR0FBSTtRQUN2QixPQUFPO0lBQ1QsT0FDSyxJQUFLRixPQUFPRSxJQUFJLEtBQUssR0FBSTtRQUM1QixPQUFPO0lBQ1QsT0FDSztRQUNILE1BQU0sSUFBSUMsTUFBTyxDQUFDLGtEQUFrRCxFQUFFSCxRQUFRO0lBQ2hGO0FBQ0YifQ==