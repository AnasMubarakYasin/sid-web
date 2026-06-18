// Copyright 2021, University of Colorado Boulder
// this is a file that runs in node
// it compares all the dependencies from one project to another project.
// Assumes you have a clean working copy, in case you are checking out shas
// @author Sam Reid (PhET Interactive Simulations)
// import fs
const fs = require('fs');
// import assert
const assert = require('assert');
// Parse the command line arguments
const args = process.argv.slice(2);
// The first command line argument is the first project for comparison
const project1 = args[0];
// The second command line argument is the second project for comparison
const project2 = args[1];
// Assert that both project one and project to are defined
assert(project1, 'project1 is not defined');
assert(project2, 'project2 is not defined');
function loadDependenciesForProject(project) {
    // If project contains a #, Then the first part is the directories and the second part is the branch name
    const directory = project.split('@')[0];
    // Get the branch or SHA name
    const target = project.split('@')[1];
    // Print the project one directories and project one branch
    //   console.log( 'project1Directories', directory );
    //   console.log( 'project1Branch', target );
    // If there is a branch name specified, fork and execute a command that will check out that branch in that directories
    if (target) {
        const command = `git -C ${directory} checkout ${target}`;
        // console.log( 'command', command );
        require('child_process').execSync(command);
    }
    // Load dependencies.json from relative path one and parse it as JSON
    const dependencies = JSON.parse(fs.readFileSync(`${directory}/dependencies.json`));
    return dependencies;
}
const dependencies1 = loadDependenciesForProject(project1);
const dependencies2 = loadDependenciesForProject(project2);
const allKeys = [
    ...Object.keys(dependencies1),
    ...Object.keys(dependencies2)
].filter((repo)=>repo !== 'comment');
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
            console.log(lines.length);
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
console.log('Discovered issues');
console.log(Array.from(issues).sort().join('\n'));
console.log(`${commitCount} commits referenced ${issues.size} separate issues`);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL2NvbXBhcmUtZGVwZW5kZW5jaWVzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcbi8vIHRoaXMgaXMgYSBmaWxlIHRoYXQgcnVucyBpbiBub2RlXG4vLyBpdCBjb21wYXJlcyBhbGwgdGhlIGRlcGVuZGVuY2llcyBmcm9tIG9uZSBwcm9qZWN0IHRvIGFub3RoZXIgcHJvamVjdC5cbi8vIEFzc3VtZXMgeW91IGhhdmUgYSBjbGVhbiB3b3JraW5nIGNvcHksIGluIGNhc2UgeW91IGFyZSBjaGVja2luZyBvdXQgc2hhc1xuLy8gQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcblxuLy8gaW1wb3J0IGZzXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcbi8vIGltcG9ydCBhc3NlcnRcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XG5cbi8vIFBhcnNlIHRoZSBjb21tYW5kIGxpbmUgYXJndW1lbnRzXG5jb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKCAyICk7XG5cbi8vIFRoZSBmaXJzdCBjb21tYW5kIGxpbmUgYXJndW1lbnQgaXMgdGhlIGZpcnN0IHByb2plY3QgZm9yIGNvbXBhcmlzb25cbmNvbnN0IHByb2plY3QxID0gYXJnc1sgMCBdO1xuXG4vLyBUaGUgc2Vjb25kIGNvbW1hbmQgbGluZSBhcmd1bWVudCBpcyB0aGUgc2Vjb25kIHByb2plY3QgZm9yIGNvbXBhcmlzb25cbmNvbnN0IHByb2plY3QyID0gYXJnc1sgMSBdO1xuXG4vLyBBc3NlcnQgdGhhdCBib3RoIHByb2plY3Qgb25lIGFuZCBwcm9qZWN0IHRvIGFyZSBkZWZpbmVkXG5hc3NlcnQoIHByb2plY3QxLCAncHJvamVjdDEgaXMgbm90IGRlZmluZWQnICk7XG5hc3NlcnQoIHByb2plY3QyLCAncHJvamVjdDIgaXMgbm90IGRlZmluZWQnICk7XG5cbmZ1bmN0aW9uIGxvYWREZXBlbmRlbmNpZXNGb3JQcm9qZWN0KCBwcm9qZWN0ICkge1xuXG4vLyBJZiBwcm9qZWN0IGNvbnRhaW5zIGEgIywgVGhlbiB0aGUgZmlyc3QgcGFydCBpcyB0aGUgZGlyZWN0b3JpZXMgYW5kIHRoZSBzZWNvbmQgcGFydCBpcyB0aGUgYnJhbmNoIG5hbWVcbiAgY29uc3QgZGlyZWN0b3J5ID0gcHJvamVjdC5zcGxpdCggJ0AnIClbIDAgXTtcblxuLy8gR2V0IHRoZSBicmFuY2ggb3IgU0hBIG5hbWVcbiAgY29uc3QgdGFyZ2V0ID0gcHJvamVjdC5zcGxpdCggJ0AnIClbIDEgXTtcblxuLy8gUHJpbnQgdGhlIHByb2plY3Qgb25lIGRpcmVjdG9yaWVzIGFuZCBwcm9qZWN0IG9uZSBicmFuY2hcbi8vICAgY29uc29sZS5sb2coICdwcm9qZWN0MURpcmVjdG9yaWVzJywgZGlyZWN0b3J5ICk7XG4vLyAgIGNvbnNvbGUubG9nKCAncHJvamVjdDFCcmFuY2gnLCB0YXJnZXQgKTtcblxuLy8gSWYgdGhlcmUgaXMgYSBicmFuY2ggbmFtZSBzcGVjaWZpZWQsIGZvcmsgYW5kIGV4ZWN1dGUgYSBjb21tYW5kIHRoYXQgd2lsbCBjaGVjayBvdXQgdGhhdCBicmFuY2ggaW4gdGhhdCBkaXJlY3Rvcmllc1xuICBpZiAoIHRhcmdldCApIHtcbiAgICBjb25zdCBjb21tYW5kID0gYGdpdCAtQyAke2RpcmVjdG9yeX0gY2hlY2tvdXQgJHt0YXJnZXR9YDtcbiAgICAvLyBjb25zb2xlLmxvZyggJ2NvbW1hbmQnLCBjb21tYW5kICk7XG4gICAgcmVxdWlyZSggJ2NoaWxkX3Byb2Nlc3MnICkuZXhlY1N5bmMoIGNvbW1hbmQgKTtcbiAgfVxuXG4vLyBMb2FkIGRlcGVuZGVuY2llcy5qc29uIGZyb20gcmVsYXRpdmUgcGF0aCBvbmUgYW5kIHBhcnNlIGl0IGFzIEpTT05cbiAgY29uc3QgZGVwZW5kZW5jaWVzID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgJHtkaXJlY3Rvcnl9L2RlcGVuZGVuY2llcy5qc29uYCApICk7XG5cbiAgcmV0dXJuIGRlcGVuZGVuY2llcztcbn1cblxuY29uc3QgZGVwZW5kZW5jaWVzMSA9IGxvYWREZXBlbmRlbmNpZXNGb3JQcm9qZWN0KCBwcm9qZWN0MSApO1xuY29uc3QgZGVwZW5kZW5jaWVzMiA9IGxvYWREZXBlbmRlbmNpZXNGb3JQcm9qZWN0KCBwcm9qZWN0MiApO1xuXG5jb25zdCBhbGxLZXlzID0gWyAuLi5PYmplY3Qua2V5cyggZGVwZW5kZW5jaWVzMSApLCAuLi5PYmplY3Qua2V5cyggZGVwZW5kZW5jaWVzMiApIF0uZmlsdGVyKCByZXBvID0+IHJlcG8gIT09ICdjb21tZW50JyApO1xuXG5jb25zdCBpc3N1ZXMgPSBuZXcgU2V0KCk7XG5sZXQgY29tbWl0Q291bnQgPSAwO1xuXG4vLyBJdGVyYXRlIG92ZXIgdGhlIGtleXMgdGhleSBoYXZlIGluIGNvbW1vblxuYWxsS2V5cy5mb3JFYWNoKCByZXBvID0+IHtcblxuICAvLyBJZiB0aGUga2V5IGlzIGluIGRlcGVuZGVuY2llcyB0d29cbiAgaWYgKCBkZXBlbmRlbmNpZXMxWyByZXBvIF0gJiYgZGVwZW5kZW5jaWVzMlsgcmVwbyBdICkge1xuXG4gICAgLy8gUHJpbnQgdGhlIGtleSBhbmQgdGhlIHZlcnNpb25cbiAgICAvLyBjb25zb2xlLmxvZyggYCR7cmVwb30gJHtkZXBlbmRlbmNpZXMxWyByZXBvIF0uc2hhfSAke2RlcGVuZGVuY2llczJbIHJlcG8gXS5zaGF9YCApO1xuXG4gICAgLy8gSWYgdGhlIHNoYXMgYXJlIHRoZSBzYW1lLCBwcmludCBhIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUgdGhhdCB0aGUgc2hhcyBhcmUgdGhlIHNhbWVcbiAgICBpZiAoIGRlcGVuZGVuY2llczFbIHJlcG8gXS5zaGEgPT09IGRlcGVuZGVuY2llczJbIHJlcG8gXS5zaGEgKSB7XG4gICAgICBjb25zb2xlLmxvZyggYCMgJHtyZXBvfWAgKTtcbiAgICAgIGNvbnNvbGUubG9nKCAnU0hBcyBhcmUgdGhlIHNhbWUnICk7XG4gICAgICBjb25zb2xlLmxvZygpO1xuICAgIH1cbiAgICBlbHNlIHtcblxuICAgICAgLy8gV2Uga25vdyB0aGUgc2hhcyBhcmUgZGlmZmVyZW50LCBhbmQgd2Ugd2FudCB0byBjb21wYXJlIHRoZW0gdXNpbmcgYGdpdCBsb2cgLS1vbmVsaW5lIC0tYW5jZXN0cnktcGF0aGBcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBgZ2l0IC1DIC4uLyR7cmVwb30gbG9nIC0tb25lbGluZSAtLWFuY2VzdHJ5LXBhdGggJHtkZXBlbmRlbmNpZXMxWyByZXBvIF0uc2hhfS4uJHtkZXBlbmRlbmNpZXMyWyByZXBvIF0uc2hhfWA7XG5cbiAgICAgIC8vIFJ1biB0aGF0IGNvbW1hbmQgc3luY2hyb25vdXNseVxuICAgICAgY29uc3QgYnVmZmVyID0gcmVxdWlyZSggJ2NoaWxkX3Byb2Nlc3MnICkuZXhlY1N5bmMoIGNvbW1hbmQgKTtcblxuICAgICAgLy8gQ29udmVydCB0aGUgYnVmZmVyIHRvIGEgc3RyaW5nIGFuZCBwcmludCBpdCBvdXRcbiAgICAgIGNvbnNvbGUubG9nKCBgIyAke3JlcG99YCApO1xuICAgICAgY29uc3QgYnVmZmVyU3RyaW5nID0gYnVmZmVyLnRvU3RyaW5nKCk7XG4gICAgICBjb25zb2xlLmxvZyggYnVmZmVyU3RyaW5nICk7XG5cbiAgICAgIC8vIFNwbGl0IHRoZSBidWZmZXIgc3RyaW5nIGludG8gbGluZXNcbiAgICAgIGNvbnN0IGxpbmVzID0gYnVmZmVyU3RyaW5nLnNwbGl0KCAnXFxuJyApO1xuICAgICAgY29uc29sZS5sb2coIGxpbmVzLmxlbmd0aCApO1xuICAgICAgbGluZXMuZm9yRWFjaCggbGluZSA9PiB7XG5cbiAgICAgICAgLy8gSWYgdGhlIGxpbmUgY29udGFpbnMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zLyB0aGVuIGFkZCBpdCB0byB0aGUgc2V0LlxuICAgICAgICBpZiAoIGxpbmUuaW5jbHVkZXMoICdodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvJyApICYmICFsaW5lLmluY2x1ZGVzKCAnTWVyZ2UgYnJhbmNoIFxcJ21haW5cXCcnICkgKSB7XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBVUkwgaW4gbGluZSB1c2luZyBhIHJlZ3VsYXIgZXhwcmVzc2lvblxuICAgICAgICAgIGNvbnN0IHVybCA9IGxpbmUuc3Vic3RyaW5nKCBsaW5lLmluZGV4T2YoICdodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvJyApICk7XG5cbiAgICAgICAgICBpc3N1ZXMuYWRkKCB1cmwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggbGluZS50cmltKCkubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICBjb21taXRDb3VudCsrO1xuICAgICAgICB9XG4gICAgICB9ICk7XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCBgIyAke3JlcG99YCApO1xuICAgIGNvbnNvbGUubG9nKCBgRGlkIG5vdCBhcHBlYXIgaW4gYm90aCBkZXBlbmRlbmNpZXMuIHByb2plY3QxPSR7ZGVwZW5kZW5jaWVzMVsgcmVwbyBdfSwgcHJvamVjdDI9JHtkZXBlbmRlbmNpZXMyWyByZXBvIF19YCApO1xuICAgIGNvbnNvbGUubG9nKCk7XG4gIH1cbn0gKTtcblxuY29uc29sZS5sb2coICdEaXNjb3ZlcmVkIGlzc3VlcycgKTtcbmNvbnNvbGUubG9nKCBBcnJheS5mcm9tKCBpc3N1ZXMgKS5zb3J0KCkuam9pbiggJ1xcbicgKSApO1xuXG5jb25zb2xlLmxvZyggYCR7Y29tbWl0Q291bnR9IGNvbW1pdHMgcmVmZXJlbmNlZCAke2lzc3Vlcy5zaXplfSBzZXBhcmF0ZSBpc3N1ZXNgICk7Il0sIm5hbWVzIjpbImZzIiwicmVxdWlyZSIsImFzc2VydCIsImFyZ3MiLCJwcm9jZXNzIiwiYXJndiIsInNsaWNlIiwicHJvamVjdDEiLCJwcm9qZWN0MiIsImxvYWREZXBlbmRlbmNpZXNGb3JQcm9qZWN0IiwicHJvamVjdCIsImRpcmVjdG9yeSIsInNwbGl0IiwidGFyZ2V0IiwiY29tbWFuZCIsImV4ZWNTeW5jIiwiZGVwZW5kZW5jaWVzIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwiZGVwZW5kZW5jaWVzMSIsImRlcGVuZGVuY2llczIiLCJhbGxLZXlzIiwiT2JqZWN0Iiwia2V5cyIsImZpbHRlciIsInJlcG8iLCJpc3N1ZXMiLCJTZXQiLCJjb21taXRDb3VudCIsImZvckVhY2giLCJzaGEiLCJjb25zb2xlIiwibG9nIiwiYnVmZmVyIiwiYnVmZmVyU3RyaW5nIiwidG9TdHJpbmciLCJsaW5lcyIsImxlbmd0aCIsImxpbmUiLCJpbmNsdWRlcyIsInVybCIsInN1YnN0cmluZyIsImluZGV4T2YiLCJhZGQiLCJ0cmltIiwiQXJyYXkiLCJmcm9tIiwic29ydCIsImpvaW4iLCJzaXplIl0sIm1hcHBpbmdzIjoiQUFBQSxpREFBaUQ7QUFDakQsbUNBQW1DO0FBQ25DLHdFQUF3RTtBQUN4RSwyRUFBMkU7QUFDM0Usa0RBQWtEO0FBRWxELFlBQVk7QUFDWixNQUFNQSxLQUFLQyxRQUFTO0FBQ3BCLGdCQUFnQjtBQUNoQixNQUFNQyxTQUFTRCxRQUFTO0FBRXhCLG1DQUFtQztBQUNuQyxNQUFNRSxPQUFPQyxRQUFRQyxJQUFJLENBQUNDLEtBQUssQ0FBRTtBQUVqQyxzRUFBc0U7QUFDdEUsTUFBTUMsV0FBV0osSUFBSSxDQUFFLEVBQUc7QUFFMUIsd0VBQXdFO0FBQ3hFLE1BQU1LLFdBQVdMLElBQUksQ0FBRSxFQUFHO0FBRTFCLDBEQUEwRDtBQUMxREQsT0FBUUssVUFBVTtBQUNsQkwsT0FBUU0sVUFBVTtBQUVsQixTQUFTQywyQkFBNEJDLE9BQU87SUFFNUMseUdBQXlHO0lBQ3ZHLE1BQU1DLFlBQVlELFFBQVFFLEtBQUssQ0FBRSxJQUFLLENBQUUsRUFBRztJQUU3Qyw2QkFBNkI7SUFDM0IsTUFBTUMsU0FBU0gsUUFBUUUsS0FBSyxDQUFFLElBQUssQ0FBRSxFQUFHO0lBRTFDLDJEQUEyRDtJ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