// Copyright 2021-2026, University of Colorado Boulder
/**
 * Provides the timestamp of any git target (branch/SHA)
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const assert = require('assert');
/**
 * Provides the timestamp of any git target (branch/SHA)
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} target - Branch/SHA
 * @returns {Promise.<number>} - Resolves to the timestamp
 */ module.exports = function(repo, target) {
    assert(typeof repo === 'string');
    assert(typeof target === 'string');
    return execute('git', [
        'show',
        '-s',
        '--format=%cd',
        '--date=iso',
        target
    ], `../${repo}`).then((stdout)=>{
        return Promise.resolve(new Date(stdout.trim()).getTime());
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0VGltZXN0YW1wLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIFByb3ZpZGVzIHRoZSB0aW1lc3RhbXAgb2YgYW55IGdpdCB0YXJnZXQgKGJyYW5jaC9TSEEpXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcblxuLyoqXG4gKiBQcm92aWRlcyB0aGUgdGltZXN0YW1wIG9mIGFueSBnaXQgdGFyZ2V0IChicmFuY2gvU0hBKVxuICogQHB1YmxpY1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gVGhlIHJlcG9zaXRvcnkgbmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IHRhcmdldCAtIEJyYW5jaC9TSEFcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxudW1iZXI+fSAtIFJlc29sdmVzIHRvIHRoZSB0aW1lc3RhbXBcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcmVwbywgdGFyZ2V0ICkge1xuICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJyApO1xuICBhc3NlcnQoIHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnICk7XG5cbiAgcmV0dXJuIGV4ZWN1dGUoICdnaXQnLCBbICdzaG93JywgJy1zJywgJy0tZm9ybWF0PSVjZCcsICctLWRhdGU9aXNvJywgdGFyZ2V0IF0sIGAuLi8ke3JlcG99YCApLnRoZW4oIHN0ZG91dCA9PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSggbmV3IERhdGUoIHN0ZG91dC50cmltKCkgKS5nZXRUaW1lKCkgKTtcbiAgfSApO1xufTsiXSwibmFtZXMiOlsiZXhlY3V0ZSIsInJlcXVpcmUiLCJkZWZhdWx0IiwiYXNzZXJ0IiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJ0YXJnZXQiLCJ0aGVuIiwic3Rkb3V0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJEYXRlIiwidHJpbSIsImdldFRpbWUiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7OztDQUlDLEdBRUQsTUFBTUEsVUFBVUMsUUFBUyxhQUFjQyxPQUFPO0FBQzlDLE1BQU1DLFNBQVNGLFFBQVM7QUFFeEI7Ozs7Ozs7Q0FPQyxHQUNERyxPQUFPQyxPQUFPLEdBQUcsU0FBVUMsSUFBSSxFQUFFQyxNQUFNO0lBQ3JDSixPQUFRLE9BQU9HLFNBQVM7SUFDeEJILE9BQVEsT0FBT0ksV0FBVztJQUUxQixPQUFPUCxRQUFTLE9BQU87UUFBRTtRQUFRO1FBQU07UUFBZ0I7UUFBY087S0FBUSxFQUFFLENBQUMsR0FBRyxFQUFFRCxNQUFNLEVBQUdFLElBQUksQ0FBRUMsQ0FBQUE7UUFDbEcsT0FBT0MsUUFBUUMsT0FBTyxDQUFFLElBQUlDLEtBQU1ILE9BQU9JLElBQUksSUFBS0MsT0FBTztJQUMzRDtBQUNGIn0=