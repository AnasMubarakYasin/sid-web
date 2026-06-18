// Copyright 2017, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)
const constants = require('./constants');
const sendEmail = require('./sendEmail');
const winston = require('winston');
const axios = require('axios');
/**
 * Notify the website that a new sim or translation has been deployed. This will cause the project to
 * synchronize and the new translation will appear on the website.
 * @param {Object} [options]
 *  @property {string} simName
 *  @property {string} email
 *  @property {string} brand
 *  @property {string} locales
 *  @property {number} translatorId
 *  @property {Object} [phetioOptions]
 *  @property {SimVersion} version
 *  @property {string} branch
 *  @property {string} suffix
 *  @property {boolean} ignoreForAutomatedMaintenanceReleases
 */ module.exports = async function notifyServer(options) {
    if (options.brand === constants.PHET_BRAND) {
        const project = `html/${options.simName}`;
        let url = `${constants.BUILD_SERVER_CONFIG.productionServerURL}/services/synchronize-project?projectName=${project}`;
        if (options.locales && options.locales !== '*' && options.locales !== 'en' && options.locales.indexOf(',') < 0) {
            url += `&locale=${options.locales}`;
            if (options.translatorId) {
                url += `&translatorId=${options.translatorId}`;
            }
        }
        let response;
        try {
            response = await axios({
                url: url,
                auth: {
                    username: 'token',
                    password: constants.BUILD_SERVER_CONFIG.serverToken
                }
            });
        } catch (e) {
            throw new Error(e);
        }
        let errorMessage;
        if (response.status >= 200 && response.status <= 299) {
            const data = response.data;
            if (!data.success) {
                errorMessage = `request to synchronize project ${project} on ${constants.BUILD_SERVER_CONFIG.productionServerURL} failed with message: ${data.error}`;
                winston.log('error', errorMessage);
                sendEmail('SYNCHRONIZE FAILED', errorMessage, options.email);
            } else {
                winston.log('info', `request to synchronize project ${project} on ${constants.BUILD_SERVER_CONFIG.productionServerURL} succeeded`);
            }
        } else {
            errorMessage = 'request to synchronize project errored or returned a non 2XX status code';
            winston.log('error', errorMessage);
            sendEmail('SYNCHRONIZE FAILED', errorMessage, options.email);
        }
    } else if (options.brand === constants.PHET_IO_BRAND) {
        const url = `${constants.BUILD_SERVER_CONFIG.productionServerURL}/services/metadata/phetio` + `?name=${options.simName}&versionMajor=${options.phetioOptions.version.major}&versionMinor=${options.phetioOptions.version.minor}&versionMaintenance=${options.phetioOptions.version.maintenance}&versionSuffix=${options.phetioOptions.suffix}&branch=${options.phetioOptions.branch}&active=${!options.phetioOptions.ignoreForAutomatedMaintenanceReleases}`;
        let response;
        try {
            response = await axios({
                url: url,
                method: 'POST',
                auth: {
                    username: 'token',
                    password: constants.BUILD_SERVER_CONFIG.serverToken
                }
            });
        } catch (e) {
            throw new Error(e);
        }
        let errorMessage;
        if (response.status < 200 || response.status > 299) {
            try {
                errorMessage = response.data.error;
            } catch (e) {
                errorMessage = 'request to upsert phetio deployment failed';
            }
            winston.log('error', errorMessage);
            sendEmail('PHET_IO DEPLOYMENT UPSERT FAILED', errorMessage, options.email);
            throw new Error('PHET_IO DEPLOYMENT UPSERT FAILED');
        } else {
            const data = response.data;
            if (!data.success) {
                try {
                    errorMessage = data.error;
                } catch (e) {
                    errorMessage = 'request to upsert phetio deployment failed';
                }
                winston.log('error', errorMessage);
                sendEmail('SYNCHRONIZE FAILED', errorMessage, options.email);
                throw new Error('PHET_IO DEPLOYMENT UPSERT FAILED');
            } else {
                winston.log('info', `request to upsert phetio deployment for ${options.simName} on ${constants.BUILD_SERVER_CONFIG.productionServerURL} succeeded`);
            }
        }
    } else {
        throw new Error('Called notifyServer for unsupported brand');
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvbm90aWZ5U2VydmVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcbi8vIEBhdXRob3IgTWF0dCBQZW5uaW5ndG9uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuXG5cbmNvbnN0IGNvbnN0YW50cyA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKTtcbmNvbnN0IHNlbmRFbWFpbCA9IHJlcXVpcmUoICcuL3NlbmRFbWFpbCcgKTtcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcbmNvbnN0IGF4aW9zID0gcmVxdWlyZSggJ2F4aW9zJyApO1xuXG4vKipcbiAqIE5vdGlmeSB0aGUgd2Vic2l0ZSB0aGF0IGEgbmV3IHNpbSBvciB0cmFuc2xhdGlvbiBoYXMgYmVlbiBkZXBsb3llZC4gVGhpcyB3aWxsIGNhdXNlIHRoZSBwcm9qZWN0IHRvXG4gKiBzeW5jaHJvbml6ZSBhbmQgdGhlIG5ldyB0cmFuc2xhdGlvbiB3aWxsIGFwcGVhciBvbiB0aGUgd2Vic2l0ZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqICBAcHJvcGVydHkge3N0cmluZ30gc2ltTmFtZVxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBlbWFpbFxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBicmFuZFxuICogIEBwcm9wZXJ0eSB7c3RyaW5nfSBsb2NhbGVzXG4gKiAgQHByb3BlcnR5IHtudW1iZXJ9IHRyYW5zbGF0b3JJZFxuICogIEBwcm9wZXJ0eSB7T2JqZWN0fSBbcGhldGlvT3B0aW9uc11cbiAqICBAcHJvcGVydHkge1NpbVZlcnNpb259IHZlcnNpb25cbiAqICBAcHJvcGVydHkge3N0cmluZ30gYnJhbmNoXG4gKiAgQHByb3BlcnR5IHtzdHJpbmd9IHN1ZmZpeFxuICogIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gaWdub3JlRm9yQXV0b21hdGVkTWFpbnRlbmFuY2VSZWxlYXNlc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIG5vdGlmeVNlcnZlciggb3B0aW9ucyApIHtcbiAgaWYgKCBvcHRpb25zLmJyYW5kID09PSBjb25zdGFudHMuUEhFVF9CUkFORCApIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gYGh0bWwvJHtvcHRpb25zLnNpbU5hbWV9YDtcbiAgICBsZXQgdXJsID0gYCR7Y29uc3RhbnRzLkJVSUxEX1NFUlZFUl9DT05GSUcucHJvZHVjdGlvblNlcnZlclVSTH0vc2VydmljZXMvc3luY2hyb25pemUtcHJvamVjdD9wcm9qZWN0TmFtZT0ke3Byb2plY3R9YDtcbiAgICBpZiAoIG9wdGlvbnMubG9jYWxlcyAmJiBvcHRpb25zLmxvY2FsZXMgIT09ICcqJyAmJiBvcHRpb25zLmxvY2FsZXMgIT09ICdlbicgJiYgb3B0aW9ucy5sb2NhbGVzLmluZGV4T2YoICcsJyApIDwgMCApIHtcbiAgICAgIHVybCArPSBgJmxvY2FsZT0ke29wdGlvbnMubG9jYWxlc31gO1xuICAgICAgaWYgKCBvcHRpb25zLnRyYW5zbGF0b3JJZCApIHtcbiAgICAgICAgdXJsICs9IGAmdHJhbnNsYXRvcklkPSR7b3B0aW9ucy50cmFuc2xhdG9ySWR9YDtcbiAgICAgIH1cbiAgICB9XG5cblxuICAgIGxldCByZXNwb25zZTtcbiAgICB0cnkge1xuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBheGlvcygge1xuICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgYXV0aDoge1xuICAgICAgICAgIHVzZXJuYW1lOiAndG9rZW4nLFxuICAgICAgICAgIHBhc3N3b3JkOiBjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy5zZXJ2ZXJUb2tlblxuICAgICAgICB9XG4gICAgICB9ICk7XG4gICAgfVxuICAgIGNhdGNoKCBlICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCBlICk7XG4gICAgfVxuICAgIGxldCBlcnJvck1lc3NhZ2U7XG5cbiAgICBpZiAoIHJlc3BvbnNlLnN0YXR1cyA+PSAyMDAgJiYgcmVzcG9uc2Uuc3RhdHVzIDw9IDI5OSApIHtcbiAgICAgIGNvbnN0IGRhdGEgPSByZXNwb25zZS5kYXRhO1xuXG4gICAgICBpZiAoICFkYXRhLnN1Y2Nlc3MgKSB7XG4gICAgICAgIGVycm9yTWVzc2FnZSA9IGByZXF1ZXN0IHRvIHN5bmNocm9uaXplIHByb2plY3QgJHtwcm9qZWN0fSBvbiAke2NvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLnByb2R1Y3Rpb25TZXJ2ZXJVUkx9IGZhaWxlZCB3aXRoIG1lc3NhZ2U6ICR7ZGF0YS5lcnJvcn1gO1xuICAgICAgICB3aW5zdG9uLmxvZyggJ2Vycm9yJywgZXJyb3JNZXNzYWdlICk7XG4gICAgICAgIHNlbmRFbWFpbCggJ1NZTkNIUk9OSVpFIEZBSUxFRCcsIGVycm9yTWVzc2FnZSwgb3B0aW9ucy5lbWFpbCApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHdpbnN0b24ubG9nKCAnaW5mbycsIGByZXF1ZXN0IHRvIHN5bmNocm9uaXplIHByb2plY3QgJHtwcm9qZWN0fSBvbiAke2NvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLnByb2R1Y3Rpb25TZXJ2ZXJVUkx9IHN1Y2NlZWRlZGAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBlcnJvck1lc3NhZ2UgPSAncmVxdWVzdCB0byBzeW5jaHJvbml6ZSBwcm9qZWN0IGVycm9yZWQgb3IgcmV0dXJuZWQgYSBub24gMlhYIHN0YXR1cyBjb2RlJztcbiAgICAgIHdpbnN0b24ubG9nKCAnZXJyb3InLCBlcnJvck1lc3NhZ2UgKTtcbiAgICAgIHNlbmRFbWFpbCggJ1NZTkNIUk9OSVpFIEZBSUxFRCcsIGVycm9yTWVzc2FnZSwgb3B0aW9ucy5lbWFpbCApO1xuICAgIH1cbiAgfVxuICBlbHNlIGlmICggb3B0aW9ucy5icmFuZCA9PT0gY29uc3RhbnRzLlBIRVRfSU9fQlJBTkQgKSB7XG4gICAgY29uc3QgdXJsID0gYCR7Y29uc3RhbnRzLkJVSUxEX1NFUlZFUl9DT05GSUcucHJvZHVjdGlvblNlcnZlclVSTH0vc2VydmljZXMvbWV0YWRhdGEvcGhldGlvYCArXG4gICAgICAgICAgICAgICAgYD9uYW1lPSR7b3B0aW9ucy5zaW1OYW1lXG4gICAgICAgICAgICAgICAgfSZ2ZXJzaW9uTWFqb3I9JHtvcHRpb25zLnBoZXRpb09wdGlvbnMudmVyc2lvbi5tYWpvclxuICAgICAgICAgICAgICAgIH0mdmVyc2lvbk1pbm9yPSR7b3B0aW9ucy5waGV0aW9PcHRpb25zLnZlcnNpb24ubWlub3JcbiAgICAgICAgICAgICAgICB9JnZlcnNpb25NYWludGVuYW5jZT0ke29wdGlvbnMucGhldGlvT3B0aW9ucy52ZXJzaW9uLm1haW50ZW5hbmNlXG4gICAgICAgICAgICAgICAgfSZ2ZXJzaW9uU3VmZml4PSR7b3B0aW9ucy5waGV0aW9PcHRpb25zLnN1ZmZpeFxuICAgICAgICAgICAgICAgIH0mYnJhbmNoPSR7b3B0aW9ucy5waGV0aW9PcHRpb25zLmJyYW5jaFxuICAgICAgICAgICAgICAgIH0mYWN0aXZlPSR7IW9wdGlvbnMucGhldGlvT3B0aW9ucy5pZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzfWA7XG4gICAgbGV0IHJlc3BvbnNlO1xuICAgIHRyeSB7XG4gICAgICByZXNwb25zZSA9IGF3YWl0IGF4aW9zKCB7XG4gICAgICAgIHVybDogdXJsLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgYXV0aDoge1xuICAgICAgICAgIHVzZXJuYW1lOiAndG9rZW4nLFxuICAgICAgICAgIHBhc3N3b3JkOiBjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy5zZXJ2ZXJUb2tlblxuICAgICAgICB9XG4gICAgICB9ICk7XG4gICAgfVxuICAgIGNhdGNoKCBlICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCBlICk7XG4gICAgfVxuICAgIGxldCBlcnJvck1lc3NhZ2U7XG5cbiAgICBpZiAoIHJlc3BvbnNlLnN0YXR1cyA8IDIwMCB8fCByZXNwb25zZS5zdGF0dXMgPiAyOTkgKSB7XG4gICAgICB0cnkge1xuICAgICAgICBlcnJvck1lc3NhZ2UgPSByZXNwb25zZS5kYXRhLmVycm9yO1xuICAgICAgfVxuICAgICAgY2F0Y2goIGUgKSB7XG4gICAgICAgIGVycm9yTWVzc2FnZSA9ICdyZXF1ZXN0IHRvIHVwc2VydCBwaGV0aW8gZGVwbG95bWVudCBmYWlsZWQnO1xuICAgICAgfVxuICAgICAgd2luc3Rvbi5sb2coICdlcnJvcicsIGVycm9yTWVzc2FnZSApO1xuICAgICAgc2VuZEVtYWlsKCAnUEhFVF9JTyBERVBMT1lNRU5UIFVQU0VSVCBGQUlMRUQnLCBlcnJvck1lc3NhZ2UsIG9wdGlvbnMuZW1haWwgKTtcbiAgICAgIHRocm93IG5ldyBFcnJvciggJ1BIRVRfSU8gREVQTE9ZTUVOVCBVUFNFUlQgRkFJTEVEJyApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IGRhdGEgPSByZXNwb25zZS5kYXRhO1xuXG4gICAgICBpZiAoICFkYXRhLnN1Y2Nlc3MgKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZXJyb3JNZXNzYWdlID0gZGF0YS5lcnJvcjtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCggZSApIHtcbiAgICAgICAgICBlcnJvck1lc3NhZ2UgPSAncmVxdWVzdCB0byB1cHNlcnQgcGhldGlvIGRlcGxveW1lbnQgZmFpbGVkJztcbiAgICAgICAgfVxuICAgICAgICB3aW5zdG9uLmxvZyggJ2Vycm9yJywgZXJyb3JNZXNzYWdlICk7XG4gICAgICAgIHNlbmRFbWFpbCggJ1NZTkNIUk9OSVpFIEZBSUxFRCcsIGVycm9yTWVzc2FnZSwgb3B0aW9ucy5lbWFpbCApO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdQSEVUX0lPIERFUExPWU1FTlQgVVBTRVJUIEZBSUxFRCcgKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB3aW5zdG9uLmxvZyggJ2luZm8nLCBgcmVxdWVzdCB0byB1cHNlcnQgcGhldGlvIGRlcGxveW1lbnQgZm9yICR7b3B0aW9ucy5zaW1OYW1lfSBvbiAke2NvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLnByb2R1Y3Rpb25TZXJ2ZXJVUkx9IHN1Y2NlZWRlZGAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgfVxuICBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoICdDYWxsZWQgbm90aWZ5U2VydmVyIGZvciB1bnN1cHBvcnRlZCBicmFuZCcgKTtcbiAgfVxufTsiXSwibmFtZXMiOlsiY29uc3RhbnRzIiwicmVxdWlyZSIsInNlbmRFbWFpbCIsIndpbnN0b24iLCJheGlvcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJub3RpZnlTZXJ2ZXIiLCJvcHRpb25zIiwiYnJhbmQiLCJQSEVUX0JSQU5EIiwicHJvamVjdCIsInNpbU5hbWUiLCJ1cmwiLCJCVUlMRF9TRVJWRVJfQ09ORklHIiwicHJvZHVjdGlvblNlcnZlclVSTCIsImxvY2FsZXMiLCJpbmRleE9mIiwidHJhbnNsYXRvcklkIiwicmVzcG9uc2UiLCJhdXRoIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsInNlcnZlclRva2VuIiwiZSIsIkVycm9yIiwiZXJyb3JNZXNzYWdlIiwic3RhdHVzIiwiZGF0YSIsInN1Y2Nlc3MiLCJlcnJvciIsImxvZyIsImVtYWlsIiwiUEhFVF9JT19CUkFORCIsInBoZXRpb09wdGlvbnMiLCJ2ZXJzaW9uIiwibWFqb3IiLCJtaW5vciIsIm1haW50ZW5hbmNlIiwic3VmZml4IiwiYnJhbmNoIiwiaWdub3JlRm9yQXV0b21hdGVkTWFpbnRlbmFuY2VSZWxlYXNlcyIsIm1ldGhvZCJdLCJtYXBwaW5ncyI6IkFBQUEsaURBQWlEO0FBQ2pELHlEQUF5RDtBQUd6RCxNQUFNQSxZQUFZQyxRQUFTO0FBQzNCLE1BQU1DLFlBQVlELFFBQVM7QUFDM0IsTUFBTUUsVUFBVUYsUUFBUztBQUN6QixNQUFNRyxRQUFRSCxRQUFTO0FBRXZCOzs7Ozs7Ozs7Ozs7OztDQWNDLEdBQ0RJLE9BQU9DLE9BQU8sR0FBRyxlQUFlQyxhQUFjQyxPQUFPO0lBQ25ELElBQUtBLFFBQVFDLEtBQUssS0FBS1QsVUFBVVUsVUFBVSxFQUFHO1FBQzVDLE1BQU1DLFVBQVUsQ0FBQyxLQUFLLEVBQUVILFFBQVFJLE9BQU8sRUFBRTtRQUN6QyxJQUFJQyxNQUFNLEdBQUdiLFVBQVVjLG1CQUFtQixDQUFDQyxtQkFBbUIsQ0FBQywwQ0FBMEMsRUFBRUosU0FBUztRQUNwSCxJQUFLSCxRQUFRUSxPQUFPLElBQUlSLFFBQVFRLE9BQU8sS0FBSyxPQUFPUixRQUFRUSxPQUFPLEtBQUssUUFBUVIsUUFBUVEsT0FBTyxDQUFDQyxPQUFPLENBQUUsT0FBUSxHQUFJO1lBQ2xISixPQUFPLENBQUMsUUFBUSxFQUFFTCxRQUFRUSxPQUFPLEVBQUU7WUFDbkMsSUFBS1IsUUFBUVUsWUFBWSxFQUFHO2dCQUMxQkwsT0FBTyxDQUFDLGNBQWMsRUFBRUwsUUFBUVUsWUFBWSxFQUFFO1lBQ2hEO1FBQ0Y7UUFHQSxJQUFJQztRQUNKLElBQUk7WUFDRkEsV0FBVyxNQUFNZixNQUFPO2dCQUN0QlMsS0FBS0E7Z0JBQ0xPLE1BQU07b0JBQ0pDLFVBQVU7b0JBQ1ZDLFVBQVV0QixVQUFVYyxtQkFBbUIsQ0FBQ1MsV0FBVztnQkFDckQ7WUFDRjtRQUNGLEVBQ0EsT0FBT0MsR0FBSTtZQUNULE1BQU0sSUFBSUMsTUFBT0Q7UUFDbkI7UUFDQSxJQUFJRTtRQUVKLElBQUtQLFNBQVNRLE1BQU0sSUFBSSxPQUFPUixTQUFTUSxNQUFNLElBQUksS0FBTTtZQUN0RCxNQUFNQyxPQUFPVCxTQUFTUyxJQUFJO1lBRTFCLElBQUssQ0FBQ0EsS0FBS0MsT0FBTyxFQUFHO2dCQUNuQkgsZUFBZSxDQUFDLCtCQUErQixFQUFFZixRQUFRLElBQUksRUFBRVgsVUFBVWMsbUJBQW1CLENBQUNDLG1CQUFtQixDQUFDLHNCQUFzQixFQUFFYSxLQUFLRSxLQUFLLEVBQUU7Z0JBQ3JKM0IsUUFBUTRCLEdBQUcsQ0FBRSxTQUFTTDtnQkFDdEJ4QixVQUFXLHNCQUFzQndCLGNBQWNsQixRQUFRd0IsS0FBSztZQUM5RCxPQUNLO2dCQUNIN0IsUUFBUTRCLEdBQUcsQ0FBRSxRQUFRLENBQUMsK0JBQStCLEVBQUVwQixRQUFRLElBQUksRUFBRVgsVUFBVWMsbUJBQW1CLENBQUNDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQztZQUNwSTtRQUNGLE9BQ0s7WUFDSFcsZUFBZTtZQUNmdkIsUUFBUTRCLEdBQUcsQ0FBRSxTQUFTTDtZQUN0QnhCLFVBQVcsc0JBQXNCd0IsY0FBY2xCLFFBQVF3QixLQUFLO1FBQzlEO0lBQ0YsT0FDSyxJQUFLeEIsUUFBUUMsS0FBSyxLQUFLVCxVQUFVaUMsYUFBYSxFQUFHO1FBQ3BELE1BQU1wQixNQUFNLEdBQUdiLFVBQVVjLG1CQUFtQixDQUFDQyxtQkFBbUIsQ0FBQyx5QkFBeUIsQ0FBQyxHQUMvRSxDQUFDLE1BQU0sRUFBRVAsUUFBUUksT0FBTyxDQUN2QixjQUFjLEVBQUVKLFFBQVEwQixhQUFhLENBQUNDLE9BQU8sQ0FBQ0MsS0FBSyxDQUNuRCxjQUFjLEVBQUU1QixRQUFRMEIsYUFBYSxDQUFDQyxPQUFPLENBQUNFLEtBQUssQ0FDbkQsb0JBQW9CLEVBQUU3QixRQUFRMEIsYUFBYSxDQUFDQyxPQUFPLENBQUNHLFdBQVcsQ0FDL0QsZUFBZSxFQUFFOUIsUUFBUTBCLGFBQWEsQ0FBQ0ssTUFBTSxDQUM3QyxRQUFRLEVBQUUvQixRQUFRMEIsYUFBYSxDQUFDTSxNQUFNLENBQ3RDLFFBQVEsRUFBRSxDQUFDaEMsUUFBUTBCLGFBQWEsQ0FBQ08scUNBQXFDLEVBQUU7UUFDckYsSUFBSXRCO1FBQ0osSUFBSTtZQUNGQSxXQUFXLE1BQU1mLE1BQU87Z0JBQ3RCUyxLQUFLQTtnQkFDTDZCLFFBQVE7Z0JBQ1J0QixNQUFNO29CQUNKQyxVQUFVO29CQUNWQyxVQUFVdEIsVUFBVWMsbUJBQW1CLENBQUNTLFdBQVc7Z0JBQ3JEO1lBQ0Y7UUFDRixFQUNBLE9BQU9DLEdBQUk7WUFDVCxNQUFNLElBQUlDLE1BQU9EO1FBQ25CO1FBQ0EsSUFBSUU7UUFFSixJQUFLUCxTQUFTUSxNQUFNLEdBQUcsT0FBT1IsU0FBU1EsTUFBTSxHQUFHLEtBQU07WUFDcEQsSUFBSTtnQkFDRkQsZUFBZVAsU0FBU1MsSUFBSSxDQUFDRSxLQUFLO1lBQ3BDLEVBQ0EsT0FBT04sR0FBSTtnQkFDVEUsZUFBZTtZQUNqQjtZQUNBdkIsUUFBUTRCLEdBQUcsQ0FBRSxTQUFTTDtZQUN0QnhCLFVBQVcsb0NBQW9Dd0IsY0FBY2xCLFFBQVF3QixLQUFLO1lBQzFFLE1BQU0sSUFBSVAsTUFBTztRQUNuQixPQUNLO1lBQ0gsTUFBTUcsT0FBT1QsU0FBU1MsSUFBSTtZQUUxQixJQUFLLENBQUNBLEtBQUtDLE9BQU8sRUFBRztnQkFDbkIsSUFBSTtvQkFDRkgsZUFBZUUsS0FBS0UsS0FBSztnQkFDM0IsRUFDQSxPQUFPTixHQUFJO29CQUNURSxlQUFlO2dCQUNqQjtnQkFDQXZCLFFBQVE0QixHQUFHLENBQUUsU0FBU0w7Z0JBQ3RCeEIsVUFBVyxzQkFBc0J3QixjQUFjbEIsUUFBUXdCLEtBQUs7Z0JBQzVELE1BQU0sSUFBSVAsTUFBTztZQUNuQixPQUNLO2dCQUNIdEIsUUFBUTRCLEdBQUcsQ0FBRSxRQUFRLENBQUMsd0NBQXdDLEVBQUV2QixRQUFRSSxPQUFPLENBQUMsSUFBSSxFQUFFWixVQUFVYyxtQkFBbUIsQ0FBQ0MsbUJBQW1CLENBQUMsVUFBVSxDQUFDO1lBQ3JKO1FBQ0Y7SUFFRixPQUNLO1FBQ0gsTUFBTSxJQUFJVSxNQUFPO0lBQ25CO0FBQ0YifQ==