// Copyright 2017-2026, University of Colorado Boulder
/**
 * Gets a list of branch names from the origin
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const winston = require('winston');
/**
 * Gets a list of branch names from the origin
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise.<Array.<string>>}
 * @rejects {ExecuteError}
 */ module.exports = async function(repo) {
    winston.debug(`retrieving branches from ${repo}`);
    return (await execute('git', [
        'ls-remote'
    ], `../${repo}`)).split('\n').filter((line)=>line.includes('refs/heads/')).map((line)=>{
        return line.match(/refs\/heads\/(.*)/)[1].trim();
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2V0QnJhbmNoZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogR2V0cyBhIGxpc3Qgb2YgYnJhbmNoIG5hbWVzIGZyb20gdGhlIG9yaWdpblxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcblxuLyoqXG4gKiBHZXRzIGEgbGlzdCBvZiBicmFuY2ggbmFtZXMgZnJvbSB0aGUgb3JpZ2luXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPHN0cmluZz4+fVxuICogQHJlamVjdHMge0V4ZWN1dGVFcnJvcn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggcmVwbyApIHtcbiAgd2luc3Rvbi5kZWJ1ZyggYHJldHJpZXZpbmcgYnJhbmNoZXMgZnJvbSAke3JlcG99YCApO1xuXG4gIHJldHVybiAoIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdscy1yZW1vdGUnIF0sIGAuLi8ke3JlcG99YCApICkuc3BsaXQoICdcXG4nICkuZmlsdGVyKCBsaW5lID0+IGxpbmUuaW5jbHVkZXMoICdyZWZzL2hlYWRzLycgKSApLm1hcCggbGluZSA9PiB7XG4gICAgcmV0dXJuIGxpbmUubWF0Y2goIC9yZWZzXFwvaGVhZHNcXC8oLiopLyApWyAxIF0udHJpbSgpO1xuICB9ICk7XG59OyJdLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ3aW5zdG9uIiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJkZWJ1ZyIsInNwbGl0IiwiZmlsdGVyIiwibGluZSIsImluY2x1ZGVzIiwibWFwIiwibWF0Y2giLCJ0cmltIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUM5QyxNQUFNQyxVQUFVRixRQUFTO0FBRXpCOzs7Ozs7O0NBT0MsR0FDREcsT0FBT0MsT0FBTyxHQUFHLGVBQWdCQyxJQUFJO0lBQ25DSCxRQUFRSSxLQUFLLENBQUUsQ0FBQyx5QkFBeUIsRUFBRUQsTUFBTTtJQUVqRCxPQUFPLEFBQUUsQ0FBQSxNQUFNTixRQUFTLE9BQU87UUFBRTtLQUFhLEVBQUUsQ0FBQyxHQUFHLEVBQUVNLE1BQU0sQ0FBQyxFQUFJRSxLQUFLLENBQUUsTUFBT0MsTUFBTSxDQUFFQyxDQUFBQSxPQUFRQSxLQUFLQyxRQUFRLENBQUUsZ0JBQWtCQyxHQUFHLENBQUVGLENBQUFBO1FBQ25JLE9BQU9BLEtBQUtHLEtBQUssQ0FBRSxvQkFBcUIsQ0FBRSxFQUFHLENBQUNDLElBQUk7SUFDcEQ7QUFDRiJ9