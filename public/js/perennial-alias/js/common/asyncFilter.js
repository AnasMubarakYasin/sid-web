// Copyright 2020-2026, University of Colorado Boulder
/**
 * Returns an array filtered asynchronously
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ /**
 * Returns an array filtered asynchronously
 *
 * @param {Array.<*>} list
 * @param {function({*}):*})} f
 * @returns {Promise.<Array.<*>>}
 */ const asyncFilter = async (list, f)=>{
    const items = [];
    for (const item of list){
        if (await f(item)) {
            items.push(item);
        }
    }
    return items;
};
module.exports = asyncFilter;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vYXN5bmNGaWx0ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSBmaWx0ZXJlZCBhc3luY2hyb25vdXNseVxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGFycmF5IGZpbHRlcmVkIGFzeW5jaHJvbm91c2x5XG4gKlxuICogQHBhcmFtIHtBcnJheS48Kj59IGxpc3RcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeyp9KToqfSl9IGZcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxBcnJheS48Kj4+fVxuICovXG5jb25zdCBhc3luY0ZpbHRlciA9IGFzeW5jICggbGlzdCwgZiApID0+IHtcbiAgY29uc3QgaXRlbXMgPSBbXTtcbiAgZm9yICggY29uc3QgaXRlbSBvZiBsaXN0ICkge1xuICAgIGlmICggYXdhaXQgZiggaXRlbSApICkge1xuICAgICAgaXRlbXMucHVzaCggaXRlbSApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaXRlbXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jRmlsdGVyOyJdLCJuYW1lcyI6WyJhc3luY0ZpbHRlciIsImxpc3QiLCJmIiwiaXRlbXMiLCJpdGVtIiwicHVzaCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7OztDQUlDLEdBRUQ7Ozs7OztDQU1DLEdBQ0QsTUFBTUEsY0FBYyxPQUFRQyxNQUFNQztJQUNoQyxNQUFNQyxRQUFRLEVBQUU7SUFDaEIsS0FBTSxNQUFNQyxRQUFRSCxLQUFPO1FBQ3pCLElBQUssTUFBTUMsRUFBR0UsT0FBUztZQUNyQkQsTUFBTUUsSUFBSSxDQUFFRDtRQUNkO0lBQ0Y7SUFDQSxPQUFPRDtBQUNUO0FBRUFHLE9BQU9DLE9BQU8sR0FBR1AifQ==