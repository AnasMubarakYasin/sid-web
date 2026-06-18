// Copyright 2017-2018, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)
const constants = require('./constants');
const fs = require('graceful-fs'); // eslint-disable-line phet/require-statement-match
const winston = require('winston');
const writeFile = require('../common/writeFile');
const parseScreenNames = require('./parseScreenNames');
/**
 * Create a [sim name].xml file in the live sim directory in htdocs. This file tells the website which
 * translations exist for a given sim. It is used by the "synchronize" method in Project.java in the website code.
 * @param simName
 * @param version
 * @param checkoutDir
 */ module.exports = async function(simName, version, checkoutDir) {
    const translatedStringFilesDir = `${checkoutDir}/babel/${simName}`;
    const englishStringsFile = `${simName}-strings_en.json`;
    const stringFiles = [
        {
            name: englishStringsFile,
            locale: constants.ENGLISH_LOCALE
        }
    ];
    // pull all the string filenames and locales from babel and store in stringFiles array
    try {
        const files = fs.readdirSync(translatedStringFilesDir);
        for(let i = 0; i < files.length; i++){
            const filename = files[i];
            const firstUnderscoreIndex = filename.indexOf('_');
            const periodIndex = filename.indexOf('.');
            const locale = filename.substring(firstUnderscoreIndex + 1, periodIndex);
            // Don't process English twice!
            if (locale !== constants.ENGLISH_LOCALE) {
                stringFiles.push({
                    name: filename,
                    locale: locale
                });
            }
        }
    } catch (e) {
        winston.log('warn', 'no directory for the given sim exists in babel');
    }
    // try opening the english strings file so we can read the english strings
    let englishStrings;
    try {
        englishStrings = JSON.parse(fs.readFileSync(`${checkoutDir}/${simName}/${englishStringsFile}`, {
            encoding: 'utf-8'
        }));
    } catch (e) {
        throw new Error('English strings file not found');
    }
    const simTitleKey = `${simName}.title`; // all sims must have a key of this form
    if (!englishStrings[simTitleKey]) {
        throw new Error('No key for sim title');
    }
    // create xml, making a simulation tag for each language
    let finalXML = `<?xml version="1.0" encoding="utf-8" ?>\n<project name="${simName}">\n<simulations>`;
    const screenNames = await parseScreenNames.parseScreenNames(simName, stringFiles.map((f)=>f.locale), checkoutDir);
    for(let j = 0; j < stringFiles.length; j++){
        const stringFile = stringFiles[j];
        const languageJSON = stringFile.locale === constants.ENGLISH_LOCALE ? englishStrings : JSON.parse(fs.readFileSync(`${translatedStringFilesDir}/${stringFile.name}`, {
            encoding: 'utf-8'
        }));
        const simHTML = `${constants.HTML_SIMS_DIRECTORY + simName}/${version}/${simName}_${stringFile.locale}.html`;
        if (fs.existsSync(simHTML)) {
            const localizedSimTitle = languageJSON[simTitleKey] ? languageJSON[simTitleKey].value : englishStrings[simTitleKey].value;
            finalXML = finalXML.concat(`<simulation name="${simName}" locale="${stringFile.locale}">\n` + `<title><![CDATA[${localizedSimTitle}]]></title>\n`);
            if (screenNames && screenNames[stringFile.locale]) {
                finalXML = finalXML.concat('<screens>\n');
                screenNames[stringFile.locale].forEach((screenName, index)=>{
                    finalXML = finalXML.concat(`<screenName position="${index + 1}"><![CDATA[${screenName}]]></screenName>\n`);
                });
                finalXML = finalXML.concat('</screens>\n');
            }
            finalXML = finalXML.concat('</simulation>\n');
        }
    }
    finalXML = finalXML.concat('</simulations>\n</project>');
    const xmlFilepath = `${constants.HTML_SIMS_DIRECTORY + simName}/${version}/${simName}.xml`;
    try {
        await writeFile(xmlFilepath, finalXML);
    } catch (err) {
        console.error('Error writing xml file', err);
        throw err;
    }
    winston.log('info', 'wrote XML file');
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvY3JlYXRlVHJhbnNsYXRpb25zWE1MLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMTgsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuLy8gQGF1dGhvciBNYXR0IFBlbm5pbmd0b24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG5cblxuY29uc3QgY29uc3RhbnRzID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApO1xuY29uc3QgZnMgPSByZXF1aXJlKCAnZ3JhY2VmdWwtZnMnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcGhldC9yZXF1aXJlLXN0YXRlbWVudC1tYXRjaFxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xuY29uc3Qgd3JpdGVGaWxlID0gcmVxdWlyZSggJy4uL2NvbW1vbi93cml0ZUZpbGUnICk7XG5jb25zdCBwYXJzZVNjcmVlbk5hbWVzID0gcmVxdWlyZSggJy4vcGFyc2VTY3JlZW5OYW1lcycgKTtcblxuLyoqXG4gKiBDcmVhdGUgYSBbc2ltIG5hbWVdLnhtbCBmaWxlIGluIHRoZSBsaXZlIHNpbSBkaXJlY3RvcnkgaW4gaHRkb2NzLiBUaGlzIGZpbGUgdGVsbHMgdGhlIHdlYnNpdGUgd2hpY2hcbiAqIHRyYW5zbGF0aW9ucyBleGlzdCBmb3IgYSBnaXZlbiBzaW0uIEl0IGlzIHVzZWQgYnkgdGhlIFwic3luY2hyb25pemVcIiBtZXRob2QgaW4gUHJvamVjdC5qYXZhIGluIHRoZSB3ZWJzaXRlIGNvZGUuXG4gKiBAcGFyYW0gc2ltTmFtZVxuICogQHBhcmFtIHZlcnNpb25cbiAqIEBwYXJhbSBjaGVja291dERpclxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uKCBzaW1OYW1lLCB2ZXJzaW9uLCBjaGVja291dERpciApIHtcbiAgY29uc3QgdHJhbnNsYXRlZFN0cmluZ0ZpbGVzRGlyID0gYCR7Y2hlY2tvdXREaXJ9L2JhYmVsLyR7c2ltTmFtZX1gO1xuICBjb25zdCBlbmdsaXNoU3RyaW5nc0ZpbGUgPSBgJHtzaW1OYW1lfS1zdHJpbmdzX2VuLmpzb25gO1xuICBjb25zdCBzdHJpbmdGaWxlcyA9IFsgeyBuYW1lOiBlbmdsaXNoU3RyaW5nc0ZpbGUsIGxvY2FsZTogY29uc3RhbnRzLkVOR0xJU0hfTE9DQUxFIH0gXTtcblxuICAvLyBwdWxsIGFsbCB0aGUgc3RyaW5nIGZpbGVuYW1lcyBhbmQgbG9jYWxlcyBmcm9tIGJhYmVsIGFuZCBzdG9yZSBpbiBzdHJpbmdGaWxlcyBhcnJheVxuICB0cnkge1xuICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoIHRyYW5zbGF0ZWRTdHJpbmdGaWxlc0RpciApO1xuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrICkge1xuICAgICAgY29uc3QgZmlsZW5hbWUgPSBmaWxlc1sgaSBdO1xuICAgICAgY29uc3QgZmlyc3RVbmRlcnNjb3JlSW5kZXggPSBmaWxlbmFtZS5pbmRleE9mKCAnXycgKTtcbiAgICAgIGNvbnN0IHBlcmlvZEluZGV4ID0gZmlsZW5hbWUuaW5kZXhPZiggJy4nICk7XG4gICAgICBjb25zdCBsb2NhbGUgPSBmaWxlbmFtZS5zdWJzdHJpbmcoIGZpcnN0VW5kZXJzY29yZUluZGV4ICsgMSwgcGVyaW9kSW5kZXggKTtcbiAgICAgIC8vIERvbid0IHByb2Nlc3MgRW5nbGlzaCB0d2ljZSFcbiAgICAgIGlmICggbG9jYWxlICE9PSBjb25zdGFudHMuRU5HTElTSF9MT0NBTEUgKSB7XG4gICAgICAgIHN0cmluZ0ZpbGVzLnB1c2goIHsgbmFtZTogZmlsZW5hbWUsIGxvY2FsZTogbG9jYWxlIH0gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY2F0Y2goIGUgKSB7XG4gICAgd2luc3Rvbi5sb2coICd3YXJuJywgJ25vIGRpcmVjdG9yeSBmb3IgdGhlIGdpdmVuIHNpbSBleGlzdHMgaW4gYmFiZWwnICk7XG4gIH1cblxuICAvLyB0cnkgb3BlbmluZyB0aGUgZW5nbGlzaCBzdHJpbmdzIGZpbGUgc28gd2UgY2FuIHJlYWQgdGhlIGVuZ2xpc2ggc3RyaW5nc1xuICBsZXQgZW5nbGlzaFN0cmluZ3M7XG4gIHRyeSB7XG4gICAgZW5nbGlzaFN0cmluZ3MgPSBKU09OLnBhcnNlKCBmcy5yZWFkRmlsZVN5bmMoIGAke2NoZWNrb3V0RGlyfS8ke3NpbU5hbWV9LyR7ZW5nbGlzaFN0cmluZ3NGaWxlfWAsIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSApICk7XG4gIH1cbiAgY2F0Y2goIGUgKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCAnRW5nbGlzaCBzdHJpbmdzIGZpbGUgbm90IGZvdW5kJyApO1xuICB9XG5cbiAgY29uc3Qgc2ltVGl0bGVLZXkgPSBgJHtzaW1OYW1lfS50aXRsZWA7IC8vIGFsbCBzaW1zIG11c3QgaGF2ZSBhIGtleSBvZiB0aGlzIGZvcm1cbiAgaWYgKCAhZW5nbGlzaFN0cmluZ3NbIHNpbVRpdGxlS2V5IF0gKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCAnTm8ga2V5IGZvciBzaW0gdGl0bGUnICk7XG4gIH1cblxuICAvLyBjcmVhdGUgeG1sLCBtYWtpbmcgYSBzaW11bGF0aW9uIHRhZyBmb3IgZWFjaCBsYW5ndWFnZVxuICBsZXQgZmluYWxYTUwgPSBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwidXRmLThcIiA/Plxcbjxwcm9qZWN0IG5hbWU9XCIke3NpbU5hbWV9XCI+XFxuPHNpbXVsYXRpb25zPmA7XG5cbiAgY29uc3Qgc2NyZWVuTmFtZXMgPSBhd2FpdCBwYXJzZVNjcmVlbk5hbWVzLnBhcnNlU2NyZWVuTmFtZXMoIHNpbU5hbWUsIHN0cmluZ0ZpbGVzLm1hcCggZiA9PiBmLmxvY2FsZSApLCBjaGVja291dERpciApO1xuXG4gIGZvciAoIGxldCBqID0gMDsgaiA8IHN0cmluZ0ZpbGVzLmxlbmd0aDsgaisrICkge1xuICAgIGNvbnN0IHN0cmluZ0ZpbGUgPSBzdHJpbmdGaWxlc1sgaiBdO1xuICAgIGNvbnN0IGxhbmd1YWdlSlNPTiA9ICggc3RyaW5nRmlsZS5sb2NhbGUgPT09IGNvbnN0YW50cy5FTkdMSVNIX0xPQ0FMRSApID8gZW5nbGlzaFN0cmluZ3MgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggYCR7dHJhbnNsYXRlZFN0cmluZ0ZpbGVzRGlyfS8ke3N0cmluZ0ZpbGUubmFtZX1gLCB7IGVuY29kaW5nOiAndXRmLTgnIH0gKSApO1xuXG4gICAgY29uc3Qgc2ltSFRNTCA9IGAke2NvbnN0YW50cy5IVE1MX1NJTVNfRElSRUNUT1JZICsgc2ltTmFtZX0vJHt2ZXJzaW9ufS8ke3NpbU5hbWV9XyR7c3RyaW5nRmlsZS5sb2NhbGV9Lmh0bWxgO1xuXG4gICAgaWYgKCBmcy5leGlzdHNTeW5jKCBzaW1IVE1MICkgKSB7XG4gICAgICBjb25zdCBsb2NhbGl6ZWRTaW1UaXRsZSA9ICggbGFuZ3VhZ2VKU09OWyBzaW1UaXRsZUtleSBdICkgPyBsYW5ndWFnZUpTT05bIHNpbVRpdGxlS2V5IF0udmFsdWUgOiBlbmdsaXNoU3RyaW5nc1sgc2ltVGl0bGVLZXkgXS52YWx1ZTtcbiAgICAgIGZpbmFsWE1MID0gZmluYWxYTUwuY29uY2F0KCBgPHNpbXVsYXRpb24gbmFtZT1cIiR7c2ltTmFtZX1cIiBsb2NhbGU9XCIke3N0cmluZ0ZpbGUubG9jYWxlfVwiPlxcbmAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGA8dGl0bGU+PCFbQ0RBVEFbJHtsb2NhbGl6ZWRTaW1UaXRsZX1dXT48L3RpdGxlPlxcbmAgKTtcbiAgICAgIGlmICggc2NyZWVuTmFtZXMgJiYgc2NyZWVuTmFtZXNbIHN0cmluZ0ZpbGUubG9jYWxlIF0gKSB7XG4gICAgICAgIGZpbmFsWE1MID0gZmluYWxYTUwuY29uY2F0KCAnPHNjcmVlbnM+XFxuJyApO1xuICAgICAgICBzY3JlZW5OYW1lc1sgc3RyaW5nRmlsZS5sb2NhbGUgXS5mb3JFYWNoKCAoIHNjcmVlbk5hbWUsIGluZGV4ICkgPT4ge1xuICAgICAgICAgIGZpbmFsWE1MID0gZmluYWxYTUwuY29uY2F0KCBgPHNjcmVlbk5hbWUgcG9zaXRpb249XCIke2luZGV4ICsgMX1cIj48IVtDREFUQVske3NjcmVlbk5hbWV9XV0+PC9zY3JlZW5OYW1lPlxcbmAgKTtcbiAgICAgICAgfSApO1xuICAgICAgICBmaW5hbFhNTCA9IGZpbmFsWE1MLmNvbmNhdCggJzwvc2NyZWVucz5cXG4nICk7XG4gICAgICB9XG4gICAgICBmaW5hbFhNTCA9IGZpbmFsWE1MLmNvbmNhdCggJzwvc2ltdWxhdGlvbj5cXG4nICk7XG4gICAgfVxuICB9XG5cbiAgZmluYWxYTUwgPSBmaW5hbFhNTC5jb25jYXQoICc8L3NpbXVsYXRpb25zPlxcbjwvcHJvamVjdD4nICk7XG5cbiAgY29uc3QgeG1sRmlsZXBhdGggPSBgJHtjb25zdGFudHMuSFRNTF9TSU1TX0RJUkVDVE9SWSArIHNpbU5hbWV9LyR7dmVyc2lvbn0vJHtzaW1OYW1lfS54bWxgO1xuICB0cnkge1xuICAgIGF3YWl0IHdyaXRlRmlsZSggeG1sRmlsZXBhdGgsIGZpbmFsWE1MICk7XG4gIH1cbiAgY2F0Y2goIGVyciApIHtcbiAgICBjb25zb2xlLmVycm9yKCAnRXJyb3Igd3JpdGluZyB4bWwgZmlsZScsIGVyciApO1xuICAgIHRocm93IGVycjtcbiAgfVxuICB3aW5zdG9uLmxvZyggJ2luZm8nLCAnd3JvdGUgWE1MIGZpbGUnICk7XG59OyJdLCJuYW1lcyI6WyJjb25zdGFudHMiLCJyZXF1aXJlIiwiZnMiLCJ3aW5zdG9uIiwid3JpdGVGaWxlIiwicGFyc2VTY3JlZW5OYW1lcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJzaW1OYW1lIiwidmVyc2lvbiIsImNoZWNrb3V0RGlyIiwidHJhbnNsYXRlZFN0cmluZ0ZpbGVzRGlyIiwiZW5nbGlzaFN0cmluZ3NGaWxlIiwic3RyaW5nRmlsZXMiLCJuYW1lIiwibG9jYWxlIiwiRU5HTElTSF9MT0NBTEUiLCJmaWxlcyIsInJlYWRkaXJTeW5jIiwiaSIsImxlbmd0aCIsImZpbGVuYW1lIiwiZmlyc3RVbmRlcnNjb3JlSW5kZXgiLCJpbmRleE9mIiwicGVyaW9kSW5kZXgiLCJzdWJzdHJpbmciLCJwdXNoIiwiZSIsImxvZyIsImVuZ2xpc2hTdHJpbmdzIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwiZW5jb2RpbmciLCJFcnJvciIsInNpbVRpdGxlS2V5IiwiZmluYWxYTUwiLCJzY3JlZW5OYW1lcyIsIm1hcCIsImYiLCJqIiwic3RyaW5nRmlsZSIsImxhbmd1YWdlSlNPTiIsInNpbUhUTUwiLCJIVE1MX1NJTVNfRElSRUNUT1JZIiwiZXhpc3RzU3luYyIsImxvY2FsaXplZFNpbVRpdGxlIiwidmFsdWUiLCJjb25jYXQiLCJmb3JFYWNoIiwic2NyZWVuTmFtZSIsImluZGV4IiwieG1sRmlsZXBhdGgiLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUN0RCx5REFBeUQ7QUFHekQsTUFBTUEsWUFBWUMsUUFBUztBQUMzQixNQUFNQyxLQUFLRCxRQUFTLGdCQUFpQixtREFBbUQ7QUFDeEYsTUFBTUUsVUFBVUYsUUFBUztBQUN6QixNQUFNRyxZQUFZSCxRQUFTO0FBQzNCLE1BQU1JLG1CQUFtQkosUUFBUztBQUVsQzs7Ozs7O0NBTUMsR0FDREssT0FBT0MsT0FBTyxHQUFHLGVBQWdCQyxPQUFPLEVBQUVDLE9BQU8sRUFBRUMsV0FBVztJQUM1RCxNQUFNQywyQkFBMkIsR0FBR0QsWUFBWSxPQUFPLEVBQUVGLFNBQVM7SUFDbEUsTUFBTUkscUJBQXFCLEdBQUdKLFFBQVEsZ0JBQWdCLENBQUM7SUFDdkQsTUFBTUssY0FBYztRQUFFO1lBQUVDLE1BQU1GO1lBQW9CRyxRQUFRZixVQUFVZ0IsY0FBYztRQUFDO0tBQUc7SUFFdEYsc0ZBQXNGO0lBQ3RGLElBQUk7UUFDRixNQUFNQyxRQUFRZixHQUFHZ0IsV0FBVyxDQUFFUDtRQUM5QixJ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