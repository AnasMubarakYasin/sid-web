// Copyright 2023-2026, University of Colorado Boulder
/**
 * Returns an inverse string map (stringMap[ stringKey ][ locale ]) for all strings in all dependencies for a given repo
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const getDependencyRepos = require('../common/getDependencyRepos');
const getRepoStringMap = require('./getRepoStringMap');
/**
 * Returns an inverse string map (stringMap[ stringKey ][ locale ]) for all strings in all dependencies for a given repo
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} checkoutDir
 * @returns {Promise.<stringMap[ stringKey ][ locale ]>}
 */ module.exports = async function getFullStringMap(repo, checkoutDir) {
    let result = {};
    for (const dependencyRepo of (await getDependencyRepos(repo, {
        cwd: checkoutDir
    }))){
        result = {
            ...result,
            ...await getRepoStringMap(dependencyRepo, checkoutDir)
        };
    }
    return result;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvZ2V0RnVsbFN0cmluZ01hcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMy0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBSZXR1cm5zIGFuIGludmVyc2Ugc3RyaW5nIG1hcCAoc3RyaW5nTWFwWyBzdHJpbmdLZXkgXVsgbG9jYWxlIF0pIGZvciBhbGwgc3RyaW5ncyBpbiBhbGwgZGVwZW5kZW5jaWVzIGZvciBhIGdpdmVuIHJlcG9cbiAqXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICovXG5cbmNvbnN0IGdldERlcGVuZGVuY3lSZXBvcyA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2V0RGVwZW5kZW5jeVJlcG9zJyApO1xuY29uc3QgZ2V0UmVwb1N0cmluZ01hcCA9IHJlcXVpcmUoICcuL2dldFJlcG9TdHJpbmdNYXAnICk7XG5cbi8qKlxuICogUmV0dXJucyBhbiBpbnZlcnNlIHN0cmluZyBtYXAgKHN0cmluZ01hcFsgc3RyaW5nS2V5IF1bIGxvY2FsZSBdKSBmb3IgYWxsIHN0cmluZ3MgaW4gYWxsIGRlcGVuZGVuY2llcyBmb3IgYSBnaXZlbiByZXBvXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gY2hlY2tvdXREaXJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmdNYXBbIHN0cmluZ0tleSBdWyBsb2NhbGUgXT59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gZ2V0RnVsbFN0cmluZ01hcCggcmVwbywgY2hlY2tvdXREaXIgKSB7XG5cbiAgbGV0IHJlc3VsdCA9IHt9O1xuXG4gIGZvciAoIGNvbnN0IGRlcGVuZGVuY3lSZXBvIG9mIGF3YWl0IGdldERlcGVuZGVuY3lSZXBvcyggcmVwbywgeyBjd2Q6IGNoZWNrb3V0RGlyIH0gKSApIHtcbiAgICByZXN1bHQgPSB7IC4uLnJlc3VsdCwgLi4uYXdhaXQgZ2V0UmVwb1N0cmluZ01hcCggZGVwZW5kZW5jeVJlcG8sIGNoZWNrb3V0RGlyICkgfTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59OyJdLCJuYW1lcyI6WyJnZXREZXBlbmRlbmN5UmVwb3MiLCJyZXF1aXJlIiwiZ2V0UmVwb1N0cmluZ01hcCIsIm1vZHVsZSIsImV4cG9ydHMiLCJnZXRGdWxsU3RyaW5nTWFwIiwicmVwbyIsImNoZWNrb3V0RGlyIiwicmVzdWx0IiwiZGVwZW5kZW5jeVJlcG8iLCJjd2QiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7OztDQUlDLEdBRUQsTUFBTUEscUJBQXFCQyxRQUFTO0FBQ3BDLE1BQU1DLG1CQUFtQkQsUUFBUztBQUVsQzs7Ozs7OztDQU9DLEdBQ0RFLE9BQU9DLE9BQU8sR0FBRyxlQUFlQyxpQkFBa0JDLElBQUksRUFBRUMsV0FBVztJQUVqRSxJQUFJQyxTQUFTLENBQUM7SUFFZCxLQUFNLE1BQU1DLGtCQUFrQixDQUFBLE1BQU1ULG1CQUFvQk0sTUFBTTtRQUFFSSxLQUFLSDtJQUFZLEVBQUUsRUFBSTtRQUNyRkMsU0FBUztZQUFFLEdBQUdBLE1BQU07WUFBRSxHQUFHLE1BQU1OLGlCQUFrQk8sZ0JBQWdCRixZQUFhO1FBQUM7SUFDakY7SUFFQSxPQUFPQztBQUNUIn0=