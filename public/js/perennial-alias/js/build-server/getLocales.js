// Copyright 2017, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)
const constants = require('./constants');
const fs = require('graceful-fs'); // eslint-disable-line phet/require-statement-match
const getSortedVersionDirectories = require('./getSortedVersionDirectories');
const parseString = require('xml2js').parseString; // eslint-disable-line phet/no-property-in-require-statement
const winston = require('winston');
async function getJsonFromXML(xmlString) {
    return new Promise((resolve, reject)=>{
        parseString(xmlString, (error, json)=>{
            if (error) {
                reject(error);
            } else {
                resolve(json);
            }
        });
    });
}
/**
 * Get all of the deployed locales for the latest deployed version of the specified simulation.  This is generally done
 * before publishing a new version so that we can know which locales to rebuild.
 * @param {String} locales - comma separated list of locale codes
 * @param {String} simName - name of the sim, should match GitHub repo name, e.g. "energy-skate-park-basics"
 */ async function getLocales(locales, simName) {
    let callbackLocales;
    if (locales && locales !== '*') {
        // from rosetta
        callbackLocales = locales;
    } else {
        // from grunt deploy-production
        const simDirectory = constants.HTML_SIMS_DIRECTORY + simName;
        const versionDirectories = await getSortedVersionDirectories(simDirectory);
        if (versionDirectories.length > 0) {
            const latest = versionDirectories[versionDirectories.length - 1];
            const translationsXMLFile = `${constants.HTML_SIMS_DIRECTORY + simName}/${latest}/${simName}.xml`;
            winston.log('info', `path to translations XML file = ${translationsXMLFile}`);
            const xmlString = fs.readFileSync(translationsXMLFile);
            let json;
            try {
                json = await getJsonFromXML(xmlString);
            } catch (err) {
                // TODO https://github.com/phetsims/perennial/issues/167 should we call reject here? what happens when callbackLocales is undefined?
                winston.log('error', `error parsing XML, err = ${err}`);
            }
            winston.log('info', 'data extracted from translations XML file:');
            winston.log('info', JSON.stringify(json, null, 2));
            const simsArray = json.project.simulations[0].simulation;
            const localesArray = [];
            for(let i = 0; i < simsArray.length; i++){
                localesArray.push(simsArray[i].$.locale);
            }
            callbackLocales = localesArray.join(',');
        } else {
            // first deploy, sim directory will not exist yet, just publish the english version
            callbackLocales = 'en';
        }
    }
    winston.log('info', `building locales=${callbackLocales}`);
    return callbackLocales;
}
module.exports = getLocales;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvZ2V0TG9jYWxlcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG4vLyBAYXV0aG9yIE1hdHQgUGVubmluZ3RvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcblxuXG5jb25zdCBjb25zdGFudHMgPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICk7XG5jb25zdCBmcyA9IHJlcXVpcmUoICdncmFjZWZ1bC1mcycgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBwaGV0L3JlcXVpcmUtc3RhdGVtZW50LW1hdGNoXG5jb25zdCBnZXRTb3J0ZWRWZXJzaW9uRGlyZWN0b3JpZXMgPSByZXF1aXJlKCAnLi9nZXRTb3J0ZWRWZXJzaW9uRGlyZWN0b3JpZXMnICk7XG5jb25zdCBwYXJzZVN0cmluZyA9IHJlcXVpcmUoICd4bWwyanMnICkucGFyc2VTdHJpbmc7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcGhldC9uby1wcm9wZXJ0eS1pbi1yZXF1aXJlLXN0YXRlbWVudFxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xuXG5hc3luYyBmdW5jdGlvbiBnZXRKc29uRnJvbVhNTCggeG1sU3RyaW5nICkge1xuICByZXR1cm4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT4ge1xuICAgIHBhcnNlU3RyaW5nKCB4bWxTdHJpbmcsICggZXJyb3IsIGpzb24gKSA9PiB7XG4gICAgICBpZiAoIGVycm9yICkge1xuICAgICAgICByZWplY3QoIGVycm9yICk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZSgganNvbiApO1xuICAgICAgfVxuICAgIH0gKTtcbiAgfSApO1xufVxuXG4vKipcbiAqIEdldCBhbGwgb2YgdGhlIGRlcGxveWVkIGxvY2FsZXMgZm9yIHRoZSBsYXRlc3QgZGVwbG95ZWQgdmVyc2lvbiBvZiB0aGUgc3BlY2lmaWVkIHNpbXVsYXRpb24uICBUaGlzIGlzIGdlbmVyYWxseSBkb25lXG4gKiBiZWZvcmUgcHVibGlzaGluZyBhIG5ldyB2ZXJzaW9uIHNvIHRoYXQgd2UgY2FuIGtub3cgd2hpY2ggbG9jYWxlcyB0byByZWJ1aWxkLlxuICogQHBhcmFtIHtTdHJpbmd9IGxvY2FsZXMgLSBjb21tYSBzZXBhcmF0ZWQgbGlzdCBvZiBsb2NhbGUgY29kZXNcbiAqIEBwYXJhbSB7U3RyaW5nfSBzaW1OYW1lIC0gbmFtZSBvZiB0aGUgc2ltLCBzaG91bGQgbWF0Y2ggR2l0SHViIHJlcG8gbmFtZSwgZS5nLiBcImVuZXJneS1za2F0ZS1wYXJrLWJhc2ljc1wiXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdldExvY2FsZXMoIGxvY2FsZXMsIHNpbU5hbWUgKSB7XG4gIGxldCBjYWxsYmFja0xvY2FsZXM7XG5cbiAgaWYgKCBsb2NhbGVzICYmIGxvY2FsZXMgIT09ICcqJyApIHtcblxuICAgIC8vIGZyb20gcm9zZXR0YVxuICAgIGNhbGxiYWNrTG9jYWxlcyA9IGxvY2FsZXM7XG4gIH1cbiAgZWxzZSB7XG5cbiAgICAvLyBmcm9tIGdydW50IGRlcGxveS1wcm9kdWN0aW9uXG4gICAgY29uc3Qgc2ltRGlyZWN0b3J5ID0gY29uc3RhbnRzLkhUTUxfU0lNU19ESVJFQ1RPUlkgKyBzaW1OYW1lO1xuICAgIGNvbnN0IHZlcnNpb25EaXJlY3RvcmllcyA9IGF3YWl0IGdldFNvcnRlZFZlcnNpb25EaXJlY3Rvcmllcyggc2ltRGlyZWN0b3J5ICk7XG4gICAgaWYgKCB2ZXJzaW9uRGlyZWN0b3JpZXMubGVuZ3RoID4gMCApIHtcbiAgICAgIGNvbnN0IGxhdGVzdCA9IHZlcnNpb25EaXJlY3Rvcmllc1sgdmVyc2lvbkRpcmVjdG9yaWVzLmxlbmd0aCAtIDEgXTtcbiAgICAgIGNvbnN0IHRyYW5zbGF0aW9uc1hNTEZpbGUgPSBgJHtjb25zdGFudHMuSFRNTF9TSU1TX0RJUkVDVE9SWSArIHNpbU5hbWV9LyR7bGF0ZXN0fS8ke3NpbU5hbWV9LnhtbGA7XG4gICAgICB3aW5zdG9uLmxvZyggJ2luZm8nLCBgcGF0aCB0byB0cmFuc2xhdGlvbnMgWE1MIGZpbGUgPSAke3RyYW5zbGF0aW9uc1hNTEZpbGV9YCApO1xuICAgICAgY29uc3QgeG1sU3RyaW5nID0gZnMucmVhZEZpbGVTeW5jKCB0cmFuc2xhdGlvbnNYTUxGaWxlICk7XG4gICAgICBsZXQganNvbjtcbiAgICAgIHRyeSB7XG4gICAgICAgIGpzb24gPSBhd2FpdCBnZXRKc29uRnJvbVhNTCggeG1sU3RyaW5nICk7XG4gICAgICB9XG4gICAgICBjYXRjaCggZXJyICkge1xuICAgICAgICAvLyBUT0RPIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9wZXJlbm5pYWwvaXNzdWVzLzE2NyBzaG91bGQgd2UgY2FsbCByZWplY3QgaGVyZT8gd2hhdCBoYXBwZW5zIHdoZW4gY2FsbGJhY2tMb2NhbGVzIGlzIHVuZGVmaW5lZD9cbiAgICAgICAgd2luc3Rvbi5sb2coICdlcnJvcicsIGBlcnJvciBwYXJzaW5nIFhNTCwgZXJyID0gJHtlcnJ9YCApO1xuICAgICAgfVxuICAgICAgd2luc3Rvbi5sb2coICdpbmZvJywgJ2RhdGEgZXh0cmFjdGVkIGZyb20gdHJhbnNsYXRpb25zIFhNTCBmaWxlOicgKTtcbiAgICAgIHdpbnN0b24ubG9nKCAnaW5mbycsIEpTT04uc3RyaW5naWZ5KCBqc29uLCBudWxsLCAyICkgKTtcbiAgICAgIGNvbnN0IHNpbXNBcnJheSA9IGpzb24ucHJvamVjdC5zaW11bGF0aW9uc1sgMCBdLnNpbXVsYXRpb247XG4gICAgICBjb25zdCBsb2NhbGVzQXJyYXkgPSBbXTtcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHNpbXNBcnJheS5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgbG9jYWxlc0FycmF5LnB1c2goIHNpbXNBcnJheVsgaSBdLiQubG9jYWxlICk7XG4gICAgICB9XG4gICAgICBjYWxsYmFja0xvY2FsZXMgPSBsb2NhbGVzQXJyYXkuam9pbiggJywnICk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gZmlyc3QgZGVwbG95LCBzaW0gZGlyZWN0b3J5IHdpbGwgbm90IGV4aXN0IHlldCwganVzdCBwdWJsaXNoIHRoZSBlbmdsaXNoIHZlcnNpb25cbiAgICAgIGNhbGxiYWNrTG9jYWxlcyA9ICdlbic7XG4gICAgfVxuICB9XG5cbiAgd2luc3Rvbi5sb2coICdpbmZvJywgYGJ1aWxkaW5nIGxvY2FsZXM9JHtjYWxsYmFja0xvY2FsZXN9YCApO1xuXG4gIHJldHVybiBjYWxsYmFja0xvY2FsZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0TG9jYWxlczsiXSwibmFtZXMiOlsiY29uc3RhbnRzIiwicmVxdWlyZSIsImZzIiwiZ2V0U29ydGVkVmVyc2lvbkRpcmVjdG9yaWVzIiwicGFyc2VTdHJpbmciLCJ3aW5zdG9uIiwiZ2V0SnNvbkZyb21YTUwiLCJ4bWxTdHJpbmciLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImVycm9yIiwianNvbiIsImdldExvY2FsZXMiLCJsb2NhbGVzIiwic2ltTmFtZSIsImNhbGxiYWNrTG9jYWxlcyIsInNpbURpcmVjdG9yeSIsIkhUTUxfU0lNU19ESVJFQ1RPUlkiLCJ2ZXJzaW9uRGlyZWN0b3JpZXMiLCJsZW5ndGgiLCJsYXRlc3QiLCJ0cmFuc2xhdGlvbnNYTUxGaWxlIiwibG9nIiwicmVhZEZpbGVTeW5jIiwiZXJyIiwiSlNPTiIsInN0cmluZ2lmeSIsInNpbXNBcnJheSIsInByb2plY3QiLCJzaW11bGF0aW9ucyIsInNpbXVsYXRpb24iLCJsb2NhbGVzQXJyYXkiLCJpIiwicHVzaCIsIiQiLCJsb2NhbGUiLCJqb2luIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUEsaURBQWlEO0FBQ2pELHlEQUF5RDtBQUd6RCxNQUFNQSxZQUFZQyxRQUFTO0FBQzNCLE1BQU1DLEtBQUtELFFBQVMsZ0JBQWlCLG1EQUFtRDtBQUN4RixNQUFNRSw4QkFBOEJGLFFBQVM7QUFDN0MsTUFBTUcsY0FBY0gsUUFBUyxVQUFXRyxXQUFXLEVBQUUsNERBQTREO0FBQ2pILE1BQU1DLFVBQVVKLFFBQVM7QUFFekIsZUFBZUssZUFBZ0JDLFNBQVM7SUFDdEMsT0FBTyxJQUFJQyxRQUFTLENBQUVDLFNBQVNDO1FBQzdCTixZQUFhRyxXQUFXLENBQUVJLE9BQU9DO1lBQy9CLElBQUtELE9BQVE7Z0JBQ1hELE9BQVFDO1lBQ1YsT0FDSztnQkFDSEYsUUFBU0c7WUFDWDtRQUNGO0lBQ0Y7QUFDRjtBQUVBOzs7OztDQUtDLEdBQ0QsZUFBZUMsV0FBWUMsT0FBTyxFQUFFQyxPQUFPO0lBQ3pDLElBQUlDO0lBRUosSUFBS0YsV0FBV0EsWUFBWSxLQUFNO1FBRWhDLGVBQWU7UUFDZkUsa0JBQWtCRjtJQUNwQixPQUNLO1FBRUgsK0JBQStCO1FBQy9CLE1BQU1HLGVBQWVqQixVQUFVa0IsbUJBQW1CLEdBQUdIO1FBQ3JELE1BQU1JLHFCQUFxQixNQUFNaEIsNEJBQTZCYztRQUM5RCxJQUFLRSxtQkFBbUJDLE1BQU0sR0FBRyxHQUFJO1lBQ25DLE1BQU1DLFNBQVNGLGtCQUFrQixDQUFFQSxtQkFBbUJDLE1BQU0sR0FBRyxFQUFHO1lBQ2xFLE1BQU1FLHNCQUFzQixHQUFHdEIsVUFBVWtCLG1CQUFtQixHQUFHSCxRQUFRLENBQUMsRUFBRU0sT0FBTyxDQUFDLEVBQUVOLFFBQVEsSUFBSSxDQUFDO1lBQ2pHVixRQUFRa0IsR0FBRyxDQUFFLFFBQVEsQ0FBQyxnQ0FBZ0MsRUFBRUQscUJBQXFCO1lBQzdFLE1BQU1mLFlBQVlMLEdBQUdzQixZQUFZLENBQUVGO1lBQ25DLElBQUlWO1lBQ0osSUFBSTtnQkFDRkEsT0FBTyxNQUFNTixlQUFnQkM7WUFDL0IsRUFDQSxPQUFPa0IsS0FBTTtnQkFDWCxvSUFBb0k7Z0JBQ3BJcEIsUUFBUWtCLEdBQUcsQ0FBRSxTQUFTLENBQUMseUJBQXlCLEVBQUVFLEtBQUs7WUFDekQ7WUFDQXBCLFFBQVFrQixHQUFHLENBQUUsUUFBUTtZQUNyQmxCLFFBQVFrQixHQUFHLENBQUUsUUFBUUcsS0FBS0MsU0FBUyxDQUFFZixNQUFNLE1BQU07WUFDakQsTUFBTWdCLFlBQVloQixLQUFLaUIsT0FBTyxDQUFDQyxXQUFXLENBQUUsRUFBRyxDQUFDQyxVQUFVO1lBQzFELE1BQU1DLGVBQWUsRUFBRTtZQUN2QixJQUFNLElBQUlDLElBQUksR0FBR0EsSUFBSUwsVUFBVVIsTUFBTSxFQUFFYSxJQUFNO2dCQUMzQ0QsYUFBYUUsSUFBSSxDQUFFTixTQUFTLENBQUVLLEVBQUcsQ0FBQ0UsQ0FBQyxDQUFDQyxNQUFNO1lBQzVDO1lBQ0FwQixrQkFBa0JnQixhQUFhSyxJQUFJLENBQUU7UUFDdkMsT0FDSztZQUNILG1GQUFtRjtZQUNuRnJCLGtCQUFrQjtRQUNwQjtJQUNGO0lBRUFYLFFBQVFrQixHQUFHLENBQUUsUUFBUSxDQUFDLGlCQUFpQixFQUFFUCxpQkFBaUI7SUFFMUQsT0FBT0E7QUFDVDtBQUVBc0IsT0FBT0MsT0FBTyxHQUFHMUIifQ==