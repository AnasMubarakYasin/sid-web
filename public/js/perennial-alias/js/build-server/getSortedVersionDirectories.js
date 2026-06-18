// Copyright 2017, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)
const fs = require('graceful-fs'); // eslint-disable-line phet/require-statement-match
/**
 * Define a helper function that will get a list of the PhET-style version directories at the given path.  The
 * directories must be named with three numbers separated by periods, e.g. 1.2.5.  The directories are sorted in
 * numerical order, which is different from the lexical ordering used by the Linux file system.  So, for example, valid
 * output from this method could be the array [ "1.1.8", "1.1.9", "1.1.10" ].  For more information on why this is
 * necessary, see https://github.com/phetsims/perennial/issues/28.
 *
 * @param path - Filename of the directory.  It's ok if the path does not exist.
 * @returns {Array} - returns a sorted array of version directories.  Returns an empty array if none exist or if the
 * path does not exist.
 */ module.exports = async function getSortedVersionDirectories(path) {
    let versions;
    if (fs.existsSync(path)) {
        versions = fs.readdirSync(path);
    } else {
        versions = [];
    }
    // filter out names that don't match the required format
    versions = versions.filter((path)=>{
        const splitPath = path.split('.');
        if (splitPath.length !== 3) {
            return false;
        }
        for(let i = 0; i < 3; i++){
            if (isNaN(splitPath[i])) {
                return false;
            }
        }
        return true;
    });
    // sort the names in numerical (not lexical) order
    versions.sort((a, b)=>{
        const aTokenized = a.split('.');
        const bTokenized = b.split('.');
        let result = 0;
        for(let i = 0; i < aTokenized.length; i++){
            if (Number(aTokenized[i]) < Number(bTokenized[i])) {
                result = -1;
                break;
            } else if (Number(aTokenized[i]) > Number(bTokenized[i])) {
                result = 1;
                break;
            }
        }
        return result;
    });
    return versions;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvZ2V0U29ydGVkVmVyc2lvbkRpcmVjdG9yaWVzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcbi8vIEBhdXRob3IgTWF0dCBQZW5uaW5ndG9uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuXG5cbmNvbnN0IGZzID0gcmVxdWlyZSggJ2dyYWNlZnVsLWZzJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHBoZXQvcmVxdWlyZS1zdGF0ZW1lbnQtbWF0Y2hcblxuLyoqXG4gKiBEZWZpbmUgYSBoZWxwZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGdldCBhIGxpc3Qgb2YgdGhlIFBoRVQtc3R5bGUgdmVyc2lvbiBkaXJlY3RvcmllcyBhdCB0aGUgZ2l2ZW4gcGF0aC4gIFRoZVxuICogZGlyZWN0b3JpZXMgbXVzdCBiZSBuYW1lZCB3aXRoIHRocmVlIG51bWJlcnMgc2VwYXJhdGVkIGJ5IHBlcmlvZHMsIGUuZy4gMS4yLjUuICBUaGUgZGlyZWN0b3JpZXMgYXJlIHNvcnRlZCBpblxuICogbnVtZXJpY2FsIG9yZGVyLCB3aGljaCBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgbGV4aWNhbCBvcmRlcmluZyB1c2VkIGJ5IHRoZSBMaW51eCBmaWxlIHN5c3RlbS4gIFNvLCBmb3IgZXhhbXBsZSwgdmFsaWRcbiAqIG91dHB1dCBmcm9tIHRoaXMgbWV0aG9kIGNvdWxkIGJlIHRoZSBhcnJheSBbIFwiMS4xLjhcIiwgXCIxLjEuOVwiLCBcIjEuMS4xMFwiIF0uICBGb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiB3aHkgdGhpcyBpc1xuICogbmVjZXNzYXJ5LCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BlcmVubmlhbC9pc3N1ZXMvMjguXG4gKlxuICogQHBhcmFtIHBhdGggLSBGaWxlbmFtZSBvZiB0aGUgZGlyZWN0b3J5LiAgSXQncyBvayBpZiB0aGUgcGF0aCBkb2VzIG5vdCBleGlzdC5cbiAqIEByZXR1cm5zIHtBcnJheX0gLSByZXR1cm5zIGEgc29ydGVkIGFycmF5IG9mIHZlcnNpb24gZGlyZWN0b3JpZXMuICBSZXR1cm5zIGFuIGVtcHR5IGFycmF5IGlmIG5vbmUgZXhpc3Qgb3IgaWYgdGhlXG4gKiBwYXRoIGRvZXMgbm90IGV4aXN0LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIGdldFNvcnRlZFZlcnNpb25EaXJlY3RvcmllcyggcGF0aCApIHtcblxuICBsZXQgdmVyc2lvbnM7XG5cbiAgaWYgKCBmcy5leGlzdHNTeW5jKCBwYXRoICkgKSB7XG4gICAgdmVyc2lvbnMgPSBmcy5yZWFkZGlyU3luYyggcGF0aCApO1xuICB9XG4gIGVsc2Uge1xuICAgIHZlcnNpb25zID0gW107XG4gIH1cblxuICAvLyBmaWx0ZXIgb3V0IG5hbWVzIHRoYXQgZG9uJ3QgbWF0Y2ggdGhlIHJlcXVpcmVkIGZvcm1hdFxuICB2ZXJzaW9ucyA9IHZlcnNpb25zLmZpbHRlciggcGF0aCA9PiB7XG4gICAgY29uc3Qgc3BsaXRQYXRoID0gcGF0aC5zcGxpdCggJy4nICk7XG4gICAgaWYgKCBzcGxpdFBhdGgubGVuZ3RoICE9PSAzICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCAzOyBpKysgKSB7XG4gICAgICBpZiAoIGlzTmFOKCBzcGxpdFBhdGhbIGkgXSApICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9ICk7XG5cbiAgLy8gc29ydCB0aGUgbmFtZXMgaW4gbnVtZXJpY2FsIChub3QgbGV4aWNhbCkgb3JkZXJcbiAgdmVyc2lvbnMuc29ydCggKCBhLCBiICkgPT4ge1xuICAgIGNvbnN0IGFUb2tlbml6ZWQgPSBhLnNwbGl0KCAnLicgKTtcbiAgICBjb25zdCBiVG9rZW5pemVkID0gYi5zcGxpdCggJy4nICk7XG4gICAgbGV0IHJlc3VsdCA9IDA7XG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYVRva2VuaXplZC5sZW5ndGg7IGkrKyApIHtcbiAgICAgIGlmICggTnVtYmVyKCBhVG9rZW5pemVkWyBpIF0gKSA8IE51bWJlciggYlRva2VuaXplZFsgaSBdICkgKSB7XG4gICAgICAgIHJlc3VsdCA9IC0xO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKCBOdW1iZXIoIGFUb2tlbml6ZWRbIGkgXSApID4gTnVtYmVyKCBiVG9rZW5pemVkWyBpIF0gKSApIHtcbiAgICAgICAgcmVzdWx0ID0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gKTtcbiAgcmV0dXJuIHZlcnNpb25zO1xufTsiXSwibmFtZXMiOlsiZnMiLCJyZXF1aXJlIiwibW9kdWxlIiwiZXhwb3J0cyIsImdldFNvcnRlZFZlcnNpb25EaXJlY3RvcmllcyIsInBhdGgiLCJ2ZXJzaW9ucyIsImV4aXN0c1N5bmMiLCJyZWFkZGlyU3luYyIsImZpbHRlciIsInNwbGl0UGF0aCIsInNwbGl0IiwibGVuZ3RoIiwiaSIsImlzTmFOIiwic29ydCIsImEiLCJiIiwiYVRva2VuaXplZCIsImJUb2tlbml6ZWQiLCJyZXN1bHQiLCJOdW1iZXIiXSwibWFwcGluZ3MiOiJBQUFBLGlEQUFpRDtBQUNqRCx5REFBeUQ7QUFHekQsTUFBTUEsS0FBS0MsUUFBUyxnQkFBaUIsbURBQW1EO0FBRXhGOzs7Ozs7Ozs7O0NBVUMsR0FDREMsT0FBT0MsT0FBTyxHQUFHLGVBQWVDLDRCQUE2QkMsSUFBSTtJQUUvRCxJQUFJQztJQUVKLElBQUtOLEdBQUdPLFVBQVUsQ0FBRUYsT0FBUztRQUMzQkMsV0FBV04sR0FBR1EsV0FBVyxDQUFFSDtJQUM3QixPQUNLO1FBQ0hDLFdBQVcsRUFBRTtJQUNmO0lBRUEsd0RBQXdEO0lBQ3hEQSxXQUFXQSxTQUFTRyxNQUFNLENBQUVKLENBQUFBO1FBQzFCLE1BQU1LLFlBQVlMLEtBQUtNLEtBQUssQ0FBRTtRQUM5QixJQUFLRCxVQUFVRSxNQUFNLEtBQUssR0FBSTtZQUM1QixPQUFPO1FBQ1Q7UUFDQSxJQUFNLElBQUlDLElBQUksR0FBR0EsSUFBSSxHQUFHQSxJQUFNO1lBQzVCLElBQUtDLE1BQU9KLFNBQVMsQ0FBRUcsRUFBRyxHQUFLO2dCQUM3QixPQUFPO1lBQ1Q7UUFDRjtRQUNBLE9BQU87SUFDVDtJQUVBLGtEQUFrRDtJQUNsRFAsU0FBU1MsSUFBSSxDQUFFLENBQUVDLEdBQUdDO1FBQ2xCLE1BQU1DLGFBQWFGLEVBQUVMLEtBQUssQ0FBRTtRQUM1QixNQUFNUSxhQUFhRixFQUFFTixLQUFLLENBQUU7UUFDNUIsSUFBSVMsU0FBUztRQUNiLElBQU0sSUFBSVAsSUFBSSxHQUFHQSxJQUFJSyxXQUFXTixNQUFNLEVBQUVDLElBQU07WUFDNUMsSUFBS1EsT0FBUUgsVUFBVSxDQUFFTCxFQUFHLElBQUtRLE9BQVFGLFVBQVUsQ0FBRU4sRUFBRyxHQUFLO2dCQUMzRE8sU0FBUyxDQUFDO2dCQUNWO1lBQ0YsT0FDSyxJQUFLQyxPQUFRSCxVQUFVLENBQUVMLEVBQUcsSUFBS1EsT0FBUUYsVUFBVSxDQUFFTixFQUFHLEdBQUs7Z0JBQ2hFTyxTQUFTO2dCQUNUO1lBQ0Y7UUFDRjtRQUNBLE9BQU9BO0lBQ1Q7SUFDQSxPQUFPZDtBQUNUIn0=