// Copyright 2017-2026, University of Colorado Boulder
/**
 * git checkout
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
const assert = require('assert');
const winston = require('winston');
/**
 * Executes git checkout
 * @public
 *
 * @param {string} target - The SHA/branch/whatnot to check out
 * @param {string} directory - The working cwd directory
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */ module.exports = function gitCheckoutDirectory(target, directory) {
    assert(typeof target === 'string');
    assert(typeof directory === 'string');
    winston.info(`git checkout ${target} in ${directory}`);
    return execute('git', [
        'checkout',
        target
    ], directory);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2l0Q2hlY2tvdXREaXJlY3RvcnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogZ2l0IGNoZWNrb3V0XG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKS5kZWZhdWx0O1xuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcblxuLyoqXG4gKiBFeGVjdXRlcyBnaXQgY2hlY2tvdXRcbiAqIEBwdWJsaWNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFyZ2V0IC0gVGhlIFNIQS9icmFuY2gvd2hhdG5vdCB0byBjaGVjayBvdXRcbiAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3RvcnkgLSBUaGUgd29ya2luZyBjd2QgZGlyZWN0b3J5XG4gKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn0gLSBTdGRvdXRcbiAqIEByZWplY3RzIHtFeGVjdXRlRXJyb3J9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2l0Q2hlY2tvdXREaXJlY3RvcnkoIHRhcmdldCwgZGlyZWN0b3J5ICkge1xuICBhc3NlcnQoIHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnICk7XG4gIGFzc2VydCggdHlwZW9mIGRpcmVjdG9yeSA9PT0gJ3N0cmluZycgKTtcblxuICB3aW5zdG9uLmluZm8oIGBnaXQgY2hlY2tvdXQgJHt0YXJnZXR9IGluICR7ZGlyZWN0b3J5fWAgKTtcblxuICByZXR1cm4gZXhlY3V0ZSggJ2dpdCcsIFsgJ2NoZWNrb3V0JywgdGFyZ2V0IF0sIGRpcmVjdG9yeSApO1xufTsiXSwibmFtZXMiOlsiZXhlY3V0ZSIsInJlcXVpcmUiLCJkZWZhdWx0IiwiYXNzZXJ0Iiwid2luc3RvbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJnaXRDaGVja291dERpcmVjdG9yeSIsInRhcmdldCIsImRpcmVjdG9yeSIsImluZm8iXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7OztDQUlDLEdBRUQsTUFBTUEsVUFBVUMsUUFBUyxhQUFjQyxPQUFPO0FBQzlDLE1BQU1DLFNBQVNGLFFBQVM7QUFDeEIsTUFBTUcsVUFBVUgsUUFBUztBQUV6Qjs7Ozs7Ozs7Q0FRQyxHQUNESSxPQUFPQyxPQUFPLEdBQUcsU0FBU0MscUJBQXNCQyxNQUFNLEVBQUVDLFNBQVM7SUFDL0ROLE9BQVEsT0FBT0ssV0FBVztJQUMxQkwsT0FBUSxPQUFPTSxjQUFjO0lBRTdCTCxRQUFRTSxJQUFJLENBQUUsQ0FBQyxhQUFhLEVBQUVGLE9BQU8sSUFBSSxFQUFFQyxXQUFXO0lBRXRELE9BQU9ULFFBQVMsT0FBTztRQUFFO1FBQVlRO0tBQVEsRUFBRUM7QUFDakQifQ==