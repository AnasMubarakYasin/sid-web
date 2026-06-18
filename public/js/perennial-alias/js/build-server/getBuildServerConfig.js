// Copyright 2002-2015, University of Colorado Boulder
const assert = require('assert');
/**
 * Gets configuration information that is related to deploying sims.
 *
 * All fields are @public (read-only).
 * Fields include:
 *
 * Required:
 * {string} buildServerAuthorizationCode - password that verifies if build request comes from phet team members
 * {string} devUsername - username on our dev server
 *
 * Optional:
 * {string} devDeployServer - name of the dev server, defaults to 'bayes.colorado.edu'
 * {string} devDeployPath - path on dev server to deploy to, defaults to '/data/web/htdocs/dev/html/'
 * {string} productionServerURL - production server url, defaults to 'https://phet.colorado.edu', can be over-ridden to 'https://phet-dev.colorado.edu'
 *
 * Include these fields in build-local.json to enable sending emails from build-server on build failure.
 * They are only needed on the production server, not locally. A valid emailUsername and emailPassword are needed to authenticate
 * sending mail from the smtp server, though the actual emails will be sent from 'PhET Build Server <phethelp@colorado.edu>',
 * not from the address you put here.
 * {string} emailUsername - e.g. "[identikey]@colorado.edu"
 * {string} emailPassword
 * {string} emailServer - (optional: defaults to "smtp.colorado.edu")
 * {string} emailTo - e.g. "Me <[identikey]@colorado.edu>, Another Person <person@example.com>"
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Aaron Davis
 */ /**
 * @param fs - the node fs API
 * @returns {Object} deploy configuration information, fields documented above
 *
 * @private
 */ function getDeployConfig(fs) {
    //------------------------------------------------------------------------------------
    // read configuration file
    const BUILD_LOCAL_FILENAME = `${process.env.HOME}/.phet/build-local.json`;
    const buildLocalJSON = JSON.parse(fs.readFileSync(BUILD_LOCAL_FILENAME, {
        encoding: 'utf-8'
    }));
    assert(buildLocalJSON.buildServerAuthorizationCode, `buildServerAuthorizationCode missing from ${BUILD_LOCAL_FILENAME}`);
    assert(buildLocalJSON.devUsername, `devUsername missing from ${BUILD_LOCAL_FILENAME}`);
    //------------------------------------------------------------------------------------
    // Assemble the deployConfig
    return {
        babelBranch: buildLocalJSON.babelBranch || 'main',
        buildServerAuthorizationCode: buildLocalJSON.buildServerAuthorizationCode,
        databaseAuthorizationCode: buildLocalJSON.databaseAuthorizationCode,
        devDeployPath: buildLocalJSON.devDeployPath || '/data/web/htdocs/dev/html/',
        devDeployServer: buildLocalJSON.devDeployServer || 'bayes.colorado.edu',
        devUsername: buildLocalJSON.devUsername,
        emailPassword: buildLocalJSON.emailPassword,
        emailServer: buildLocalJSON.emailServer || 'smtp.office365.com',
        emailTo: buildLocalJSON.emailTo,
        emailUsername: buildLocalJSON.emailUsername,
        htmlSimsDirectory: buildLocalJSON.htmlSimsDirectory,
        phetioSimsDirectory: buildLocalJSON.phetioSimsDirectory,
        pgConnectionString: buildLocalJSON.pgConnectionString,
        productionServerURL: buildLocalJSON.productionServerURL || 'https://phet.colorado.edu',
        serverToken: buildLocalJSON.serverToken,
        verbose: buildLocalJSON.verbose || buildLocalJSON.verbose === 'true'
    };
}
module.exports = getDeployConfig;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvZ2V0QnVpbGRTZXJ2ZXJDb25maWcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMDItMjAxNSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cblxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcblxuLyoqXG4gKiBHZXRzIGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24gdGhhdCBpcyByZWxhdGVkIHRvIGRlcGxveWluZyBzaW1zLlxuICpcbiAqIEFsbCBmaWVsZHMgYXJlIEBwdWJsaWMgKHJlYWQtb25seSkuXG4gKiBGaWVsZHMgaW5jbHVkZTpcbiAqXG4gKiBSZXF1aXJlZDpcbiAqIHtzdHJpbmd9IGJ1aWxkU2VydmVyQXV0aG9yaXphdGlvbkNvZGUgLSBwYXNzd29yZCB0aGF0IHZlcmlmaWVzIGlmIGJ1aWxkIHJlcXVlc3QgY29tZXMgZnJvbSBwaGV0IHRlYW0gbWVtYmVyc1xuICoge3N0cmluZ30gZGV2VXNlcm5hbWUgLSB1c2VybmFtZSBvbiBvdXIgZGV2IHNlcnZlclxuICpcbiAqIE9wdGlvbmFsOlxuICoge3N0cmluZ30gZGV2RGVwbG95U2VydmVyIC0gbmFtZSBvZiB0aGUgZGV2IHNlcnZlciwgZGVmYXVsdHMgdG8gJ2JheWVzLmNvbG9yYWRvLmVkdSdcbiAqIHtzdHJpbmd9IGRldkRlcGxveVBhdGggLSBwYXRoIG9uIGRldiBzZXJ2ZXIgdG8gZGVwbG95IHRvLCBkZWZhdWx0cyB0byAnL2RhdGEvd2ViL2h0ZG9jcy9kZXYvaHRtbC8nXG4gKiB7c3RyaW5nfSBwcm9kdWN0aW9uU2VydmVyVVJMIC0gcHJvZHVjdGlvbiBzZXJ2ZXIgdXJsLCBkZWZhdWx0cyB0byAnaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdScsIGNhbiBiZSBvdmVyLXJpZGRlbiB0byAnaHR0cHM6Ly9waGV0LWRldi5jb2xvcmFkby5lZHUnXG4gKlxuICogSW5jbHVkZSB0aGVzZSBmaWVsZHMgaW4gYnVpbGQtbG9jYWwuanNvbiB0byBlbmFibGUgc2VuZGluZyBlbWFpbHMgZnJvbSBidWlsZC1zZXJ2ZXIgb24gYnVpbGQgZmFpbHVyZS5cbiAqIFRoZXkgYXJlIG9ubHkgbmVlZGVkIG9uIHRoZSBwcm9kdWN0aW9uIHNlcnZlciwgbm90IGxvY2FsbHkuIEEgdmFsaWQgZW1haWxVc2VybmFtZSBhbmQgZW1haWxQYXNzd29yZCBhcmUgbmVlZGVkIHRvIGF1dGhlbnRpY2F0ZVxuICogc2VuZGluZyBtYWlsIGZyb20gdGhlIHNtdHAgc2VydmVyLCB0aG91Z2ggdGhlIGFjdHVhbCBlbWFpbHMgd2lsbCBiZSBzZW50IGZyb20gJ1BoRVQgQnVpbGQgU2VydmVyIDxwaGV0aGVscEBjb2xvcmFkby5lZHU+JyxcbiAqIG5vdCBmcm9tIHRoZSBhZGRyZXNzIHlvdSBwdXQgaGVyZS5cbiAqIHtzdHJpbmd9IGVtYWlsVXNlcm5hbWUgLSBlLmcuIFwiW2lkZW50aWtleV1AY29sb3JhZG8uZWR1XCJcbiAqIHtzdHJpbmd9IGVtYWlsUGFzc3dvcmRcbiAqIHtzdHJpbmd9IGVtYWlsU2VydmVyIC0gKG9wdGlvbmFsOiBkZWZhdWx0cyB0byBcInNtdHAuY29sb3JhZG8uZWR1XCIpXG4gKiB7c3RyaW5nfSBlbWFpbFRvIC0gZS5nLiBcIk1lIDxbaWRlbnRpa2V5XUBjb2xvcmFkby5lZHU+LCBBbm90aGVyIFBlcnNvbiA8cGVyc29uQGV4YW1wbGUuY29tPlwiXG4gKlxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcbiAqIEBhdXRob3IgQWFyb24gRGF2aXNcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSBmcyAtIHRoZSBub2RlIGZzIEFQSVxuICogQHJldHVybnMge09iamVjdH0gZGVwbG95IGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24sIGZpZWxkcyBkb2N1bWVudGVkIGFib3ZlXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZ2V0RGVwbG95Q29uZmlnKCBmcyApIHtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyByZWFkIGNvbmZpZ3VyYXRpb24gZmlsZVxuICBjb25zdCBCVUlMRF9MT0NBTF9GSUxFTkFNRSA9IGAke3Byb2Nlc3MuZW52LkhPTUV9Ly5waGV0L2J1aWxkLWxvY2FsLmpzb25gO1xuICBjb25zdCBidWlsZExvY2FsSlNPTiA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggQlVJTERfTE9DQUxfRklMRU5BTUUsIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSApICk7XG4gIGFzc2VydCggYnVpbGRMb2NhbEpTT04uYnVpbGRTZXJ2ZXJBdXRob3JpemF0aW9uQ29kZSwgYGJ1aWxkU2VydmVyQXV0aG9yaXphdGlvbkNvZGUgbWlzc2luZyBmcm9tICR7QlVJTERfTE9DQUxfRklMRU5BTUV9YCApO1xuICBhc3NlcnQoIGJ1aWxkTG9jYWxKU09OLmRldlVzZXJuYW1lLCBgZGV2VXNlcm5hbWUgbWlzc2luZyBmcm9tICR7QlVJTERfTE9DQUxfRklMRU5BTUV9YCApO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEFzc2VtYmxlIHRoZSBkZXBsb3lDb25maWdcblxuICByZXR1cm4ge1xuICAgIGJhYmVsQnJhbmNoOiBidWlsZExvY2FsSlNPTi5iYWJlbEJyYW5jaCB8fCAnbWFpbicsXG4gICAgYnVpbGRTZXJ2ZXJBdXRob3JpemF0aW9uQ29kZTogYnVpbGRMb2NhbEpTT04uYnVpbGRTZXJ2ZXJBdXRob3JpemF0aW9uQ29kZSxcbiAgICBkYXRhYmFzZUF1dGhvcml6YXRpb25Db2RlOiBidWlsZExvY2FsSlNPTi5kYXRhYmFzZUF1dGhvcml6YXRpb25Db2RlLFxuICAgIGRldkRlcGxveVBhdGg6IGJ1aWxkTG9jYWxKU09OLmRldkRlcGxveVBhdGggfHwgJy9kYXRhL3dlYi9odGRvY3MvZGV2L2h0bWwvJyxcbiAgICBkZXZEZXBsb3lTZXJ2ZXI6IGJ1aWxkTG9jYWxKU09OLmRldkRlcGxveVNlcnZlciB8fCAnYmF5ZXMuY29sb3JhZG8uZWR1JyxcbiAgICBkZXZVc2VybmFtZTogYnVpbGRMb2NhbEpTT04uZGV2VXNlcm5hbWUsXG4gICAgZW1haWxQYXNzd29yZDogYnVpbGRMb2NhbEpTT04uZW1haWxQYXNzd29yZCxcbiAgICBlbWFpbFNlcnZlcjogYnVpbGRMb2NhbEpTT04uZW1haWxTZXJ2ZXIgfHwgJ3NtdHAub2ZmaWNlMzY1LmNvbScsXG4gICAgZW1haWxUbzogYnVpbGRMb2NhbEpTT04uZW1haWxUbyxcbiAgICBlbWFpbFVzZXJuYW1lOiBidWlsZExvY2FsSlNPTi5lbWFpbFVzZXJuYW1lLFxuICAgIGh0bWxTaW1zRGlyZWN0b3J5OiBidWlsZExvY2FsSlNPTi5odG1sU2ltc0RpcmVjdG9yeSxcbiAgICBwaGV0aW9TaW1zRGlyZWN0b3J5OiBidWlsZExvY2FsSlNPTi5waGV0aW9TaW1zRGlyZWN0b3J5LFxuICAgIHBnQ29ubmVjdGlvblN0cmluZzogYnVpbGRMb2NhbEpTT04ucGdDb25uZWN0aW9uU3RyaW5nLFxuICAgIHByb2R1Y3Rpb25TZXJ2ZXJVUkw6IGJ1aWxkTG9jYWxKU09OLnByb2R1Y3Rpb25TZXJ2ZXJVUkwgfHwgJ2h0dHBzOi8vcGhldC5jb2xvcmFkby5lZHUnLFxuICAgIHNlcnZlclRva2VuOiBidWlsZExvY2FsSlNPTi5zZXJ2ZXJUb2tlbixcbiAgICB2ZXJib3NlOiBidWlsZExvY2FsSlNPTi52ZXJib3NlIHx8IGJ1aWxkTG9jYWxKU09OLnZlcmJvc2UgPT09ICd0cnVlJ1xuICB9O1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0RGVwbG95Q29uZmlnOyJdLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiZ2V0RGVwbG95Q29uZmlnIiwiZnMiLCJCVUlMRF9MT0NBTF9GSUxFTkFNRSIsInByb2Nlc3MiLCJlbnYiLCJIT01FIiwiYnVpbGRMb2NhbEpTT04iLCJKU09OIiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiLCJlbmNvZGluZyIsImJ1aWxkU2VydmVyQXV0aG9yaXphdGlvbkNvZGUiLCJkZXZVc2VybmFtZSIsImJhYmVsQnJhbmNoIiwiZGF0YWJhc2VBdXRob3JpemF0aW9uQ29kZSIsImRldkRlcGxveVBhdGgiLCJkZXZEZXBsb3lTZXJ2ZXIiLCJlbWFpbFBhc3N3b3JkIiwiZW1haWxTZXJ2ZXIiLCJlbWFpbFRvIiwiZW1haWxVc2VybmFtZSIsImh0bWxTaW1zRGlyZWN0b3J5IiwicGhldGlvU2ltc0RpcmVjdG9yeSIsInBnQ29ubmVjdGlvblN0cmluZyIsInByb2R1Y3Rpb25TZXJ2ZXJVUkwiLCJzZXJ2ZXJUb2tlbiIsInZlcmJvc2UiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFHdEQsTUFBTUEsU0FBU0MsUUFBUztBQUV4Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwQkMsR0FFRDs7Ozs7Q0FLQyxHQUNELFNBQVNDLGdCQUFpQkMsRUFBRTtJQUUxQixzRkFBc0Y7SUFDdEYsMEJBQTBCO0lBQzFCLE1BQU1DLHVCQUF1QixHQUFHQyxRQUFRQyxHQUFHLENBQUNDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQztJQUN6RSxNQUFNQyxpQkFBaUJDLEtBQUtDLEtBQUssQ0FBRVAsR0FBR1EsWUFBWSxDQUFFUCxzQkFBc0I7UUFBRVEsVUFBVTtJQUFRO0lBQzlGWixPQUFRUSxlQUFlSyw0QkFBNEIsRUFBRSxDQUFDLDBDQUEwQyxFQUFFVCxzQkFBc0I7SUFDeEhKLE9BQVFRLGVBQWVNLFdBQVcsRUFBRSxDQUFDLHlCQUF5QixFQUFFVixzQkFBc0I7SUFFdEYsc0ZBQXNGO0lBQ3RGLDRCQUE0QjtJQUU1QixPQUFPO1FBQ0xXLGFBQWFQLGVBQWVPLFdBQVcsSUFBSTtRQUMzQ0YsOEJBQThCTCxlQUFlSyw0QkFBNEI7UUFDekVHLDJCQUEyQlIsZUFBZVEseUJBQXlCO1FBQ25FQyxlQUFlVCxlQUFlUyxhQUFhLElBQUk7UUFDL0NDLGlCQUFpQlYsZUFBZVUsZUFBZSxJQUFJO1FBQ25ESixhQUFhTixlQUFlTSxXQUFXO1FBQ3ZDSyxlQUFlWCxlQUFlVyxhQUFhO1FBQzNDQyxhQUFhWixlQUFlWSxXQUFXLElBQUk7UUFDM0NDLFNBQVNiLGVBQWVhLE9BQU87UUFDL0JDLGVBQWVkLGVBQWVjLGFBQWE7UUFDM0NDLG1CQUFtQmYsZUFBZWUsaUJBQWlCO1FBQ25EQyxxQkFBcUJoQixlQUFlZ0IsbUJBQW1CO1FBQ3ZEQyxvQkFBb0JqQixlQUFlaUIsa0JBQWtCO1FBQ3JEQyxxQkFBcUJsQixlQUFla0IsbUJBQW1CLElBQUk7UUFDM0RDLGFBQWFuQixlQUFlbUIsV0FBVztRQUN2Q0MsU0FBU3BCLGVBQWVvQixPQUFPLElBQUlwQixlQUFlb0IsT0FBTyxLQUFLO0lBQ2hFO0FBRUY7QUFFQUMsT0FBT0MsT0FBTyxHQUFHNUIifQ==