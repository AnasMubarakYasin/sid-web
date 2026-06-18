// Copyright 2021-2026, University of Colorado Boulder
/**
 * A fast-running status check. NOTE: Only checks the local status, does NOT check the server. Use the full status for
 * that if needed.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('../common/execute').default;
const getActiveRepos = require('../common/getActiveRepos');
const gitRevParse = require('../common/gitRevParse');
const winston = require('winston');
winston.default.transports.console.level = 'error';
// ANSI escape sequences to move to the right (in the same line) or to apply or reset colors
const moveRight = ' \u001b[42G';
const red = '\u001b[31m';
const green = '\u001b[32m';
const reset = '\u001b[0m';
const repos = getActiveRepos();
const data = {};
const getStatus = async (repo)=>{
    data[repo] = '';
    const symbolicRef = (await execute('git', [
        'symbolic-ref',
        '-q',
        'HEAD'
    ], `../${repo}`)).trim();
    const branch = symbolicRef.replace('refs/heads/', ''); // might be empty string
    const sha = await gitRevParse(repo, 'HEAD');
    const status = await execute('git', [
        'status',
        '--porcelain'
    ], `../${repo}`);
    const track = branch ? (await execute('git', [
        'for-each-ref',
        '--format=%(push:track,nobracket)',
        symbolicRef
    ], `../${repo}`)).trim() : '';
    let isGreen = false;
    if (branch) {
        isGreen = !status && branch === 'main' && !track.length;
        if (!isGreen || process.argv.includes('--all')) {
            data[repo] += `${repo}${moveRight}${isGreen ? green : red}${branch}${reset} ${track}\n`;
        }
    } else {
        // if no branch, print our SHA (detached head)
        data[repo] += `${repo}${moveRight}${red}${sha}${reset}\n`;
    }
    if (status) {
        if (!isGreen || process.argv.includes('--all')) {
            data[repo] += status + '\n';
        }
    }
};
(async ()=>{
    await Promise.all(repos.map((repo)=>getStatus(repo)));
    repos.forEach((repo)=>{
        process.stdout.write(data[repo]);
    });
})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL3F1aWNrLXN0YXR1cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBBIGZhc3QtcnVubmluZyBzdGF0dXMgY2hlY2suIE5PVEU6IE9ubHkgY2hlY2tzIHRoZSBsb2NhbCBzdGF0dXMsIGRvZXMgTk9UIGNoZWNrIHRoZSBzZXJ2ZXIuIFVzZSB0aGUgZnVsbCBzdGF0dXMgZm9yXG4gKiB0aGF0IGlmIG5lZWRlZC5cbiAqXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICovXG5cbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi4vY29tbW9uL2V4ZWN1dGUnICkuZGVmYXVsdDtcbmNvbnN0IGdldEFjdGl2ZVJlcG9zID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXRBY3RpdmVSZXBvcycgKTtcbmNvbnN0IGdpdFJldlBhcnNlID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRSZXZQYXJzZScgKTtcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcblxud2luc3Rvbi5kZWZhdWx0LnRyYW5zcG9ydHMuY29uc29sZS5sZXZlbCA9ICdlcnJvcic7XG5cbi8vIEFOU0kgZXNjYXBlIHNlcXVlbmNlcyB0byBtb3ZlIHRvIHRoZSByaWdodCAoaW4gdGhlIHNhbWUgbGluZSkgb3IgdG8gYXBwbHkgb3IgcmVzZXQgY29sb3JzXG5jb25zdCBtb3ZlUmlnaHQgPSAnIFxcdTAwMWJbNDJHJztcbmNvbnN0IHJlZCA9ICdcXHUwMDFiWzMxbSc7XG5jb25zdCBncmVlbiA9ICdcXHUwMDFiWzMybSc7XG5jb25zdCByZXNldCA9ICdcXHUwMDFiWzBtJztcblxuY29uc3QgcmVwb3MgPSBnZXRBY3RpdmVSZXBvcygpO1xuY29uc3QgZGF0YSA9IHt9O1xuXG5jb25zdCBnZXRTdGF0dXMgPSBhc3luYyByZXBvID0+IHtcbiAgZGF0YVsgcmVwbyBdID0gJyc7XG5cbiAgY29uc3Qgc3ltYm9saWNSZWYgPSAoIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdzeW1ib2xpYy1yZWYnLCAnLXEnLCAnSEVBRCcgXSwgYC4uLyR7cmVwb31gICkgKS50cmltKCk7XG4gIGNvbnN0IGJyYW5jaCA9IHN5bWJvbGljUmVmLnJlcGxhY2UoICdyZWZzL2hlYWRzLycsICcnICk7IC8vIG1pZ2h0IGJlIGVtcHR5IHN0cmluZ1xuICBjb25zdCBzaGEgPSBhd2FpdCBnaXRSZXZQYXJzZSggcmVwbywgJ0hFQUQnICk7XG4gIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdzdGF0dXMnLCAnLS1wb3JjZWxhaW4nIF0sIGAuLi8ke3JlcG99YCApO1xuICBjb25zdCB0cmFjayA9IGJyYW5jaCA/ICggYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFsgJ2Zvci1lYWNoLXJlZicsICctLWZvcm1hdD0lKHB1c2g6dHJhY2ssbm9icmFja2V0KScsIHN5bWJvbGljUmVmIF0sIGAuLi8ke3JlcG99YCApICkudHJpbSgpIDogJyc7XG5cbiAgbGV0IGlzR3JlZW4gPSBmYWxzZTtcbiAgaWYgKCBicmFuY2ggKSB7XG4gICAgaXNHcmVlbiA9ICFzdGF0dXMgJiYgYnJhbmNoID09PSAnbWFpbicgJiYgIXRyYWNrLmxlbmd0aDtcblxuICAgIGlmICggIWlzR3JlZW4gfHwgcHJvY2Vzcy5hcmd2LmluY2x1ZGVzKCAnLS1hbGwnICkgKSB7XG4gICAgICBkYXRhWyByZXBvIF0gKz0gYCR7cmVwb30ke21vdmVSaWdodH0ke2lzR3JlZW4gPyBncmVlbiA6IHJlZH0ke2JyYW5jaH0ke3Jlc2V0fSAke3RyYWNrfVxcbmA7XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIC8vIGlmIG5vIGJyYW5jaCwgcHJpbnQgb3VyIFNIQSAoZGV0YWNoZWQgaGVhZClcbiAgICBkYXRhWyByZXBvIF0gKz0gYCR7cmVwb30ke21vdmVSaWdodH0ke3JlZH0ke3NoYX0ke3Jlc2V0fVxcbmA7XG4gIH1cblxuICBpZiAoIHN0YXR1cyApIHtcbiAgICBpZiAoICFpc0dyZWVuIHx8IHByb2Nlc3MuYXJndi5pbmNsdWRlcyggJy0tYWxsJyApICkge1xuICAgICAgZGF0YVsgcmVwbyBdICs9IHN0YXR1cyArICdcXG4nO1xuICAgIH1cbiAgfVxufTtcblxuKCBhc3luYyAoKSA9PiB7XG4gIGF3YWl0IFByb21pc2UuYWxsKCByZXBvcy5tYXAoIHJlcG8gPT4gZ2V0U3RhdHVzKCByZXBvICkgKSApO1xuICByZXBvcy5mb3JFYWNoKCByZXBvID0+IHtcbiAgICBwcm9jZXNzLnN0ZG91dC53cml0ZSggZGF0YVsgcmVwbyBdICk7XG4gIH0gKTtcbn0gKSgpOyJdLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImRlZmF1bHQiLCJnZXRBY3RpdmVSZXBvcyIsImdpdFJldlBhcnNlIiwid2luc3RvbiIsInRyYW5zcG9ydHMiLCJjb25zb2xlIiwibGV2ZWwiLCJtb3ZlUmlnaHQiLCJyZWQiLCJncmVlbiIsInJlc2V0IiwicmVwb3MiLCJkYXRhIiwiZ2V0U3RhdHVzIiwicmVwbyIsInN5bWJvbGljUmVmIiwidHJpbSIsImJyYW5jaCIsInJlcGxhY2UiLCJzaGEiLCJzdGF0dXMiLCJ0cmFjayIsImlzR3JlZW4iLCJsZW5ndGgiLCJwcm9jZXNzIiwiYXJndiIsImluY2x1ZGVzIiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsImZvckVhY2giLCJzdGRvdXQiLCJ3cml0ZSJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7OztDQUtDLEdBRUQsTUFBTUEsVUFBVUMsUUFBUyxxQkFBc0JDLE9BQU87QUFDdEQsTUFBTUMsaUJBQWlCRixRQUFTO0FBQ2hDLE1BQU1HLGNBQWNILFFBQVM7QUFDN0IsTUFBTUksVUFBVUosUUFBUztBQUV6QkksUUFBUUgsT0FBTyxDQUFDSSxVQUFVLENBQUNDLE9BQU8sQ0FBQ0MsS0FBSyxHQUFHO0FBRTNDLDRGQUE0RjtBQUM1RixNQUFNQyxZQUFZO0FBQ2xCLE1BQU1DLE1BQU07QUFDWixNQUFNQyxRQUFRO0FBQ2QsTUFBTUMsUUFBUTtBQUVkLE1BQU1DLFFBQVFWO0FBQ2QsTUFBTVcsT0FBTyxDQUFDO0FBRWQsTUFBTUMsWUFBWSxPQUFNQztJQUN0QkYsSUFBSSxDQUFFRSxLQUFNLEdBQUc7SUFFZixNQUFNQyxjQUFjLEFBQUUsQ0FBQSxNQUFNakIsUUFBUyxPQUFPO1FBQUU7UUFBZ0I7UUFBTTtLQUFRLEVBQUUsQ0FBQyxHQUFHLEVBQUVnQixNQUFNLENBQUMsRUFBSUUsSUFBSTtJQUNuRyxNQUFNQyxTQUFTRixZQUFZRyxPQUFPLENBQUUsZUFBZSxLQUFNLHdCQUF3QjtJQUNqRixNQUFNQyxNQUFNLE1BQU1qQixZQUFhWSxNQUFNO0lBQ3JDLE1BQU1NLFNBQVMsTUFBTXRCLFFBQVMsT0FBTztRQUFFO1FBQVU7S0FBZSxFQUFFLENBQUMsR0FBRyxFQUFFZ0IsTUFBTTtJQUM5RSxNQUFNTyxRQUFRSixTQUFTLEFBQUUsQ0FBQSxNQUFNbkIsUUFBUyxPQUFPO1FBQUU7UUFBZ0I7UUFBb0NpQjtLQUFhLEVBQUUsQ0FBQyxHQUFHLEVBQUVELE1BQU0sQ0FBQyxFQUFJRSxJQUFJLEtBQUs7SUFFOUksSUFBSU0sVUFBVTtJQUNkLElBQUtMLFFBQVM7UUFDWkssVUFBVSxDQUFDRixVQUFVSCxXQUFXLFVBQVUsQ0FBQ0ksTUFBTUUsTUFBTTtRQUV2RCxJQUFLLENBQUNELFdBQVdFLFFBQVFDLElBQUksQ0FBQ0MsUUFBUSxDQUFFLFVBQVk7WUFDbERkLElBQUksQ0FBRUUsS0FBTSxJQUFJLEdBQUdBLE9BQU9QLFlBQVllLFVBQVViLFFBQVFELE1BQU1TLFNBQVNQLE1BQU0sQ0FBQyxFQUFFVyxNQUFNLEVBQUUsQ0FBQztRQUMzRjtJQUNGLE9BQ0s7UUFDSCw4Q0FBOEM7UUFDOUNULElBQUksQ0FBRUUsS0FBTSxJQUFJLEdBQUdBLE9BQU9QLFlBQVlDLE1BQU1XLE1BQU1ULE1BQU0sRUFBRSxDQUFDO0lBQzdEO0lBRUEsSUFBS1UsUUFBUztRQUNaLElBQUssQ0FBQ0UsV0FBV0UsUUFBUUMsSUFBSSxDQUFDQyxRQUFRLENBQUUsVUFBWTtZQUNsRGQsSUFBSSxDQUFFRSxLQUFNLElBQUlNLFNBQVM7UUFDM0I7SUFDRjtBQUNGO0FBRUUsQ0FBQTtJQUNBLE1BQU1PLFFBQVFDLEdBQUcsQ0FBRWpCLE1BQU1rQixHQUFHLENBQUVmLENBQUFBLE9BQVFELFVBQVdDO0lBQ2pESCxNQUFNbUIsT0FBTyxDQUFFaEIsQ0FBQUE7UUFDYlUsUUFBUU8sTUFBTSxDQUFDQyxLQUFLLENBQUVwQixJQUFJLENBQUVFLEtBQU07SUFDcEM7QUFDRixDQUFBIn0=