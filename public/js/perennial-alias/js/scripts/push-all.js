// Copyright 2021-2026, University of Colorado Boulder
/**
 * Rebases and pushes repos that are ahead of origin, with consolidated status/error output.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('../common/execute').default;
const getRepoList = require('../common/getRepoList');
const gitIsClean = require('../common/gitIsClean');
const gitPullRebase = require('../common/gitPullRebase');
const gitPush = require('../common/gitPush');
const winston = require('winston');
const { getOption } = require('../grunt/tasks/util/getOption');
// Change directory to top level of this repo
process.chdir(`${__dirname}/../../`);
winston.default.transports.console.level = 'error';
// ANSI escape sequences to move to the right (in the same line) or to apply or reset colors
const red = '\u001b[31m';
const green = '\u001b[32m';
const reset = '\u001b[0m';
const repoList = getOption('repoList') || 'active-repos';
const ignorePull = getOption('noPull');
const repos = getRepoList(repoList);
const data = {};
let ok = true;
const pushAll = async (repo)=>{
    data[repo] = '';
    try {
        const symbolicRef = (await execute('git', [
            'symbolic-ref',
            '-q',
            'HEAD'
        ], `../${repo}`)).trim();
        const branch = symbolicRef.replace('refs/heads/', '');
        const trackShort = branch ? (await execute('git', [
            'for-each-ref',
            '--format=%(push:trackshort)',
            symbolicRef
        ], `../${repo}`)).trim() : '';
        // If it's ahead at all
        if (trackShort.includes('>')) {
            if (await gitIsClean(repo)) {
                !ignorePull && await gitPullRebase(repo);
            } else {
                data[repo] += `${red}${repo} not clean, skipping pull${reset}\n`;
            }
            if (branch) {
                await gitPush(repo, branch);
                data[repo] += `${green}${repo} pushed\n`;
            } else {
                data[repo] += `${red}${repo} no branch, skipping push${reset}\n`;
                ok = false;
            }
        }
    } catch (e) {
        data[repo] += `${repo} ERROR: ${e}\n`;
        ok = false;
    }
};
(async ()=>{
    await Promise.all(repos.map((repo)=>pushAll(repo)));
    repos.forEach((repo)=>{
        process.stdout.write(data[repo]);
    });
    console.log(`\n${ok ? green : red}-----=====] finished [=====-----${reset}\n`);
})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL3B1c2gtYWxsLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIFJlYmFzZXMgYW5kIHB1c2hlcyByZXBvcyB0aGF0IGFyZSBhaGVhZCBvZiBvcmlnaW4sIHdpdGggY29uc29saWRhdGVkIHN0YXR1cy9lcnJvciBvdXRwdXQuXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4uL2NvbW1vbi9leGVjdXRlJyApLmRlZmF1bHQ7XG5jb25zdCBnZXRSZXBvTGlzdCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2V0UmVwb0xpc3QnICk7XG5jb25zdCBnaXRJc0NsZWFuID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRJc0NsZWFuJyApO1xuY29uc3QgZ2l0UHVsbFJlYmFzZSA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0UHVsbFJlYmFzZScgKTtcbmNvbnN0IGdpdFB1c2ggPSByZXF1aXJlKCAnLi4vY29tbW9uL2dpdFB1c2gnICk7XG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XG5jb25zdCB7IGdldE9wdGlvbiB9ID0gcmVxdWlyZSggJy4uL2dydW50L3Rhc2tzL3V0aWwvZ2V0T3B0aW9uJyApO1xuXG4vLyBDaGFuZ2UgZGlyZWN0b3J5IHRvIHRvcCBsZXZlbCBvZiB0aGlzIHJlcG9cbnByb2Nlc3MuY2hkaXIoIGAke19fZGlybmFtZX0vLi4vLi4vYCApO1xuXG53aW5zdG9uLmRlZmF1bHQudHJhbnNwb3J0cy5jb25zb2xlLmxldmVsID0gJ2Vycm9yJztcblxuLy8gQU5TSSBlc2NhcGUgc2VxdWVuY2VzIHRvIG1vdmUgdG8gdGhlIHJpZ2h0IChpbiB0aGUgc2FtZSBsaW5lKSBvciB0byBhcHBseSBvciByZXNldCBjb2xvcnNcbmNvbnN0IHJlZCA9ICdcXHUwMDFiWzMxbSc7XG5jb25zdCBncmVlbiA9ICdcXHUwMDFiWzMybSc7XG5jb25zdCByZXNldCA9ICdcXHUwMDFiWzBtJztcblxuY29uc3QgcmVwb0xpc3QgPSBnZXRPcHRpb24oICdyZXBvTGlzdCcgKSB8fCAnYWN0aXZlLXJlcG9zJztcbmNvbnN0IGlnbm9yZVB1bGwgPSBnZXRPcHRpb24oICdub1B1bGwnICk7XG5cbmNvbnN0IHJlcG9zID0gZ2V0UmVwb0xpc3QoIHJlcG9MaXN0ICk7XG5jb25zdCBkYXRhID0ge307XG5sZXQgb2sgPSB0cnVlO1xuXG5jb25zdCBwdXNoQWxsID0gYXN5bmMgcmVwbyA9PiB7XG4gIGRhdGFbIHJlcG8gXSA9ICcnO1xuXG4gIHRyeSB7XG4gICAgY29uc3Qgc3ltYm9saWNSZWYgPSAoIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdzeW1ib2xpYy1yZWYnLCAnLXEnLCAnSEVBRCcgXSwgYC4uLyR7cmVwb31gICkgKS50cmltKCk7XG4gICAgY29uc3QgYnJhbmNoID0gc3ltYm9saWNSZWYucmVwbGFjZSggJ3JlZnMvaGVhZHMvJywgJycgKTtcbiAgICBjb25zdCB0cmFja1Nob3J0ID0gYnJhbmNoID8gKCBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnZm9yLWVhY2gtcmVmJywgJy0tZm9ybWF0PSUocHVzaDp0cmFja3Nob3J0KScsIHN5bWJvbGljUmVmIF0sIGAuLi8ke3JlcG99YCApICkudHJpbSgpIDogJyc7XG5cbiAgICAvLyBJZiBpdCdzIGFoZWFkIGF0IGFsbFxuICAgIGlmICggdHJhY2tTaG9ydC5pbmNsdWRlcyggJz4nICkgKSB7XG4gICAgICBpZiAoIGF3YWl0IGdpdElzQ2xlYW4oIHJlcG8gKSApIHtcbiAgICAgICAgIWlnbm9yZVB1bGwgJiYgYXdhaXQgZ2l0UHVsbFJlYmFzZSggcmVwbyApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGRhdGFbIHJlcG8gXSArPSBgJHtyZWR9JHtyZXBvfSBub3QgY2xlYW4sIHNraXBwaW5nIHB1bGwke3Jlc2V0fVxcbmA7XG4gICAgICB9XG5cbiAgICAgIGlmICggYnJhbmNoICkge1xuICAgICAgICBhd2FpdCBnaXRQdXNoKCByZXBvLCBicmFuY2ggKTtcbiAgICAgICAgZGF0YVsgcmVwbyBdICs9IGAke2dyZWVufSR7cmVwb30gcHVzaGVkXFxuYDtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBkYXRhWyByZXBvIF0gKz0gYCR7cmVkfSR7cmVwb30gbm8gYnJhbmNoLCBza2lwcGluZyBwdXNoJHtyZXNldH1cXG5gO1xuICAgICAgICBvayA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBjYXRjaCggZSApIHtcbiAgICBkYXRhWyByZXBvIF0gKz0gYCR7cmVwb30gRVJST1I6ICR7ZX1cXG5gO1xuICAgIG9rID0gZmFsc2U7XG4gIH1cbn07XG5cbiggYXN5bmMgKCkgPT4ge1xuICBhd2FpdCBQcm9taXNlLmFsbCggcmVwb3MubWFwKCByZXBvID0+IHB1c2hBbGwoIHJlcG8gKSApICk7XG5cbiAgcmVwb3MuZm9yRWFjaCggcmVwbyA9PiB7XG4gICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoIGRhdGFbIHJlcG8gXSApO1xuICB9ICk7XG5cbiAgY29uc29sZS5sb2coIGBcXG4ke29rID8gZ3JlZW4gOiByZWR9LS0tLS09PT09PV0gZmluaXNoZWQgWz09PT09LS0tLS0ke3Jlc2V0fVxcbmAgKTtcbn0gKSgpOyJdLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImRlZmF1bHQiLCJnZXRSZXBvTGlzdCIsImdpdElzQ2xlYW4iLCJnaXRQdWxsUmViYXNlIiwiZ2l0UHVzaCIsIndpbnN0b24iLCJnZXRPcHRpb24iLCJwcm9jZXNzIiwiY2hkaXIiLCJfX2Rpcm5hbWUiLCJ0cmFuc3BvcnRzIiwiY29uc29sZSIsImxldmVsIiwicmVkIiwiZ3JlZW4iLCJyZXNldCIsInJlcG9MaXN0IiwiaWdub3JlUHVsbCIsInJlcG9zIiwiZGF0YSIsIm9rIiwicHVzaEFsbCIsInJlcG8iLCJzeW1ib2xpY1JlZiIsInRyaW0iLCJicmFuY2giLCJyZXBsYWNlIiwidHJhY2tTaG9ydCIsImluY2x1ZGVzIiwiZSIsIlByb21pc2UiLCJhbGwiLCJtYXAiLCJmb3JFYWNoIiwic3Rkb3V0Iiwid3JpdGUiLCJsb2ciXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7OztDQUlDLEdBRUQsTUFBTUEsVUFBVUMsUUFBUyxxQkFBc0JDLE9BQU87QUFDdEQsTUFBTUMsY0FBY0YsUUFBUztBQUM3QixNQUFNRyxhQUFhSCxRQUFTO0FBQzVCLE1BQU1JLGdCQUFnQkosUUFBUztBQUMvQixNQUFNSyxVQUFVTCxRQUFTO0FBQ3pCLE1BQU1NLFVBQVVOLFFBQVM7QUFDekIsTUFBTSxFQUFFTyxTQUFTLEVBQUUsR0FBR1AsUUFBUztBQUUvQiw2Q0FBNkM7QUFDN0NRLFFBQVFDLEtBQUssQ0FBRSxHQUFHQyxVQUFVLE9BQU8sQ0FBQztBQUVwQ0osUUFBUUwsT0FBTyxDQUFDVSxVQUFVLENBQUNDLE9BQU8sQ0FBQ0MsS0FBSyxHQUFHO0FBRTNDLDRGQUE0RjtBQUM1RixNQUFNQyxNQUFNO0FBQ1osTUFBTUMsUUFBUTtBQUNkLE1BQU1DLFFBQVE7QUFFZCxNQUFNQyxXQUFXVixVQUFXLGVBQWdCO0FBQzVDLE1BQU1XLGFBQWFYLFVBQVc7QUFFOUIsTUFBTVksUUFBUWpCLFlBQWFlO0FBQzNCLE1BQU1HLE9BQU8sQ0FBQztBQUNkLElBQUlDLEtBQUs7QUFFVCxNQUFNQyxVQUFVLE9BQU1DO0lBQ3BCSCxJQUFJLENBQUVHLEtBQU0sR0FBRztJQUVmLElBQUk7UUFDRixNQUFNQyxjQUFjLEFBQUUsQ0FBQSxNQUFNekIsUUFBUyxPQUFPO1lBQUU7WUFBZ0I7WUFBTTtTQUFRLEVBQUUsQ0FBQyxHQUFHLEVBQUV3QixNQUFNLENBQUMsRUFBSUUsSUFBSTtRQUNuRyxNQUFNQyxTQUFTRixZQUFZRyxPQUFPLENBQUUsZUFBZTtRQUNuRCxNQUFNQyxhQUFhRixTQUFTLEFBQUUsQ0FBQSxNQUFNM0IsUUFBUyxPQUFPO1lBQUU7WUFBZ0I7WUFBK0J5QjtTQUFhLEVBQUUsQ0FBQyxHQUFHLEVBQUVELE1BQU0sQ0FBQyxFQUFJRSxJQUFJLEtBQUs7UUFFOUksdUJBQXVCO1FBQ3ZCLElBQUtHLFdBQVdDLFFBQVEsQ0FBRSxNQUFRO1lBQ2hDLElBQUssTUFBTTFCLFdBQVlvQixPQUFTO2dCQUM5QixDQUFDTCxjQUFjLE1BQU1kLGNBQWVtQjtZQUN0QyxPQUNLO2dCQUNISCxJQUFJLENBQUVHLEtBQU0sSUFBSSxHQUFHVCxNQUFNUyxLQUFLLHlCQUF5QixFQUFFUCxNQUFNLEVBQUUsQ0FBQztZQUNwRTtZQUVBLElBQUtVLFFBQVM7Z0JBQ1osTUFBTXJCLFFBQVNrQixNQUFNRztnQkFDckJOLElBQUksQ0FBRUcsS0FBTSxJQUFJLEdBQUdSLFFBQVFRLEtBQUssU0FBUyxDQUFDO1lBQzVDLE9BQ0s7Z0JBQ0hILElBQUksQ0FBRUcsS0FBTSxJQUFJLEdBQUdULE1BQU1TLEtBQUsseUJBQXlCLEVBQUVQLE1BQU0sRUFBRSxDQUFDO2dCQUNsRUssS0FBSztZQUNQO1FBQ0Y7SUFDRixFQUNBLE9BQU9TLEdBQUk7UUFDVFYsSUFBSSxDQUFFRyxLQUFNLElBQUksR0FBR0EsS0FBSyxRQUFRLEVBQUVPLEVBQUUsRUFBRSxDQUFDO1FBQ3ZDVCxLQUFLO0lBQ1A7QUFDRjtBQUVFLENBQUE7SUFDQSxNQUFNVSxRQUFRQyxHQUFHLENBQUViLE1BQU1jLEdBQUcsQ0FBRVYsQ0FBQUEsT0FBUUQsUUFBU0M7SUFFL0NKLE1BQU1lLE9BQU8sQ0FBRVgsQ0FBQUE7UUFDYmYsUUFBUTJCLE1BQU0sQ0FBQ0MsS0FBSyxDQUFFaEIsSUFBSSxDQUFFRyxLQUFNO0lBQ3BDO0lBRUFYLFFBQVF5QixHQUFHLENBQUUsQ0FBQyxFQUFFLEVBQUVoQixLQUFLTixRQUFRRCxJQUFJLGdDQUFnQyxFQUFFRSxNQUFNLEVBQUUsQ0FBQztBQUNoRixDQUFBIn0=