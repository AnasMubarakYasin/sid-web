// Copyright 2017-2026, University of Colorado Boulder
/**
 * For `grunt create-one-off`, see Gruntfile for details
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const SimVersion = require('../browser-and-node/SimVersion').default;
const build = require('../common/build');
const copyFile = require('../common/copyFile');
const execute = require('../common/execute').default;
const getRepoVersion = require('../common/getRepoVersion');
const gitAdd = require('../common/gitAdd');
const gitCommit = require('../common/gitCommit');
const gitIsClean = require('../common/gitIsClean');
const gitPush = require('../common/gitPush');
const hasRemoteBranch = require('../common/hasRemoteBranch');
const npmUpdate = require('../common/npmUpdate');
const setRepoVersion = require('../common/setRepoVersion');
/**
 * For `grunt create-one-off`, see Gruntfile for details
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} branch - The branch to create (should be {{MAJOR}}.{{MINOR}})
 * @param {string} [message] - Optional message to append to the version-increment commit.
 * @returns {Promise}
 */ module.exports = async function(repo, branch, message) {
    const hasBranchAlready = await hasRemoteBranch(repo, branch);
    if (hasBranchAlready) {
        // Comment this line out if you know, because you just created the branch on accident.
        throw new Error('Branch already exists, aborting');
    }
    const branchedVersion = await getRepoVersion(repo);
    const newVersion = new SimVersion(branchedVersion.major, branchedVersion.minor, 0, {
        testType: branch,
        testNumber: 0
    });
    const isClean = await gitIsClean(repo);
    if (!isClean) {
        throw new Error(`Unclean status in ${repo}, cannot create release branch`);
    }
    const checkoutArgs = [
        'checkout'
    ];
    !hasBranchAlready && checkoutArgs.push('-b');
    checkoutArgs.push(branch);
    // Create the branch, update the version info
    await execute('git', checkoutArgs, `../${repo}`);
    await setRepoVersion(repo, newVersion, message);
    await gitPush(repo, branch);
    // Update dependencies.json for the release branch
    await npmUpdate(repo);
    await npmUpdate('chipper');
    await npmUpdate('perennial-alias');
    const brand = 'phet';
    await build(repo, {
        brands: [
            brand
        ],
        // We just need the dependencies.json generated.
        minify: false,
        lint: false,
        typeCheck: false
    });
    await copyFile(`../${repo}/build/${brand}/dependencies.json`, `../${repo}/dependencies.json`);
    if (!await gitIsClean(repo)) {
        await gitAdd(repo, 'dependencies.json');
        await gitCommit(repo, `updated dependencies.json for version ${newVersion.toString()}`);
    }
    await gitPush(repo, branch);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9ncnVudC9jcmVhdGVPbmVPZmYuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogRm9yIGBncnVudCBjcmVhdGUtb25lLW9mZmAsIHNlZSBHcnVudGZpbGUgZm9yIGRldGFpbHNcbiAqXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuICovXG5cbmNvbnN0IFNpbVZlcnNpb24gPSByZXF1aXJlKCAnLi4vYnJvd3Nlci1hbmQtbm9kZS9TaW1WZXJzaW9uJyApLmRlZmF1bHQ7XG5jb25zdCBidWlsZCA9IHJlcXVpcmUoICcuLi9jb21tb24vYnVpbGQnICk7XG5jb25zdCBjb3B5RmlsZSA9IHJlcXVpcmUoICcuLi9jb21tb24vY29weUZpbGUnICk7XG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4uL2NvbW1vbi9leGVjdXRlJyApLmRlZmF1bHQ7XG5jb25zdCBnZXRSZXBvVmVyc2lvbiA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2V0UmVwb1ZlcnNpb24nICk7XG5jb25zdCBnaXRBZGQgPSByZXF1aXJlKCAnLi4vY29tbW9uL2dpdEFkZCcgKTtcbmNvbnN0IGdpdENvbW1pdCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0Q29tbWl0JyApO1xuY29uc3QgZ2l0SXNDbGVhbiA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0SXNDbGVhbicgKTtcbmNvbnN0IGdpdFB1c2ggPSByZXF1aXJlKCAnLi4vY29tbW9uL2dpdFB1c2gnICk7XG5jb25zdCBoYXNSZW1vdGVCcmFuY2ggPSByZXF1aXJlKCAnLi4vY29tbW9uL2hhc1JlbW90ZUJyYW5jaCcgKTtcbmNvbnN0IG5wbVVwZGF0ZSA9IHJlcXVpcmUoICcuLi9jb21tb24vbnBtVXBkYXRlJyApO1xuY29uc3Qgc2V0UmVwb1ZlcnNpb24gPSByZXF1aXJlKCAnLi4vY29tbW9uL3NldFJlcG9WZXJzaW9uJyApO1xuXG4vKipcbiAqIEZvciBgZ3J1bnQgY3JlYXRlLW9uZS1vZmZgLCBzZWUgR3J1bnRmaWxlIGZvciBkZXRhaWxzXG4gKiBAcHVibGljXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoIC0gVGhlIGJyYW5jaCB0byBjcmVhdGUgKHNob3VsZCBiZSB7e01BSk9SfX0ue3tNSU5PUn19KVxuICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIE9wdGlvbmFsIG1lc3NhZ2UgdG8gYXBwZW5kIHRvIHRoZSB2ZXJzaW9uLWluY3JlbWVudCBjb21taXQuXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggcmVwbywgYnJhbmNoLCBtZXNzYWdlICkge1xuICBjb25zdCBoYXNCcmFuY2hBbHJlYWR5ID0gYXdhaXQgaGFzUmVtb3RlQnJhbmNoKCByZXBvLCBicmFuY2ggKTtcbiAgaWYgKCBoYXNCcmFuY2hBbHJlYWR5ICkge1xuXG4gICAgLy8gQ29tbWVudCB0aGlzIGxpbmUgb3V0IGlmIHlvdSBrbm93LCBiZWNhdXNlIHlvdSBqdXN0IGNyZWF0ZWQgdGhlIGJyYW5jaCBvbiBhY2NpZGVudC5cbiAgICB0aHJvdyBuZXcgRXJyb3IoICdCcmFuY2ggYWxyZWFkeSBleGlzdHMsIGFib3J0aW5nJyApO1xuICB9XG5cbiAgY29uc3QgYnJhbmNoZWRWZXJzaW9uID0gYXdhaXQgZ2V0UmVwb1ZlcnNpb24oIHJlcG8gKTtcblxuICBjb25zdCBuZXdWZXJzaW9uID0gbmV3IFNpbVZlcnNpb24oIGJyYW5jaGVkVmVyc2lvbi5tYWpvciwgYnJhbmNoZWRWZXJzaW9uLm1pbm9yLCAwLCB7XG4gICAgdGVzdFR5cGU6IGJyYW5jaCxcbiAgICB0ZXN0TnVtYmVyOiAwXG4gIH0gKTtcblxuICBjb25zdCBpc0NsZWFuID0gYXdhaXQgZ2l0SXNDbGVhbiggcmVwbyApO1xuICBpZiAoICFpc0NsZWFuICkge1xuICAgIHRocm93IG5ldyBFcnJvciggYFVuY2xlYW4gc3RhdHVzIGluICR7cmVwb30sIGNhbm5vdCBjcmVhdGUgcmVsZWFzZSBicmFuY2hgICk7XG4gIH1cblxuICBjb25zdCBjaGVja291dEFyZ3MgPSBbICdjaGVja291dCcgXTtcbiAgIWhhc0JyYW5jaEFscmVhZHkgJiYgY2hlY2tvdXRBcmdzLnB1c2goICctYicgKTtcbiAgY2hlY2tvdXRBcmdzLnB1c2goIGJyYW5jaCApO1xuXG4gIC8vIENyZWF0ZSB0aGUgYnJhbmNoLCB1cGRhdGUgdGhlIHZlcnNpb24gaW5mb1xuICBhd2FpdCBleGVjdXRlKCAnZ2l0JywgY2hlY2tvdXRBcmdzLCBgLi4vJHtyZXBvfWAgKTtcbiAgYXdhaXQgc2V0UmVwb1ZlcnNpb24oIHJlcG8sIG5ld1ZlcnNpb24sIG1lc3NhZ2UgKTtcbiAgYXdhaXQgZ2l0UHVzaCggcmVwbywgYnJhbmNoICk7XG5cbiAgLy8gVXBkYXRlIGRlcGVuZGVuY2llcy5qc29uIGZvciB0aGUgcmVsZWFzZSBicmFuY2hcbiAgYXdhaXQgbnBtVXBkYXRlKCByZXBvICk7XG4gIGF3YWl0IG5wbVVwZGF0ZSggJ2NoaXBwZXInICk7XG4gIGF3YWl0IG5wbVVwZGF0ZSggJ3BlcmVubmlhbC1hbGlhcycgKTtcblxuICBjb25zdCBicmFuZCA9ICdwaGV0JztcbiAgYXdhaXQgYnVpbGQoIHJlcG8sIHtcbiAgICBicmFuZHM6IFsgYnJhbmQgXSxcblxuICAgIC8vIFdlIGp1c3QgbmVlZCB0aGUgZGVwZW5kZW5jaWVzLmpzb24gZ2VuZXJhdGVkLlxuICAgIG1pbmlmeTogZmFsc2UsXG4gICAgbGludDogZmFsc2UsXG4gICAgdHlwZUNoZWNrOiBmYWxzZVxuICB9ICk7XG4gIGF3YWl0IGNvcHlGaWxlKCBgLi4vJHtyZXBvfS9idWlsZC8ke2JyYW5kfS9kZXBlbmRlbmNpZXMuanNvbmAsIGAuLi8ke3JlcG99L2RlcGVuZGVuY2llcy5qc29uYCApO1xuICBpZiAoICFhd2FpdCBnaXRJc0NsZWFuKCByZXBvICkgKSB7XG4gICAgYXdhaXQgZ2l0QWRkKCByZXBvLCAnZGVwZW5kZW5jaWVzLmpzb24nICk7XG4gICAgYXdhaXQgZ2l0Q29tbWl0KCByZXBvLCBgdXBkYXRlZCBkZXBlbmRlbmNpZXMuanNvbiBmb3IgdmVyc2lvbiAke25ld1ZlcnNpb24udG9TdHJpbmcoKX1gICk7XG4gIH1cbiAgYXdhaXQgZ2l0UHVzaCggcmVwbywgYnJhbmNoICk7XG59OyJdLCJuYW1lcyI6WyJTaW1WZXJzaW9uIiwicmVxdWlyZSIsImRlZmF1bHQiLCJidWlsZCIsImNvcHlGaWxlIiwiZXhlY3V0ZSIsImdldFJlcG9WZXJzaW9uIiwiZ2l0QWRkIiwiZ2l0Q29tbWl0IiwiZ2l0SXNDbGVhbiIsImdpdFB1c2giLCJoYXNSZW1vdGVCcmFuY2giLCJucG1VcGRhdGUiLCJzZXRSZXBvVmVyc2lvbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwiYnJhbmNoIiwibWVzc2FnZSIsImhhc0JyYW5jaEFscmVhZHkiLCJFcnJvciIsImJyYW5jaGVkVmVyc2lvbiIsIm5ld1ZlcnNpb24iLCJtYWpvciIsIm1pbm9yIiwidGVzdFR5cGUiLCJ0ZXN0TnVtYmVyIiwiaXNDbGVhbiIsImNoZWNrb3V0QXJncyIsInB1c2giLCJicmFuZCIsImJyYW5kcyIsIm1pbmlmeSIsImxpbnQiLCJ0eXBlQ2hlY2siLCJ0b1N0cmluZyJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7O0NBSUMsR0FFRCxNQUFNQSxhQUFhQyxRQUFTLGtDQUFtQ0MsT0FBTztBQUN0RSxNQUFNQyxRQUFRRixRQUFTO0FBQ3ZCLE1BQU1HLFdBQVdILFFBQVM7QUFDMUIsTUFBTUksVUFBVUosUUFBUyxxQkFBc0JDLE9BQU87QUFDdEQsTUFBTUksaUJBQWlCTCxRQUFTO0FBQ2hDLE1BQU1NLFNBQVNOLFFBQVM7QUFDeEIsTUFBTU8sWUFBWVAsUUFBUztBQUMzQixNQUFNUSxhQUFhUixRQUFTO0FBQzVCLE1BQU1TLFVBQVVULFFBQVM7QUFDekIsTUFBTVUsa0JBQWtCVixRQUFTO0FBQ2pDLE1BQU1XLFlBQVlYLFFBQVM7QUFDM0IsTUFBTVksaUJBQWlCWixRQUFTO0FBRWhDOzs7Ozs7OztDQVFDLEdBQ0RhLE9BQU9DLE9BQU8sR0FBRyxlQUFnQkMsSUFBSSxFQUFFQyxNQUFNLEVBQUVDLE9BQU87SUFDcEQsTUFBTUMsbUJBQW1CLE1BQU1SLGdCQUFpQkssTUFBTUM7SUFDdEQsSUFBS0Usa0JBQW1CO1FBRXRCLHNGQUFzRjtRQUN0RixNQUFNLElBQUlDLE1BQU87SUFDbkI7SUFFQSxNQUFNQyxrQkFBa0IsTUFBTWYsZUFBZ0JVO0lBRTlDLE1BQU1NLGFBQWEsSUFBSXRCLFdBQVlxQixnQkFBZ0JFLEtBQUssRUFBRUYsZ0JBQWdCRyxLQUFLLEVBQUUsR0FBRztRQUNsRkMsVUFBVVI7UUFDVlMsWUFBWTtJQUNkO0lBRUEsTUFBTUMsVUFBVSxNQUFNbEIsV0FBWU87SUFDbEMsSUFBSyxDQUFDVyxTQUFVO1FBQ2QsTUFBTSxJQUFJUCxNQUFPLENBQUMsa0JBQWtCLEVBQUVKLEtBQUssOEJBQThCLENBQUM7SUFDNUU7SUFFQSxNQUFNWSxlQUFlO1FBQUU7S0FBWTtJQUNuQyxDQUFDVCxvQkFBb0JTLGFBQWFDLElBQUksQ0FBRTtJQUN4Q0QsYUFBYUMsSUFBSSxDQUFFWjtJQUVuQiw2Q0FBNkM7SUFDN0MsTUFBTVosUUFBUyxPQUFPdUIsY0FBYyxDQUFDLEdBQUcsRUFBRVosTUFBTTtJQUNoRCxNQUFNSCxlQUFnQkcsTUFBTU0sWUFBWUo7SUFDeEMsTUFBTVIsUUFBU00sTUFBTUM7SUFFckIsa0RBQWtEO0lBQ2xELE1BQU1MLFVBQVdJO0lBQ2pCLE1BQU1KLFVBQVc7SUFDakIsTUFBTUEsVUFBVztJQUVqQixNQUFNa0IsUUFBUTtJQUNkLE1BQU0zQixNQUFPYSxNQUFNO1FBQ2pCZSxRQUFRO1lBQUVEO1NBQU87UUFFakIsZ0RBQWdEO1FBQ2hERSxRQUFRO1FBQ1JDLE1BQU07UUFDTkMsV0FBVztJQUNiO0lBQ0EsTUFBTTlCLFNBQVUsQ0FBQyxHQUFHLEVBQUVZLEtBQUssT0FBTyxFQUFFYyxNQUFNLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUVkLEtBQUssa0JBQWtCLENBQUM7SUFDN0YsSUFBSyxDQUFDLE1BQU1QLFdBQVlPLE9BQVM7UUFDL0IsTUFBTVQsT0FBUVMsTUFBTTtRQUNwQixNQUFNUixVQUFXUSxNQUFNLENBQUMsc0NBQXNDLEVBQUVNLFdBQVdhLFFBQVEsSUFBSTtJQUN6RjtJQUNBLE1BQU16QixRQUFTTSxNQUFNQztBQUN2QiJ9