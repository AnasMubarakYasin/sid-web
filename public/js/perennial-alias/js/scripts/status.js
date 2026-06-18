// Copyright 2021-2026, University of Colorado Boulder
/**
 * Checks status for repos, and prints it out to the console
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const getActiveRepos = require('../common/getActiveRepos');
const gitStatus = require('../common/gitStatus');
const winston = require('winston');
winston.default.transports.console.level = 'error';
// ANSI escape sequences to move to the right (in the same line) or to apply or reset colors
const moveRight = '\u001b[42G';
const red = '\u001b[31m';
const green = '\u001b[32m';
const reset = '\u001b[0m';
const repos = getActiveRepos();
const data = {};
const getStatus = async (repo)=>{
    data[repo] = '';
    const status = await gitStatus(repo);
    let isGreen = false;
    if (status.branch) {
        isGreen = !status.status && status.branch === 'main' && status.ahead === 0;
        if (!isGreen || process.argv.includes('--all')) {
            data[repo] += `${repo}${moveRight}${isGreen ? green : red}${status.branch}${reset}${status.ahead === 0 ? '' : ` ahead ${status.ahead}`}${status.behind === 0 ? '' : ` behind ${status.behind}`}\n`;
        }
    } else {
        // if no branch, print our SHA (detached head)
        data[repo] += `${repo}${moveRight}${red}${status.sha}${reset}\n`;
    }
    if (status.status) {
        if (!isGreen || process.argv.includes('--all')) {
            data[repo] += status.status + '\n';
        }
    }
};
(async ()=>{
    await Promise.all(repos.map((repo)=>getStatus(repo)));
    repos.forEach((repo)=>{
        process.stdout.write(data[repo]);
    });
})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL3N0YXR1cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBDaGVja3Mgc3RhdHVzIGZvciByZXBvcywgYW5kIHByaW50cyBpdCBvdXQgdG8gdGhlIGNvbnNvbGVcbiAqXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICovXG5cbmNvbnN0IGdldEFjdGl2ZVJlcG9zID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXRBY3RpdmVSZXBvcycgKTtcbmNvbnN0IGdpdFN0YXR1cyA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0U3RhdHVzJyApO1xuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xuXG53aW5zdG9uLmRlZmF1bHQudHJhbnNwb3J0cy5jb25zb2xlLmxldmVsID0gJ2Vycm9yJztcblxuLy8gQU5TSSBlc2NhcGUgc2VxdWVuY2VzIHRvIG1vdmUgdG8gdGhlIHJpZ2h0IChpbiB0aGUgc2FtZSBsaW5lKSBvciB0byBhcHBseSBvciByZXNldCBjb2xvcnNcbmNvbnN0IG1vdmVSaWdodCA9ICdcXHUwMDFiWzQyRyc7XG5jb25zdCByZWQgPSAnXFx1MDAxYlszMW0nO1xuY29uc3QgZ3JlZW4gPSAnXFx1MDAxYlszMm0nO1xuY29uc3QgcmVzZXQgPSAnXFx1MDAxYlswbSc7XG5cbmNvbnN0IHJlcG9zID0gZ2V0QWN0aXZlUmVwb3MoKTtcbmNvbnN0IGRhdGEgPSB7fTtcblxuY29uc3QgZ2V0U3RhdHVzID0gYXN5bmMgcmVwbyA9PiB7XG4gIGRhdGFbIHJlcG8gXSA9ICcnO1xuXG4gIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGdpdFN0YXR1cyggcmVwbyApO1xuXG4gIGxldCBpc0dyZWVuID0gZmFsc2U7XG4gIGlmICggc3RhdHVzLmJyYW5jaCApIHtcbiAgICBpc0dyZWVuID0gIXN0YXR1cy5zdGF0dXMgJiYgc3RhdHVzLmJyYW5jaCA9PT0gJ21haW4nICYmIHN0YXR1cy5haGVhZCA9PT0gMDtcblxuICAgIGlmICggIWlzR3JlZW4gfHwgcHJvY2Vzcy5hcmd2LmluY2x1ZGVzKCAnLS1hbGwnICkgKSB7XG4gICAgICBkYXRhWyByZXBvIF0gKz0gYCR7cmVwb30ke21vdmVSaWdodH0ke2lzR3JlZW4gPyBncmVlbiA6IHJlZH0ke3N0YXR1cy5icmFuY2h9JHtyZXNldH0ke3N0YXR1cy5haGVhZCA9PT0gMCA/ICcnIDogYCBhaGVhZCAke3N0YXR1cy5haGVhZH1gfSR7c3RhdHVzLmJlaGluZCA9PT0gMCA/ICcnIDogYCBiZWhpbmQgJHtzdGF0dXMuYmVoaW5kfWB9XFxuYDtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gaWYgbm8gYnJhbmNoLCBwcmludCBvdXIgU0hBIChkZXRhY2hlZCBoZWFkKVxuICAgIGRhdGFbIHJlcG8gXSArPSBgJHtyZXBvfSR7bW92ZVJpZ2h0fSR7cmVkfSR7c3RhdHVzLnNoYX0ke3Jlc2V0fVxcbmA7XG4gIH1cblxuICBpZiAoIHN0YXR1cy5zdGF0dXMgKSB7XG4gICAgaWYgKCAhaXNHcmVlbiB8fCBwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoICctLWFsbCcgKSApIHtcbiAgICAgIGRhdGFbIHJlcG8gXSArPSBzdGF0dXMuc3RhdHVzICsgJ1xcbic7XG4gICAgfVxuICB9XG59O1xuXG4oIGFzeW5jICgpID0+IHtcbiAgYXdhaXQgUHJvbWlzZS5hbGwoIHJlcG9zLm1hcCggcmVwbyA9PiBnZXRTdGF0dXMoIHJlcG8gKSApICk7XG4gIHJlcG9zLmZvckVhY2goIHJlcG8gPT4ge1xuICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKCBkYXRhWyByZXBvIF0gKTtcbiAgfSApO1xufSApKCk7Il0sIm5hbWVzIjpbImdldEFjdGl2ZVJlcG9zIiwicmVxdWlyZSIsImdpdFN0YXR1cyIsIndpbnN0b24iLCJkZWZhdWx0IiwidHJhbnNwb3J0cyIsImNvbnNvbGUiLCJsZXZlbCIsIm1vdmVSaWdodCIsInJlZCIsImdyZWVuIiwicmVzZXQiLCJyZXBvcyIsImRhdGEiLCJnZXRTdGF0dXMiLCJyZXBvIiwic3RhdHVzIiwiaXNHcmVlbiIsImJyYW5jaCIsImFoZWFkIiwicHJvY2VzcyIsImFyZ3YiLCJpbmNsdWRlcyIsImJlaGluZCIsInNoYSIsIlByb21pc2UiLCJhbGwiLCJtYXAiLCJmb3JFYWNoIiwic3Rkb3V0Iiwid3JpdGUiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7OztDQUlDLEdBRUQsTUFBTUEsaUJBQWlCQyxRQUFTO0FBQ2hDLE1BQU1DLFlBQVlELFFBQVM7QUFDM0IsTUFBTUUsVUFBVUYsUUFBUztBQUV6QkUsUUFBUUMsT0FBTyxDQUFDQyxVQUFVLENBQUNDLE9BQU8sQ0FBQ0MsS0FBSyxHQUFHO0FBRTNDLDRGQUE0RjtBQUM1RixNQUFNQyxZQUFZO0FBQ2xCLE1BQU1DLE1BQU07QUFDWixNQUFNQyxRQUFRO0FBQ2QsTUFBTUMsUUFBUTtBQUVkLE1BQU1DLFFBQVFaO0FBQ2QsTUFBTWEsT0FBTyxDQUFDO0FBRWQsTUFBTUMsWUFBWSxPQUFNQztJQUN0QkYsSUFBSSxDQUFFRSxLQUFNLEdBQUc7SUFFZixNQUFNQyxTQUFTLE1BQU1kLFVBQVdhO0lBRWhDLElBQUlFLFVBQVU7SUFDZCxJQUFLRCxPQUFPRSxNQUFNLEVBQUc7UUFDbkJELFVBQVUsQ0FBQ0QsT0FBT0EsTUFBTSxJQUFJQSxPQUFPRSxNQUFNLEtBQUssVUFBVUYsT0FBT0csS0FBSyxLQUFLO1FBRXpFLElBQUssQ0FBQ0YsV0FBV0csUUFBUUMsSUFBSSxDQUFDQyxRQUFRLENBQUUsVUFBWTtZQUNsRFQsSUFBSSxDQUFFRSxLQUFNLElBQUksR0FBR0EsT0FBT1AsWUFBWVMsVUFBVVAsUUFBUUQsTUFBTU8sT0FBT0UsTUFBTSxHQUFHUCxRQUFRSyxPQUFPRyxLQUFLLEtBQUssSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFSCxPQUFPRyxLQUFLLEVBQUUsR0FBR0gsT0FBT08sTUFBTSxLQUFLLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRVAsT0FBT08sTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ3RNO0lBQ0YsT0FDSztRQUNILDhDQUE4QztRQUM5Q1YsSUFBSSxDQUFFRSxLQUFNLElBQUksR0FBR0EsT0FBT1AsWUFBWUMsTUFBTU8sT0FBT1EsR0FBRyxHQUFHYixNQUFNLEVBQUUsQ0FBQztJQUNwRTtJQUVBLElBQUtLLE9BQU9BLE1BQU0sRUFBRztRQUNuQixJQUFLLENBQUNDLFdBQVdHLFFBQVFDLElBQUksQ0FBQ0MsUUFBUSxDQUFFLFVBQVk7WUFDbERULElBQUksQ0FBRUUsS0FBTSxJQUFJQyxPQUFPQSxNQUFNLEdBQUc7UUFDbEM7SUFDRjtBQUNGO0FBRUUsQ0FBQTtJQUNBLE1BQU1TLFFBQVFDLEdBQUcsQ0FBRWQsTUFBTWUsR0FBRyxDQUFFWixDQUFBQSxPQUFRRCxVQUFXQztJQUNqREgsTUFBTWdCLE9BQU8sQ0FBRWIsQ0FBQUE7UUFDYkssUUFBUVMsTUFBTSxDQUFDQyxLQUFLLENBQUVqQixJQUFJLENBQUVFLEtBQU07SUFDcEM7QUFDRixDQUFBIn0=