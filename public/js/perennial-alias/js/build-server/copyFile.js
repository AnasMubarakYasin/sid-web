// Copyright 2017-2018, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)
const fs = require('graceful-fs'); // eslint-disable-line phet/require-statement-match
module.exports = async function(src, dest) {
    return new Promise((resolve, reject)=>{
        fs.copyFile(src, dest, (err)=>{
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvY29weUZpbGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAxOCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG4vLyBAYXV0aG9yIE1hdHQgUGVubmluZ3RvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcblxuY29uc3QgZnMgPSByZXF1aXJlKCAnZ3JhY2VmdWwtZnMnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcGhldC9yZXF1aXJlLXN0YXRlbWVudC1tYXRjaFxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uKCBzcmMsIGRlc3QgKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSggKCByZXNvbHZlLCByZWplY3QgKSA9PiB7XG4gICAgZnMuY29weUZpbGUoIHNyYywgZGVzdCwgZXJyID0+IHtcbiAgICAgIGlmICggZXJyICkge1xuICAgICAgICByZWplY3QoIGVyciApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9ICk7XG4gIH0gKTtcbn07Il0sIm5hbWVzIjpbImZzIiwicmVxdWlyZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJzcmMiLCJkZXN0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJjb3B5RmlsZSIsImVyciJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBQ3RELHlEQUF5RDtBQUV6RCxNQUFNQSxLQUFLQyxRQUFTLGdCQUFpQixtREFBbUQ7QUFFeEZDLE9BQU9DLE9BQU8sR0FBRyxlQUFnQkMsR0FBRyxFQUFFQyxJQUFJO0lBQ3hDLE9BQU8sSUFBSUMsUUFBUyxDQUFFQyxTQUFTQztRQUM3QlIsR0FBR1MsUUFBUSxDQUFFTCxLQUFLQyxNQUFNSyxDQUFBQTtZQUN0QixJQUFLQSxLQUFNO2dCQUNURixPQUFRRTtZQUNWLE9BQ0s7Z0JBQ0hIO1lBQ0Y7UUFDRjtJQUNGO0FBQ0YifQ==