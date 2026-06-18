// Copyright 2021, University of Colorado Boulder
/**
 * Copy the history of a file or directory to a different repo.
 *
 * ### REQUIREMENT: `git filter-repo`############################################
 * ###
 * ### This process requires the command `git filter-repo`, which is recommended by the git documentation as an improvement
 * ### over `git filter-branch`, https://git-scm.com/docs/git-filter-branch#_warning. I used `git --exec-path` to see the
 * ### path for auxiliary git commands.
 * ###
 * ### On SR's mac it was `/Library/Developer/CommandLineTools/usr/libexec/git-core`
 * ### On SR's win it was `/C/Program\ Files/Git/mingw64/libexec/git-core`
 * ### On MK's win it was `/C/Program\ Files\ (x86)/Git/mingw32/libexec/git-core`
 * ###
 * ### Installing `git filter-repo` on Windows consisted of these steps:
 * ### 1. Install python and confirm it is in the path and works from the command line
 * ### 2. Copy the raw contents of https://github.com/newren/git-filter-repo/blob/main/git-filter-repo into a file
 *        "git-filter-repo" in the --exec-path (it is easiest to write a file to you desktop and then click and drag
 *        the file into the admin-protected directory).
 * ### 3. If your system uses "python" instead of "python3", change that in the 1st line of the file.
 * ### 4. Test using "git filter-repo", if it is installed correctly it will say something like: "No arguments specified"
 * ###
 * ### More instructions about installing are listed here:
 * ### https://github.com/newren/git-filter-repo#how-do-i-install-it
 * ##############################################################################
 *
 * USAGE:
 * sage run perennial/js/scripts/copy-history-to-different-repo.ts source-path destination-repo
 *
 * EXAMPLE:
 * sage run perennial/js/scripts/copy-history-to-different-repo.ts center-and-variability/js/common/view/QuestionBar.ts scenery-phet
 * sage run perennial/js/scripts/copy-history-to-different-repo.ts counting-common/js/ number-suite-common
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */ import booleanPrompt from '../common/booleanPrompt.js';
import execute from '../common/execute.js';
(async ()=>{
    const args = process.argv.slice(2);
    const sourceRepo = args[0].split('/')[0];
    const relativePath = args[0].split('/').slice(1).join('/');
    const targetRepo = args[1];
    console.log(`Copying ${relativePath} from ${sourceRepo} to ${targetRepo}`);
    // git log --oneline --follow -M --name-status -- js/ABSwitch.ts
    // const stdout = await execute( 'git', `log --oneline --follow -M --name-status -- ${relativePath}`.split( ' ' ), `./perennial/${sourceRepo}` );
    const gitlog = await execute('git', `log --oneline --follow -M --name-status -- ${relativePath}`.split(' '), `./${sourceRepo}`);
    const allFilenames = new Set();
    gitlog.split('\n').forEach((line)=>{
        if (line.length > 0 && // Catch lines that start with an uppercase letter
        line[0].toUpperCase() === line[0] && // Avoid lines that do not start with a letter.  Only letters have uppercase and lowercase
        line[0].toUpperCase() !== line[0].toLowerCase()) {
            const terms = line.split('\t');
            const filenamesFromTerm = terms.slice(1);
            filenamesFromTerm.forEach((filenameFromTerm)=>{
                allFilenames.add(filenameFromTerm);
            });
        }
    });
    const filenameArray = Array.from(allFilenames.values());
    console.log(filenameArray.join('\n'));
    // git clone https://github.com/phetsims/vegas.git vegas-backup
    const historyCopyRepo = `${sourceRepo}-history-copy`;
    await execute('git', `clone -b main --single-branch https://github.com/phetsims/${sourceRepo}.git ${historyCopyRepo}`.split(' '), '.');
    const filterArgs = [
        'filter-repo'
    ];
    filenameArray.forEach((filename)=>{
        filterArgs.push('--path');
        filterArgs.push(filename);
    });
    console.log(filterArgs.join(' '));
    const filterResults = await execute('git', filterArgs, historyCopyRepo);
    console.log(filterResults);
    if (!await booleanPrompt(`Please inspect the filtered repo ${historyCopyRepo} to make sure it is ready for 
  merging. It should include all detected files:\n\n${filenameArray.join('\n')}\nWant to merge into ${targetRepo}?`, false)) {
        console.log('Aborted');
        return;
    }
    await execute('git', `remote add ${historyCopyRepo} ../${historyCopyRepo}`.split(' '), `./${targetRepo}`);
    await execute('git', `fetch ${historyCopyRepo}`.split(' '), `./${targetRepo}`);
    await execute('git', `merge ${historyCopyRepo}/main --allow-unrelated`.split(' '), `./${targetRepo}`);
    await execute('git', `remote remove ${historyCopyRepo}`.split(' '), `./${targetRepo}`);
    const aboutToPush = await execute('git', 'diff --stat --cached origin/main'.split(' '), `./${targetRepo}`);
    console.log('About to push: ' + aboutToPush);
    const unpushedCommits = await execute('git', 'log origin/main..main'.split(' '), `./${targetRepo}`);
    console.log(unpushedCommits);
    console.log(`Merged into target repo ${targetRepo}. The remaining steps are manual:   
* Inspect the merged repo ${targetRepo} files and history and see if the result looks good.
* Delete the temporary cloned repo: rm -rf ${historyCopyRepo}
* Update the namespace and registry statement, if appropriate.
* Move the file to the desired directory.
* Type-check, lint and test the new code.
* If the history, file, type checks and lint all seem good, git push the changes. (otherwise re-clone).
* Delete the copy in the prior directory. In the commit message, refer to an issue so there is a paper trail.
`);
    // When running tsx in combination with readline, the process does not exit properly, so we need to force it. See https://github.com/phetsims/perennial/issues/389
    process.exit(0);
})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL2NvcHktaGlzdG9yeS10by1kaWZmZXJlbnQtcmVwby50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogQ29weSB0aGUgaGlzdG9yeSBvZiBhIGZpbGUgb3IgZGlyZWN0b3J5IHRvIGEgZGlmZmVyZW50IHJlcG8uXG4gKlxuICogIyMjIFJFUVVJUkVNRU5UOiBgZ2l0IGZpbHRlci1yZXBvYCMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4gKiAjIyNcbiAqICMjIyBUaGlzIHByb2Nlc3MgcmVxdWlyZXMgdGhlIGNvbW1hbmQgYGdpdCBmaWx0ZXItcmVwb2AsIHdoaWNoIGlzIHJlY29tbWVuZGVkIGJ5IHRoZSBnaXQgZG9jdW1lbnRhdGlvbiBhcyBhbiBpbXByb3ZlbWVudFxuICogIyMjIG92ZXIgYGdpdCBmaWx0ZXItYnJhbmNoYCwgaHR0cHM6Ly9naXQtc2NtLmNvbS9kb2NzL2dpdC1maWx0ZXItYnJhbmNoI193YXJuaW5nLiBJIHVzZWQgYGdpdCAtLWV4ZWMtcGF0aGAgdG8gc2VlIHRoZVxuICogIyMjIHBhdGggZm9yIGF1eGlsaWFyeSBnaXQgY29tbWFuZHMuXG4gKiAjIyNcbiAqICMjIyBPbiBTUidzIG1hYyBpdCB3YXMgYC9MaWJyYXJ5L0RldmVsb3Blci9Db21tYW5kTGluZVRvb2xzL3Vzci9saWJleGVjL2dpdC1jb3JlYFxuICogIyMjIE9uIFNSJ3Mgd2luIGl0IHdhcyBgL0MvUHJvZ3JhbVxcIEZpbGVzL0dpdC9taW5ndzY0L2xpYmV4ZWMvZ2l0LWNvcmVgXG4gKiAjIyMgT24gTUsncyB3aW4gaXQgd2FzIGAvQy9Qcm9ncmFtXFwgRmlsZXNcXCAoeDg2KS9HaXQvbWluZ3czMi9saWJleGVjL2dpdC1jb3JlYFxuICogIyMjXG4gKiAjIyMgSW5zdGFsbGluZyBgZ2l0IGZpbHRlci1yZXBvYCBvbiBXaW5kb3dzIGNvbnNpc3RlZCBvZiB0aGVzZSBzdGVwczpcbiAqICMjIyAxLiBJbnN0YWxsIHB5dGhvbiBhbmQgY29uZmlybSBpdCBpcyBpbiB0aGUgcGF0aCBhbmQgd29ya3MgZnJvbSB0aGUgY29tbWFuZCBsaW5lXG4gKiAjIyMgMi4gQ29weSB0aGUgcmF3IGNvbnRlbnRzIG9mIGh0dHBzOi8vZ2l0aHViLmNvbS9uZXdyZW4vZ2l0LWZpbHRlci1yZXBvL2Jsb2IvbWFpbi9naXQtZmlsdGVyLXJlcG8gaW50byBhIGZpbGVcbiAqICAgICAgICBcImdpdC1maWx0ZXItcmVwb1wiIGluIHRoZSAtLWV4ZWMtcGF0aCAoaXQgaXMgZWFzaWVzdCB0byB3cml0ZSBhIGZpbGUgdG8geW91IGRlc2t0b3AgYW5kIHRoZW4gY2xpY2sgYW5kIGRyYWdcbiAqICAgICAgICB0aGUgZmlsZSBpbnRvIHRoZSBhZG1pbi1wcm90ZWN0ZWQgZGlyZWN0b3J5KS5cbiAqICMjIyAzLiBJZiB5b3VyIHN5c3RlbSB1c2VzIFwicHl0aG9uXCIgaW5zdGVhZCBvZiBcInB5dGhvbjNcIiwgY2hhbmdlIHRoYXQgaW4gdGhlIDFzdCBsaW5lIG9mIHRoZSBmaWxlLlxuICogIyMjIDQuIFRlc3QgdXNpbmcgXCJnaXQgZmlsdGVyLXJlcG9cIiwgaWYgaXQgaXMgaW5zdGFsbGVkIGNvcnJlY3RseSBpdCB3aWxsIHNheSBzb21ldGhpbmcgbGlrZTogXCJObyBhcmd1bWVudHMgc3BlY2lmaWVkXCJcbiAqICMjI1xuICogIyMjIE1vcmUgaW5zdHJ1Y3Rpb25zIGFib3V0IGluc3RhbGxpbmcgYXJlIGxpc3RlZCBoZXJlOlxuICogIyMjIGh0dHBzOi8vZ2l0aHViLmNvbS9uZXdyZW4vZ2l0LWZpbHRlci1yZXBvI2hvdy1kby1pLWluc3RhbGwtaXRcbiAqICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuICpcbiAqIFVTQUdFOlxuICogc2FnZSBydW4gcGVyZW5uaWFsL2pzL3NjcmlwdHMvY29weS1oaXN0b3J5LXRvLWRpZmZlcmVudC1yZXBvLnRzIHNvdXJjZS1wYXRoIGRlc3RpbmF0aW9uLXJlcG9cbiAqXG4gKiBFWEFNUExFOlxuICogc2FnZSBydW4gcGVyZW5uaWFsL2pzL3NjcmlwdHMvY29weS1oaXN0b3J5LXRvLWRpZmZlcmVudC1yZXBvLnRzIGNlbnRlci1hbmQtdmFyaWFiaWxpdHkvanMvY29tbW9uL3ZpZXcvUXVlc3Rpb25CYXIudHMgc2NlbmVyeS1waGV0XG4gKiBzYWdlIHJ1biBwZXJlbm5pYWwvanMvc2NyaXB0cy9jb3B5LWhpc3RvcnktdG8tZGlmZmVyZW50LXJlcG8udHMgY291bnRpbmctY29tbW9uL2pzLyBudW1iZXItc3VpdGUtY29tbW9uXG4gKlxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqIEBhdXRob3IgQ2hyaXMgS2x1c2VuZG9yZiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5pbXBvcnQgYm9vbGVhblByb21wdCBmcm9tICcuLi9jb21tb24vYm9vbGVhblByb21wdC5qcyc7XG5pbXBvcnQgZXhlY3V0ZSBmcm9tICcuLi9jb21tb24vZXhlY3V0ZS5qcyc7XG5cbiggYXN5bmMgKCkgPT4ge1xuICBjb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKCAyICk7XG5cbiAgY29uc3Qgc291cmNlUmVwbyA9IGFyZ3NbIDAgXS5zcGxpdCggJy8nIClbIDAgXTtcbiAgY29uc3QgcmVsYXRpdmVQYXRoID0gYXJnc1sgMCBdLnNwbGl0KCAnLycgKS5zbGljZSggMSApLmpvaW4oICcvJyApO1xuXG4gIGNvbnN0IHRhcmdldFJlcG8gPSBhcmdzWyAxIF07XG5cbiAgY29uc29sZS5sb2coIGBDb3B5aW5nICR7cmVsYXRpdmVQYXRofSBmcm9tICR7c291cmNlUmVwb30gdG8gJHt0YXJnZXRSZXBvfWAgKTtcblxuICAvLyBnaXQgbG9nIC0tb25lbGluZSAtLWZvbGxvdyAtTSAtLW5hbWUtc3RhdHVzIC0tIGpzL0FCU3dpdGNoLnRzXG4gIC8vIGNvbnN0IHN0ZG91dCA9IGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBgbG9nIC0tb25lbGluZSAtLWZvbGxvdyAtTSAtLW5hbWUtc3RhdHVzIC0tICR7cmVsYXRpdmVQYXRofWAuc3BsaXQoICcgJyApLCBgLi9wZXJlbm5pYWwvJHtzb3VyY2VSZXBvfWAgKTtcbiAgY29uc3QgZ2l0bG9nID0gYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIGBsb2cgLS1vbmVsaW5lIC0tZm9sbG93IC1NIC0tbmFtZS1zdGF0dXMgLS0gJHtyZWxhdGl2ZVBhdGh9YC5zcGxpdCggJyAnICksIGAuLyR7c291cmNlUmVwb31gICk7XG5cbiAgY29uc3QgYWxsRmlsZW5hbWVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGdpdGxvZy5zcGxpdCggJ1xcbicgKS5mb3JFYWNoKCAoIGxpbmU6IHN0cmluZyApID0+IHtcbiAgICBpZiAoIGxpbmUubGVuZ3RoID4gMCAmJlxuXG4gICAgICAgICAvLyBDYXRjaCBsaW5lcyB0aGF0IHN0YXJ0IHdpdGggYW4gdXBwZXJjYXNlIGxldHRlclxuICAgICAgICAgbGluZVsgMCBdLnRvVXBwZXJDYXNlKCkgPT09IGxpbmVbIDAgXSAmJlxuXG4gICAgICAgICAvLyBBdm9pZCBsaW5lcyB0aGF0IGRvIG5vdCBzdGFydCB3aXRoIGEgbGV0dGVyLiAgT25seSBsZXR0ZXJzIGhhdmUgdXBwZXJjYXNlIGFuZCBsb3dlcmNhc2VcbiAgICAgICAgIGxpbmVbIDAgXS50b1VwcGVyQ2FzZSgpICE9PSBsaW5lWyAwIF0udG9Mb3dlckNhc2UoKVxuICAgICkge1xuICAgICAgY29uc3QgdGVybXMgPSBsaW5lLnNwbGl0KCAnXFx0JyApO1xuICAgICAgY29uc3QgZmlsZW5hbWVzRnJvbVRlcm0gPSB0ZXJtcy5zbGljZSggMSApO1xuXG4gICAgICBmaWxlbmFtZXNGcm9tVGVybS5mb3JFYWNoKCBmaWxlbmFtZUZyb21UZXJtID0+IHtcbiAgICAgICAgYWxsRmlsZW5hbWVzLmFkZCggZmlsZW5hbWVGcm9tVGVybSApO1xuICAgICAgfSApO1xuICAgIH1cbiAgfSApO1xuXG4gIGNvbnN0IGZpbGVuYW1lQXJyYXkgPSBBcnJheS5mcm9tKCBhbGxGaWxlbmFtZXMudmFsdWVzKCkgKTtcbiAgY29uc29sZS5sb2coIGZpbGVuYW1lQXJyYXkuam9pbiggJ1xcbicgKSApO1xuXG4gIC8vIGdpdCBjbG9uZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdmVnYXMuZ2l0IHZlZ2FzLWJhY2t1cFxuICBjb25zdCBoaXN0b3J5Q29weVJlcG8gPSBgJHtzb3VyY2VSZXBvfS1oaXN0b3J5LWNvcHlgO1xuICBhd2FpdCBleGVjdXRlKCAnZ2l0JywgYGNsb25lIC1iIG1haW4gLS1zaW5nbGUtYnJhbmNoIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy8ke3NvdXJjZVJlcG99LmdpdCAke2hpc3RvcnlDb3B5UmVwb31gLnNwbGl0KCAnICcgKSwgJy4nICk7XG5cbiAgY29uc3QgZmlsdGVyQXJnczogc3RyaW5nW10gPSBbICdmaWx0ZXItcmVwbycgXTtcbiAgZmlsZW5hbWVBcnJheS5mb3JFYWNoKCBmaWxlbmFtZSA9PiB7XG4gICAgZmlsdGVyQXJncy5wdXNoKCAnLS1wYXRoJyApO1xuICAgIGZpbHRlckFyZ3MucHVzaCggZmlsZW5hbWUgKTtcbiAgfSApO1xuICBjb25zb2xlLmxvZyggZmlsdGVyQXJncy5qb2luKCAnICcgKSApO1xuICBjb25zdCBmaWx0ZXJSZXN1bHRzID0gYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIGZpbHRlckFyZ3MsIGhpc3RvcnlDb3B5UmVwbyApO1xuXG4gIGNvbnNvbGUubG9nKCBmaWx0ZXJSZXN1bHRzICk7XG5cbiAgaWYgKCAhYXdhaXQgYm9vbGVhblByb21wdCggYFBsZWFzZSBpbnNwZWN0IHRoZSBmaWx0ZXJlZCByZXBvICR7aGlzdG9yeUNvcHlSZXBvfSB0byBtYWtlIHN1cmUgaXQgaXMgcmVhZHkgZm9yIFxuICBtZXJnaW5nLiBJdCBzaG91bGQgaW5jbHVkZSBhbGwgZGV0ZWN0ZWQgZmlsZXM6XFxuXFxuJHtmaWxlbmFtZUFycmF5LmpvaW4oICdcXG4nICl9XFxuV2FudCB0byBtZXJnZSBpbnRvICR7dGFyZ2V0UmVwb30/YCwgZmFsc2UgKSApIHtcbiAgICBjb25zb2xlLmxvZyggJ0Fib3J0ZWQnICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIGByZW1vdGUgYWRkICR7aGlzdG9yeUNvcHlSZXBvfSAuLi8ke2hpc3RvcnlDb3B5UmVwb31gLnNwbGl0KCAnICcgKSwgYC4vJHt0YXJnZXRSZXBvfWAgKTtcbiAgYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIGBmZXRjaCAke2hpc3RvcnlDb3B5UmVwb31gLnNwbGl0KCAnICcgKSwgYC4vJHt0YXJnZXRSZXBvfWAgKTtcbiAgYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIGBtZXJnZSAke2hpc3RvcnlDb3B5UmVwb30vbWFpbiAtLWFsbG93LXVucmVsYXRlZGAuc3BsaXQoICcgJyApLCBgLi8ke3RhcmdldFJlcG99YCApO1xuICBhd2FpdCBleGVjdXRlKCAnZ2l0JywgYHJlbW90ZSByZW1vdmUgJHtoaXN0b3J5Q29weVJlcG99YC5zcGxpdCggJyAnICksIGAuLyR7dGFyZ2V0UmVwb31gICk7XG5cbiAgY29uc3QgYWJvdXRUb1B1c2ggPSBhd2FpdCBleGVjdXRlKCAnZ2l0JywgJ2RpZmYgLS1zdGF0IC0tY2FjaGVkIG9yaWdpbi9tYWluJy5zcGxpdCggJyAnICksIGAuLyR7dGFyZ2V0UmVwb31gICk7XG5cbiAgY29uc29sZS5sb2coICdBYm91dCB0byBwdXNoOiAnICsgYWJvdXRUb1B1c2ggKTtcblxuICBjb25zdCB1bnB1c2hlZENvbW1pdHMgPSBhd2FpdCBleGVjdXRlKCAnZ2l0JywgJ2xvZyBvcmlnaW4vbWFpbi4ubWFpbicuc3BsaXQoICcgJyApLCBgLi8ke3RhcmdldFJlcG99YCApO1xuICBjb25zb2xlLmxvZyggdW5wdXNoZWRDb21taXRzICk7XG5cbiAgY29uc29sZS5sb2coXG4gICAgYE1lcmdlZCBpbnRvIHRhcmdldCByZXBvICR7dGFyZ2V0UmVwb30uIFRoZSByZW1haW5pbmcgc3RlcHMgYXJlIG1hbnVhbDogICBcbiogSW5zcGVjdCB0aGUgbWVyZ2VkIHJlcG8gJHt0YXJnZXRSZXBvfSBmaWxlcyBhbmQgaGlzdG9yeSBhbmQgc2VlIGlmIHRoZSByZXN1bHQgbG9va3MgZ29vZC5cbiogRGVsZXRlIHRoZSB0ZW1wb3JhcnkgY2xvbmVkIHJlcG86IHJtIC1yZiAke2hpc3RvcnlDb3B5UmVwb31cbiogVXBkYXRlIHRoZSBuYW1lc3BhY2UgYW5kIHJlZ2lzdHJ5IHN0YXRlbWVudCwgaWYgYXBwcm9wcmlhdGUuXG4qIE1vdmUgdGhlIGZpbGUgdG8gdGhlIGRlc2lyZWQgZGlyZWN0b3J5LlxuKiBUeXBlLWNoZWNrLCBsaW50IGFuZCB0ZXN0IHRoZSBuZXcgY29kZS5cbiogSWYgdGhlIGhpc3RvcnksIGZpbGUsIHR5cGUgY2hlY2tzIGFuZCBsaW50IGFsbCBzZWVtIGdvb2QsIGdpdCBwdXNoIHRoZSBjaGFuZ2VzLiAob3RoZXJ3aXNlIHJlLWNsb25lKS5cbiogRGVsZXRlIHRoZSBjb3B5IGluIHRoZSBwcmlvciBkaXJlY3RvcnkuIEluIHRoZSBjb21taXQgbWVzc2FnZSwgcmVmZXIgdG8gYW4gaXNzdWUgc28gdGhlcmUgaXMgYSBwYXBlciB0cmFpbC5cbmAgKTtcblxuICAvLyBXaGVuIHJ1bm5pbmcgdHN4IGluIGNvbWJpbmF0aW9uIHdpdGggcmVhZGxpbmUsIHRoZSBwcm9jZXNzIGRvZXMgbm90IGV4aXQgcHJvcGVybHksIHNvIHdlIG5lZWQgdG8gZm9yY2UgaXQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy8zODlcbiAgcHJvY2Vzcy5leGl0KCAwICk7XG59ICkoKTsiXSwibmFtZXMiOlsiYm9vbGVhblByb21wdCIsImV4ZWN1dGUiLCJhcmdzIiwicHJvY2VzcyIsImFyZ3YiLCJzbGljZSIsInNvdXJjZVJlcG8iLCJzcGxpdCIsInJlbGF0aXZlUGF0aCIsImpvaW4iLCJ0YXJnZXRSZXBvIiwiY29uc29sZSIsImxvZyIsImdpdGxvZyIsImFsbEZpbGVuYW1lcyIsIlNldCIsImZvckVhY2giLCJsaW5lIiwibGVuZ3RoIiwidG9VcHBlckNhc2UiLCJ0b0xvd2VyQ2FzZSIsInRlcm1zIiwiZmlsZW5hbWVzRnJvbVRlcm0iLCJmaWxlbmFtZUZyb21UZXJtIiwiYWRkIiwiZmlsZW5hbWVBcnJheSIsIkFycmF5IiwiZnJvbSIsInZhbHVlcyIsImhpc3RvcnlDb3B5UmVwbyIsImZpbHRlckFyZ3MiLCJmaWxlbmFtZSIsInB1c2giLCJmaWx0ZXJSZXN1bHRzIiwiYWJvdXRUb1B1c2giLCJ1bnB1c2hlZENvbW1pdHMiLCJleGl0Il0sIm1hcHBpbmdzIjoiQUFBQSxpREFBaUQ7QUFFakQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FrQ0MsR0FFRCxPQUFPQSxtQkFBbUIsNkJBQTZCO0FBQ3ZELE9BQU9DLGFBQWEsdUJBQXVCO0FBRXpDLENBQUE7SUFDQSxNQUFNQyxPQUFPQyxRQUFRQyxJQUFJLENBQUNDLEtBQUssQ0FBRTtJQUVqQyxNQUFNQyxhQUFhSixJQUFJLENBQUUsRUFBRyxDQUFDSyxLQUFLLENBQUUsSUFBSyxDQUFFLEVBQUc7SUFDOUMsTUFBTUMsZUFBZU4sSUFBSSxDQUFFLEVBQUcsQ0FBQ0ssS0FBSyxDQUFFLEtBQU1GLEtBQUssQ0FBRSxHQUFJSSxJQUFJLENBQUU7SUFFN0QsTUFBTUMsYUFBYVIsSUFBSSxDQUFFLEVBQUc7SUFFNUJTLFFBQVFDLEdBQUcsQ0FBRSxDQUFDLFFBQVEsRUFBRUosYUFBYSxNQUFNLEVBQUVGLFdBQVcsSUFBSSxFQUFFSSxZQUFZO0lBRTFFLGdFQUFnRTtJQUNoRSxpSkFBaUo7SUFDakosTUFBTUcsU0FBUyxNQUFNWixRQUFTLE9BQU8sQ0FBQywyQ0FBMkMsRUFBRU8sY0FBYyxDQUFDRCxLQUFLLENBQUUs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