// Copyright 2024, University of Colorado Boulder
/**
 * This grunt task checks out main for all sims. Useful in some cases where different shas with conflicting dependencies are checked out.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */ const _ = require('lodash');
const grunt = require('grunt');
import child_process from 'child_process';
import getOption from './util/getOption.js';
function checkoutMainAll(branch = 'main') {
    return new Promise((resolve)=>{
        const command = `git checkout ${branch}`;
        const potentialGitRoots = grunt.file.expand({
            cwd: '../'
        }, '*');
        const finished = _.after(potentialGitRoots.length, resolve);
        for(let i = 0; i < potentialGitRoots.length; i++){
            const filename = potentialGitRoots[i]; // Don't change to const without rewrapping usages in the closure
            const repoPath = `../${filename}`;
            const cwd = {
                cwd: repoPath
            };
            if (filename !== 'babel' && // Always on main
            grunt.file.isDir(repoPath) && // Is a directory
            grunt.file.exists(`${repoPath}/.git`) && // Is a git repo
            // Only checkout branch if it exists, don't create a new one.
            (branch === 'main' || child_process.execSync(`git branch --list ${branch}`, cwd).toString().length > 0)) {
                child_process.exec(command, cwd, (error)=>{
                    if (error) {
                        grunt.log.writeln(`error in ${command} for repo ${filename}`);
                    }
                    finished();
                });
            } else {
                finished();
            }
        }
    });
}
(async ()=>checkoutMainAll(getOption('branch')))();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9ncnVudC90YXNrcy9jaGVja291dC1tYWluLWFsbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogVGhpcyBncnVudCB0YXNrIGNoZWNrcyBvdXQgbWFpbiBmb3IgYWxsIHNpbXMuIFVzZWZ1bCBpbiBzb21lIGNhc2VzIHdoZXJlIGRpZmZlcmVudCBzaGFzIHdpdGggY29uZmxpY3RpbmcgZGVwZW5kZW5jaWVzIGFyZSBjaGVja2VkIG91dC5cbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBfID0gcmVxdWlyZSggJ2xvZGFzaCcgKTtcbmNvbnN0IGdydW50ID0gcmVxdWlyZSggJ2dydW50JyApO1xuXG5pbXBvcnQgY2hpbGRfcHJvY2VzcyBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBnZXRPcHRpb24gZnJvbSAnLi91dGlsL2dldE9wdGlvbi5qcyc7XG5cbmZ1bmN0aW9uIGNoZWNrb3V0TWFpbkFsbCggYnJhbmNoID0gJ21haW4nICk6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoIHJlc29sdmUgPT4ge1xuXG4gICAgY29uc3QgY29tbWFuZCA9IGBnaXQgY2hlY2tvdXQgJHticmFuY2h9YDtcblxuICAgIGNvbnN0IHBvdGVudGlhbEdpdFJvb3RzID0gZ3J1bnQuZmlsZS5leHBhbmQoIHsgY3dkOiAnLi4vJyB9LCAnKicgKTtcbiAgICBjb25zdCBmaW5pc2hlZCA9IF8uYWZ0ZXIoIHBvdGVudGlhbEdpdFJvb3RzLmxlbmd0aCwgcmVzb2x2ZSApO1xuXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgcG90ZW50aWFsR2l0Um9vdHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICBjb25zdCBmaWxlbmFtZSA9IHBvdGVudGlhbEdpdFJvb3RzWyBpIF07IC8vIERvbid0IGNoYW5nZSB0byBjb25zdCB3aXRob3V0IHJld3JhcHBpbmcgdXNhZ2VzIGluIHRoZSBjbG9zdXJlXG4gICAgICBjb25zdCByZXBvUGF0aCA9IGAuLi8ke2ZpbGVuYW1lfWA7XG4gICAgICBjb25zdCBjd2QgPSB7IGN3ZDogcmVwb1BhdGggfTtcbiAgICAgIGlmICggZmlsZW5hbWUgIT09ICdiYWJlbCcgJiYgLy8gQWx3YXlzIG9uIG1haW5cbiAgICAgICAgICAgZ3J1bnQuZmlsZS5pc0RpciggcmVwb1BhdGggKSAmJiAvLyBJcyBhIGRpcmVjdG9yeVxuICAgICAgICAgICBncnVudC5maWxlLmV4aXN0cyggYCR7cmVwb1BhdGh9Ly5naXRgICkgJiYgLy8gSXMgYSBnaXQgcmVwb1xuXG4gICAgICAgICAgIC8vIE9ubHkgY2hlY2tvdXQgYnJhbmNoIGlmIGl0IGV4aXN0cywgZG9uJ3QgY3JlYXRlIGEgbmV3IG9uZS5cbiAgICAgICAgICAgKCBicmFuY2ggPT09ICdtYWluJyB8fCBjaGlsZF9wcm9jZXNzLmV4ZWNTeW5jKCBgZ2l0IGJyYW5jaCAtLWxpc3QgJHticmFuY2h9YCwgY3dkICkudG9TdHJpbmcoKS5sZW5ndGggPiAwICkgKSB7XG4gICAgICAgIGNoaWxkX3Byb2Nlc3MuZXhlYyggY29tbWFuZCwgY3dkLCBlcnJvciA9PiB7XG4gICAgICAgICAgaWYgKCBlcnJvciApIHtcbiAgICAgICAgICAgIGdydW50LmxvZy53cml0ZWxuKCBgZXJyb3IgaW4gJHtjb21tYW5kfSBmb3IgcmVwbyAke2ZpbGVuYW1lfWAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZmluaXNoZWQoKTtcbiAgICAgICAgfSApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGZpbmlzaGVkKCk7XG4gICAgICB9XG4gICAgfVxuICB9ICk7XG59XG5cbiggYXN5bmMgKCkgPT4gY2hlY2tvdXRNYWluQWxsKCBnZXRPcHRpb24oICdicmFuY2gnICkgKSApKCk7Il0sIm5hbWVzIjpbIl8iLCJyZXF1aXJlIiwiZ3J1bnQiLCJjaGlsZF9wcm9jZXNzIiwiZ2V0T3B0aW9uIiwiY2hlY2tvdXRNYWluQWxsIiwiYnJhbmNoIiwiUHJvbWlzZSIsInJlc29sdmUiLCJjb21tYW5kIiwicG90ZW50aWFsR2l0Um9vdHMiLCJmaWxlIiwiZXhwYW5kIiwiY3dkIiwiZmluaXNoZWQiLCJhZnRlciIsImxlbmd0aCIsImkiLCJmaWxlbmFtZSIsInJlcG9QYXRoIiwiaXNEaXIiLCJleGlzdHMiLCJleGVjU3luYyIsInRvU3RyaW5nIiwiZXhlYyIsImVycm9yIiwibG9nIiwid3JpdGVsbiJdLCJtYXBwaW5ncyI6IkFBQUEsaURBQWlEO0FBRWpEOzs7Q0FHQyxHQUVELE1BQU1BLElBQUlDLFFBQVM7QUFDbkIsTUFBTUMsUUFBUUQsUUFBUztBQUV2QixPQUFPRSxtQkFBbUIsZ0JBQWdCO0FBQzFDLE9BQU9DLGVBQWUsc0JBQXNCO0FBRTVDLFNBQVNDLGdCQUFpQkMsU0FBUyxNQUFNO0lBQ3ZDLE9BQU8sSUFBSUMsUUFBU0MsQ0FBQUE7UUFFbEIsTUFBTUMsVUFBVSxDQUFDLGFBQWEsRUFBRUgsUUFBUTtRQUV4QyxNQUFNSSxvQkFBb0JSLE1BQU1TLElBQUksQ0FBQ0MsTUFBTSxDQUFFO1lBQUVDLEtBQUs7UUFBTSxHQUFHO1FBQzdELE1BQU1DLFdBQVdkLEVBQUVlLEtBQUssQ0FBRUwsa0JBQWtCTSxNQUFNLEVBQUVSO1FBRXBELElBQU0sSUFBSVMsSUFBSSxHQUFHQSxJQUFJUCxrQkFBa0JNLE1BQU0sRUFBRUMsSUFBTTtZQUNuRCxNQUFNQyxXQUFXUixpQkFBaUIsQ0FBRU8sRUFBRyxFQUFFLGlFQUFpRTtZQUMxRyxNQUFNRSxXQUFXLENBQUMsR0FBRyxFQUFFRCxVQUFVO1lBQ2pDLE1BQU1MLE1BQU07Z0JBQUVBLEtBQUtNO1lBQVM7WUFDNUIsSUFBS0QsYUFBYSxXQUFXLGlCQUFpQjtZQUN6Q2hCLE1BQU1TLElBQUksQ0FBQ1MsS0FBSyxDQUFFRCxhQUFjLGlCQUFpQjtZQUNqRGpCLE1BQU1TLElBQUksQ0FBQ1UsTUFBTSxDQUFFLEdBQUdGLFNBQVMsS0FBSyxDQUFDLEtBQU0sZ0JBQWdCO1lBRTNELDZEQUE2RDtZQUMzRGIsQ0FBQUEsV0FBVyxVQUFVSCxjQUFjbUIsUUFBUSxDQUFFLENBQUMsa0JBQWtCLEVBQUVoQixRQUFRLEVBQUVPLEtBQU1VLFFBQVEsR0FBR1AsTUFBTSxHQUFHLENBQUEsR0FBTTtnQkFDakhiLGNBQWNxQixJQUFJLENBQUVmLFNBQVNJLEtBQUtZLENBQUFBO29CQUNoQyxJQUFLQSxPQUFRO3dCQUNYdkIsTUFBTXdCLEdBQUcsQ0FBQ0MsT0FBTyxDQUFFLENBQUMsU0FBUyxFQUFFbEIsUUFBUSxVQUFVLEVBQUVTLFVBQVU7b0JBQy9EO29CQUNBSjtnQkFDRjtZQUNGLE9BQ0s7Z0JBQ0hBO1lBQ0Y7UUFDRjtJQUNGO0FBQ0Y7QUFFRSxDQUFBLFVBQVlULGdCQUFpQkQsVUFBVyxVQUFXIn0=