// Copyright 2023, University of Colorado Boulder
/**
 * Append a note about contributing and a link to the contributing
 * doc in this repo to core common repos then commit. This script
 * is meant to be run from the root of the PhET project directory.
 *
 * @author Liam Mulhall <liammulh@gmail.com>
 */ import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { chdir, cwd } from 'node:process';
import appendToFile from './append-to-file.js';
import coreCommonRepos from './core-common-repos.js';
const contributingNote = `### Contributing
If you would like to contribute to this repo, please read our [contributing guidelines](https://github.com/phetsims/community/blob/main/CONTRIBUTING.md).
`;
for (const repo of coreCommonRepos){
    console.log('=======================================');
    console.log(`appending contrib note to ${repo}`);
    appendToFile(join(repo, 'README.md'), '\n\n' + contributingNote);
    const repoDir = join(cwd(), repo);
    console.log(`changing directory to ${repoDir}`);
    chdir(repoDir);
    const commitMessage = '"automated commit from phetsims/community; adding contrib doc note"';
    const commands = [
        'git pull origin main',
        'git add README.md',
        `git commit --message ${commitMessage} --no-verify`,
        'git push origin main'
    ];
    for (const command of commands){
        console.log(`executing command: ${command}`);
        execSync(command);
    }
    console.log('going back one directory');
    chdir('..');
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL2FwcGVuZC1jb250cmliLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBBcHBlbmQgYSBub3RlIGFib3V0IGNvbnRyaWJ1dGluZyBhbmQgYSBsaW5rIHRvIHRoZSBjb250cmlidXRpbmdcbiAqIGRvYyBpbiB0aGlzIHJlcG8gdG8gY29yZSBjb21tb24gcmVwb3MgdGhlbiBjb21taXQuIFRoaXMgc2NyaXB0XG4gKiBpcyBtZWFudCB0byBiZSBydW4gZnJvbSB0aGUgcm9vdCBvZiB0aGUgUGhFVCBwcm9qZWN0IGRpcmVjdG9yeS5cbiAqXG4gKiBAYXV0aG9yIExpYW0gTXVsaGFsbCA8bGlhbW11bGhAZ21haWwuY29tPlxuICovXG5cbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnbm9kZTpjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgY2hkaXIsIGN3ZCB9IGZyb20gJ25vZGU6cHJvY2Vzcyc7XG5pbXBvcnQgYXBwZW5kVG9GaWxlIGZyb20gJy4vYXBwZW5kLXRvLWZpbGUuanMnO1xuaW1wb3J0IGNvcmVDb21tb25SZXBvcyBmcm9tICcuL2NvcmUtY29tbW9uLXJlcG9zLmpzJztcblxuY29uc3QgY29udHJpYnV0aW5nTm90ZSA9IGAjIyMgQ29udHJpYnV0aW5nXG5JZiB5b3Ugd291bGQgbGlrZSB0byBjb250cmlidXRlIHRvIHRoaXMgcmVwbywgcGxlYXNlIHJlYWQgb3VyIFtjb250cmlidXRpbmcgZ3VpZGVsaW5lc10oaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NvbW11bml0eS9ibG9iL21haW4vQ09OVFJJQlVUSU5HLm1kKS5cbmA7XG5cbmZvciAoIGNvbnN0IHJlcG8gb2YgY29yZUNvbW1vblJlcG9zICkge1xuICBjb25zb2xlLmxvZyggJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PScgKTtcbiAgY29uc29sZS5sb2coIGBhcHBlbmRpbmcgY29udHJpYiBub3RlIHRvICR7cmVwb31gICk7XG4gIGFwcGVuZFRvRmlsZSggam9pbiggcmVwbywgJ1JFQURNRS5tZCcgKSwgJ1xcblxcbicgKyBjb250cmlidXRpbmdOb3RlICk7XG4gIGNvbnN0IHJlcG9EaXIgPSBqb2luKCBjd2QoKSwgcmVwbyApO1xuICBjb25zb2xlLmxvZyggYGNoYW5naW5nIGRpcmVjdG9yeSB0byAke3JlcG9EaXJ9YCApO1xuICBjaGRpciggcmVwb0RpciApO1xuICBjb25zdCBjb21taXRNZXNzYWdlID0gJ1wiYXV0b21hdGVkIGNvbW1pdCBmcm9tIHBoZXRzaW1zL2NvbW11bml0eTsgYWRkaW5nIGNvbnRyaWIgZG9jIG5vdGVcIic7XG4gIGNvbnN0IGNvbW1hbmRzID0gW1xuICAgICdnaXQgcHVsbCBvcmlnaW4gbWFpbicsXG4gICAgJ2dpdCBhZGQgUkVBRE1FLm1kJyxcbiAgICBgZ2l0IGNvbW1pdCAtLW1lc3NhZ2UgJHtjb21taXRNZXNzYWdlfSAtLW5vLXZlcmlmeWAsXG4gICAgJ2dpdCBwdXNoIG9yaWdpbiBtYWluJ1xuICBdO1xuICBmb3IgKCBjb25zdCBjb21tYW5kIG9mIGNvbW1hbmRzICkge1xuICAgIGNvbnNvbGUubG9nKCBgZXhlY3V0aW5nIGNvbW1hbmQ6ICR7Y29tbWFuZH1gICk7XG4gICAgZXhlY1N5bmMoIGNvbW1hbmQgKTtcbiAgfVxuICBjb25zb2xlLmxvZyggJ2dvaW5nIGJhY2sgb25lIGRpcmVjdG9yeScgKTtcbiAgY2hkaXIoICcuLicgKTtcbn0iXSwibmFtZXMiOlsiZXhlY1N5bmMiLCJqb2luIiwiY2hkaXIiLCJjd2QiLCJhcHBlbmRUb0ZpbGUiLCJjb3JlQ29tbW9uUmVwb3MiLCJjb250cmlidXRpbmdOb3RlIiwicmVwbyIsImNvbnNvbGUiLCJsb2ciLCJyZXBvRGlyIiwiY29tbWl0TWVzc2FnZSIsImNvbW1hbmRzIiwiY29tbWFuZCJdLCJtYXBwaW5ncyI6IkFBQUEsaURBQWlEO0FBRWpEOzs7Ozs7Q0FNQyxHQUVELFNBQVNBLFFBQVEsUUFBUSxxQkFBcUI7QUFDOUMsU0FBU0MsSUFBSSxRQUFRLFlBQVk7QUFDakMsU0FBU0MsS0FBSyxFQUFFQyxHQUFHLFFBQVEsZUFBZTtBQUMxQyxPQUFPQyxrQkFBa0Isc0JBQXNCO0FBQy9DLE9BQU9DLHFCQUFxQix5QkFBeUI7QUFFckQsTUFBTUMsbUJBQW1CLENBQUM7O0FBRTFCLENBQUM7QUFFRCxLQUFNLE1BQU1DLFFBQVFGLGdCQUFrQjtJQUNwQ0csUUFBUUMsR0FBRyxDQUFFO0lBQ2JELFFBQVFDLEdBQUcsQ0FBRSxDQUFDLDBCQUEwQixFQUFFRixNQUFNO0lBQ2hESCxhQUFjSCxLQUFNTSxNQUFNLGNBQWUsU0FBU0Q7SUFDbEQsTUFBTUksVUFBVVQsS0FBTUUsT0FBT0k7SUFDN0JDLFFBQVFDLEdBQUcsQ0FBRSxDQUFDLHNCQUFzQixFQUFFQyxTQUFTO0lBQy9DUixNQUFPUTtJQUNQLE1BQU1DLGdCQUFnQjtJQUN0QixNQUFNQyxXQUFXO1FBQ2Y7UUFDQTtRQUNBLENBQUMscUJBQXFCLEVBQUVELGNBQWMsWUFBWSxDQUFDO1FBQ25EO0tBQ0Q7SUFDRCxLQUFNLE1BQU1FLFdBQVdELFNBQVc7UUFDaENKLFFBQVFDLEdBQUcsQ0FBRSxDQUFDLG1CQUFtQixFQUFFSSxTQUFTO1FBQzVDYixTQUFVYTtJQUNaO0lBQ0FMLFFBQVFDLEdBQUcsQ0FBRTtJQUNiUCxNQUFPO0FBQ1QifQ==