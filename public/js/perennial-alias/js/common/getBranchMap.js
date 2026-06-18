// Copyright 2023-2026, University of Colorado Boulder
/**
 * Gets a map of branch names (from the origin) to their remote SHAs
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const winston = require('winston');
/**
 * Gets a map of branch names (from the origin) to their remote SHAs
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise.<Record<string, string>>}
 * @rejects {ExecuteError}
 */ module.exports = async function(repo) {
    winston.debug(`retrieving branches from ${repo}`);
    const result = {};
    (await execute('git', [
        'ls-remote'
    ], `../${repo}`)).split('\n').filter((line)=>line.includes('refs/heads/')).forEach((line)=>{
        const branch = line.match(/refs\/heads\/(.*)/)[1].trim();
        const sha = line.split(/\s+/)[0].trim();
        result[branch] = sha;
    });
    return result;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2V0QnJhbmNoTWFwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIEdldHMgYSBtYXAgb2YgYnJhbmNoIG5hbWVzIChmcm9tIHRoZSBvcmlnaW4pIHRvIHRoZWlyIHJlbW90ZSBTSEFzXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xuXG4vKipcbiAqIEdldHMgYSBtYXAgb2YgYnJhbmNoIG5hbWVzIChmcm9tIHRoZSBvcmlnaW4pIHRvIHRoZWlyIHJlbW90ZSBTSEFzXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48UmVjb3JkPHN0cmluZywgc3RyaW5nPj59XG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uKCByZXBvICkge1xuICB3aW5zdG9uLmRlYnVnKCBgcmV0cmlldmluZyBicmFuY2hlcyBmcm9tICR7cmVwb31gICk7XG5cbiAgY29uc3QgcmVzdWx0ID0ge307XG5cbiAgKCBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnbHMtcmVtb3RlJyBdLCBgLi4vJHtyZXBvfWAgKSApLnNwbGl0KCAnXFxuJyApLmZpbHRlciggbGluZSA9PiBsaW5lLmluY2x1ZGVzKCAncmVmcy9oZWFkcy8nICkgKS5mb3JFYWNoKCBsaW5lID0+IHtcbiAgICBjb25zdCBicmFuY2ggPSBsaW5lLm1hdGNoKCAvcmVmc1xcL2hlYWRzXFwvKC4qKS8gKVsgMSBdLnRyaW0oKTtcbiAgICBjb25zdCBzaGEgPSBsaW5lLnNwbGl0KCAvXFxzKy8gKVsgMCBdLnRyaW0oKTtcbiAgICByZXN1bHRbIGJyYW5jaCBdID0gc2hhO1xuICB9ICk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07Il0sIm5hbWVzIjpbImV4ZWN1dGUiLCJyZXF1aXJlIiwiZGVmYXVsdCIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImRlYnVnIiwicmVzdWx0Iiwic3BsaXQiLCJmaWx0ZXIiLCJsaW5lIiwiaW5jbHVkZXMiLCJmb3JFYWNoIiwiYnJhbmNoIiwibWF0Y2giLCJ0cmltIiwic2hhIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUM5QyxNQUFNQyxVQUFVRixRQUFTO0FBRXpCOzs7Ozs7O0NBT0MsR0FDREcsT0FBT0MsT0FBTyxHQUFHLGVBQWdCQyxJQUFJO0lBQ25DSCxRQUFRSSxLQUFLLENBQUUsQ0FBQyx5QkFBeUIsRUFBRUQsTUFBTTtJQUVqRCxNQUFNRSxTQUFTLENBQUM7SUFFZCxDQUFBLE1BQU1SLFFBQVMsT0FBTztRQUFFO0tBQWEsRUFBRSxDQUFDLEdBQUcsRUFBRU0sTUFBTSxDQUFDLEVBQUlHLEtBQUssQ0FBRSxNQUFPQyxNQUFNLENBQUVDLENBQUFBLE9BQVFBLEtBQUtDLFFBQVEsQ0FBRSxnQkFBa0JDLE9BQU8sQ0FBRUYsQ0FBQUE7UUFDaEksTUFBTUcsU0FBU0gsS0FBS0ksS0FBSyxDQUFFLG9CQUFxQixDQUFFLEVBQUcsQ0FBQ0MsSUFBSTtRQUMxRCxNQUFNQyxNQUFNTixLQUFLRixLQUFLLENBQUUsTUFBTyxDQUFFLEVBQUcsQ0FBQ08sSUFBSTtRQUN6Q1IsTUFBTSxDQUFFTSxPQUFRLEdBQUdHO0lBQ3JCO0lBRUEsT0FBT1Q7QUFDVCJ9