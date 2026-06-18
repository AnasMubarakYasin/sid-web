// Copyright 2014-2015, University of Colorado Boulder
/**
 * This grunt task creates a simulation based on the simula-rasa template.
 * This task must be run from perennial directory.
 *
 * Example usage:
 * grunt create-sim --repo=cannon-blaster --author="Sam Reid (PhET Interactive Simulations)"
 *
 * This task will attempt to coerce a sim title from the repository name. For example,
 * 'cannon-blaster' becomes 'Cannon Blaster'.  If this is not suitable, then use --title
 * to specify a title.  For example:
 * grunt create-sim --repo=fractions-basics --title="Fractions: Basics" --author="Sam Reid (PhET Interactive Simulations)"
 *
 * For development and debugging, add --clean=true to delete the repository directory.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */ const _ = require('lodash');
const assert = require('assert');
const execute = require('../common/execute').default;
const grunt = require('grunt');
const gruntCommand = require('../common/gruntCommand');
const npmUpdate = require('../common/npmUpdate');
const fs = require('fs');
const { readFileSync } = require('fs');
/**
 * @param {string} repo
 * @param {string} author
 * @param {Object} [options]
 */ module.exports = async function(repo, author, options) {
    const { title = toTitle(repo), clean = false } = options || {};
    assert(typeof repo === 'string' && /^[a-z]+(-[a-z]+)*$/u.test(repo), 'repo name should be composed of lower-case characters, optionally with dashes used as separators');
    assert(typeof author === 'string');
    assert(typeof title === 'string');
    assert(typeof clean === 'boolean');
    /**
   * Coerces a repository name to a sim title, eg, 'simula-rasa' -> 'Simula Rasa'
   * @param {string} simName - the input string like 'build-an-atom'
   * @returns {string}
   */ function toTitle(simName) {
        const tmpString = simName.replace(/-(.)/g, (match, group1)=>{
            return ` ${group1.toUpperCase()}`;
        });
        return tmpString.substring(0, 1).toUpperCase() + tmpString.substring(1);
    }
    grunt.log.writeln(`Greetings ${author}!`);
    grunt.log.writeln(`creating sim with repository name ${repo}`);
    // initialize the directory
    const destinationPath = `../${repo}`;
    if (grunt.file.exists(destinationPath)) {
        if (clean) {
            grunt.log.writeln(`Cleaning ${destinationPath}`);
            grunt.file.delete(destinationPath, {
                force: true
            }); // delete won't operate outside of current working dir unless forced
        } else {
            grunt.log.writeln(`WARNING:${destinationPath} already exists, overwriting`);
        }
    }
    grunt.file.mkdir(destinationPath);
    // Create variations of the repository name
    const configPath = repo.toUpperCase().replace(/-/g, '_'); // eg, 'simula-rasa' -> 'SIMULA_RASA'
    const lowerCamelCase = _.camelCase(repo); // eg, 'simula-rasa' -> 'simulaRasa'
    const upperCamelCase = lowerCamelCase.substring(0, 1).toUpperCase() + lowerCamelCase.substring(1); // eg, 'simula-rasa' -> 'SimulaRasa'
    const yearToday = grunt.template.today('yyyy');
    // Iterate over the file system and copy files, changing filenames and contents as we go.
    grunt.file.recurse('../simula-rasa', (abspath, rootdir, subdir, filename)=>{
        // skip these files
        if (abspath.indexOf('../simula-rasa/README.md') === 0 || abspath.indexOf('../simula-rasa/node_modules/') === 0 || abspath.indexOf('../simula-rasa/.git/') === 0 || abspath.indexOf('../simula-rasa/build/') === 0) {
        // do nothing
        } else {
            let contents = grunt.file.read(abspath);
            // Replace variations of the repository name
            contents = contents.replace(/simula-rasa/g, repo);
            contents = contents.replace(/SIMULA_RASA/g, configPath);
            contents = contents.replace(/simulaRasa/g, lowerCamelCase);
            contents = contents.replace(/SimulaRasa/g, upperCamelCase);
            // Replace the title
            contents = contents.replace(/{{TITLE}}/g, title);
            // Replace author
            contents = contents.replace(/{{AUTHOR}}/g, author);
            // Fix copyright comments
            contents = contents.replace(/\/\/ Copyright \d\d\d\d.*/g, `// Copyright ${yearToday}, University of Colorado Boulder`);
            // Replace names in the path where the contents will be written
            let contentsPath = subdir ? `${destinationPath}/${subdir}/${filename}` : `${destinationPath}/${filename}`;
            contentsPath = contentsPath.replace(/simula-rasa/, repo);
            contentsPath = contentsPath.replace(/simulaRasa/, lowerCamelCase);
            contentsPath = contentsPath.replace(/SimulaRasa/, upperCamelCase);
            // Write the file
            grunt.file.write(contentsPath, contents);
            grunt.log.writeln('wrote', contentsPath);
        }
    });
    // Delete readmeCreatedManually from template, see https://github.com/phetsims/perennial/issues/199
    const packagePath = `${destinationPath}/package.json`;
    const simPackageJSON = JSON.parse(readFileSync(packagePath, 'utf8'));
    if (simPackageJSON.phet && simPackageJSON.phet.hasOwnProperty('readmeCreatedManually')) {
        delete simPackageJSON.phet.readmeCreatedManually;
    }
    fs.writeFileSync(packagePath, JSON.stringify(simPackageJSON, null, 2));
    await npmUpdate(repo);
    await execute(gruntCommand, [
        'unpublished-readme'
    ], `../${repo}`);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9ncnVudC9jcmVhdGVTaW0uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAxNSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogVGhpcyBncnVudCB0YXNrIGNyZWF0ZXMgYSBzaW11bGF0aW9uIGJhc2VkIG9uIHRoZSBzaW11bGEtcmFzYSB0ZW1wbGF0ZS5cbiAqIFRoaXMgdGFzayBtdXN0IGJlIHJ1biBmcm9tIHBlcmVubmlhbCBkaXJlY3RvcnkuXG4gKlxuICogRXhhbXBsZSB1c2FnZTpcbiAqIGdydW50IGNyZWF0ZS1zaW0gLS1yZXBvPWNhbm5vbi1ibGFzdGVyIC0tYXV0aG9yPVwiU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXCJcbiAqXG4gKiBUaGlzIHRhc2sgd2lsbCBhdHRlbXB0IHRvIGNvZXJjZSBhIHNpbSB0aXRsZSBmcm9tIHRoZSByZXBvc2l0b3J5IG5hbWUuIEZvciBleGFtcGxlLFxuICogJ2Nhbm5vbi1ibGFzdGVyJyBiZWNvbWVzICdDYW5ub24gQmxhc3RlcicuICBJZiB0aGlzIGlzIG5vdCBzdWl0YWJsZSwgdGhlbiB1c2UgLS10aXRsZVxuICogdG8gc3BlY2lmeSBhIHRpdGxlLiAgRm9yIGV4YW1wbGU6XG4gKiBncnVudCBjcmVhdGUtc2ltIC0tcmVwbz1mcmFjdGlvbnMtYmFzaWNzIC0tdGl0bGU9XCJGcmFjdGlvbnM6IEJhc2ljc1wiIC0tYXV0aG9yPVwiU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXCJcbiAqXG4gKiBGb3IgZGV2ZWxvcG1lbnQgYW5kIGRlYnVnZ2luZywgYWRkIC0tY2xlYW49dHJ1ZSB0byBkZWxldGUgdGhlIHJlcG9zaXRvcnkgZGlyZWN0b3J5LlxuICpcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxuICovXG5cbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi4vY29tbW9uL2V4ZWN1dGUnICkuZGVmYXVsdDtcbmNvbnN0IGdydW50ID0gcmVxdWlyZSggJ2dydW50JyApO1xuY29uc3QgZ3J1bnRDb21tYW5kID0gcmVxdWlyZSggJy4uL2NvbW1vbi9ncnVudENvbW1hbmQnICk7XG5jb25zdCBucG1VcGRhdGUgPSByZXF1aXJlKCAnLi4vY29tbW9uL25wbVVwZGF0ZScgKTtcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xuY29uc3QgeyByZWFkRmlsZVN5bmMgfSA9IHJlcXVpcmUoICdmcycgKTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xuICogQHBhcmFtIHtzdHJpbmd9IGF1dGhvclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uKCByZXBvLCBhdXRob3IsIG9wdGlvbnMgKSB7XG4gIGNvbnN0IHtcbiAgICB0aXRsZSA9IHRvVGl0bGUoIHJlcG8gKSxcbiAgICBjbGVhbiA9IGZhbHNlXG4gIH0gPSBvcHRpb25zIHx8IHt9O1xuXG4gIGFzc2VydCggdHlwZW9mIHJlcG8gPT09ICdzdHJpbmcnICYmIC9eW2Etel0rKC1bYS16XSspKiQvdS50ZXN0KCByZXBvICksICdyZXBvIG5hbWUgc2hvdWxkIGJlIGNvbXBvc2VkIG9mIGxvd2VyLWNhc2UgY2hhcmFjdGVycywgb3B0aW9uYWxseSB3aXRoIGRhc2hlcyB1c2VkIGFzIHNlcGFyYXRvcnMnICk7XG4gIGFzc2VydCggdHlwZW9mIGF1dGhvciA9PT0gJ3N0cmluZycgKTtcbiAgYXNzZXJ0KCB0eXBlb2YgdGl0bGUgPT09ICdzdHJpbmcnICk7XG4gIGFzc2VydCggdHlwZW9mIGNsZWFuID09PSAnYm9vbGVhbicgKTtcblxuICAvKipcbiAgICogQ29lcmNlcyBhIHJlcG9zaXRvcnkgbmFtZSB0byBhIHNpbSB0aXRsZSwgZWcsICdzaW11bGEtcmFzYScgLT4gJ1NpbXVsYSBSYXNhJ1xuICAgKiBAcGFyYW0ge3N0cmluZ30gc2ltTmFtZSAtIHRoZSBpbnB1dCBzdHJpbmcgbGlrZSAnYnVpbGQtYW4tYXRvbSdcbiAgICogQHJldHVybnMge3N0cmluZ31cbiAgICovXG4gIGZ1bmN0aW9uIHRvVGl0bGUoIHNpbU5hbWUgKSB7XG4gICAgY29uc3QgdG1wU3RyaW5nID0gc2ltTmFtZS5yZXBsYWNlKCAvLSguKS9nLCAoIG1hdGNoLCBncm91cDEgKSA9PiB7XG4gICAgICByZXR1cm4gYCAke2dyb3VwMS50b1VwcGVyQ2FzZSgpfWA7XG4gICAgfSApO1xuICAgIHJldHVybiB0bXBTdHJpbmcuc3Vic3RyaW5nKCAwLCAxICkudG9VcHBlckNhc2UoKSArIHRtcFN0cmluZy5zdWJzdHJpbmcoIDEgKTtcbiAgfVxuXG4gIGdydW50LmxvZy53cml0ZWxuKCBgR3JlZXRpbmdzICR7YXV0aG9yfSFgICk7XG4gIGdydW50LmxvZy53cml0ZWxuKCBgY3JlYXRpbmcgc2ltIHdpdGggcmVwb3NpdG9yeSBuYW1lICR7cmVwb31gICk7XG5cbiAgLy8gaW5pdGlhbGl6ZSB0aGUgZGlyZWN0b3J5XG4gIGNvbnN0IGRlc3RpbmF0aW9uUGF0aCA9IGAuLi8ke3JlcG99YDtcbiAgaWYgKCBncnVudC5maWxlLmV4aXN0cyggZGVzdGluYXRpb25QYXRoICkgKSB7XG4gICAgaWYgKCBjbGVhbiApIHtcbiAgICAgIGdydW50LmxvZy53cml0ZWxuKCBgQ2xlYW5pbmcgJHtkZXN0aW5hdGlvblBhdGh9YCApO1xuICAgICAgZ3J1bnQuZmlsZS5kZWxldGUoIGRlc3RpbmF0aW9uUGF0aCwgeyBmb3JjZTogdHJ1ZSB9ICk7IC8vIGRlbGV0ZSB3b24ndCBvcGVyYXRlIG91dHNpZGUgb2YgY3VycmVudCB3b3JraW5nIGRpciB1bmxlc3MgZm9yY2VkXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIGBXQVJOSU5HOiR7ZGVzdGluYXRpb25QYXRofSBhbHJlYWR5IGV4aXN0cywgb3ZlcndyaXRpbmdgICk7XG4gICAgfVxuICB9XG4gIGdydW50LmZpbGUubWtkaXIoIGRlc3RpbmF0aW9uUGF0aCApO1xuXG4gIC8vIENyZWF0ZSB2YXJpYXRpb25zIG9mIHRoZSByZXBvc2l0b3J5IG5hbWVcbiAgY29uc3QgY29uZmlnUGF0aCA9IHJlcG8udG9VcHBlckNhc2UoKS5yZXBsYWNlKCAvLS9nLCAnXycgKTsgLy8gZWcsICdzaW11bGEtcmFzYScgLT4gJ1NJTVVMQV9SQVNBJ1xuICBjb25zdCBsb3dlckNhbWVsQ2FzZSA9IF8uY2FtZWxDYXNlKCByZXBvICk7IC8vIGVnLCAnc2ltdWxhLXJhc2EnIC0+ICdzaW11bGFSYXNhJ1xuICBjb25zdCB1cHBlckNhbWVsQ2FzZSA9IGxvd2VyQ2FtZWxDYXNlLnN1YnN0cmluZyggMCwgMSApLnRvVXBwZXJDYXNlKCkgKyBsb3dlckNhbWVsQ2FzZS5zdWJzdHJpbmcoIDEgKTsgLy8gZWcsICdzaW11bGEtcmFzYScgLT4gJ1NpbXVsYVJhc2EnXG5cbiAgY29uc3QgeWVhclRvZGF5ID0gZ3J1bnQudGVtcGxhdGUudG9kYXkoICd5eXl5JyApO1xuXG4gIC8vIEl0ZXJhdGUgb3ZlciB0aGUgZmlsZSBzeXN0ZW0gYW5kIGNvcHkgZmlsZXMsIGNoYW5naW5nIGZpbGVuYW1lcyBhbmQgY29udGVudHMgYXMgd2UgZ28uXG4gIGdydW50LmZpbGUucmVjdXJzZSggJy4uL3NpbXVsYS1yYXNhJywgKCBhYnNwYXRoLCByb290ZGlyLCBzdWJkaXIsIGZpbGVuYW1lICkgPT4ge1xuXG4gICAgLy8gc2tpcCB0aGVzZSBmaWxlc1xuICAgIGlmICggYWJzcGF0aC5pbmRleE9mKCAnLi4vc2ltdWxhLXJhc2EvUkVBRE1FLm1kJyApID09PSAwIHx8XG4gICAgICAgICBhYnNwYXRoLmluZGV4T2YoICcuLi9zaW11bGEtcmFzYS9ub2RlX21vZHVsZXMvJyApID09PSAwIHx8XG4gICAgICAgICBhYnNwYXRoLmluZGV4T2YoICcuLi9zaW11bGEtcmFzYS8uZ2l0LycgKSA9PT0gMCB8fFxuICAgICAgICAgYWJzcGF0aC5pbmRleE9mKCAnLi4vc2ltdWxhLXJhc2EvYnVpbGQvJyApID09PSAwICkge1xuXG4gICAgICAvLyBkbyBub3RoaW5nXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbGV0IGNvbnRlbnRzID0gZ3J1bnQuZmlsZS5yZWFkKCBhYnNwYXRoICk7XG5cbiAgICAgIC8vIFJlcGxhY2UgdmFyaWF0aW9ucyBvZiB0aGUgcmVwb3NpdG9yeSBuYW1lXG4gICAgICBjb250ZW50cyA9IGNvbnRlbnRzLnJlcGxhY2UoIC9zaW11bGEtcmFzYS9nLCByZXBvICk7XG4gICAgICBjb250ZW50cyA9IGNvbnRlbnRzLnJlcGxhY2UoIC9TSU1VTEFfUkFTQS9nLCBjb25maWdQYXRoICk7XG4gICAgICBjb250ZW50cyA9IGNvbnRlbnRzLnJlcGxhY2UoIC9zaW11bGFSYXNhL2csIGxvd2VyQ2FtZWxDYXNlICk7XG4gICAgICBjb250ZW50cyA9IGNvbnRlbnRzLnJlcGxhY2UoIC9TaW11bGFSYXNhL2csIHVwcGVyQ2FtZWxDYXNlICk7XG5cbiAgICAgIC8vIFJlcGxhY2UgdGhlIHRpdGxlXG4gICAgICBjb250ZW50cyA9IGNvbnRlbnRzLnJlcGxhY2UoIC97e1RJVExFfX0vZywgdGl0bGUgKTtcblxuICAgICAgLy8gUmVwbGFjZSBhdXRob3JcbiAgICAgIGNvbnRlbnRzID0gY29udGVudHMucmVwbGFjZSggL3t7QVVUSE9SfX0vZywgYXV0aG9yICk7XG5cbiAgICAgIC8vIEZpeCBjb3B5cmlnaHQgY29tbWVudHNcbiAgICAgIGNvbnRlbnRzID0gY29udGVudHMucmVwbGFjZSggL1xcL1xcLyBDb3B5cmlnaHQgXFxkXFxkXFxkXFxkLiovZywgYC8vIENvcHlyaWdodCAke3llYXJUb2RheX0sIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlcmAgKTtcblxuICAgICAgLy8gUmVwbGFjZSBuYW1lcyBpbiB0aGUgcGF0aCB3aGVyZSB0aGUgY29udGVudHMgd2lsbCBiZSB3cml0dGVuXG4gICAgICBsZXQgY29udGVudHNQYXRoID0gc3ViZGlyID8gKCBgJHtkZXN0aW5hdGlvblBhdGh9LyR7c3ViZGlyfS8ke2ZpbGVuYW1lfWAgKSA6ICggYCR7ZGVzdGluYXRpb25QYXRofS8ke2ZpbGVuYW1lfWAgKTtcbiAgICAgIGNvbnRlbnRzUGF0aCA9IGNvbnRlbnRzUGF0aC5yZXBsYWNlKCAvc2ltdWxhLXJhc2EvLCByZXBvICk7XG4gICAgICBjb250ZW50c1BhdGggPSBjb250ZW50c1BhdGgucmVwbGFjZSggL3NpbXVsYVJhc2EvLCBsb3dlckNhbWVsQ2FzZSApO1xuICAgICAgY29udGVudHNQYXRoID0gY29udGVudHNQYXRoLnJlcGxhY2UoIC9TaW11bGFSYXNhLywgdXBwZXJDYW1lbENhc2UgKTtcblxuICAgICAgLy8gV3JpdGUgdGhlIGZpbGVcbiAgICAgIGdydW50LmZpbGUud3JpdGUoIGNvbnRlbnRzUGF0aCwgY29udGVudHMgKTtcbiAgICAgIGdydW50LmxvZy53cml0ZWxuKCAnd3JvdGUnLCBjb250ZW50c1BhdGggKTtcbiAgICB9XG4gIH0gKTtcblxuICAvLyBEZWxldGUgcmVhZG1lQ3JlYXRlZE1hbnVhbGx5IGZyb20gdGVtcGxhdGUsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy8xOTlcbiAgY29uc3QgcGFja2FnZVBhdGggPSBgJHtkZXN0aW5hdGlvblBhdGh9L3BhY2thZ2UuanNvbmA7XG4gIGNvbnN0IHNpbVBhY2thZ2VKU09OID0gSlNPTi5wYXJzZSggcmVhZEZpbGVTeW5jKCBwYWNrYWdlUGF0aCwgJ3V0ZjgnICkgKTtcbiAgaWYgKCBzaW1QYWNrYWdlSlNPTi5waGV0ICYmIHNpbVBhY2thZ2VKU09OLnBoZXQuaGFzT3duUHJvcGVydHkoICdyZWFkbWVDcmVhdGVkTWFudWFsbHknICkgKSB7XG4gICAgZGVsZXRlIHNpbVBhY2thZ2VKU09OLnBoZXQucmVhZG1lQ3JlYXRlZE1hbnVhbGx5O1xuICB9XG4gIGZzLndyaXRlRmlsZVN5bmMoIHBhY2thZ2VQYXRoLCBKU09OLnN0cmluZ2lmeSggc2ltUGFja2FnZUpTT04sIG51bGwsIDIgKSApO1xuXG4gIGF3YWl0IG5wbVVwZGF0ZSggcmVwbyApO1xuICBhd2FpdCBleGVjdXRlKCBncnVudENvbW1hbmQsIFsgJ3VucHVibGlzaGVkLXJlYWRtZScgXSwgYC4uLyR7cmVwb31gICk7XG59OyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImFzc2VydCIsImV4ZWN1dGUiLCJkZWZhdWx0IiwiZ3J1bnQiLCJncnVudENvbW1hbmQiLCJucG1VcGRhdGUiLCJmcyIsInJlYWRGaWxlU3luYyIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwiYXV0aG9yIiwib3B0aW9ucyIsInRpdGxlIiwidG9UaXRsZSIsImNsZWFuIiwidGVzdCIsInNpbU5hbWUiLCJ0bXBTdHJpbmciLCJyZXBsYWNlIiwibWF0Y2giLCJncm91cDEiLCJ0b1VwcGVyQ2FzZSIsInN1YnN0cmluZyIsImxvZyIsIndyaXRlbG4iLCJkZXN0aW5hdGlvblBhdGgiLCJmaWxlIiwiZXhpc3RzIiwiZGVsZXRlIiwiZm9yY2UiLCJta2RpciIsImNvbmZpZ1BhdGgiLCJsb3dlckNhbWVsQ2FzZSIsImNhbWVsQ2FzZSIsInVwcGVyQ2FtZWxDYXNlIiwieWVhclRvZGF5IiwidGVtcGxhdGUiLCJ0b2RheSIsInJlY3Vyc2UiLCJhYnNwYXRoIiwicm9vdGRpciIsInN1YmRpciIsImZpbGVuYW1lIiwiaW5kZXhPZiIsImNvbnRlbnRzIiwicmVhZCIsImNvbnRlbnRzUGF0aCIsIndyaXRlIiwicGFja2FnZVBhdGgiLCJzaW1QYWNrYWdlSlNPTiIsIkpTT04iLCJwYXJzZSIsInBoZXQiLCJoYXNPd25Qcm9wZXJ0eSIsInJlYWRtZUNyZWF0ZWRNYW51YWxs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