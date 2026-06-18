// Copyright 2023-2026, University of Colorado Boulder
/**
 * Returns an inverse string map (stringMap[ stringKey ][ locale ]) for all strings in a given repo.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const loadJSON = require('../common/loadJSON');
const fs = require('fs');
/**
 * Returns an inverse string map (stringMap[ stringKey ][ locale ]) for all strings in a given repo.
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} checkoutDir
 * @returns {Promise.<stringMap[ stringKey ][ locale ]>}
 */ module.exports = async function getRepoStringMap(repo, checkoutDir) {
    // partialKeyMap[ partialStringKey ][ locale ] = stringValue
    const partialKeyMap = {};
    // If we're not a repo with strings
    if (!fs.existsSync(`${checkoutDir}/${repo}/${repo}-strings_en.json`)) {
        return {};
    }
    const packageJSON = await loadJSON(`${checkoutDir}/${repo}/package.json`);
    const requirejsNamespace = packageJSON.phet.requirejsNamespace;
    const englishStrings = await loadJSON(`${checkoutDir}/${repo}/${repo}-strings_en.json`);
    // Support recursive structure of English string files. Tests for `value: <<string type>>` to determine if it's a string.
    // Fills partialKeyMap
    (function recur(stringStructure, stringKeyParts) {
        if (typeof stringStructure.value === 'string') {
            partialKeyMap[stringKeyParts.join('.')] = {
                en: stringStructure.value
            };
        }
        Object.keys(stringStructure).forEach((partialKey)=>{
            if (typeof stringStructure[partialKey] === 'object') {
                recur(stringStructure[partialKey], [
                    ...stringKeyParts,
                    partialKey
                ]);
            }
        });
    })(englishStrings, []);
    // Fill partialKeyMap with other locales (if the directory in babel exists)
    if (fs.existsSync(`${checkoutDir}/babel/${repo}`)) {
        for (const stringFilename of fs.readdirSync(`${checkoutDir}/babel/${repo}`)){
            const localeStrings = await loadJSON(`${checkoutDir}/babel/${repo}/${stringFilename}`);
            // Extract locale from filename
            const firstUnderscoreIndex = stringFilename.indexOf('_');
            const periodIndex = stringFilename.indexOf('.');
            const locale = stringFilename.substring(firstUnderscoreIndex + 1, periodIndex);
            Object.keys(localeStrings).forEach((partialStringKey)=>{
                if (partialKeyMap[partialStringKey]) {
                    partialKeyMap[partialStringKey][locale] = localeStrings[partialStringKey].value;
                }
            });
        }
    }
    // result[ stringKey ][ locale ] = stringValue
    const result = {};
    // Prepend the requirejsNamespace to the string keys
    Object.keys(partialKeyMap).forEach((partialKey)=>{
        result[`${requirejsNamespace}/${partialKey}`] = partialKeyMap[partialKey];
    });
    return result;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvZ2V0UmVwb1N0cmluZ01hcC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMy0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBSZXR1cm5zIGFuIGludmVyc2Ugc3RyaW5nIG1hcCAoc3RyaW5nTWFwWyBzdHJpbmdLZXkgXVsgbG9jYWxlIF0pIGZvciBhbGwgc3RyaW5ncyBpbiBhIGdpdmVuIHJlcG8uXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBsb2FkSlNPTiA9IHJlcXVpcmUoICcuLi9jb21tb24vbG9hZEpTT04nICk7XG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcblxuLyoqXG4gKiBSZXR1cm5zIGFuIGludmVyc2Ugc3RyaW5nIG1hcCAoc3RyaW5nTWFwWyBzdHJpbmdLZXkgXVsgbG9jYWxlIF0pIGZvciBhbGwgc3RyaW5ncyBpbiBhIGdpdmVuIHJlcG8uXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gY2hlY2tvdXREaXJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmdNYXBbIHN0cmluZ0tleSBdWyBsb2NhbGUgXT59XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gZ2V0UmVwb1N0cmluZ01hcCggcmVwbywgY2hlY2tvdXREaXIgKSB7XG5cbiAgLy8gcGFydGlhbEtleU1hcFsgcGFydGlhbFN0cmluZ0tleSBdWyBsb2NhbGUgXSA9IHN0cmluZ1ZhbHVlXG4gIGNvbnN0IHBhcnRpYWxLZXlNYXAgPSB7fTtcblxuICAvLyBJZiB3ZSdyZSBub3QgYSByZXBvIHdpdGggc3RyaW5nc1xuICBpZiAoICFmcy5leGlzdHNTeW5jKCBgJHtjaGVja291dERpcn0vJHtyZXBvfS8ke3JlcG99LXN0cmluZ3NfZW4uanNvbmAgKSApIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICBjb25zdCBwYWNrYWdlSlNPTiA9IGF3YWl0IGxvYWRKU09OKCBgJHtjaGVja291dERpcn0vJHtyZXBvfS9wYWNrYWdlLmpzb25gICk7XG4gIGNvbnN0IHJlcXVpcmVqc05hbWVzcGFjZSA9IHBhY2thZ2VKU09OLnBoZXQucmVxdWlyZWpzTmFtZXNwYWNlO1xuXG4gIGNvbnN0IGVuZ2xpc2hTdHJpbmdzID0gYXdhaXQgbG9hZEpTT04oIGAke2NoZWNrb3V0RGlyfS8ke3JlcG99LyR7cmVwb30tc3RyaW5nc19lbi5qc29uYCApO1xuXG4gIC8vIFN1cHBvcnQgcmVjdXJzaXZlIHN0cnVjdHVyZSBvZiBFbmdsaXNoIHN0cmluZyBmaWxlcy4gVGVzdHMgZm9yIGB2YWx1ZTogPDxzdHJpbmcgdHlwZT4+YCB0byBkZXRlcm1pbmUgaWYgaXQncyBhIHN0cmluZy5cbiAgLy8gRmlsbHMgcGFydGlhbEtleU1hcFxuICAoIGZ1bmN0aW9uIHJlY3VyKCBzdHJpbmdTdHJ1Y3R1cmUsIHN0cmluZ0tleVBhcnRzICkge1xuICAgIGlmICggdHlwZW9mIHN0cmluZ1N0cnVjdHVyZS52YWx1ZSA9PT0gJ3N0cmluZycgKSB7XG4gICAgICBwYXJ0aWFsS2V5TWFwWyBzdHJpbmdLZXlQYXJ0cy5qb2luKCAnLicgKSBdID0ge1xuICAgICAgICBlbjogc3RyaW5nU3RydWN0dXJlLnZhbHVlXG4gICAgICB9O1xuICAgIH1cbiAgICBPYmplY3Qua2V5cyggc3RyaW5nU3RydWN0dXJlICkuZm9yRWFjaCggcGFydGlhbEtleSA9PiB7XG4gICAgICBpZiAoIHR5cGVvZiBzdHJpbmdTdHJ1Y3R1cmVbIHBhcnRpYWxLZXkgXSA9PT0gJ29iamVjdCcgKSB7XG4gICAgICAgIHJlY3VyKCBzdHJpbmdTdHJ1Y3R1cmVbIHBhcnRpYWxLZXkgXSwgWyAuLi5zdHJpbmdLZXlQYXJ0cywgcGFydGlhbEtleSBdICk7XG4gICAgICB9XG4gICAgfSApO1xuICB9ICkoIGVuZ2xpc2hTdHJpbmdzLCBbXSApO1xuXG4gIC8vIEZpbGwgcGFydGlhbEtleU1hcCB3aXRoIG90aGVyIGxvY2FsZXMgKGlmIHRoZSBkaXJlY3RvcnkgaW4gYmFiZWwgZXhpc3RzKVxuICBpZiAoIGZzLmV4aXN0c1N5bmMoIGAke2NoZWNrb3V0RGlyfS9iYWJlbC8ke3JlcG99YCApICkge1xuICAgIGZvciAoIGNvbnN0IHN0cmluZ0ZpbGVuYW1lIG9mIGZzLnJlYWRkaXJTeW5jKCBgJHtjaGVja291dERpcn0vYmFiZWwvJHtyZXBvfWAgKSApIHtcbiAgICAgIGNvbnN0IGxvY2FsZVN0cmluZ3MgPSBhd2FpdCBsb2FkSlNPTiggYCR7Y2hlY2tvdXREaXJ9L2JhYmVsLyR7cmVwb30vJHtzdHJpbmdGaWxlbmFtZX1gICk7XG5cbiAgICAgIC8vIEV4dHJhY3QgbG9jYWxlIGZyb20gZmlsZW5hbWVcbiAgICAgIGNvbnN0IGZpcnN0VW5kZXJzY29yZUluZGV4ID0gc3RyaW5nRmlsZW5hbWUuaW5kZXhPZiggJ18nICk7XG4gICAgICBjb25zdCBwZXJpb2RJbmRleCA9IHN0cmluZ0ZpbGVuYW1lLmluZGV4T2YoICcuJyApO1xuICAgICAgY29uc3QgbG9jYWxlID0gc3RyaW5nRmlsZW5hbWUuc3Vic3RyaW5nKCBmaXJzdFVuZGVyc2NvcmVJbmRleCArIDEsIHBlcmlvZEluZGV4ICk7XG5cbiAgICAgIE9iamVjdC5rZXlzKCBsb2NhbGVTdHJpbmdzICkuZm9yRWFjaCggcGFydGlhbFN0cmluZ0tleSA9PiB7XG4gICAgICAgIGlmICggcGFydGlhbEtleU1hcFsgcGFydGlhbFN0cmluZ0tleSBdICkge1xuICAgICAgICAgIHBhcnRpYWxLZXlNYXBbIHBhcnRpYWxTdHJpbmdLZXkgXVsgbG9jYWxlIF0gPSBsb2NhbGVTdHJpbmdzWyBwYXJ0aWFsU3RyaW5nS2V5IF0udmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH0gKTtcbiAgICB9XG4gIH1cblxuICAvLyByZXN1bHRbIHN0cmluZ0tleSBdWyBsb2NhbGUgXSA9IHN0cmluZ1ZhbHVlXG4gIGNvbnN0IHJlc3VsdCA9IHt9O1xuXG4gIC8vIFByZXBlbmQgdGhlIHJlcXVpcmVqc05hbWVzcGFjZSB0byB0aGUgc3RyaW5nIGtleXNcbiAgT2JqZWN0LmtleXMoIHBhcnRpYWxLZXlNYXAgKS5mb3JFYWNoKCBwYXJ0aWFsS2V5ID0+IHtcbiAgICByZXN1bHRbIGAke3JlcXVpcmVqc05hbWVzcGFjZX0vJHtwYXJ0aWFsS2V5fWAgXSA9IHBhcnRpYWxLZXlNYXBbIHBhcnRpYWxLZXkgXTtcbiAgfSApO1xuXG4gIHJldHVybiByZXN1bHQ7XG59OyJdLCJuYW1lcyI6WyJsb2FkSlNPTiIsInJlcXVpcmUiLCJmcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJnZXRSZXBvU3RyaW5nTWFwIiwicmVwbyIsImNoZWNrb3V0RGlyIiwicGFydGlhbEtleU1hcCIsImV4aXN0c1N5bmMiLCJwYWNrYWdlSlNPTiIsInJlcXVpcmVqc05hbWVzcGFjZSIsInBoZXQiLCJlbmdsaXNoU3RyaW5ncyIsInJlY3VyIiwic3RyaW5nU3RydWN0dXJlIiwic3RyaW5nS2V5UGFydHMiLCJ2YWx1ZSIsImpvaW4iLCJlbiIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwicGFydGlhbEtleSIsInN0cmluZ0ZpbGVuYW1lIiwicmVhZGRpclN5bmMiLCJsb2NhbGVTdHJpbmdzIiwiZmlyc3RVbmRlcnNjb3JlSW5kZXgiLCJpbmRleE9mIiwicGVyaW9kSW5kZXgiLCJsb2NhbGUiLCJzdWJzdHJpbmciLCJwYXJ0aWFsU3RyaW5nS2V5IiwicmVzdWx0Il0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Q0FJQyxHQUVELE1BQU1BLFdBQVdDLFFBQVM7QUFDMUIsTUFBTUMsS0FBS0QsUUFBUztBQUVwQjs7Ozs7OztDQU9DLEdBQ0RFLE9BQU9DLE9BQU8sR0FBRyxlQUFlQyxpQkFBa0JDLElBQUksRUFBRUMsV0FBVztJQUVqRSw0REFBNEQ7SUFDNUQsTUFBTUMsZ0JBQWdCLENBQUM7SUFFdkIsbUNBQW1DO0lBQ25DLElBQUssQ0FBQ04sR0FBR08sVUFBVSxDQUFFLEdBQUdGLFlBQVksQ0FBQyxFQUFFRCxLQUFLLENBQUMsRUFBRUEsS0FBSyxnQkFBZ0IsQ0FBQyxHQUFLO1FBQ3hFLE9BQU8sQ0FBQztJQUNWO0lBRUEsTUFBTUksY0FBYyxNQUFNVixTQUFVLEdBQUdPLFlBQVksQ0FBQyxFQUFFRCxLQUFLLGFBQWEsQ0FBQztJQUN6RSxNQUFNSyxxQkFBcUJELFlBQVlFLElBQUksQ0FBQ0Qsa0JBQWtCO0lBRTlELE1BQU1FLGlCQUFpQixNQUFNYixTQUFVLEdBQUdPLFlBQVksQ0FBQyxFQUFFRCxLQUFLLENBQUMsRUFBRUEsS0FBSyxnQkFBZ0IsQ0FBQztJQUV2Rix5SEFBeUg7SUFDekgsc0JBQXNCO0lBQ3BCLENBQUEsU0FBU1EsTUFBT0MsZUFBZSxFQUFFQyxjQUFjO1FBQy9DLElBQUssT0FBT0QsZ0JBQWdCRSxLQUFLLEtBQUssVUFBVztZQUMvQ1QsYUFBYSxDQUFFUSxlQUFlRSxJQUFJLENBQUUsS0FBTyxHQUFHO2dCQUM1Q0MsSUFBSUosZ0JBQWdCRSxLQUFLO1lBQzNCO1FBQ0Y7UUFDQUcsT0FBT0MsSUFBSSxDQUFFTixpQkFBa0JPLE9BQU8sQ0FBRUMsQ0FBQUE7WUFDdEMsSUFBSyxPQUFPUixlQUFlLENBQUVRLFdBQVksS0FBSyxVQUFXO2dCQUN2RFQsTUFBT0MsZUFBZSxDQUFFUSxXQUFZLEVBQUU7dUJBQUtQO29CQUFnQk87aUJBQVk7WUFDekU7UUFDRjtJQUNGLENBQUEsRUFBS1YsZ0JBQWdCLEVBQUU7SUFFdkIsMkVBQTJFO0lBQzNFLElBQUtYLEdBQUdPLFVBQVUsQ0FBRSxHQUFHRixZQUFZLE9BQU8sRUFBRUQsTUFBTSxHQUFLO1FBQ3JELEtBQU0sTUFBTWtCLGtCQUFrQnRCLEdBQUd1QixXQUFXLENBQUUsR0FBR2xCLFlBQVksT0FBTyxFQUFFRCxNQUFNLEVBQUs7WUFDL0UsTUFBTW9CLGdCQUFnQixNQUFNMUIsU0FBVSxHQUFHTyxZQUFZLE9BQU8sRUFBRUQsS0FBSyxDQUFDLEVBQUVrQixnQkFBZ0I7WUFFdEYsK0JBQStCO1lBQy9CLE1BQU1HLHVCQUF1QkgsZUFBZUksT0FBTyxDQUFFO1lBQ3JELE1BQU1DLGNBQWNMLGVBQWVJLE9BQU8sQ0FBRTtZQUM1QyxNQUFNRSxTQUFTTixlQUFlTyxTQUFTLENBQUVKLHVCQUF1QixHQUFHRTtZQUVuRVQsT0FBT0MsSUFBSSxDQUFFSyxlQUFnQkosT0FBTyxDQUFFVSxDQUFBQTtnQkFDcEMsSUFBS3hCLGFBQWEsQ0FBRXdCLGlCQUFrQixFQUFHO29CQUN2Q3hCLGFBQWEsQ0FBRXdCLGlCQUFrQixDQUFFRixPQUFRLEdBQUdKLGFBQWEsQ0FBRU0saUJBQWtCLENBQUNmLEtBQUs7Z0JBQ3ZGO1lBQ0Y7UUFDRjtJQUNGO0lBRUEsOENBQThDO0lBQzlDLE1BQU1nQixTQUFTLENBQUM7SUFFaEIsb0RBQW9EO0lBQ3BEYixPQUFPQyxJQUFJLENBQUViLGVBQWdCYyxPQUFPLENBQUVDLENBQUFBO1FBQ3BDVSxNQUFNLENBQUUsR0FBR3RCLG1CQUFtQixDQUFDLEVBQUVZLFlBQVksQ0FBRSxHQUFHZixhQUFhLENBQUVlLFdBQVk7SUFDL0U7SUFFQSxPQUFPVTtBQUNUIn0=