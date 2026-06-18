// Copyright 2017-2018, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)
const fs = require('graceful-fs'); // eslint-disable-line phet/require-statement-match
const winston = require('winston');
module.exports = async function(filepath, contents) {
    return new Promise((resolve, reject)=>{
        let tries = 0;
        winston.info(`Writing file to path: ${filepath}`);
        const writeFileInterval = setInterval(()=>{
            const onError = (err)=>{
                clearInterval(writeFileInterval);
                reject(err);
            };
            fs.writeFile(filepath, contents, (err)=>{
                if (err) {
                    tries += 1;
                    if (err.code === 'ENOENT') {
                        winston.error(`Write operation failed. The target directory did not exist: ${filepath}`);
                        onError(err);
                    } else if (tries >= 10) {
                        winston.error(`Write operation failed ${tries} time(s). I'm giving up, all hope is lost: ${filepath}`);
                        onError(err);
                    } else {
                        winston.error(`Write failed with error: ${JSON.stringify(err)}, trying again: ${filepath}`);
                    }
                } else {
                    winston.debug('Write success.');
                    clearInterval(writeFileInterval);
                    resolve();
                }
            });
        }, 1000);
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vd3JpdGVGaWxlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMTgsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuLy8gQGF1dGhvciBNYXR0IFBlbm5pbmd0b24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG5cbmNvbnN0IGZzID0gcmVxdWlyZSggJ2dyYWNlZnVsLWZzJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHBoZXQvcmVxdWlyZS1zdGF0ZW1lbnQtbWF0Y2hcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggZmlsZXBhdGgsIGNvbnRlbnRzICkge1xuICByZXR1cm4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT4ge1xuICAgIGxldCB0cmllcyA9IDA7XG4gICAgd2luc3Rvbi5pbmZvKCBgV3JpdGluZyBmaWxlIHRvIHBhdGg6ICR7ZmlsZXBhdGh9YCApO1xuICAgIGNvbnN0IHdyaXRlRmlsZUludGVydmFsID0gc2V0SW50ZXJ2YWwoICgpID0+IHtcbiAgICAgIGNvbnN0IG9uRXJyb3IgPSBlcnIgPT4ge1xuICAgICAgICBjbGVhckludGVydmFsKCB3cml0ZUZpbGVJbnRlcnZhbCApO1xuICAgICAgICByZWplY3QoIGVyciApO1xuICAgICAgfTtcbiAgICAgIGZzLndyaXRlRmlsZSggZmlsZXBhdGgsIGNvbnRlbnRzLCBlcnIgPT4ge1xuICAgICAgICBpZiAoIGVyciApIHtcbiAgICAgICAgICB0cmllcyArPSAxO1xuICAgICAgICAgIGlmICggZXJyLmNvZGUgPT09ICdFTk9FTlQnICkge1xuICAgICAgICAgICAgd2luc3Rvbi5lcnJvciggYFdyaXRlIG9wZXJhdGlvbiBmYWlsZWQuIFRoZSB0YXJnZXQgZGlyZWN0b3J5IGRpZCBub3QgZXhpc3Q6ICR7ZmlsZXBhdGh9YCApO1xuICAgICAgICAgICAgb25FcnJvciggZXJyICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKCB0cmllcyA+PSAxMCApIHtcbiAgICAgICAgICAgIHdpbnN0b24uZXJyb3IoIGBXcml0ZSBvcGVyYXRpb24gZmFpbGVkICR7dHJpZXN9IHRpbWUocykuIEknbSBnaXZpbmcgdXAsIGFsbCBob3BlIGlzIGxvc3Q6ICR7ZmlsZXBhdGh9YCApO1xuICAgICAgICAgICAgb25FcnJvciggZXJyICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2luc3Rvbi5lcnJvciggYFdyaXRlIGZhaWxlZCB3aXRoIGVycm9yOiAke0pTT04uc3RyaW5naWZ5KCBlcnIgKX0sIHRyeWluZyBhZ2FpbjogJHtmaWxlcGF0aH1gICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHdpbnN0b24uZGVidWcoICdXcml0ZSBzdWNjZXNzLicgKTtcbiAgICAgICAgICBjbGVhckludGVydmFsKCB3cml0ZUZpbGVJbnRlcnZhbCApO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSApO1xuICAgIH0sIDEwMDAgKTtcbiAgfSApO1xufTsiXSwibmFtZXMiOlsiZnMiLCJyZXF1aXJlIiwid2luc3RvbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJmaWxlcGF0aCIsImNvbnRlbnRzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ0cmllcyIsImluZm8iLCJ3cml0ZUZpbGVJbnRlcnZhbCIsInNldEludGVydmFsIiwib25FcnJvciIsImVyciIsImNsZWFySW50ZXJ2YWwiLCJ3cml0ZUZpbGUiLCJjb2RlIiwiZXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwiZGVidWciXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUN0RCx5REFBeUQ7QUFFekQsTUFBTUEsS0FBS0MsUUFBUyxnQkFBaUIsbURBQW1EO0FBQ3hGLE1BQU1DLFVBQVVELFFBQVM7QUFFekJFLE9BQU9DLE9BQU8sR0FBRyxlQUFnQkMsUUFBUSxFQUFFQyxRQUFRO0lBQ2pELE9BQU8sSUFBSUMsUUFBUyxDQUFFQyxTQUFTQztRQUM3QixJQUFJQyxRQUFRO1FBQ1pSLFFBQVFTLElBQUksQ0FBRSxDQUFDLHNCQUFzQixFQUFFTixVQUFVO1FBQ2pELE1BQU1PLG9CQUFvQkMsWUFBYTtZQUNyQyxNQUFNQyxVQUFVQyxDQUFBQTtnQkFDZEMsY0FBZUo7Z0JBQ2ZILE9BQVFNO1lBQ1Y7WUFDQWYsR0FBR2lCLFNBQVMsQ0FBRVosVUFBVUMsVUFBVVMsQ0FBQUE7Z0JBQ2hDLElBQUtBLEtBQU07b0JBQ1RMLFNBQVM7b0JBQ1QsSUFBS0ssSUFBSUcsSUFBSSxLQUFLLFVBQVc7d0JBQzNCaEIsUUFBUWlCLEtBQUssQ0FBRSxDQUFDLDREQUE0RCxFQUFFZCxVQUFVO3dCQUN4RlMsUUFBU0M7b0JBQ1gsT0FDSyxJQUFLTCxTQUFTLElBQUs7d0JBQ3RCUixRQUFRaUIsS0FBSyxDQUFFLENBQUMsdUJBQXVCLEVBQUVULE1BQU0sMkNBQTJDLEVBQUVMLFVBQVU7d0JBQ3RHUyxRQUFTQztvQkFDWCxPQUNLO3dCQUNIYixRQUFRaUIsS0FBSyxDQUFFLENBQUMseUJBQXlCLEVBQUVDLEtBQUtDLFNBQVMsQ0FBRU4sS0FBTSxnQkFBZ0IsRUFBRVYsVUFBVTtvQkFDL0Y7Z0JBQ0YsT0FDSztvQkFDSEgsUUFBUW9CLEtBQUssQ0FBRTtvQkFDZk4sY0FBZUo7b0JBQ2ZKO2dCQUNGO1lBQ0Y7UUFDRixHQUFHO0lBQ0w7QUFDRiJ9