// Copyright 2017-2026, University of Colorado Boulder
/**
 * Creates an object that stores information about all dependencies (including their SHAs and current branches)
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ import assert from 'assert';
import { readFileSync } from 'fs';
import execute from '../../../perennial-alias/js/common/execute.js';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import ChipperStringUtils from '../common/ChipperStringUtils.js';
import getPhetLibs from './getPhetLibs.js';
// Our definition of an allowed simName is defined in the buildServer: https://github.com/phetsims/perennial/blob/78025b7ae6064e9ab5260cea5e532f3bf24c3ec8/js/build-server/taskWorker.js#L99-L98
// We don't want to be this strict though, because 3rd parties are allowed to name sims to be whatever they want. So
// for the purposes of dependencies, we just need to make sure it is a name, and not a path.
const simNameRegex = /^[^/]+$/;
/**
 * Returns an object in the dependencies.json format. Keys are repo names (or 'comment'). Repo keys have 'sha' and 'branch' fields.
 *
 * @returns - In the dependencies.json format. JSON.stringify if you want to output to a file
 */ export default async function getDependencies(repo) {
    const packageObject = JSON.parse(readFileSync(`../${repo}/package.json`, 'utf8'));
    const version = packageObject.version;
    // Accumulate dependencies for all brands
    const dependencies = getPhetLibs(repo).filter((dependency)=>dependency !== 'babel'); // Remove babel since it should be kept at main
    // We need to check dependencies for the main brand, so we can know what is guaranteed to be public
    const mainDependencies = getPhetLibs(repo, 'phet').filter((dependency)=>dependency !== 'babel');
    grunt.log.verbose.writeln(`Scanning dependencies from:\n${dependencies.toString()}`);
    const dependenciesInfo = {
        comment: `# ${repo} ${version} ${new Date().toString()}`
    };
    for (const dependency of dependencies){
        assert(!dependenciesInfo.dependency, `there was already a dependency named ${dependency}`);
        if (!simNameRegex.test(dependency)) {
            throw new Error(`Dependency name is not valid: ${dependency}`);
        } else if (!grunt.file.exists(`../${dependency}`)) {
            if (mainDependencies.includes(dependency)) {
                throw new Error(`Dependency not found: ${dependency}`);
            }
            // NOTE NOTE NOTE: This error message is checked for on the perennial build side (it will fail the build). Do NOT change this without changing that.
            grunt.log.warn(`WARNING404: Skipping potentially non-public dependency ${dependency}`);
            continue;
        }
        let sha = null;
        let branch = null;
        try {
            sha = (await execute('git', [
                'rev-parse',
                'HEAD'
            ], `../${dependency}`)).trim();
            branch = (await execute('git', [
                'rev-parse',
                '--abbrev-ref',
                'HEAD'
            ], `../${dependency}`)).trim();
        } catch (e) {
            // We support repos that are not git repositories, see https://github.com/phetsims/chipper/issues/1011
            console.log(`Did not find git information for ${dependency}`);
        }
        grunt.log.verbose.writeln(`${ChipperStringUtils.padString(dependency, 20) + branch} ${sha}`);
        dependenciesInfo[dependency] = {
            sha: sha,
            branch: branch
        };
    }
    return dependenciesInfo;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2pzL2dydW50L2dldERlcGVuZGVuY2llcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBDcmVhdGVzIGFuIG9iamVjdCB0aGF0IHN0b3JlcyBpbmZvcm1hdGlvbiBhYm91dCBhbGwgZGVwZW5kZW5jaWVzIChpbmNsdWRpbmcgdGhlaXIgU0hBcyBhbmQgY3VycmVudCBicmFuY2hlcylcbiAqXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgZXhlY3V0ZSBmcm9tICcuLi8uLi8uLi9wZXJlbm5pYWwtYWxpYXMvanMvY29tbW9uL2V4ZWN1dGUuanMnO1xuaW1wb3J0IGdydW50IGZyb20gJy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9ucG0tZGVwZW5kZW5jaWVzL2dydW50LmpzJztcbmltcG9ydCBDaGlwcGVyU3RyaW5nVXRpbHMgZnJvbSAnLi4vY29tbW9uL0NoaXBwZXJTdHJpbmdVdGlscy5qcyc7XG5pbXBvcnQgZ2V0UGhldExpYnMgZnJvbSAnLi9nZXRQaGV0TGlicy5qcyc7XG5cbi8vIE91ciBkZWZpbml0aW9uIG9mIGFuIGFsbG93ZWQgc2ltTmFtZSBpcyBkZWZpbmVkIGluIHRoZSBidWlsZFNlcnZlcjogaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BlcmVubmlhbC9ibG9iLzc4MDI1YjdhZTYwNjRlOWFiNTI2MGNlYTVlNTMyZjNiZjI0YzNlYzgvanMvYnVpbGQtc2VydmVyL3Rhc2tXb3JrZXIuanMjTDk5LUw5OFxuLy8gV2UgZG9uJ3Qgd2FudCB0byBiZSB0aGlzIHN0cmljdCB0aG91Z2gsIGJlY2F1c2UgM3JkIHBhcnRpZXMgYXJlIGFsbG93ZWQgdG8gbmFtZSBzaW1zIHRvIGJlIHdoYXRldmVyIHRoZXkgd2FudC4gU29cbi8vIGZvciB0aGUgcHVycG9zZXMgb2YgZGVwZW5kZW5jaWVzLCB3ZSBqdXN0IG5lZWQgdG8gbWFrZSBzdXJlIGl0IGlzIGEgbmFtZSwgYW5kIG5vdCBhIHBhdGguXG5jb25zdCBzaW1OYW1lUmVnZXggPSAvXlteL10rJC87XG5cbi8qKlxuICogUmV0dXJucyBhbiBvYmplY3QgaW4gdGhlIGRlcGVuZGVuY2llcy5qc29uIGZvcm1hdC4gS2V5cyBhcmUgcmVwbyBuYW1lcyAob3IgJ2NvbW1lbnQnKS4gUmVwbyBrZXlzIGhhdmUgJ3NoYScgYW5kICdicmFuY2gnIGZpZWxkcy5cbiAqXG4gKiBAcmV0dXJucyAtIEluIHRoZSBkZXBlbmRlbmNpZXMuanNvbiBmb3JtYXQuIEpTT04uc3RyaW5naWZ5IGlmIHlvdSB3YW50IHRvIG91dHB1dCB0byBhIGZpbGVcbiAqL1xuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gZ2V0RGVwZW5kZW5jaWVzKCByZXBvOiBzdHJpbmcgKTogUHJvbWlzZTxvYmplY3Q+IHtcblxuICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gSlNPTi5wYXJzZSggcmVhZEZpbGVTeW5jKCBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gLCAndXRmOCcgKSApO1xuICBjb25zdCB2ZXJzaW9uID0gcGFja2FnZU9iamVjdC52ZXJzaW9uO1xuXG4gIC8vIEFjY3VtdWxhdGUgZGVwZW5kZW5jaWVzIGZvciBhbGwgYnJhbmRzXG4gIGNvbnN0IGRlcGVuZGVuY2llczogc3RyaW5nW10gPSBnZXRQaGV0TGlicyggcmVwbyApLmZpbHRlciggZGVwZW5kZW5jeSA9PiBkZXBlbmRlbmN5ICE9PSAnYmFiZWwnICk7IC8vIFJlbW92ZSBiYWJlbCBzaW5jZSBpdCBzaG91bGQgYmUga2VwdCBhdCBtYWluXG5cbiAgLy8gV2UgbmVlZCB0byBjaGVjayBkZXBlbmRlbmNpZXMgZm9yIHRoZSBtYWluIGJyYW5kLCBzbyB3ZSBjYW4ga25vdyB3aGF0IGlzIGd1YXJhbnRlZWQgdG8gYmUgcHVibGljXG4gIGNvbnN0IG1haW5EZXBlbmRlbmNpZXMgPSBnZXRQaGV0TGlicyggcmVwbywgJ3BoZXQnICkuZmlsdGVyKCBkZXBlbmRlbmN5ID0+IGRlcGVuZGVuY3kgIT09ICdiYWJlbCcgKTtcblxuICBncnVudC5sb2cudmVyYm9zZS53cml0ZWxuKCBgU2Nhbm5pbmcgZGVwZW5kZW5jaWVzIGZyb206XFxuJHtkZXBlbmRlbmNpZXMudG9TdHJpbmcoKX1gICk7XG5cbiAgY29uc3QgZGVwZW5kZW5jaWVzSW5mbzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgY29tbWVudDogYCMgJHtyZXBvfSAke3ZlcnNpb259ICR7bmV3IERhdGUoKS50b1N0cmluZygpfWBcbiAgfTtcblxuICBmb3IgKCBjb25zdCBkZXBlbmRlbmN5IG9mIGRlcGVuZGVuY2llcyApIHtcbiAgICBhc3NlcnQoICFkZXBlbmRlbmNpZXNJbmZvLmRlcGVuZGVuY3ksIGB0aGVyZSB3YXMgYWxyZWFkeSBhIGRlcGVuZGVuY3kgbmFtZWQgJHtkZXBlbmRlbmN5fWAgKTtcblxuICAgIGlmICggIXNpbU5hbWVSZWdleC50ZXN0KCBkZXBlbmRlbmN5ICkgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGBEZXBlbmRlbmN5IG5hbWUgaXMgbm90IHZhbGlkOiAke2RlcGVuZGVuY3l9YCApO1xuICAgIH1cbiAgICBlbHNlIGlmICggIWdydW50LmZpbGUuZXhpc3RzKCBgLi4vJHtkZXBlbmRlbmN5fWAgKSApIHtcbiAgICAgIGlmICggbWFpbkRlcGVuZGVuY2llcy5pbmNsdWRlcyggZGVwZW5kZW5jeSApICkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBEZXBlbmRlbmN5IG5vdCBmb3VuZDogJHtkZXBlbmRlbmN5fWAgKTtcbiAgICAgIH1cblxuICAgICAgLy8gTk9URSBOT1RFIE5PVEU6IFRoaXMgZXJyb3IgbWVzc2FnZSBpcyBjaGVja2VkIGZvciBvbiB0aGUgcGVyZW5uaWFsIGJ1aWxkIHNpZGUgKGl0IHdpbGwgZmFpbCB0aGUgYnVpbGQpLiBEbyBOT1QgY2hhbmdlIHRoaXMgd2l0aG91dCBjaGFuZ2luZyB0aGF0LlxuICAgICAgZ3J1bnQubG9nLndhcm4oIGBXQVJOSU5HNDA0OiBTa2lwcGluZyBwb3RlbnRpYWxseSBub24tcHVibGljIGRlcGVuZGVuY3kgJHtkZXBlbmRlbmN5fWAgKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGxldCBzaGEgPSBudWxsO1xuICAgIGxldCBicmFuY2ggPSBudWxsO1xuXG4gICAgdHJ5IHtcbiAgICAgIHNoYSA9ICggYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFsgJ3Jldi1wYXJzZScsICdIRUFEJyBdLCBgLi4vJHtkZXBlbmRlbmN5fWAgKSApLnRyaW0oKTtcbiAgICAgIGJyYW5jaCA9ICggYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFsgJ3Jldi1wYXJzZScsICctLWFiYnJldi1yZWYnLCAnSEVBRCcgXSwgYC4uLyR7ZGVwZW5kZW5jeX1gICkgKS50cmltKCk7XG4gICAgfVxuICAgIGNhdGNoKCBlICkge1xuICAgICAgLy8gV2Ugc3VwcG9ydCByZXBvcyB0aGF0IGFyZSBub3QgZ2l0IHJlcG9zaXRvcmllcywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy8xMDExXG4gICAgICBjb25zb2xlLmxvZyggYERpZCBub3QgZmluZCBnaXQgaW5mb3JtYXRpb24gZm9yICR7ZGVwZW5kZW5jeX1gICk7XG4gICAgfVxuXG4gICAgZ3J1bnQubG9nLnZlcmJvc2Uud3JpdGVsbiggYCR7Q2hpcHBlclN0cmluZ1V0aWxzLnBhZFN0cmluZyggZGVwZW5kZW5jeSwgMjAgKSArIGJyYW5jaH0gJHtzaGF9YCApO1xuICAgIGRlcGVuZGVuY2llc0luZm9bIGRlcGVuZGVuY3kgXSA9IHsgc2hhOiBzaGEsIGJyYW5jaDogYnJhbmNoIH07XG4gIH1cblxuICByZXR1cm4gZGVwZW5kZW5jaWVzSW5mbztcbn0iXSwibmFtZXMiOlsiYXNzZXJ0IiwicmVhZEZpbGVTeW5jIiwiZXhlY3V0ZSIsImdydW50IiwiQ2hpcHBlclN0cmluZ1V0aWxzIiwiZ2V0UGhldExpYnMiLCJzaW1OYW1lUmVnZXgiLCJnZXREZXBlbmRlbmNpZXMiLCJyZXBvIiwicGFja2FnZU9iamVjdCIsIkpTT04iLCJwYXJzZSIsInZlcnNpb24iLCJkZXBlbmRlbmNpZXMiLCJmaWx0ZXIiLCJkZXBlbmRlbmN5IiwibWFpbkRlcGVuZGVuY2llcyIsImxvZyIsInZlcmJvc2UiLCJ3cml0ZWxuIiwidG9TdHJpbmciLCJkZXBlbmRlbmNpZXNJbmZvIiwiY29tbWVudCIsIkRhdGUiLCJ0ZXN0IiwiRXJyb3IiLCJmaWxlIiwiZXhpc3RzIiwiaW5jbHVkZXMiLCJ3YXJuIiwic2hhIiwiYnJhbmNoIiwidHJpbSIsImUiLCJjb25zb2xlIiwicGFkU3RyaW5nIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7O0NBS0MsR0FFRCxPQUFPQSxZQUFZLFNBQVM7QUFDNUIsU0FBU0MsWUFBWSxRQUFRLEtBQUs7QUFDbEMsT0FBT0MsYUFBYSxnREFBZ0Q7QUFDcEUsT0FBT0MsV0FBVyx3REFBd0Q7QUFDMUUsT0FBT0Msd0JBQXdCLGtDQUFrQztBQUNqRSxPQUFPQyxpQkFBaUIsbUJBQW1CO0FBRTNDLGdNQUFnTTtBQUNoTSxvSEFBb0g7QUFDcEgsNEZBQTRGO0FBQzVGLE1BQU1DLGVBQWU7QUFFckI7Ozs7Q0FJQyxHQUNELGVBQWUsZUFBZUMsZ0JBQWlCQyxJQUFZO0lBRXpELE1BQU1DLGdCQUFnQkMsS0FBS0MsS0FBSyxDQUFFVixhQUFjLENBQUMsR0FBRyxFQUFFTyxLQUFLLGFBQWEsQ0FBQyxFQUFFO0lBQzNFLE1BQU1JLFVBQVVILGNBQWNHLE9BQU87SUFFckMseUNBQXlDO0lBQ3pDLE1BQU1DLGVBQXlCUixZQUFhRyxNQUFPTSxNQUFNLENBQUVDLENBQUFBLGFBQWNBLGVBQWUsVUFBVywrQ0FBK0M7SUFFbEosbUdBQW1HO0lBQ25HLE1BQU1DLG1CQUFtQlgsWUFBYUcsTUFBTSxRQUFTTSxNQUFNLENBQUVDLENBQUFBLGFBQWNBLGVBQWU7SUFFMUZaLE1BQU1jLEdBQUcsQ0FBQ0MsT0FBTyxDQUFDQyxPQUFPLENBQUUsQ0FBQyw2QkFBNkIsRUFBRU4sYUFBYU8sUUFBUSxJQUFJO0lBRXBGLE1BQU1DLG1CQUE0QztRQUNoREMsU0FBUyxDQUFDLEVBQUUsRUFBRWQsS0FBSyxDQUFDLEVBQUVJLFFBQVEsQ0FBQyxFQUFFLElBQUlXLE9BQU9ILFFBQVEsSUFBSTtJQUMxRDtJQUVBLEtBQU0sTUFBTUwsY0FBY0YsYUFBZTtRQUN2Q2IsT0FBUSxDQUFDcUIsaUJBQWlCTixVQUFVLEVBQUUsQ0FBQyxxQ0FBcUMsRUFBRUEsWUFBWTtRQUUxRixJQUFLLENBQUNULGFBQWFrQixJQUFJLENBQUVULGFBQWU7WUFDdEMsTUFBTSxJQUFJVSxNQUFPLENBQUMsOEJBQThCLEVBQUVWLFlBQVk7UUFDaEUsT0FDSyxJQUFLLENBQUNaLE1BQU11QixJQUFJLENBQUNDLE1BQU0sQ0FBRSxDQUFDLEdBQUcsRUFBRVosWUFBWSxHQUFLO1lBQ25ELElBQUtDLGlCQUFpQlksUUFBUSxDQUFFYixhQUFlO2dCQUM3QyxNQUFNLElBQUlVLE1BQU8sQ0FBQyxzQkFBc0IsRUFBRVYsWUFBWTtZQUN4RDtZQUVBLG9KQUFvSjtZQUNwSlosTUFBTWMsR0FBRyxDQUFDWSxJQUFJLENBQUUsQ0FBQyx1REFBdUQsRUFBRWQsWUFBWTtZQUN0RjtRQUNGO1FBRUEsSUFBSWUsTUFBTTtRQUNWLElBQUlDLFNBQVM7UUFFYixJQUFJO1lBQ0ZELE1BQU0sQUFBRSxDQUFBLE1BQU01QixRQUFTLE9BQU87Z0JBQUU7Z0JBQWE7YUFBUSxFQUFFLENBQUMsR0FBRyxFQUFFYSxZQUFZLENBQUMsRUFBSWlCLElBQUk7WUFDbEZELFNBQVMsQUFBRSxDQUFBLE1BQU03QixRQUFTLE9BQU87Z0JBQUU7Z0JBQWE7Z0JBQWdCO2FBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRWEsWUFBWSxDQUFDLEVBQUlpQixJQUFJO1FBQ3ZHLEVBQ0EsT0FBT0MsR0FBSTtZQUNULHNHQUFzRztZQUN0R0MsUUFBUWpCLEdBQUcsQ0FBRSxDQUFDLGlDQUFpQyxFQUFFRixZQUFZO1FBQy9EO1FBRUFaLE1BQU1jLEdBQUcsQ0FBQ0MsT0FBTyxDQUFDQyxPQUFPLENBQUUsR0FBR2YsbUJBQW1CK0IsU0FBUyxDQUFFcEIsWUFBWSxNQUFPZ0IsT0FBTyxDQUFDLEVBQUVELEtBQUs7UUFDOUZULGdCQUFnQixDQUFFTixXQUFZLEdBQUc7WUFBRWUsS0FBS0E7WUFBS0MsUUFBUUE7UUFBTztJQUM5RDtJQUVBLE9BQU9WO0FBQ1QifQ==