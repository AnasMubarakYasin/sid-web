// Copyright 2017-2026, University of Colorado Boulder
/**
 * Gets a mapping from branch name to branch SHA from the remote
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const winston = require('winston');
/**
 * Gets a mapping from branch name to branch SHA from the remote
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise.<Object>} - Object map from branch => sha {string}
 * @rejects {ExecuteError}
 */ module.exports = async function(repo) {
    winston.debug(`retrieving branches from ${repo}`);
    const map = {};
    (await execute('git', [
        'ls-remote'
    ], `../${repo}`)).split('\n').forEach((line)=>{
        const match = line.trim().match(/^(\S+)\s+refs\/heads\/(\S+)$/);
        if (match) {
            map[match[2]] = match[1];
        }
    });
    return map;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2V0UmVtb3RlQnJhbmNoU0hBcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBHZXRzIGEgbWFwcGluZyBmcm9tIGJyYW5jaCBuYW1lIHRvIGJyYW5jaCBTSEEgZnJvbSB0aGUgcmVtb3RlXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xuXG4vKipcbiAqIEdldHMgYSBtYXBwaW5nIGZyb20gYnJhbmNoIG5hbWUgdG8gYnJhbmNoIFNIQSBmcm9tIHRoZSByZW1vdGVcbiAqIEBwdWJsaWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxPYmplY3Q+fSAtIE9iamVjdCBtYXAgZnJvbSBicmFuY2ggPT4gc2hhIHtzdHJpbmd9XG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uKCByZXBvICkge1xuICB3aW5zdG9uLmRlYnVnKCBgcmV0cmlldmluZyBicmFuY2hlcyBmcm9tICR7cmVwb31gICk7XG5cbiAgY29uc3QgbWFwID0ge307XG5cbiAgKCBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnbHMtcmVtb3RlJyBdLCBgLi4vJHtyZXBvfWAgKSApLnNwbGl0KCAnXFxuJyApLmZvckVhY2goIGxpbmUgPT4ge1xuICAgIGNvbnN0IG1hdGNoID0gbGluZS50cmltKCkubWF0Y2goIC9eKFxcUyspXFxzK3JlZnNcXC9oZWFkc1xcLyhcXFMrKSQvICk7XG4gICAgaWYgKCBtYXRjaCApIHtcbiAgICAgIG1hcFsgbWF0Y2hbIDIgXSBdID0gbWF0Y2hbIDEgXTtcbiAgICB9XG4gIH0gKTtcblxuICByZXR1cm4gbWFwO1xufTsiXSwibmFtZXMiOlsiZXhlY3V0ZSIsInJlcXVpcmUiLCJkZWZhdWx0Iiwid2luc3RvbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwiZGVidWciLCJtYXAiLCJzcGxpdCIsImZvckVhY2giLCJsaW5lIiwibWF0Y2giLCJ0cmltIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUM5QyxNQUFNQyxVQUFVRixRQUFTO0FBRXpCOzs7Ozs7O0NBT0MsR0FDREcsT0FBT0MsT0FBTyxHQUFHLGVBQWdCQyxJQUFJO0lBQ25DSCxRQUFRSSxLQUFLLENBQUUsQ0FBQyx5QkFBeUIsRUFBRUQsTUFBTTtJQUVqRCxNQUFNRSxNQUFNLENBQUM7SUFFWCxDQUFBLE1BQU1SLFFBQVMsT0FBTztRQUFFO0tBQWEsRUFBRSxDQUFDLEdBQUcsRUFBRU0sTUFBTSxDQUFDLEVBQUlHLEtBQUssQ0FBRSxNQUFPQyxPQUFPLENBQUVDLENBQUFBO1FBQy9FLE1BQU1DLFFBQVFELEtBQUtFLElBQUksR0FBR0QsS0FBSyxDQUFFO1FBQ2pDLElBQUtBLE9BQVE7WUFDWEosR0FBRyxDQUFFSSxLQUFLLENBQUUsRUFBRyxDQUFFLEdBQUdBLEtBQUssQ0FBRSxFQUFHO1FBQ2hDO0lBQ0Y7SUFFQSxPQUFPSjtBQUNUIn0=