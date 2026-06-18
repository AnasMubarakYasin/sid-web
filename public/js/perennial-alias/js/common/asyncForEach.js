// Copyright 2020-2026, University of Colorado Boulder
/**
 * Executes async functions on each element in an array.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ /**
 * Executes async functions on each element in an array.
 *
 * @param {Array.<*>} list
 * @param {function({*})})} f
 * @returns {Promise}
 */ const asyncForEach = async (list, f)=>{
    let index = 0;
    for (const item of list){
        await f(item, index++);
    }
};
module.exports = asyncForEach;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vYXN5bmNGb3JFYWNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIEV4ZWN1dGVzIGFzeW5jIGZ1bmN0aW9ucyBvbiBlYWNoIGVsZW1lbnQgaW4gYW4gYXJyYXkuXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG4vKipcbiAqIEV4ZWN1dGVzIGFzeW5jIGZ1bmN0aW9ucyBvbiBlYWNoIGVsZW1lbnQgaW4gYW4gYXJyYXkuXG4gKlxuICogQHBhcmFtIHtBcnJheS48Kj59IGxpc3RcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeyp9KX0pfSBmXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xuY29uc3QgYXN5bmNGb3JFYWNoID0gYXN5bmMgKCBsaXN0LCBmICkgPT4ge1xuICBsZXQgaW5kZXggPSAwO1xuICBmb3IgKCBjb25zdCBpdGVtIG9mIGxpc3QgKSB7XG4gICAgYXdhaXQgZiggaXRlbSwgaW5kZXgrKyApO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jRm9yRWFjaDsiXSwibmFtZXMiOlsiYXN5bmNGb3JFYWNoIiwibGlzdCIsImYiLCJpbmRleCIsIml0ZW0iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVEOzs7Ozs7Q0FNQyxHQUNELE1BQU1BLGVBQWUsT0FBUUMsTUFBTUM7SUFDakMsSUFBSUMsUUFBUTtJQUNaLEtBQU0sTUFBTUMsUUFBUUgsS0FBTztRQUN6QixNQUFNQyxFQUFHRSxNQUFNRDtJQUNqQjtBQUNGO0FBRUFFLE9BQU9DLE9BQU8sR0FBR04ifQ==