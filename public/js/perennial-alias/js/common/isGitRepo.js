// Copyright 2023, University of Colorado Boulder
/**
 * Checks to see if the git repo is initialized.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */ const execute = require('./execute').default;
module.exports = async function(repo) {
    try {
        // an arbitrary command that will fail if the repo is not initialized
        await execute('git', [
            'status'
        ], `../${repo}`);
        return true;
    } catch (error) {
        return false;
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vaXNHaXRSZXBvLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBDaGVja3MgdG8gc2VlIGlmIHRoZSBnaXQgcmVwbyBpcyBpbml0aWFsaXplZC5cbiAqXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICkuZGVmYXVsdDtcblxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggcmVwbyApIHtcbiAgdHJ5IHtcblxuICAgIC8vIGFuIGFyYml0cmFyeSBjb21tYW5kIHRoYXQgd2lsbCBmYWlsIGlmIHRoZSByZXBvIGlzIG5vdCBpbml0aWFsaXplZFxuICAgIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdzdGF0dXMnIF0sIGAuLi8ke3JlcG99YCApO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGNhdGNoKCBlcnJvciApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07Il0sIm5hbWVzIjpbImV4ZWN1dGUiLCJyZXF1aXJlIiwiZGVmYXVsdCIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwiZXJyb3IiXSwibWFwcGluZ3MiOiJBQUFBLGlEQUFpRDtBQUVqRDs7OztDQUlDLEdBQ0QsTUFBTUEsVUFBVUMsUUFBUyxhQUFjQyxPQUFPO0FBRTlDQyxPQUFPQyxPQUFPLEdBQUcsZUFBZ0JDLElBQUk7SUFDbkMsSUFBSTtRQUVGLHFFQUFxRTtRQUNyRSxNQUFNTCxRQUFTLE9BQU87WUFBRTtTQUFVLEVBQUUsQ0FBQyxHQUFHLEVBQUVLLE1BQU07UUFDaEQsT0FBTztJQUNULEVBQ0EsT0FBT0MsT0FBUTtRQUNiLE9BQU87SUFDVDtBQUNGIn0=