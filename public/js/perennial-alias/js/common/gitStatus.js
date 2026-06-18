// Copyright 2018-2026, University of Colorado Boulder
/**
 * Returns a combination of status information for the repository's git status
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const getBranch = require('./getBranch');
const getRemoteBranchSHAs = require('./getRemoteBranchSHAs');
const gitRevParse = require('./gitRevParse');
const assert = require('assert');
/**
 * Returns a combination of status information for the repository's git status
 * @public
 *
 * @param {string} repo - The repository name
 */ module.exports = async function(repo) {
    assert(typeof repo === 'string');
    const result = {};
    // This is needed to get the below `git rev-list` with ${u} to actually compare with the remote state.
    await execute('git', [
        'remote',
        'update'
    ], `../${repo}`);
    result.symbolicRef = await execute('git', [
        'symbolic-ref',
        '-q',
        'HEAD'
    ], `../${repo}`);
    result.branch = await getBranch(repo); // might be empty string
    result.sha = await gitRevParse(repo, 'HEAD');
    result.status = await execute('git', [
        'status',
        '--porcelain'
    ], `../${repo}`);
    if (result.branch) {
        // Safe method to get ahead/behind counts, see http://stackoverflow.com/questions/2969214/git-programmatically-know-by-how-much-the-branch-is-ahead-behind-a-remote-branc
        result.remoteSHA = (await getRemoteBranchSHAs(repo))[result.branch];
        // get the tracking-branch name
        result.trackingBranch = await execute('git', [
            'for-each-ref',
            '--format=\'%(upstream:short)\'',
            result.symbolicRef
        ], `../${repo}`);
        // e.g. behind-count + '\t' + ahead-count
        const counts = await execute('git', [
            'rev-list',
            '--left-right',
            '--count',
            `${result.trackingBranch}@{u}...HEAD`
        ], `../${repo}`);
        result.behind = Number(counts.split('\t')[0]);
        result.ahead = Number(counts.split('\t')[1]);
        result.remoteDifferent = result.remoteSHA !== result.sha;
        if (result.remoteDifferent) {
            assert(result.behind > 0 || result.ahead > 0, 'We should be ahead or behind commits if our remote SHA is different than our HEAD');
        }
    }
    return result;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0U3RhdHVzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIFJldHVybnMgYSBjb21iaW5hdGlvbiBvZiBzdGF0dXMgaW5mb3JtYXRpb24gZm9yIHRoZSByZXBvc2l0b3J5J3MgZ2l0IHN0YXR1c1xuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcbmNvbnN0IGdldEJyYW5jaCA9IHJlcXVpcmUoICcuL2dldEJyYW5jaCcgKTtcbmNvbnN0IGdldFJlbW90ZUJyYW5jaFNIQXMgPSByZXF1aXJlKCAnLi9nZXRSZW1vdGVCcmFuY2hTSEFzJyApO1xuY29uc3QgZ2l0UmV2UGFyc2UgPSByZXF1aXJlKCAnLi9naXRSZXZQYXJzZScgKTtcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XG5cbi8qKlxuICogUmV0dXJucyBhIGNvbWJpbmF0aW9uIG9mIHN0YXR1cyBpbmZvcm1hdGlvbiBmb3IgdGhlIHJlcG9zaXRvcnkncyBnaXQgc3RhdHVzXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24oIHJlcG8gKSB7XG4gIGFzc2VydCggdHlwZW9mIHJlcG8gPT09ICdzdHJpbmcnICk7XG5cbiAgY29uc3QgcmVzdWx0ID0ge307XG5cbiAgLy8gVGhpcyBpcyBuZWVkZWQgdG8gZ2V0IHRoZSBiZWxvdyBgZ2l0IHJldi1saXN0YCB3aXRoICR7dX0gdG8gYWN0dWFsbHkgY29tcGFyZSB3aXRoIHRoZSByZW1vdGUgc3RhdGUuXG4gIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdyZW1vdGUnLCAndXBkYXRlJyBdLCBgLi4vJHtyZXBvfWAgKTtcblxuICByZXN1bHQuc3ltYm9saWNSZWYgPSBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnc3ltYm9saWMtcmVmJywgJy1xJywgJ0hFQUQnIF0sIGAuLi8ke3JlcG99YCApO1xuICByZXN1bHQuYnJhbmNoID0gYXdhaXQgZ2V0QnJhbmNoKCByZXBvICk7IC8vIG1pZ2h0IGJlIGVtcHR5IHN0cmluZ1xuICByZXN1bHQuc2hhID0gYXdhaXQgZ2l0UmV2UGFyc2UoIHJlcG8sICdIRUFEJyApO1xuICByZXN1bHQuc3RhdHVzID0gYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFsgJ3N0YXR1cycsICctLXBvcmNlbGFpbicgXSwgYC4uLyR7cmVwb31gICk7XG5cbiAgaWYgKCByZXN1bHQuYnJhbmNoICkge1xuICAgIC8vIFNhZmUgbWV0aG9kIHRvIGdldCBhaGVhZC9iZWhpbmQgY291bnRzLCBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yOTY5MjE0L2dpdC1wcm9ncmFtbWF0aWNhbGx5LWtub3ctYnktaG93LW11Y2gtdGhlLWJyYW5jaC1pcy1haGVhZC1iZWhpbmQtYS1yZW1vdGUtYnJhbmNcblxuICAgIHJlc3VsdC5yZW1vdGVTSEEgPSAoIGF3YWl0IGdldFJlbW90ZUJyYW5jaFNIQXMoIHJlcG8gKSApWyByZXN1bHQuYnJhbmNoIF07XG5cbiAgICAvLyBnZXQgdGhlIHRyYWNraW5nLWJyYW5jaCBuYW1lXG4gICAgcmVzdWx0LnRyYWNraW5nQnJhbmNoID0gYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFsgJ2Zvci1lYWNoLXJlZicsICctLWZvcm1hdD1cXCclKHVwc3RyZWFtOnNob3J0KVxcJycsIHJlc3VsdC5zeW1ib2xpY1JlZiBdLCBgLi4vJHtyZXBvfWAgKTtcblxuICAgIC8vIGUuZy4gYmVoaW5kLWNvdW50ICsgJ1xcdCcgKyBhaGVhZC1jb3VudFxuICAgIGNvbnN0IGNvdW50cyA9IGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdyZXYtbGlzdCcsICctLWxlZnQtcmlnaHQnLCAnLS1jb3VudCcsIGAke3Jlc3VsdC50cmFja2luZ0JyYW5jaH1Ae3V9Li4uSEVBRGAgXSwgYC4uLyR7cmVwb31gICk7XG5cbiAgICByZXN1bHQuYmVoaW5kID0gTnVtYmVyKCBjb3VudHMuc3BsaXQoICdcXHQnIClbIDAgXSApO1xuICAgIHJlc3VsdC5haGVhZCA9IE51bWJlciggY291bnRzLnNwbGl0KCAnXFx0JyApWyAxIF0gKTtcbiAgICByZXN1bHQucmVtb3RlRGlmZmVyZW50ID0gcmVzdWx0LnJlbW90ZVNIQSAhPT0gcmVzdWx0LnNoYTtcblxuICAgIGlmICggcmVzdWx0LnJlbW90ZURpZmZlcmVudCApIHtcbiAgICAgIGFzc2VydCggcmVzdWx0LmJlaGluZCA+IDAgfHwgcmVzdWx0LmFoZWFkID4gMCwgJ1dlIHNob3VsZCBiZSBhaGVhZCBvciBiZWhpbmQgY29tbWl0cyBpZiBvdXIgcmVtb3RlIFNIQSBpcyBkaWZmZXJlbnQgdGhhbiBvdXIgSEVBRCcgKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTsiXSwibmFtZXMiOlsiZXhlY3V0ZSIsInJlcXVpcmUiLCJkZWZhdWx0IiwiZ2V0QnJhbmNoIiwiZ2V0UmVtb3RlQnJhbmNoU0hBcyIsImdpdFJldlBhcnNlIiwiYXNzZXJ0IiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJyZXN1bHQiLCJzeW1ib2xpY1JlZiIsImJyYW5jaCIsInNoYSIsInN0YXR1cyIsInJlbW90ZVNIQSIsInRyYWNraW5nQnJhbmNoIiwiY291bnRzIiwiYmVoaW5kIiwiTnVtYmVyIiwic3BsaXQiLCJhaGVhZCIsInJlbW90ZURpZmZlcmVudCJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7O0NBSUMsR0FFRCxNQUFNQSxVQUFVQyxRQUFTLGFBQWNDLE9BQU87QUFDOUMsTUFBTUMsWUFBWUYsUUFBUztBQUMzQixNQUFNRyxzQkFBc0JILFFBQVM7QUFDckMsTUFBTUksY0FBY0osUUFBUztBQUM3QixNQUFNSyxTQUFTTCxRQUFTO0FBRXhCOzs7OztDQUtDLEdBQ0RNLE9BQU9DLE9BQU8sR0FBRyxlQUFnQkMsSUFBSTtJQUNuQ0gsT0FBUSxPQUFPRyxTQUFTO0lBRXhCLE1BQU1DLFNBQVMsQ0FBQztJQUVoQixzR0FBc0c7SUFDdEcsTUFBTVYsUUFBUyxPQUFPO1FBQUU7UUFBVTtLQUFVLEVBQUUsQ0FBQyxHQUFHLEVBQUVTLE1BQU07SUFFMURDLE9BQU9DLFdBQVcsR0FBRyxNQUFNWCxRQUFTLE9BQU87UUFBRTtRQUFnQjtRQUFNO0tBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRVMsTUFBTTtJQUN6RkMsT0FBT0UsTUFBTSxHQUFHLE1BQU1ULFVBQVdNLE9BQVEsd0JBQXdCO0lBQ2pFQyxPQUFPRyxHQUFHLEdBQUcsTUFBTVIsWUFBYUksTUFBTTtJQUN0Q0MsT0FBT0ksTUFBTSxHQUFHLE1BQU1kLFFBQVMsT0FBTztRQUFFO1FBQVU7S0FBZSxFQUFFLENBQUMsR0FBRyxFQUFFUyxNQUFNO0lBRS9FLElBQUtDLE9BQU9FLE1BQU0sRUFBRztRQUNuQix5S0FBeUs7UUFFektGLE9BQU9LLFNBQVMsR0FBRyxBQUFFLENBQUEsTUFBTVgsb0JBQXFCSyxLQUFLLENBQUcsQ0FBRUMsT0FBT0UsTUFBTSxDQUFFO1FBRXpFLCtCQUErQjtRQUMvQkYsT0FBT00sY0FBYyxHQUFHLE1BQU1oQixRQUFTLE9BQU87WUFBRTtZQUFnQjtZQUFrQ1UsT0FBT0MsV0FBVztTQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUVGLE1BQU07UUFFcEkseUNBQXlDO1FBQ3pDLE1BQU1RLFNBQVMsTUFBTWpCLFFBQVMsT0FBTztZQUFFO1lBQVk7WUFBZ0I7WUFBVyxHQUFHVSxPQUFPTSxjQUFjLENBQUMsV0FBVyxDQUFDO1NBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRVAsTUFBTTtRQUVuSUMsT0FBT1EsTUFBTSxHQUFHQyxPQUFRRixPQUFPRyxLQUFLLENBQUUsS0FBTSxDQUFFLEVBQUc7UUFDakRWLE9BQU9XLEtBQUssR0FBR0YsT0FBUUYsT0FBT0csS0FBSyxDQUFFLEtBQU0sQ0FBRSxFQUFHO1FBQ2hEVixPQUFPWSxlQUFlLEdBQUdaLE9BQU9LLFNBQVMsS0FBS0wsT0FBT0csR0FBRztRQUV4RCxJQUFLSCxPQUFPWSxlQUFlLEVBQUc7WUFDNUJoQixPQUFRSSxPQUFPUSxNQUFNLEdBQUcsS0FBS1IsT0FBT1csS0FBSyxHQUFHLEdBQUc7UUFDakQ7SUFDRjtJQUVBLE9BQU9YO0FBQ1QifQ==