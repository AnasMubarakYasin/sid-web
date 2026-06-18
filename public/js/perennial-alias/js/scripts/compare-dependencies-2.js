// Copyright 2021, University of Colorado Boulder
/**
 * Compare the commits between two dependencies.json files, and print out the commits that are different.
 *
 * USAGE:
 * cd perennial
 * sage run js/scripts/compare-dependencies-2.js ../mysim/dependenciesOLD.json ../mysim/dependencies.json
 *
 * NOTES: The old dependencies.json must be specified first. Also, keep in mind you may want to do a fresh build to get
 * an updated dependencies.json if you are trying to compare to main.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */ const fs = require('fs');
const _ = require('lodash');
// Parse the command line arguments
const args = process.argv.slice(2);
// The first command line argument is the first project for comparison
const project1 = args[0];
// The second command line argument is the second project for comparison
const project2 = args[1];
const dependencies1 = JSON.parse(fs.readFileSync(project1));
const dependencies2 = JSON.parse(fs.readFileSync(project2));
const allKeys = _.uniq([
    ...Object.keys(dependencies1),
    ...Object.keys(dependencies2)
].filter((repo)=>repo !== 'comment'));
const issues = new Set();
let commitCount = 0;
// Iterate over the keys they have in common
allKeys.forEach((repo)=>{
    // If the key is in dependencies two
    if (dependencies1[repo] && dependencies2[repo]) {
        // Print the key and the version
        // console.log( `${repo} ${dependencies1[ repo ].sha} ${dependencies2[ repo ].sha}` );
        // If the shas are the same, print a message to the console that the shas are the same
        if (dependencies1[repo].sha === dependencies2[repo].sha) {
            console.log(`# ${repo}`);
            console.log('SHAs are the same');
            console.log();
        } else {
            // We know the shas are different, and we want to compare them using `git log --oneline --ancestry-path`
            const command = `git -C ../${repo} log --oneline --ancestry-path ${dependencies1[repo].sha}..${dependencies2[repo].sha}`;
            // Run that command synchronously
            const buffer = require('child_process').execSync(command);
            // Convert the buffer to a string and print it out
            console.log(`# ${repo}`);
            const bufferString = buffer.toString();
            console.log(bufferString);
            // Split the buffer string into lines
            const lines = bufferString.split('\n');
            // console.log( lines.length );
            lines.forEach((line)=>{
                // If the line contains https://github.com/phetsims/ then add it to the set.
                if (line.includes('https://github.com/phetsims/') && !line.includes('Merge branch \'main\'')) {
                    // Find the URL in line using a regular expression
                    const url = line.substring(line.indexOf('https://github.com/phetsims/'));
                    issues.add(url);
                }
                if (line.trim().length > 0) {
                    commitCount++;
                }
            });
        }
    } else {
        console.log(`# ${repo}`);
        console.log(`Did not appear in both dependencies. project1=${dependencies1[repo]}, project2=${dependencies2[repo]}`);
        console.log();
    }
});
console.log('Discovered issues:');
console.log(Array.from(issues).sort().join('\n'));
console.log(`${commitCount} commits referenced ${issues.size} separate issues`);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL2NvbXBhcmUtZGVwZW5kZW5jaWVzLTIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuLyoqXG4gKiBDb21wYXJlIHRoZSBjb21taXRzIGJldHdlZW4gdHdvIGRlcGVuZGVuY2llcy5qc29uIGZpbGVzLCBhbmQgcHJpbnQgb3V0IHRoZSBjb21taXRzIHRoYXQgYXJlIGRpZmZlcmVudC5cbiAqXG4gKiBVU0FHRTpcbiAqIGNkIHBlcmVubmlhbFxuICogc2FnZSBydW4ganMvc2NyaXB0cy9jb21wYXJlLWRlcGVuZGVuY2llcy0yLmpzIC4uL215c2ltL2RlcGVuZGVuY2llc09MRC5qc29uIC4uL215c2ltL2RlcGVuZGVuY2llcy5qc29uXG4gKlxuICogTk9URVM6IFRoZSBvbGQgZGVwZW5kZW5jaWVzLmpzb24gbXVzdCBiZSBzcGVjaWZpZWQgZmlyc3QuIEFsc28sIGtlZXAgaW4gbWluZCB5b3UgbWF5IHdhbnQgdG8gZG8gYSBmcmVzaCBidWlsZCB0byBnZXRcbiAqIGFuIHVwZGF0ZWQgZGVwZW5kZW5jaWVzLmpzb24gaWYgeW91IGFyZSB0cnlpbmcgdG8gY29tcGFyZSB0byBtYWluLlxuICpcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XG5cbi8vIFBhcnNlIHRoZSBjb21tYW5kIGxpbmUgYXJndW1lbnRzXG5jb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKCAyICk7XG5cbi8vIFRoZSBmaXJzdCBjb21tYW5kIGxpbmUgYXJndW1lbnQgaXMgdGhlIGZpcnN0IHByb2plY3QgZm9yIGNvbXBhcmlzb25cbmNvbnN0IHByb2plY3QxID0gYXJnc1sgMCBdO1xuXG4vLyBUaGUgc2Vjb25kIGNvbW1hbmQgbGluZSBhcmd1bWVudCBpcyB0aGUgc2Vjb25kIHByb2plY3QgZm9yIGNvbXBhcmlzb25cbmNvbnN0IHByb2plY3QyID0gYXJnc1sgMSBdO1xuXG5jb25zdCBkZXBlbmRlbmNpZXMxID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBwcm9qZWN0MSApICk7XG5jb25zdCBkZXBlbmRlbmNpZXMyID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBwcm9qZWN0MiApICk7XG5cbmNvbnN0IGFsbEtleXMgPSBfLnVuaXEoIFsgLi4uT2JqZWN0LmtleXMoIGRlcGVuZGVuY2llczEgKSwgLi4uT2JqZWN0LmtleXMoIGRlcGVuZGVuY2llczIgKSBdLmZpbHRlciggcmVwbyA9PiByZXBvICE9PSAnY29tbWVudCcgKSApO1xuXG5jb25zdCBpc3N1ZXMgPSBuZXcgU2V0KCk7XG5sZXQgY29tbWl0Q291bnQgPSAwO1xuXG4vLyBJdGVyYXRlIG92ZXIgdGhlIGtleXMgdGhleSBoYXZlIGluIGNvbW1vblxuYWxsS2V5cy5mb3JFYWNoKCByZXBvID0+IHtcblxuICAvLyBJZiB0aGUga2V5IGlzIGluIGRlcGVuZGVuY2llcyB0d29cbiAgaWYgKCBkZXBlbmRlbmNpZXMxWyByZXBvIF0gJiYgZGVwZW5kZW5jaWVzMlsgcmVwbyBdICkge1xuXG4gICAgLy8gUHJpbnQgdGhlIGtleSBhbmQgdGhlIHZlcnNpb25cbiAgICAvLyBjb25zb2xlLmxvZyggYCR7cmVwb30gJHtkZXBlbmRlbmNpZXMxWyByZXBvIF0uc2hhfSAke2RlcGVuZGVuY2llczJbIHJlcG8gXS5zaGF9YCApO1xuXG4gICAgLy8gSWYgdGhlIHNoYXMgYXJlIHRoZSBzYW1lLCBwcmludCBhIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUgdGhhdCB0aGUgc2hhcyBhcmUgdGhlIHNhbWVcbiAgICBpZiAoIGRlcGVuZGVuY2llczFbIHJlcG8gXS5zaGEgPT09IGRlcGVuZGVuY2llczJbIHJlcG8gXS5zaGEgKSB7XG4gICAgICBjb25zb2xlLmxvZyggYCMgJHtyZXBvfWAgKTtcbiAgICAgIGNvbnNvbGUubG9nKCAnU0hBcyBhcmUgdGhlIHNhbWUnICk7XG4gICAgICBjb25zb2xlLmxvZygpO1xuICAgIH1cbiAgICBlbHNlIHtcblxuICAgICAgLy8gV2Uga25vdyB0aGUgc2hhcyBhcmUgZGlmZmVyZW50LCBhbmQgd2Ugd2FudCB0byBjb21wYXJlIHRoZW0gdXNpbmcgYGdpdCBsb2cgLS1vbmVsaW5lIC0tYW5jZXN0cnktcGF0aGBcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBgZ2l0IC1DIC4uLyR7cmVwb30gbG9nIC0tb25lbGluZSAtLWFuY2VzdHJ5LXBhdGggJHtkZXBlbmRlbmNpZXMxWyByZXBvIF0uc2hhfS4uJHtkZXBlbmRlbmNpZXMyWyByZXBvIF0uc2hhfWA7XG5cbiAgICAgIC8vIFJ1biB0aGF0IGNvbW1hbmQgc3luY2hyb25vdXNseVxuICAgICAgY29uc3QgYnVmZmVyID0gcmVxdWlyZSggJ2NoaWxkX3Byb2Nlc3MnICkuZXhlY1N5bmMoIGNvbW1hbmQgKTtcblxuICAgICAgLy8gQ29udmVydCB0aGUgYnVmZmVyIHRvIGEgc3RyaW5nIGFuZCBwcmludCBpdCBvdXRcbiAgICAgIGNvbnNvbGUubG9nKCBgIyAke3JlcG99YCApO1xuICAgICAgY29uc3QgYnVmZmVyU3RyaW5nID0gYnVmZmVyLnRvU3RyaW5nKCk7XG4gICAgICBjb25zb2xlLmxvZyggYnVmZmVyU3RyaW5nICk7XG5cbiAgICAgIC8vIFNwbGl0IHRoZSBidWZmZXIgc3RyaW5nIGludG8gbGluZXNcbiAgICAgIGNvbnN0IGxpbmVzID0gYnVmZmVyU3RyaW5nLnNwbGl0KCAnXFxuJyApO1xuICAgICAgLy8gY29uc29sZS5sb2coIGxpbmVzLmxlbmd0aCApO1xuICAgICAgbGluZXMuZm9yRWFjaCggbGluZSA9PiB7XG5cbiAgICAgICAgLy8gSWYgdGhlIGxpbmUgY29udGFpbnMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zLyB0aGVuIGFkZCBpdCB0byB0aGUgc2V0LlxuICAgICAgICBpZiAoIGxpbmUuaW5jbHVkZXMoICdodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvJyApICYmICFsaW5lLmluY2x1ZGVzKCAnTWVyZ2UgYnJhbmNoIFxcJ21haW5cXCcnICkgKSB7XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBVUkwgaW4gbGluZSB1c2luZyBhIHJlZ3VsYXIgZXhwcmVzc2lvblxuICAgICAgICAgIGNvbnN0IHVybCA9IGxpbmUuc3Vic3RyaW5nKCBsaW5lLmluZGV4T2YoICdodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvJyApICk7XG5cbiAgICAgICAgICBpc3N1ZXMuYWRkKCB1cmwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggbGluZS50cmltKCkubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICBjb21taXRDb3VudCsrO1xuICAgICAgICB9XG4gICAgICB9ICk7XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCBgIyAke3JlcG99YCApO1xuICAgIGNvbnNvbGUubG9nKCBgRGlkIG5vdCBhcHBlYXIgaW4gYm90aCBkZXBlbmRlbmNpZXMuIHByb2plY3QxPSR7ZGVwZW5kZW5jaWVzMVsgcmVwbyBdfSwgcHJvamVjdDI9JHtkZXBlbmRlbmNpZXMyWyByZXBvIF19YCApO1xuICAgIGNvbnNvbGUubG9nKCk7XG4gIH1cbn0gKTtcblxuY29uc29sZS5sb2coICdEaXNjb3ZlcmVkIGlzc3VlczonICk7XG5jb25zb2xlLmxvZyggQXJyYXkuZnJvbSggaXNzdWVzICkuc29ydCgpLmpvaW4oICdcXG4nICkgKTtcblxuY29uc29sZS5sb2coIGAke2NvbW1pdENvdW50fSBjb21taXRzIHJlZmVyZW5jZWQgJHtpc3N1ZXMuc2l6ZX0gc2VwYXJhdGUgaXNzdWVzYCApOyJdLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJfIiwiYXJncyIsInByb2Nlc3MiLCJhcmd2Iiwic2xpY2UiLCJwcm9qZWN0MSIsInByb2plY3QyIiwiZGVwZW5kZW5jaWVzMSIsIkpTT04iLCJwYXJzZSIsInJlYWRGaWxlU3luYyIsImRlcGVuZGVuY2llczIiLCJhbGxLZXlzIiwidW5pcSIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJyZXBvIiwiaXNzdWVzIiwiU2V0IiwiY29tbWl0Q291bnQiLCJmb3JFYWNoIiwic2hhIiwiY29uc29sZSIsImxvZyIsImNvbW1hbmQiLCJidWZmZXIiLCJleGVjU3luYyIsImJ1ZmZlclN0cmluZyIsInRvU3RyaW5nIiwibGluZXMiLCJzcGxpdCIsImxpbmUiLCJpbmNsdWRlcyIsInVybCIsInN1YnN0cmluZyIsImluZGV4T2YiLCJhZGQiLCJ0cmltIiwibGVuZ3RoIiwiQXJyYXkiLCJmcm9tIiwic29ydCIsImpvaW4iLCJzaXplIl0sIm1hcHBpbmdzIjoiQUFBQSxpREFBaUQ7QUFDakQ7Ozs7Ozs7Ozs7O0NBV0MsR0FDRCxNQUFNQSxLQUFLQyxRQUFTO0FBQ3BCLE1BQU1DLElBQUlELFFBQVM7QUFFbkIsbUNBQW1DO0FBQ25DLE1BQU1FLE9BQU9DLFFBQVFDLElBQUksQ0FBQ0MsS0FBSyxDQUFFO0FBRWpDLHNFQUFzRTtBQUN0RSxNQUFNQyxXQUFXSixJQUFJLENBQUUsRUFBRztBQUUxQix3RUFBd0U7QUFDeEUsTUFBTUssV0FBV0wsSUFBSSxDQUFFLEVBQUc7QUFFMUIsTUFBTU0sZ0JBQWdCQyxLQUFLQyxLQUFLLENBQUVYLEdBQUdZLFlBQVksQ0FBRUw7QUFDbkQsTUFBTU0sZ0JBQWdCSCxLQUFLQyxLQUFLLENBQUVYLEdBQUdZLFlBQVksQ0FBRUo7QUFFbkQsTUFBTU0sVUFBVVosRUFBRWEsSUFBSSxDQUFFO09BQUtDLE9BQU9DLElBQUksQ0FBRVI7T0FBb0JPLE9BQU9DLElBQUksQ0FBRUo7Q0FBaUIsQ0FBQ0ssTUFBTSxDQUFFQyxDQUFBQSxPQUFRQSxTQUFTO0FBRXRILE1BQU1DLFNBQVMsSUFBSUM7QUFDbkIsSUFBSUMsY0FBYztBQUVsQiw0Q0FBNEM7QUFDNUNSLFFBQVFTLE9BQU8sQ0FBRUosQ0FBQUE7SUFFZixvQ0FBb0M7SUFDcEMsSUFBS1YsYUFBYSxDQUFFVSxLQUFNLElBQUlOLGFBQWEsQ0FBRU0sS0FBTSxFQUFHO1FBRXBELGdDQUFnQztRQUNoQyxzRkFBc0Y7UUFFdEYsc0ZBQXNGO1FBQ3RGLElBQUtWLGFBQWEsQ0FBRVUsS0FBTSxDQUFDSyxHQUFHLEtBQUtYLGFBQWEsQ0FBRU0sS0FBTSxDQUFDSyxHQUFHLEVBQUc7WUFDN0RDLFFBQVFDLEdBQUcsQ0FBRSxDQUFDLEVBQUUsRUFBRVAsTUFBTTtZQUN4Qk0sUUFBUUMsR0FBRyxDQUFFO1lBQ2JELFFBQVFDLEdBQUc7UUFDYixPQUNLO1lBRUgsd0dBQXdHO1lBQ3hHLE1BQU1DLFVBQVUsQ0FBQyxVQUFVLEVBQUVSLEtBQUssK0JBQStCLEVBQUVWLGFBQWEsQ0FBRVUsS0FBTSxDQUFDSyxHQUFHLENBQUMsRUFBRSxFQUFFWCxhQUFhLENBQUVNLEtBQU0sQ0FBQ0ssR0FBRyxFQUFFO1lBRTVILGlDQUFpQztZQUNqQyxNQUFNSSxTQUFTM0IsUUFBUyxpQkFBa0I0QixRQUFRLENBQUVGO1lBRXBELGtEQUFrRDtZQUNsREYsUUFBUUMsR0FBRyxDQUFFLENBQUMsRUFBRSxFQUFFUCxNQUFNO1lBQ3hCLE1BQU1XLGVBQWVGLE9BQU9HLFFBQVE7WUFDcENOLFFBQVFDLEdBQUcsQ0FBRUk7WUFFYixxQ0FBcUM7WUFDckMsTUFBTUUsUUFBUUYsYUFBYUcsS0FBSyxDQUFFO1lBQ2xDLCtCQUErQjtZQUMvQkQsTUFBTVQsT0FBTyxDQUFFVyxDQUFBQTtnQkFFYiw0RUFBNEU7Z0JBQzVFLElBQUtBLEtBQUtDLFFBQVEsQ0FBRSxtQ0FBb0MsQ0FBQ0QsS0FBS0MsUUFBUSxDQUFFLDBCQUE0QjtvQkFFbEcsa0RBQWtEO29CQUNsRCxNQUFNQyxNQUFNRixLQUFLRyxTQUFTLENBQUVILEtBQUtJLE9BQU8sQ0FBRTtvQkFFMUNsQixPQUFPbUIsR0FBRyxDQUFFSDtnQkFDZDtnQkFFQSxJQUFLRixLQUFLTSxJQUFJLEdBQUdDLE1BQU0sR0FBRyxHQUFJO29CQUM1Qm5CO2dCQUNGO1lBQ0Y7UUFDRjtJQUNGLE9BQ0s7UUFDSEcsUUFBUUMsR0FBRyxDQUFFLENBQUMsRUFBRSxFQUFFUCxNQUFNO1FBQ3hCTSxRQUFRQyxHQUFHLENBQUUsQ0FBQyw4Q0FBOEMsRUFBRWpCLGFBQWEsQ0FBRVUsS0FBTSxDQUFDLFdBQVcsRUFBRU4sYUFBYSxDQUFFTSxLQUFNLEVBQUU7UUFDeEhNLFFBQVFDLEdBQUc7SUFDYjtBQUNGO0FBRUFELFFBQVFDLEdBQUcsQ0FBRTtBQUNiRCxRQUFRQyxHQUFHLENBQUVnQixNQUFNQyxJQUFJLENBQUV2QixRQUFTd0IsSUFBSSxHQUFHQyxJQUFJLENBQUU7QUFFL0NwQixRQUFRQyxHQUFHLENBQUUsR0FBR0osWUFBWSxvQkFBb0IsRUFBRUYsT0FBTzBCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyJ9