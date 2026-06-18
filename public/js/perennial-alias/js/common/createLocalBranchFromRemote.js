// Copyright 2023-2026, University of Colorado Boulder
/**
 * If your local repo does not have a remote branch, this script will grab it and set up tracking on it.
 * This script will start and end on the same, current branch the repo is on, but checkouts the `branch` param while
 * running.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const gitPull = require('./gitPull');
const getBranch = require('./getBranch');
const gitCheckout = require('./gitCheckout');
/**
 * If your local repo does not have a remote branch, this script will grab it and set up tracking on it.
 * This script will start and end on the same, current branch the repo is on, but checkouts the `branch` param while
 * running.
 *
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} branch - The branch name
 * @returns {Promise<void>}
 */ module.exports = async function createLocalBranchFromRemote(repo, branch) {
    const currentBranch = await getBranch(repo);
    await execute('git', [
        'checkout',
        '-b',
        branch,
        `origin/${branch}`
    ], `../${repo}`);
    await gitPull(repo);
    if (branch !== '') {
        await gitCheckout(repo, currentBranch);
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vY3JlYXRlTG9jYWxCcmFuY2hGcm9tUmVtb3RlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLTIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIElmIHlvdXIgbG9jYWwgcmVwbyBkb2VzIG5vdCBoYXZlIGEgcmVtb3RlIGJyYW5jaCwgdGhpcyBzY3JpcHQgd2lsbCBncmFiIGl0IGFuZCBzZXQgdXAgdHJhY2tpbmcgb24gaXQuXG4gKiBUaGlzIHNjcmlwdCB3aWxsIHN0YXJ0IGFuZCBlbmQgb24gdGhlIHNhbWUsIGN1cnJlbnQgYnJhbmNoIHRoZSByZXBvIGlzIG9uLCBidXQgY2hlY2tvdXRzIHRoZSBgYnJhbmNoYCBwYXJhbSB3aGlsZVxuICogcnVubmluZy5cbiAqXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3QgZ2l0UHVsbCA9IHJlcXVpcmUoICcuL2dpdFB1bGwnICk7XG5jb25zdCBnZXRCcmFuY2ggPSByZXF1aXJlKCAnLi9nZXRCcmFuY2gnICk7XG5jb25zdCBnaXRDaGVja291dCA9IHJlcXVpcmUoICcuL2dpdENoZWNrb3V0JyApO1xuXG4vKipcbiAqIElmIHlvdXIgbG9jYWwgcmVwbyBkb2VzIG5vdCBoYXZlIGEgcmVtb3RlIGJyYW5jaCwgdGhpcyBzY3JpcHQgd2lsbCBncmFiIGl0IGFuZCBzZXQgdXAgdHJhY2tpbmcgb24gaXQuXG4gKiBUaGlzIHNjcmlwdCB3aWxsIHN0YXJ0IGFuZCBlbmQgb24gdGhlIHNhbWUsIGN1cnJlbnQgYnJhbmNoIHRoZSByZXBvIGlzIG9uLCBidXQgY2hlY2tvdXRzIHRoZSBgYnJhbmNoYCBwYXJhbSB3aGlsZVxuICogcnVubmluZy5cbiAqXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoIC0gVGhlIGJyYW5jaCBuYW1lXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBjcmVhdGVMb2NhbEJyYW5jaEZyb21SZW1vdGUoIHJlcG8sIGJyYW5jaCApIHtcbiAgY29uc3QgY3VycmVudEJyYW5jaCA9IGF3YWl0IGdldEJyYW5jaCggcmVwbyApO1xuICBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnY2hlY2tvdXQnLCAnLWInLCBicmFuY2gsIGBvcmlnaW4vJHticmFuY2h9YCBdLCBgLi4vJHtyZXBvfWAgKTtcbiAgYXdhaXQgZ2l0UHVsbCggcmVwbyApO1xuXG4gIGlmICggYnJhbmNoICE9PSAnJyApIHsgLy8gb3RoZXJ3aXNlIGl0IHdvdWxkIGZhaWxcbiAgICBhd2FpdCBnaXRDaGVja291dCggcmVwbywgY3VycmVudEJyYW5jaCApO1xuICB9XG59OyJdLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImRlZmF1bHQiLCJnaXRQdWxsIiwiZ2V0QnJhbmNoIiwiZ2l0Q2hlY2tvdXQiLCJtb2R1bGUiLCJleHBvcnRzIiwiY3JlYXRlTG9jYWxCcmFuY2hGcm9tUmVtb3RlIiwicmVwbyIsImJyYW5jaCIsImN1cnJlbnRCcmFuY2giXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7Ozs7Ozs7Q0FRQyxHQUVELE1BQU1BLFVBQVVDLFFBQVMsYUFBY0MsT0FBTztBQUM5QyxNQUFNQyxVQUFVRixRQUFTO0FBQ3pCLE1BQU1HLFlBQVlILFFBQVM7QUFDM0IsTUFBTUksY0FBY0osUUFBUztBQUU3Qjs7Ozs7Ozs7OztDQVVDLEdBQ0RLLE9BQU9DLE9BQU8sR0FBRyxlQUFlQyw0QkFBNkJDLElBQUksRUFBRUMsTUFBTTtJQUN2RSxNQUFNQyxnQkFBZ0IsTUFBTVAsVUFBV0s7SUFDdkMsTUFBTVQsUUFBUyxPQUFPO1FBQUU7UUFBWTtRQUFNVTtRQUFRLENBQUMsT0FBTyxFQUFFQSxRQUFRO0tBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRUQsTUFBTTtJQUNwRixNQUFNTixRQUFTTTtJQUVmLElBQUtDLFdBQVcsSUFBSztRQUNuQixNQUFNTCxZQUFhSSxNQUFNRTtJQUMzQjtBQUNGIn0=