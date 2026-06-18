// Copyright 2017, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)
const constants = require('./constants');
const winston = require('winston');
const nodemailer = require('nodemailer');
// configure email server
let transporter;
if (constants.BUILD_SERVER_CONFIG.emailUsername && constants.BUILD_SERVER_CONFIG.emailPassword && constants.BUILD_SERVER_CONFIG.emailTo) {
    transporter = nodemailer.createTransport({
        auth: {
            user: constants.BUILD_SERVER_CONFIG.emailUsername,
            pass: constants.BUILD_SERVER_CONFIG.emailPassword
        },
        host: constants.BUILD_SERVER_CONFIG.emailServer,
        port: 587,
        tls: {
            ciphers: 'SSLv3'
        }
    });
} else {
    winston.log('warn', 'failed to set up email server, missing one or more of the following fields in build-local.json:\n' + 'emailUsername, emailPassword, emailTo');
}
/**
 * Send an email. Used to notify developers if a build fails
 * @param subject
 * @param text
 * @param emailParameter - recipient defined per request
 * @param emailParameterOnly - if true send the email only to the passed in email, not to the default list as well
 */ module.exports = async function sendEmail(subject, text, emailParameter, emailParameterOnly) {
    if (transporter) {
        let emailTo = constants.BUILD_SERVER_CONFIG.emailTo;
        if (emailParameter) {
            if (emailParameterOnly) {
                emailTo = emailParameter;
            } else {
                emailTo += `, ${emailParameter}`;
            }
        }
        // don't send an email if no email is given
        if (emailParameterOnly && !emailParameter) {
            return;
        }
        try {
            const emailResult = await transporter.sendMail({
                from: `"PhET Mail" <${constants.BUILD_SERVER_CONFIG.emailUsername}>`,
                to: emailTo,
                subject: subject,
                text: text.replace(/([^\r])\n/g, '$1\r\n') // Replace LF with CRLF, bare line feeds are rejected by some email clients,
            });
            winston.info(`sent email: ${emailTo}, ${subject}, ${emailResult.messageId}, ${emailResult.response}`);
        } catch (err) {
            let errorString = typeof err === 'string' ? err : JSON.stringify(err);
            errorString = errorString.replace(constants.BUILD_SERVER_CONFIG.emailPassword, '***PASSWORD REDACTED***');
            winston.error(`error when attempted to send email, err = ${errorString}`);
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvc2VuZEVtYWlsLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcbi8vIEBhdXRob3IgTWF0dCBQZW5uaW5ndG9uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuXG5cbmNvbnN0IGNvbnN0YW50cyA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKTtcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcbmNvbnN0IG5vZGVtYWlsZXIgPSByZXF1aXJlKCAnbm9kZW1haWxlcicgKTtcblxuLy8gY29uZmlndXJlIGVtYWlsIHNlcnZlclxubGV0IHRyYW5zcG9ydGVyO1xuaWYgKCBjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy5lbWFpbFVzZXJuYW1lICYmIGNvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLmVtYWlsUGFzc3dvcmQgJiYgY29uc3RhbnRzLkJVSUxEX1NFUlZFUl9DT05GSUcuZW1haWxUbyApIHtcbiAgdHJhbnNwb3J0ZXIgPSBub2RlbWFpbGVyLmNyZWF0ZVRyYW5zcG9ydCgge1xuICAgIGF1dGg6IHtcbiAgICAgIHVzZXI6IGNvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLmVtYWlsVXNlcm5hbWUsXG4gICAgICBwYXNzOiBjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy5lbWFpbFBhc3N3b3JkXG4gICAgfSxcbiAgICBob3N0OiBjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy5lbWFpbFNlcnZlcixcbiAgICBwb3J0OiA1ODcsXG4gICAgdGxzOiB7XG4gICAgICBjaXBoZXJzOiAnU1NMdjMnXG4gICAgfVxuICB9ICk7XG59XG5lbHNlIHtcbiAgd2luc3Rvbi5sb2coICd3YXJuJywgJ2ZhaWxlZCB0byBzZXQgdXAgZW1haWwgc2VydmVyLCBtaXNzaW5nIG9uZSBvciBtb3JlIG9mIHRoZSBmb2xsb3dpbmcgZmllbGRzIGluIGJ1aWxkLWxvY2FsLmpzb246XFxuJyArXG4gICAgICAgICAgICAgICAgICAgICAgICdlbWFpbFVzZXJuYW1lLCBlbWFpbFBhc3N3b3JkLCBlbWFpbFRvJyApO1xufVxuXG4vKipcbiAqIFNlbmQgYW4gZW1haWwuIFVzZWQgdG8gbm90aWZ5IGRldmVsb3BlcnMgaWYgYSBidWlsZCBmYWlsc1xuICogQHBhcmFtIHN1YmplY3RcbiAqIEBwYXJhbSB0ZXh0XG4gKiBAcGFyYW0gZW1haWxQYXJhbWV0ZXIgLSByZWNpcGllbnQgZGVmaW5lZCBwZXIgcmVxdWVzdFxuICogQHBhcmFtIGVtYWlsUGFyYW1ldGVyT25seSAtIGlmIHRydWUgc2VuZCB0aGUgZW1haWwgb25seSB0byB0aGUgcGFzc2VkIGluIGVtYWlsLCBub3QgdG8gdGhlIGRlZmF1bHQgbGlzdCBhcyB3ZWxsXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gc2VuZEVtYWlsKCBzdWJqZWN0LCB0ZXh0LCBlbWFpbFBhcmFtZXRlciwgZW1haWxQYXJhbWV0ZXJPbmx5ICkge1xuICBpZiAoIHRyYW5zcG9ydGVyICkge1xuICAgIGxldCBlbWFpbFRvID0gY29uc3RhbnRzLkJVSUxEX1NFUlZFUl9DT05GSUcuZW1haWxUbztcblxuICAgIGlmICggZW1haWxQYXJhbWV0ZXIgKSB7XG4gICAgICBpZiAoIGVtYWlsUGFyYW1ldGVyT25seSApIHtcbiAgICAgICAgZW1haWxUbyA9IGVtYWlsUGFyYW1ldGVyO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGVtYWlsVG8gKz0gKCBgLCAke2VtYWlsUGFyYW1ldGVyfWAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkb24ndCBzZW5kIGFuIGVtYWlsIGlmIG5vIGVtYWlsIGlzIGdpdmVuXG4gICAgaWYgKCBlbWFpbFBhcmFtZXRlck9ubHkgJiYgIWVtYWlsUGFyYW1ldGVyICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBlbWFpbFJlc3VsdCA9IGF3YWl0IHRyYW5zcG9ydGVyLnNlbmRNYWlsKCB7XG4gICAgICAgIGZyb206IGBcIlBoRVQgTWFpbFwiIDwke2NvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLmVtYWlsVXNlcm5hbWV9PmAsXG4gICAgICAgIHRvOiBlbWFpbFRvLFxuICAgICAgICBzdWJqZWN0OiBzdWJqZWN0LFxuICAgICAgICB0ZXh0OiB0ZXh0LnJlcGxhY2UoIC8oW15cXHJdKVxcbi9nLCAnJDFcXHJcXG4nICkgLy8gUmVwbGFjZSBMRiB3aXRoIENSTEYsIGJhcmUgbGluZSBmZWVkcyBhcmUgcmVqZWN0ZWQgYnkgc29tZSBlbWFpbCBjbGllbnRzLFxuICAgICAgfSApO1xuXG4gICAgICB3aW5zdG9uLmluZm8oIGBzZW50IGVtYWlsOiAke2VtYWlsVG99LCAke3N1YmplY3R9LCAke2VtYWlsUmVzdWx0Lm1lc3NhZ2VJZH0sICR7ZW1haWxSZXN1bHQucmVzcG9uc2V9YCApO1xuICAgIH1cbiAgICBjYXRjaCggZXJyICkge1xuICAgICAgbGV0IGVycm9yU3RyaW5nID0gdHlwZW9mIGVyciA9PT0gJ3N0cmluZycgPyBlcnIgOiBKU09OLnN0cmluZ2lmeSggZXJyICk7XG4gICAgICBlcnJvclN0cmluZyA9IGVycm9yU3RyaW5nLnJlcGxhY2UoIGNvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLmVtYWlsUGFzc3dvcmQsICcqKipQQVNTV09SRCBSRURBQ1RFRCoqKicgKTtcbiAgICAgIHdpbnN0b24uZXJyb3IoIGBlcnJvciB3aGVuIGF0dGVtcHRlZCB0byBzZW5kIGVtYWlsLCBlcnIgPSAke2Vycm9yU3RyaW5nfWAgKTtcbiAgICB9XG4gIH1cbn07Il0sIm5hbWVzIjpbImNvbnN0YW50cyIsInJlcXVpcmUiLCJ3aW5zdG9uIiwibm9kZW1haWxlciIsInRyYW5zcG9ydGVyIiwiQlVJTERfU0VSVkVSX0NPTkZJRyIsImVtYWlsVXNlcm5hbWUiLCJlbWFpbFBhc3N3b3JkIiwiZW1haWxUbyIsImNyZWF0ZVRyYW5zcG9ydCIsImF1dGgiLCJ1c2VyIiwicGFzcyIsImhvc3QiLCJlbWFpbFNlcnZlciIsInBvcnQiLCJ0bHMiLCJjaXBoZXJzIiwibG9nIiwibW9kdWxlIiwiZXhwb3J0cyIsInNlbmRFbWFpbCIsInN1YmplY3QiLCJ0ZXh0IiwiZW1haWxQYXJhbWV0ZXIiLCJlbWFpbFBhcmFtZXRlck9ubHkiLCJlbWFpbFJlc3VsdCIsInNlbmRNYWlsIiwiZnJvbSIsInRvIiwicmVwbGFjZSIsImluZm8iLCJtZXNzYWdlSWQiLCJyZXNwb25zZSIsImVyciIsImVycm9yU3RyaW5nIiwiSlNPTiIsInN0cmluZ2lmeSIsImVycm9yIl0sIm1hcHBpbmdzIjoiQUFBQSxpREFBaUQ7QUFDakQseURBQXlEO0FBR3pELE1BQU1BLFlBQVlDLFFBQVM7QUFDM0IsTUFBTUMsVUFBVUQsUUFBUztBQUN6QixNQUFNRSxhQUFhRixRQUFTO0FBRTVCLHlCQUF5QjtBQUN6QixJQUFJRztBQUNKLElBQUtKLFVBQVVLLG1CQUFtQixDQUFDQyxhQUFhLElBQUlOLFVBQVVLLG1CQUFtQixDQUFDRSxhQUFhLElBQUlQLFVBQVVLLG1CQUFtQixDQUFDRyxPQUFPLEVBQUc7SUFDeklKLGNBQWNELFdBQVdNLGVBQWUsQ0FBRTtRQUN4Q0MsTUFBTTtZQUNKQyxNQUFNWCxVQUFVSyxtQkFBbUIsQ0FBQ0MsYUFBYTtZQUNqRE0sTUFBTVosVUFBVUssbUJBQW1CLENBQUNFLGFBQWE7UUFDbkQ7UUFDQU0sTUFBTWIsVUFBVUssbUJBQW1CLENBQUNTLFdBQVc7UUFDL0NDLE1BQU07UUFDTkMsS0FBSztZQUNIQyxTQUFTO1FBQ1g7SUFDRjtBQUNGLE9BQ0s7SUFDSGYsUUFBUWdCLEdBQUcsQ0FBRSxRQUFRLHNHQUNBO0FBQ3ZCO0FBRUE7Ozs7OztDQU1DLEdBQ0RDLE9BQU9DLE9BQU8sR0FBRyxlQUFlQyxVQUFXQyxPQUFPLEVBQUVDLElBQUksRUFBRUMsY0FBYyxFQUFFQyxrQkFBa0I7SUFDMUYsSUFBS3JCLGFBQWM7UUFDakIsSUFBSUksVUFBVVIsVUFBVUssbUJBQW1CLENBQUNHLE9BQU87UUFFbkQsSUFBS2dCLGdCQUFpQjtZQUNwQixJQUFLQyxvQkFBcUI7Z0JBQ3hCakIsVUFBVWdCO1lBQ1osT0FDSztnQkFDSGhCLFdBQWEsQ0FBQyxFQUFFLEVBQUVnQixnQkFBZ0I7WUFDcEM7UUFDRjtRQUVBLDJDQUEyQztRQUMzQyxJQUFLQyxzQkFBc0IsQ0FBQ0QsZ0JBQWlCO1lBQzNDO1FBQ0Y7UUFFQSxJQUFJO1lBQ0YsTUFBTUUsY0FBYyxNQUFNdEIsWUFBWXVCLFFBQVEsQ0FBRTtnQkFDOUNDLE1BQU0sQ0FBQyxhQUFhLEVBQUU1QixVQUFVSyxtQkFBbUIsQ0FBQ0MsYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDcEV1QixJQUFJckI7Z0JBQ0pjLFNBQVNBO2dCQUNUQyxNQUFNQSxLQUFLTyxPQUFPLENBQUUsY0FBYyxVQUFXLDRFQUE0RTtZQUMzSDtZQUVBNUIsUUFBUTZCLElBQUksQ0FBRSxDQUFDLFlBQVksRUFBRXZCLFFBQVEsRUFBRSxFQUFFYyxRQUFRLEVBQUUsRUFBRUksWUFBWU0sU0FBUyxDQUFDLEVBQUUsRUFBRU4sWUFBWU8sUUFBUSxFQUFFO1FBQ3ZHLEVBQ0EsT0FBT0MsS0FBTTtZQUNYLElBQUlDLGNBQWMsT0FBT0QsUUFBUSxXQUFXQSxNQUFNRSxLQUFLQyxTQUFTLENBQUVIO1lBQ2xFQyxjQUFjQSxZQUFZTCxPQUFPLENBQUU5QixVQUFVSyxtQkFBbUIsQ0FBQ0UsYUFBYSxFQUFFO1lBQ2hGTCxRQUFRb0MsS0FBSyxDQUFFLENBQUMsMENBQTBDLEVBQUVILGFBQWE7UUFDM0U7SUFDRjtBQUNGIn0=