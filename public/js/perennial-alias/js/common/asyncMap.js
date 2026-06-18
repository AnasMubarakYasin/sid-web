// Copyright 2020-2026, University of Colorado Boulder
/**
 * Returns an array mapped asynchronously
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ /**
 * Returns an array mapped asynchronously
 *
 * @param {Array.<*>} list
 * @param {function({*}):*})} f
 * @returns {Promise.<Array.<*>>}
 */ const asyncMap = async (list, f)=>{
    const items = [];
    let index = 0;
    for (const item of list){
        items.push(await f(item, index++));
    }
    return items;
};
module.exports = asyncMap;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vYXN5bmNNYXAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSBtYXBwZWQgYXN5bmNocm9ub3VzbHlcbiAqXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICovXG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSBtYXBwZWQgYXN5bmNocm9ub3VzbHlcbiAqXG4gKiBAcGFyYW0ge0FycmF5LjwqPn0gbGlzdFxuICogQHBhcmFtIHtmdW5jdGlvbih7Kn0pOip9KX0gZlxuICogQHJldHVybnMge1Byb21pc2UuPEFycmF5LjwqPj59XG4gKi9cbmNvbnN0IGFzeW5jTWFwID0gYXN5bmMgKCBsaXN0LCBmICkgPT4ge1xuICBjb25zdCBpdGVtcyA9IFtdO1xuICBsZXQgaW5kZXggPSAwO1xuICBmb3IgKCBjb25zdCBpdGVtIG9mIGxpc3QgKSB7XG4gICAgaXRlbXMucHVzaCggYXdhaXQgZiggaXRlbSwgaW5kZXgrKyApICk7XG4gIH1cbiAgcmV0dXJuIGl0ZW1zO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBhc3luY01hcDsiXSwibmFtZXMiOlsiYXN5bmNNYXAiLCJsaXN0IiwiZiIsIml0ZW1zIiwiaW5kZXgiLCJpdGVtIiwicHVzaCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7OztDQUlDLEdBRUQ7Ozs7OztDQU1DLEdBQ0QsTUFBTUEsV0FBVyxPQUFRQyxNQUFNQztJQUM3QixNQUFNQyxRQUFRLEVBQUU7SUFDaEIsSUFBSUMsUUFBUTtJQUNaLEtBQU0sTUFBTUMsUUFBUUosS0FBTztRQUN6QkUsTUFBTUcsSUFBSSxDQUFFLE1BQU1KLEVBQUdHLE1BQU1EO0lBQzdCO0lBQ0EsT0FBT0Q7QUFDVDtBQUVBSSxPQUFPQyxPQUFPLEdBQUdSIn0=