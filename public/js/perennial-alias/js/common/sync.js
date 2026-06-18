// Copyright 2021-2026, University of Colorado Boulder
/**
 * The main logic behind the sync grunt task (js/grunt/tasks/sync.ts).
 *
 * Generally a "one-stop shop" for all things needed to update the PhET Codebase. By default, this will:
 * - clone missing repos
 * - pull all repos
 * - set up tracking to the remote (only if needed)
 * - npm update all repos in perennial/data/npm-update (and --repo if provided)
 * - log working copy changes in repos that have them
 *
 * There are a variety of options listed below to customize this process to your development needs. The default behavior
 * is meant to remain the list of items that are needed to ensure that, no matter what, your local codebase is up to
 * date after running. With a few noted exceptions:
 * - transpiling: you can use --transpile here, but most devs want to run a watch process, so this is not on by default
 * - starting a server: devs have a variety of ways to host the PhET codebase locally, this goes beyond the scope of
 *   this file.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */ import assert from 'assert';
import fs from 'fs';
import _ from 'lodash';
import { getOptionIfProvided } from '../grunt/tasks/util/getOption.js';
import cloneMissingRepos from './cloneMissingRepos.js';
import execute from './execute.js';
import getBranches from './getBranches.js';
import getRepoList from './getRepoList.js';
import gitCheckout from './gitCheckout.js';
import gitFetch from './gitFetch.js';
import gitIsClean from './gitIsClean.js';
import gitPullRebase from './gitPullRebase.js';
import gitRevParse from './gitRevParse.js';
import npmUpdate from './npmUpdate.js';
import { PERENNIAL_REPO_NAME } from './perennialRepoUtils.js';
import transpileAll from './transpileAll.js';
import chunkDelayed from './util/chunkDelayed.js';
const DEFAULTS = {
    pull: true,
    checkoutMain: true,
    status: true,
    npmUpdate: true,
    allBranches: false,
    transpile: false,
    logPull: true,
    logAll: false,
    logFormatting: true,
    omitPrivate: false,
    slowPull: false,
    repo: PERENNIAL_REPO_NAME,
    repoList: 'active-repos'
};
export const getSyncCLIOptions = ()=>{
    return {
        pull: getOptionIfProvided('pull', DEFAULTS.pull),
        checkoutMain: getOptionIfProvided('checkoutMain', DEFAULTS.checkoutMain),
        status: getOptionIfProvided('status', DEFAULTS.status),
        npmUpdate: getOptionIfProvided('npmUpdate', DEFAULTS.npmUpdate),
        allBranches: getOptionIfProvided('allBranches', DEFAULTS.allBranches),
        transpile: getOptionIfProvided('transpile', DEFAULTS.transpile),
        logPull: getOptionIfProvided('logPull', DEFAULTS.logPull),
        logAll: getOptionIfProvided('logAll', DEFAULTS.logAll),
        logFormatting: getOptionIfProvided('logFormatting', DEFAULTS.logFormatting),
        omitPrivate: getOptionIfProvided('omitPrivate', DEFAULTS.omitPrivate),
        slowPull: getOptionIfProvided('slowPull', DEFAULTS.slowPull),
        repo: getOptionIfProvided('repo', DEFAULTS.repo),
        repoList: getOptionIfProvided('repoList', DEFAULTS.repoList)
    };
};
// A consistent way to know if a git pulling command pulled changes. Returns the stdout output
// of the pull command.
export function parsePullResult(stdout) {
    if (stdout === 'Already up to date.\nCurrent branch main is up to date.\n' || stdout === 'Already up to date.\n' || stdout === 'Current branch main is up to date.\n') {
        return null;
    } else {
        return stdout.trim();
    }
}
/**
 * Returns success boolean
 */ export const sync = async (providedOptions)=>{
    const options = _.merge({}, DEFAULTS, providedOptions);
    options.logAll && assert(options.status, '--logAll is only supported with --status=true, otherwise not all repos have something to report');
    // The fastest way to update the codebase is to run clone-missing-repos as part of the parallel repoUpdate (for perennial)
    // Some options mandate that we clone repos first for correctness, before running parallel pull/status. If pulling all
    // branches, or printing all repos, it would be buggy to not have all repos checked out before kicking off the update
    // step. That said, don't default to the slower behavior unless we need to.
    const cloneFirst = options.allBranches || options.logAll;
    // ANSI escape sequences to move to the right (in the same line) or to apply or reset colors
    const moveRight = options.logFormatting ? ' \u001b[42G' : '\t';
    const red = options.logFormatting ? '\u001b[31m' : '';
    const green = options.logFormatting ? '\u001b[32m' : '';
    const bold = options.logFormatting ? '\u001b[1m' : '';
    const reset = options.logFormatting ? '\u001b[0m' : '';
    const data = {};
    let hasNoPullStatusProblems = true;
    async function pullAllBranches(repo) {
        const branches = await getBranches(repo);
        for (const branch of branches){
            // Only track the remote branch if it hasn't been tracked yet
            if ((await execute('git', [
                'rev-parse',
                '--verify',
                branch
            ], `../${repo}`, {
                errors: 'resolve'
            })).code !== 0) {
                await gitFetch(repo);
                await execute('git', [
                    'branch',
                    '--track',
                    branch,
                    `origin/${branch}`
                ], `../${repo}`);
            }
            await gitCheckout(repo, branch);
            try {
                await gitPullRebase(repo);
            } catch (e) {
                // Likely there is no tracking info set up on the local branch
                await execute('git', [
                    'branch',
                    `--set-upstream-to=origin/${branch}`,
                    branch
                ], `../${repo}`);
                await gitPullRebase(repo);
            }
        }
        // Go back to main
        await gitCheckout(repo, 'main');
    }
    function append(repo, message) {
        if (data[repo]) {
            data[repo] += '\n' + message;
        } else {
            data[repo] += `${bold}${repo}${reset}${message}`;
        }
    }
    const updateRepo = async (repo, allRepos)=>{
        data[repo] = '';
        try {
            let pullResult = null;
            if (fs.existsSync(`../${repo}`)) {
                if (options.pull) {
                    if (await gitIsClean(repo)) {
                        if (options.allBranches) {
                            await pullAllBranches(repo);
                        } else {
                            options.checkoutMain && await gitCheckout(repo, 'main');
                            pullResult = parsePullResult(await gitPullRebase(repo));
                        }
                    } else {
                        hasNoPullStatusProblems = false;
                        if (!options.status) {
                            append(repo, `${moveRight}${red}not clean, skipping pull${reset}`);
                        } else if (repo === PERENNIAL_REPO_NAME && !options.slowPull) {
                            console.log(`${red}${PERENNIAL_REPO_NAME} is not clean, skipping pull${reset}\n`);
                        }
                    }
                }
            } else {
                // This will be handled later when perennial gets around to cloneMissingRepos
                return;
            }
            // Inline cloneMissingRepos so it can run in parallel with other repoUpdate steps.
            if (!cloneFirst && repo === PERENNIAL_REPO_NAME) {
                await cloneMissingReposInternal(allRepos);
            }
            if (options.status) {
                const symbolicRef = (await execute('git', [
                    'symbolic-ref',
                    '-q',
                    'HEAD'
                ], `../${repo}`)).trim();
                const branch = symbolicRef.replace('refs/heads/', ''); // might be empty string
                const sha = await gitRevParse(repo, 'HEAD');
                const status = await execute('git', [
                    'status',
                    '--porcelain'
                ], `../${repo}`);
                const track = branch ? (await execute('git', [
                    'for-each-ref',
                    '--format=%(push:track,nobracket)',
                    symbolicRef
                ], `../${repo}`)).trim() : '';
                let isGreen = false;
                if (branch) {
                    const correctBranch = !options.checkoutMain || branch === 'main';
                    isGreen = !status && correctBranch && !track.length;
                    if (!isGreen || options.logAll) {
                        append(repo, `${moveRight}${isGreen ? green : red}${branch}${reset} ${track}`);
                    }
                } else {
                    // if no branch, print our SHA (detached head)
                    append(repo, `${moveRight}${red}${sha}${reset}`);
                }
                if (status) {
                    if (!isGreen || options.logAll) {
                        append(repo, status);
                    }
                }
                hasNoPullStatusProblems = hasNoPullStatusProblems && isGreen;
            }
            // Log pull result after the status section, for formatting
            if (options.logPull && pullResult) {
                append(repo, ' ' + pullResult);
            }
        } catch (e) {
            hasNoPullStatusProblems = false;
            append(repo, ` ERROR: ${e}`);
        }
        // Print progress as we go during slowPull, because it is slow
        if (options.slowPull) {
            (options.logAll || data[repo].length) && console.log(data[repo]);
        }
    };
    // Bundles a call to cloneMissingRepos with logging what repos were cloned
    async function cloneMissingReposInternal(reposToCheck) {
        const missingRepos = await cloneMissingRepos(options.omitPrivate, reposToCheck);
        if (missingRepos.length) {
            console.log(`${green}Cloned:\n\t${missingRepos.join('\n\t')}${reset}`);
        }
    }
    // Get the list of repos that will be updated. Instead of having certain options override each other, just include the subset.
    function getRepos() {
        const repoList = getRepoList(options.repoList);
        // Always update perennial, to make sure cloning can happen
        return _.uniq([
            ...repoList,
            PERENNIAL_REPO_NAME,
            options.repo
        ]);
    }
    const startPullStatus = Date.now();
    console.log(); // extra space before the first logging
    let repos = getRepos();
    if (options.pull || options.status) {
        // See doc for "clone first"
        if (cloneFirst) {
            await gitIsClean(PERENNIAL_REPO_NAME) && await gitPullRebase(PERENNIAL_REPO_NAME);
            await cloneMissingReposInternal(repos);
            // reload repo list after the above cloneMissingRepos changes
            repos = getRepos(); // eslint-disable-line require-atomic-updates
        }
        if (options.slowPull) {
            await chunkDelayed(repos, (repo)=>updateRepo(repo, repos), {
                waitPerItem: options.allBranches ? 1000 : 110,
                chunkSize: options.allBranches ? 20 : 15
            });
        } else {
            await Promise.all(repos.map((repo)=>updateRepo(repo, repos)));
            repos.forEach((repo)=>data[repo].length > 0 && console.log(data[repo]));
        }
        const color = hasNoPullStatusProblems ? green : red;
        console.log(`\n${color}-----=====] finished pull/status (${Date.now() - startPullStatus}ms) [=====-----${reset}\n`);
    }
    let npmUpdateProblems = false;
    if (options.npmUpdate) {
        const startNPM = Date.now();
        const npmUpdatesNeeded = getRepoList('npm-update').filter((repo)=>repos.includes(repo));
        try {
            const promises = npmUpdatesNeeded.map((repo)=>npmUpdate(repo));
            const cwdRepo = options.repo;
            cwdRepo && !npmUpdatesNeeded.includes(cwdRepo) && fs.existsSync(`../${cwdRepo}/package.json`) && promises.push(npmUpdate(cwdRepo));
            await Promise.all(promises);
        } catch (e) {
            npmUpdateProblems = true;
            console.error('Error npm updating:', e);
        }
        console.log(`${npmUpdateProblems ? red : green}-----=====] finished npm (${Date.now() - startNPM}ms) [=====-----${reset}\n`);
    }
    let transpileProblems = false;
    if (options.transpile) {
        const startTranspile = Date.now();
        try {
            await transpileAll();
        } catch (e) {
            transpileProblems = true;
            console.error('Error transpiling:', e);
        }
        console.log(`${transpileProblems ? red : green}-----=====] finished transpile (${Date.now() - startTranspile}ms) [=====-----${reset}\n`);
    }
    console.log(`\nsync complete in ${Date.now() - startPullStatus}ms`);
    return hasNoPullStatusProblems && !npmUpdateProblems && !transpileProblems;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vc3luYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBUaGUgbWFpbiBsb2dpYyBiZWhpbmQgdGhlIHN5bmMgZ3J1bnQgdGFzayAoanMvZ3J1bnQvdGFza3Mvc3luYy50cykuXG4gKlxuICogR2VuZXJhbGx5IGEgXCJvbmUtc3RvcCBzaG9wXCIgZm9yIGFsbCB0aGluZ3MgbmVlZGVkIHRvIHVwZGF0ZSB0aGUgUGhFVCBDb2RlYmFzZS4gQnkgZGVmYXVsdCwgdGhpcyB3aWxsOlxuICogLSBjbG9uZSBtaXNzaW5nIHJlcG9zXG4gKiAtIHB1bGwgYWxsIHJlcG9zXG4gKiAtIHNldCB1cCB0cmFja2luZyB0byB0aGUgcmVtb3RlIChvbmx5IGlmIG5lZWRlZClcbiAqIC0gbnBtIHVwZGF0ZSBhbGwgcmVwb3MgaW4gcGVyZW5uaWFsL2RhdGEvbnBtLXVwZGF0ZSAoYW5kIC0tcmVwbyBpZiBwcm92aWRlZClcbiAqIC0gbG9nIHdvcmtpbmcgY29weSBjaGFuZ2VzIGluIHJlcG9zIHRoYXQgaGF2ZSB0aGVtXG4gKlxuICogVGhlcmUgYXJlIGEgdmFyaWV0eSBvZiBvcHRpb25zIGxpc3RlZCBiZWxvdyB0byBjdXN0b21pemUgdGhpcyBwcm9jZXNzIHRvIHlvdXIgZGV2ZWxvcG1lbnQgbmVlZHMuIFRoZSBkZWZhdWx0IGJlaGF2aW9yXG4gKiBpcyBtZWFudCB0byByZW1haW4gdGhlIGxpc3Qgb2YgaXRlbXMgdGhhdCBhcmUgbmVlZGVkIHRvIGVuc3VyZSB0aGF0LCBubyBtYXR0ZXIgd2hhdCwgeW91ciBsb2NhbCBjb2RlYmFzZSBpcyB1cCB0b1xuICogZGF0ZSBhZnRlciBydW5uaW5nLiBXaXRoIGEgZmV3IG5vdGVkIGV4Y2VwdGlvbnM6XG4gKiAtIHRyYW5zcGlsaW5nOiB5b3UgY2FuIHVzZSAtLXRyYW5zcGlsZSBoZXJlLCBidXQgbW9zdCBkZXZzIHdhbnQgdG8gcnVuIGEgd2F0Y2ggcHJvY2Vzcywgc28gdGhpcyBpcyBub3Qgb24gYnkgZGVmYXVsdFxuICogLSBzdGFydGluZyBhIHNlcnZlcjogZGV2cyBoYXZlIGEgdmFyaWV0eSBvZiB3YXlzIHRvIGhvc3QgdGhlIFBoRVQgY29kZWJhc2UgbG9jYWxseSwgdGhpcyBnb2VzIGJleW9uZCB0aGUgc2NvcGUgb2ZcbiAqICAgdGhpcyBmaWxlLlxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBJbnRlbnRpb25hbFBlcmVubmlhbEFueSB9IGZyb20gJy4uL2Jyb3dzZXItYW5kLW5vZGUvUGVyZW5uaWFsVHlwZXMuanMnO1xuaW1wb3J0IHsgZ2V0T3B0aW9uSWZQcm92aWRlZCB9IGZyb20gJy4uL2dydW50L3Rhc2tzL3V0aWwvZ2V0T3B0aW9uLmpzJztcbmltcG9ydCBjbG9uZU1pc3NpbmdSZXBvcyBmcm9tICcuL2Nsb25lTWlzc2luZ1JlcG9zLmpzJztcbmltcG9ydCBleGVjdXRlIGZyb20gJy4vZXhlY3V0ZS5qcyc7XG5pbXBvcnQgZ2V0QnJhbmNoZXMgZnJvbSAnLi9nZXRCcmFuY2hlcy5qcyc7XG5pbXBvcnQgZ2V0UmVwb0xpc3QgZnJvbSAnLi9nZXRSZXBvTGlzdC5qcyc7XG5pbXBvcnQgZ2l0Q2hlY2tvdXQgZnJvbSAnLi9naXRDaGVja291dC5qcyc7XG5pbXBvcnQgZ2l0RmV0Y2ggZnJvbSAnLi9naXRGZXRjaC5qcyc7XG5pbXBvcnQgZ2l0SXNDbGVhbiBmcm9tICcuL2dpdElzQ2xlYW4uanMnO1xuaW1wb3J0IGdpdFB1bGxSZWJhc2UgZnJvbSAnLi9naXRQdWxsUmViYXNlLmpzJztcbmltcG9ydCBnaXRSZXZQYXJzZSBmcm9tICcuL2dpdFJldlBhcnNlLmpzJztcbmltcG9ydCBucG1VcGRhdGUgZnJvbSAnLi9ucG1VcGRhdGUuanMnO1xuaW1wb3J0IHsgUEVSRU5OSUFMX1JFUE9fTkFNRSB9IGZyb20gJy4vcGVyZW5uaWFsUmVwb1V0aWxzLmpzJztcbmltcG9ydCB0cmFuc3BpbGVBbGwgZnJvbSAnLi90cmFuc3BpbGVBbGwuanMnO1xuaW1wb3J0IGNodW5rRGVsYXllZCBmcm9tICcuL3V0aWwvY2h1bmtEZWxheWVkLmpzJztcblxuZXhwb3J0IHR5cGUgU3luY09wdGlvbnMgPSB7XG4gIC8vIGdpdCBwdWxsIHJlcG9zLCBkZWZhdWx0IHRvIHRydWUuIFdoZW4gZmFsc2UsIHdpbGwgYWxzbyBza2lwIGNoZWNraW5nIG91dCBtYWluLlxuICBwdWxsOiBib29sZWFuO1xuXG4gIC8vIGdpdCBjaGVja291dCBtYWluIGJlZm9yZSBwdWxsaW5nIGVhY2ggcmVwby4gVGhpcyBvcHRpb24gaXMgaWdub3JlZCBpZiAtLXB1bGw9ZmFsc2UuIERlZmF1bHQgdG8gdHJ1ZS5cbiAgY2hlY2tvdXRNYWluOiBib29sZWFuO1xuXG4gIC8vIGdpdC1zdGF0dXMtc3R5bGVkIG91dHB1dCwgZGVmYXVsdCB0byB0cnVlXG4gIHN0YXR1czogYm9vbGVhbjtcblxuICAvLyBucG0gdXBkYXRlIG9uIGFsbCByZXBvcyBpbiBwZXJlbm5pYWwvZGF0YS9ucG0tdXBkYXRlLCBhbmQgdGhlIGAtLXJlcG9gIG9wdGlvbiAoaWYgcHJvdmlkZWQpLCBkZWZhdWx0cyB0byB0cnVlLlxuICAvLyBNSyB3aXNoZXMgdGhpcyBvcHRpb25zIHdhcyBjYWxsZWQgXCJucG1cIiwgYnV0IHRoaXMgb3B0aW9uIGlzIHJlY29nbml6ZWQgYnkgbm9kZSBpbnN0ZWFkLlxuICBucG1VcGRhdGU6IGJvb2xlYW47XG5cbiAgLy8gVHJhY2sgQUxMIHJlbW90ZSBicmFuY2hlcyBvbiBhbGwgcmVwb3MgbG9jYWxseSwgY2hlY2sgdGhlbSBvdXQsIGFuZCBwdWxsIHRoZW0gKHdpdGggcmViYXNlKS4gSXQgaXMgcmVjb21tZW5kZWQgdG9cbiAgLy8gY2xvc2Ugd2Vic3Rvcm0gYW5kIHR1cm4gb2ZmIHRoZSB0cmFuc3BpbGVyIHdhdGNoIHByb2Nlc3MgYmVmb3JlIHJ1bm5pbmcgd2l0aCB0aGlzIG9wdGlvbi4gVXNlZnVsIGZvciBkb2luZyBiYXRjaFxuICAvLyBtYWludGVuYW5jZSByZWxlYXNlcy5cbiAgYWxsQnJhbmNoZXM6IGJvb2xlYW47XG5cbiAgLy8gUnVuIHRoZSB0cmFuc3BpbGUgc3RlcCAod2l0aG91dCB3YXRjaGluZykuIFJ1bnMgYXQgdGhlIGVuZCBvZiB0aGUgcHJvY2VzcyAoYWZ0ZXIgcHVsbHMgYW5kIG5wbSB1cGRhdGVzKVxuICB0cmFuc3BpbGU6IGJvb2xlYW47XG5cbiAgLy8gQnkgZGVmYXVsdCwgdGhlIG91dHB1dCBvZiBcImdpdCBwdWxsXCIgaW4gYSByZXBvIHdpbGwgYmUgbG9nZ2VkLCB1c2UgdGhpcyBvcHRpb24gdG8gdHVybiBpdCBvZmYuXG4gIGxvZ1B1bGw6IGJvb2xlYW47XG5cbiAgLy8gTG9nIHN0YXR1cyBvZiBhbGwgcmVwb3MsIGV2ZW4gaWYgbm90aGluZyBjaGFuZ2VkIHdpdGggdGhlbS4gKG9ubHkgZG9lcyBzb21ldGhpbmcgd2hlbiAtLXN0YXR1cyBpcyB0cnVlKVxuICBsb2dBbGw6IGJvb2xlYW47XG5cbiAgLy8gSW5jbHVkZSBjb21tYW5kIGxpbmUgZm9ybWF0dGluZyBtYXJraW5ncywgdXNlZnVsIGZvciBydW5uaW5nIGZyb20gYSB0ZXJtaW5hbCwgYnV0IGxlc3Mgc28gd2hlbiBydW5uaW5nIGZyb20gYW5vdGhlclxuICAvLyBzY3JpcHQgYW5kIGphdmFzY3JpcHQgbG9nZ2luZyBzdGRvdXQuXG4gIGxvZ0Zvcm1hdHRpbmc6IGJvb2xlYW47XG5cbiAgLy8gV2hlbiBjbG9uaW5nIG1pc3NpbmcgcmVwb3MsIGJ5IGRlZmF1bHQgcHJpdmF0ZSByZXBvcyBhcmUgaW5jbHVkZWQsIHVzZSB0aGlzIHRvIG9wdCBvdXRcbiAgb21pdFByaXZhdGU6IGJvb2xlYW47XG5cbiAgLy8gUHVsbGluZyByZXBvcyBpbiBwYXJhbGxlbCBkb2Vzbid0IHdvcmsgb24gV2luZG93cyBnaXQuICBUaGlzIGlzIGEgd29ya2Fyb3VuZCBmb3IgdGhhdC4gSXQgd2lsbCBhbHNvIGxvZyBhcyBpdFxuICAvLyBjb21wbGV0ZXMgaW5kaXZpZHVhbCByZXBvIHVwZGF0ZXMsIHNpbmNlIGl0IHRha2VzIG1vcmUgdGltZS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9wZXJlbm5pYWwvaXNzdWVzLzM2MVxuICBzbG93UHVsbDogYm9vbGVhbjtcblxuICAvLyBSdW4gbnBtIHVwZGF0ZSBvbiB0aGlzIHJlcG8gYXMgd2VsbC4gQXV0b21hdGljYWxseSBmaWxsZWQgaW4gaWYgcnVubmluZyBhcyBhIGdydW50IHRhc2suIFRoaXMgcmVwbyB0byB1cGRhdGUgd2lsbFxuICAvLyBiZSBjb21iaW5lZCB3aXRoIHRoZSByZXBvcyBpbiBgb3B0aW9ucy5yZXBvTGlzdGAsIGFuZCBwbGVhc2Ugbm90ZSB0aGF0IHRoZSBwZXJlbm5pYWwgcmVwbyB0aGF0IGBzeW5jYCBpcyBydW5cbiAgLy8gZnJvbSBpcyBBTFdBWVMgaW5jbHVkZWQgaW4gc2NyaXB0LlxuICByZXBvOiBzdHJpbmc7XG5cbiAgLy8gTmFtZSBvZiB0aGUgZmlsZSBvZiByZXBvcyBpbiBwZXJlbm5pYWwvZGF0YS8gdG8gdXNlIGZvciB0aGUgdXBkYXRlLCBkZWZhdWx0cyB0byBcImFjdGl2ZS1yZXBvc1wiLlxuICAvLyBGb3IgZXhhbXBsZSwgYGdydW50IHN5bmMgLS1yZXBvTGlzdD1hY3RpdmUtd2Vic2l0ZS1yZXBvc2AuIFRoaXMgbGlzdCB3aWxsIGJlIGNvbWJpbmVkIHdpdGggYG9wdGlvbnMucmVwb2AsIGFuZCBwbGVhc2VcbiAgLy8gbm90ZSB0aGF0IHRoZSBwZXJlbm5pYWwgcmVwbyB0aGF0IHN5bmMgaXMgcnVuIGZyb20gaXMgQUxXQVlTIGluY2x1ZGVkIGluIHNjcmlwdC5cbiAgcmVwb0xpc3Q6IHN0cmluZztcbn07XG5cbmNvbnN0IERFRkFVTFRTID0ge1xuICBwdWxsOiB0cnVlLFxuICBjaGVja291dE1haW46IHRydWUsXG4gIHN0YXR1czogdHJ1ZSxcbiAgbnBtVXBkYXRlOiB0cnVlLFxuICBhbGxCcmFuY2hlczogZmFsc2UsXG4gIHRyYW5zcGlsZTogZmFsc2UsXG4gIGxvZ1B1bGw6IHRydWUsXG4gIGxvZ0FsbDogZmFsc2UsXG4gIGxvZ0Zvcm1hdHRpbmc6IHRydWUsXG4gIG9taXRQcml2YXRlOiBmYWxzZSxcbiAgc2xvd1B1bGw6IGZhbHNlLFxuICByZXBvOiBQRVJFTk5JQUxfUkVQT19OQU1FLFxuICByZXBvTGlzdDogJ2FjdGl2ZS1yZXBvcydcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRTeW5jQ0xJT3B0aW9ucyA9ICgpOiBTeW5jT3B0aW9ucyA9PiB7XG5cbiAgcmV0dXJuIHtcbiAgICBwdWxsOiBnZXRPcHRpb25JZlByb3ZpZGVkKCAncHVsbCcsIERFRkFVTFRTLnB1bGwgKSxcbiAgICBjaGVja291dE1haW46IGdldE9wdGlvbklmUHJvdmlkZWQoICdjaGVja291dE1haW4nLCBERUZBVUxUUy5jaGVja291dE1haW4gKSxcbiAgICBzdGF0dXM6IGdldE9wdGlvbklmUHJvdmlkZWQoICdzdGF0dXMnLCBERUZBVUxUUy5zdGF0dXMgKSxcbiAgICBucG1VcGRhdGU6IGdldE9wdGlvbklmUHJvdmlkZWQoICducG1VcGRhdGUnLCBERUZBVUxUUy5ucG1VcGRhdGUgKSxcbiAgICBhbGxCcmFuY2hlczogZ2V0T3B0aW9uSWZQcm92aWRlZCggJ2FsbEJyYW5jaGVzJywgREVGQVVMVFMuYWxsQnJhbmNoZXMgKSxcbiAgICB0cmFuc3BpbGU6IGdldE9wdGlvbklmUHJvdmlkZWQoICd0cmFuc3BpbGUnLCBERUZBVUxUUy50cmFuc3BpbGUgKSxcbiAgICBsb2dQdWxsOiBnZXRPcHRpb25JZlByb3ZpZGVkKCAnbG9nUHVsbCcsIERFRkFVTFRTLmxvZ1B1bGwgKSxcbiAgICBsb2dBbGw6IGdldE9wdGlvbklmUHJvdmlkZWQoICdsb2dBbGwnLCBERUZBVUxUUy5sb2dBbGwgKSxcbiAgICBsb2dGb3JtYXR0aW5nOiBnZXRPcHRpb25JZlByb3ZpZGVkKCAnbG9nRm9ybWF0dGluZycsIERFRkFVTFRTLmxvZ0Zvcm1hdHRpbmcgKSxcbiAgICBvbWl0UHJpdmF0ZTogZ2V0T3B0aW9uSWZQcm92aWRlZCggJ29taXRQcml2YXRlJywgREVGQVVMVFMub21pdFByaXZhdGUgKSxcbiAgICBzbG93UHVsbDogZ2V0T3B0aW9uSWZQcm92aWRlZCggJ3Nsb3dQdWxsJywgREVGQVVMVFMuc2xvd1B1bGwgKSxcbiAgICByZXBvOiBnZXRPcHRpb25JZlByb3ZpZGVkKCAncmVwbycsIERFRkFVTFRTLnJlcG8gKSxcbiAgICByZXBvTGlzdDogZ2V0T3B0aW9uSWZQcm92aWRlZCggJ3JlcG9MaXN0JywgREVGQVVMVFMucmVwb0xpc3QgKVxuICB9O1xufTtcblxuLy8gQSBjb25zaXN0ZW50IHdheSB0byBrbm93IGlmIGEgZ2l0IHB1bGxpbmcgY29tbWFuZCBwdWxsZWQgY2hhbmdlcy4gUmV0dXJucyB0aGUgc3Rkb3V0IG91dHB1dFxuLy8gb2YgdGhlIHB1bGwgY29tbWFuZC5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVB1bGxSZXN1bHQoIHN0ZG91dDogc3RyaW5nICk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIHN0ZG91dCA9PT0gJ0FscmVhZHkgdXAgdG8gZGF0ZS5cXG5DdXJyZW50IGJyYW5jaCBtYWluIGlzIHVwIHRvIGRhdGUuXFxuJyB8fFxuICAgICAgIHN0ZG91dCA9PT0gJ0FscmVhZHkgdXAgdG8gZGF0ZS5cXG4nIHx8XG4gICAgICAgc3Rkb3V0ID09PSAnQ3VycmVudCBicmFuY2ggbWFpbiBpcyB1cCB0byBkYXRlLlxcbicgKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIHN0ZG91dC50cmltKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHN1Y2Nlc3MgYm9vbGVhblxuICovXG5leHBvcnQgY29uc3Qgc3luYyA9IGFzeW5jICggcHJvdmlkZWRPcHRpb25zPzogUGFydGlhbDxTeW5jT3B0aW9ucz4gKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XG5cbiAgY29uc3Qgb3B0aW9ucyA9IF8ubWVyZ2UoIHt9LCBERUZBVUxUUywgcHJvdmlkZWRPcHRpb25zICk7XG5cbiAgb3B0aW9ucy5sb2dBbGwgJiYgYXNzZXJ0KCBvcHRpb25zLnN0YXR1cywgJy0tbG9nQWxsIGlzIG9ubHkgc3VwcG9ydGVkIHdpdGggLS1zdGF0dXM9dHJ1ZSwgb3RoZXJ3aXNlIG5vdCBhbGwgcmVwb3MgaGF2ZSBzb21ldGhpbmcgdG8gcmVwb3J0JyApO1xuXG5cbiAgLy8gVGhlIGZhc3Rlc3Qgd2F5IHRvIHVwZGF0ZSB0aGUgY29kZWJhc2UgaXMgdG8gcnVuIGNsb25lLW1pc3NpbmctcmVwb3MgYXMgcGFydCBvZiB0aGUgcGFyYWxsZWwgcmVwb1VwZGF0ZSAoZm9yIHBlcmVubmlhbClcbiAgLy8gU29tZSBvcHRpb25zIG1hbmRhdGUgdGhhdCB3ZSBjbG9uZSByZXBvcyBmaXJzdCBmb3IgY29ycmVjdG5lc3MsIGJlZm9yZSBydW5uaW5nIHBhcmFsbGVsIHB1bGwvc3RhdHVzLiBJZiBwdWxsaW5nIGFsbFxuICAvLyBicmFuY2hlcywgb3IgcHJpbnRpbmcgYWxsIHJlcG9zLCBpdCB3b3VsZCBiZSBidWdneSB0byBub3QgaGF2ZSBhbGwgcmVwb3MgY2hlY2tlZCBvdXQgYmVmb3JlIGtpY2tpbmcgb2ZmIHRoZSB1cGRhdGVcbiAgLy8gc3RlcC4gVGhhdCBzYWlkLCBkb24ndCBkZWZhdWx0IHRvIHRoZSBzbG93ZXIgYmVoYXZpb3IgdW5sZXNzIHdlIG5lZWQgdG8uXG4gIGNvbnN0IGNsb25lRmlyc3QgPSBvcHRpb25zLmFsbEJyYW5jaGVzIHx8IG9wdGlvbnMubG9nQWxsO1xuXG4gIC8vIEFOU0kgZXNjYXBlIHNlcXVlbmNlcyB0byBtb3ZlIHRvIHRoZSByaWdodCAoaW4gdGhlIHNhbWUgbGluZSkgb3IgdG8gYXBwbHkgb3IgcmVzZXQgY29sb3JzXG4gIGNvbnN0IG1vdmVSaWdodCA9IG9wdGlvbnMubG9nRm9ybWF0dGluZyA/ICcgXFx1MDAxYls0MkcnIDogJ1xcdCc7XG4gIGNvbnN0IHJlZCA9IG9wdGlvbnMubG9nRm9ybWF0dGluZyA/ICdcXHUwMDFiWzMxbScgOiAnJztcbiAgY29uc3QgZ3JlZW4gPSBvcHRpb25zLmxvZ0Zvcm1hdHRpbmcgPyAnXFx1MDAxYlszMm0nIDogJyc7XG4gIGNvbnN0IGJvbGQgPSBvcHRpb25zLmxvZ0Zvcm1hdHRpbmcgPyAnXFx1MDAxYlsxbScgOiAnJztcbiAgY29uc3QgcmVzZXQgPSBvcHRpb25zLmxvZ0Zvcm1hdHRpbmcgPyAnXFx1MDAxYlswbScgOiAnJztcblxuICBjb25zdCBkYXRhOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGxldCBoYXNOb1B1bGxTdGF0dXNQcm9ibGVtcyA9IHRydWU7XG5cbiAgYXN5bmMgZnVuY3Rpb24gcHVsbEFsbEJyYW5jaGVzKCByZXBvOiBzdHJpbmcgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYnJhbmNoZXMgPSBhd2FpdCBnZXRCcmFuY2hlcyggcmVwbyApO1xuICAgIGZvciAoIGNvbnN0IGJyYW5jaCBvZiBicmFuY2hlcyApIHtcbiAgICAgIC8vIE9ubHkgdHJhY2sgdGhlIHJlbW90ZSBicmFuY2ggaWYgaXQgaGFzbid0IGJlZW4gdHJhY2tlZCB5ZXRcbiAgICAgIGlmICggKCBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAncmV2LXBhcnNlJywgJy0tdmVyaWZ5JywgYnJhbmNoIF0sIGAuLi8ke3JlcG99YCwgeyBlcnJvcnM6ICdyZXNvbHZlJyB9ICkgKS5jb2RlICE9PSAwICkge1xuICAgICAgICBhd2FpdCBnaXRGZXRjaCggcmVwbyApO1xuICAgICAgICBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnYnJhbmNoJywgJy0tdHJhY2snLCBicmFuY2gsIGBvcmlnaW4vJHticmFuY2h9YCBdLCBgLi4vJHtyZXBvfWAgKTtcbiAgICAgIH1cbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCByZXBvLCBicmFuY2ggKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZ2l0UHVsbFJlYmFzZSggcmVwbyApO1xuICAgICAgfVxuICAgICAgY2F0Y2goIGUgKSB7XG5cbiAgICAgICAgLy8gTGlrZWx5IHRoZXJlIGlzIG5vIHRyYWNraW5nIGluZm8gc2V0IHVwIG9uIHRoZSBsb2NhbCBicmFuY2hcbiAgICAgICAgYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFsgJ2JyYW5jaCcsIGAtLXNldC11cHN0cmVhbS10bz1vcmlnaW4vJHticmFuY2h9YCwgYnJhbmNoIF0sIGAuLi8ke3JlcG99YCApO1xuICAgICAgICBhd2FpdCBnaXRQdWxsUmViYXNlKCByZXBvICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gR28gYmFjayB0byBtYWluXG4gICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHJlcG8sICdtYWluJyApO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kKCByZXBvOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyApOiB2b2lkIHtcbiAgICBpZiAoIGRhdGFbIHJlcG8gXSApIHtcbiAgICAgIGRhdGFbIHJlcG8gXSArPSAnXFxuJyArIG1lc3NhZ2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZGF0YVsgcmVwbyBdICs9IGAke2JvbGR9JHtyZXBvfSR7cmVzZXR9JHttZXNzYWdlfWA7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdXBkYXRlUmVwbyA9IGFzeW5jICggcmVwbzogc3RyaW5nLCBhbGxSZXBvczogc3RyaW5nW10gKSA9PiB7XG4gICAgZGF0YVsgcmVwbyBdID0gJyc7XG5cbiAgICB0cnkge1xuICAgICAgbGV0IHB1bGxSZXN1bHQ6IG51bGwgfCBzdHJpbmcgPSBudWxsO1xuXG4gICAgICBpZiAoIGZzLmV4aXN0c1N5bmMoIGAuLi8ke3JlcG99YCApICkge1xuICAgICAgICBpZiAoIG9wdGlvbnMucHVsbCApIHtcbiAgICAgICAgICBpZiAoIGF3YWl0IGdpdElzQ2xlYW4oIHJlcG8gKSApIHtcbiAgICAgICAgICAgIGlmICggb3B0aW9ucy5hbGxCcmFuY2hlcyApIHtcbiAgICAgICAgICAgICAgYXdhaXQgcHVsbEFsbEJyYW5jaGVzKCByZXBvICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgb3B0aW9ucy5jaGVja291dE1haW4gJiYgYXdhaXQgZ2l0Q2hlY2tvdXQoIHJlcG8sICdtYWluJyApO1xuICAgICAgICAgICAgICBwdWxsUmVzdWx0ID0gcGFyc2VQdWxsUmVzdWx0KCBhd2FpdCBnaXRQdWxsUmViYXNlKCByZXBvICkgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBoYXNOb1B1bGxTdGF0dXNQcm9ibGVtcyA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKCAhb3B0aW9ucy5zdGF0dXMgKSB7XG4gICAgICAgICAgICAgIGFwcGVuZCggcmVwbywgYCR7bW92ZVJpZ2h0fSR7cmVkfW5vdCBjbGVhbiwgc2tpcHBpbmcgcHVsbCR7cmVzZXR9YCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIHJlcG8gPT09IFBFUkVOTklBTF9SRVBPX05BTUUgJiYgIW9wdGlvbnMuc2xvd1B1bGwgKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgJHtyZWR9JHtQRVJFTk5JQUxfUkVQT19OQU1FfSBpcyBub3QgY2xlYW4sIHNraXBwaW5nIHB1bGwke3Jlc2V0fVxcbmAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAvLyBUaGlzIHdpbGwgYmUgaGFuZGxlZCBsYXRlciB3aGVuIHBlcmVubmlhbCBnZXRzIGFyb3VuZCB0byBjbG9uZU1pc3NpbmdSZXBvc1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIElubGluZSBjbG9uZU1pc3NpbmdSZXBvcyBzbyBpdCBjYW4gcnVuIGluIHBhcmFsbGVsIHdpdGggb3RoZXIgcmVwb1VwZGF0ZSBzdGVwcy5cbiAgICAgIGlmICggIWNsb25lRmlyc3QgJiYgcmVwbyA9PT0gUEVSRU5OSUFMX1JFUE9fTkFNRSApIHtcbiAgICAgICAgYXdhaXQgY2xvbmVNaXNzaW5nUmVwb3NJbnRlcm5hbCggYWxsUmVwb3MgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCBvcHRpb25zLnN0YXR1cyApIHtcbiAgICAgICAgY29uc3Qgc3ltYm9saWNSZWYgPSAoIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdzeW1ib2xpYy1yZWYnLCAnLXEnLCAnSEVBRCcgXSwgYC4uLyR7cmVwb31gICkgKS50cmltKCk7XG4gICAgICAgIGNvbnN0IGJyYW5jaCA9IHN5bWJvbGljUmVmLnJlcGxhY2UoICdyZWZzL2hlYWRzLycsICcnICk7IC8vIG1pZ2h0IGJlIGVtcHR5IHN0cmluZ1xuICAgICAgICBjb25zdCBzaGEgPSBhd2FpdCBnaXRSZXZQYXJzZSggcmVwbywgJ0hFQUQnICk7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdzdGF0dXMnLCAnLS1wb3JjZWxhaW4nIF0sIGAuLi8ke3JlcG99YCApO1xuICAgICAgICBjb25zdCB0cmFjayA9IGJyYW5jaCA/ICggYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFsgJ2Zvci1lYWNoLXJlZicsICctLWZvcm1hdD0lKHB1c2g6dHJhY2ssbm9icmFja2V0KScsIHN5bWJvbGljUmVmIF0sIGAuLi8ke3JlcG99YCApICkudHJpbSgpIDogJyc7XG5cbiAgICAgICAgbGV0IGlzR3JlZW4gPSBmYWxzZTtcbiAgICAgICAgaWYgKCBicmFuY2ggKSB7XG4gICAgICAgICAgY29uc3QgY29ycmVjdEJyYW5jaCA9ICFvcHRpb25zLmNoZWNrb3V0TWFpbiB8fCBicmFuY2ggPT09ICdtYWluJztcbiAgICAgICAgICBpc0dyZWVuID0gIXN0YXR1cyAmJiBjb3JyZWN0QnJhbmNoICYmICF0cmFjay5sZW5ndGg7XG5cbiAgICAgICAgICBpZiAoICFpc0dyZWVuIHx8IG9wdGlvbnMubG9nQWxsICkge1xuICAgICAgICAgICAgYXBwZW5kKCByZXBvLCBgJHttb3ZlUmlnaHR9JHtpc0dyZWVuID8gZ3JlZW4gOiByZWR9JHticmFuY2h9JHtyZXNldH0gJHt0cmFja31gICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIC8vIGlmIG5vIGJyYW5jaCwgcHJpbnQgb3VyIFNIQSAoZGV0YWNoZWQgaGVhZClcbiAgICAgICAgICBhcHBlbmQoIHJlcG8sIGAke21vdmVSaWdodH0ke3JlZH0ke3NoYX0ke3Jlc2V0fWAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc3RhdHVzICkge1xuICAgICAgICAgIGlmICggIWlzR3JlZW4gfHwgb3B0aW9ucy5sb2dBbGwgKSB7XG4gICAgICAgICAgICBhcHBlbmQoIHJlcG8sIHN0YXR1cyApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGhhc05vUHVsbFN0YXR1c1Byb2JsZW1zID0gaGFzTm9QdWxsU3RhdHVzUHJvYmxlbXMgJiYgaXNHcmVlbjtcbiAgICAgIH1cblxuICAgICAgLy8gTG9nIHB1bGwgcmVzdWx0IGFmdGVyIHRoZSBzdGF0dXMgc2VjdGlvbiwgZm9yIGZvcm1hdHRpbmdcbiAgICAgIGlmICggb3B0aW9ucy5sb2dQdWxsICYmIHB1bGxSZXN1bHQgKSB7XG4gICAgICAgIGFwcGVuZCggcmVwbywgJyAnICsgcHVsbFJlc3VsdCApO1xuICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCggZSApIHtcbiAgICAgIGhhc05vUHVsbFN0YXR1c1Byb2JsZW1zID0gZmFsc2U7XG4gICAgICBhcHBlbmQoIHJlcG8sIGAgRVJST1I6ICR7ZX1gICk7XG4gICAgfVxuXG4gICAgLy8gUHJpbnQgcHJvZ3Jlc3MgYXMgd2UgZ28gZHVyaW5nIHNsb3dQdWxsLCBiZWNhdXNlIGl0IGlzIHNsb3dcbiAgICBpZiAoIG9wdGlvbnMuc2xvd1B1bGwgKSB7XG4gICAgICAoIG9wdGlvbnMubG9nQWxsIHx8IGRhdGFbIHJlcG8gXS5sZW5ndGggKSAmJiBjb25zb2xlLmxvZyggZGF0YVsgcmVwbyBdICk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEJ1bmRsZXMgYSBjYWxsIHRvIGNsb25lTWlzc2luZ1JlcG9zIHdpdGggbG9nZ2luZyB3aGF0IHJlcG9zIHdlcmUgY2xvbmVkXG4gIGFzeW5jIGZ1bmN0aW9uIGNsb25lTWlzc2luZ1JlcG9zSW50ZXJuYWwoIHJlcG9zVG9DaGVjazogc3RyaW5nW10gKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWlzc2luZ1JlcG9zID0gYXdhaXQgY2xvbmVNaXNzaW5nUmVwb3MoIG9wdGlvbnMub21pdFByaXZhdGUsIHJlcG9zVG9DaGVjayApO1xuICAgIGlmICggbWlzc2luZ1JlcG9zLmxlbmd0aCApIHtcbiAgICAgIGNvbnNvbGUubG9nKCBgJHtncmVlbn1DbG9uZWQ6XFxuXFx0JHttaXNzaW5nUmVwb3Muam9pbiggJ1xcblxcdCcgKX0ke3Jlc2V0fWAgKTtcbiAgICB9XG4gIH1cblxuICAvLyBHZXQgdGhlIGxpc3Qgb2YgcmVwb3MgdGhhdCB3aWxsIGJlIHVwZGF0ZWQuIEluc3RlYWQgb2YgaGF2aW5nIGNlcnRhaW4gb3B0aW9ucyBvdmVycmlkZSBlYWNoIG90aGVyLCBqdXN0IGluY2x1ZGUgdGhlIHN1YnNldC5cbiAgZnVuY3Rpb24gZ2V0UmVwb3MoKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHJlcG9MaXN0ID0gZ2V0UmVwb0xpc3QoIG9wdGlvbnMucmVwb0xpc3QgKTtcblxuICAgIC8vIEFsd2F5cyB1cGRhdGUgcGVyZW5uaWFsLCB0byBtYWtlIHN1cmUgY2xvbmluZyBjYW4gaGFwcGVuXG4gICAgcmV0dXJuIF8udW5pcSggWyAuLi5yZXBvTGlzdCwgUEVSRU5OSUFMX1JFUE9fTkFNRSwgb3B0aW9ucy5yZXBvIF0gKTtcbiAgfVxuXG5cbiAgY29uc3Qgc3RhcnRQdWxsU3RhdHVzID0gRGF0ZS5ub3coKTtcbiAgY29uc29sZS5sb2coKTsgLy8gZXh0cmEgc3BhY2UgYmVmb3JlIHRoZSBmaXJzdCBsb2dnaW5nXG4gIGxldCByZXBvcyA9IGdldFJlcG9zKCk7XG5cbiAgaWYgKCBvcHRpb25zLnB1bGwgfHwgb3B0aW9ucy5zdGF0dXMgKSB7XG5cbiAgICAvLyBTZWUgZG9jIGZvciBcImNsb25lIGZpcnN0XCJcbiAgICBpZiAoIGNsb25lRmlyc3QgKSB7XG4gICAgICBhd2FpdCBnaXRJc0NsZWFuKCBQRVJFTk5JQUxfUkVQT19OQU1FICkgJiYgYXdhaXQgZ2l0UHVsbFJlYmFzZSggUEVSRU5OSUFMX1JFUE9fTkFNRSApO1xuICAgICAgYXdhaXQgY2xvbmVNaXNzaW5nUmVwb3NJbnRlcm5hbCggcmVwb3MgKTtcblxuICAgICAgLy8gcmVsb2FkIHJlcG8gbGlzdCBhZnRlciB0aGUgYWJvdmUgY2xvbmVNaXNzaW5nUmVwb3MgY2hhbmdlc1xuICAgICAgcmVwb3MgPSBnZXRSZXBvcygpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtYXRvbWljLXVwZGF0ZXNcbiAgICB9XG5cbiAgICBpZiAoIG9wdGlvbnMuc2xvd1B1bGwgKSB7XG4gICAgICBhd2FpdCBjaHVua0RlbGF5ZWQoIHJlcG9zLCByZXBvID0+IHVwZGF0ZVJlcG8oIHJlcG8sIHJlcG9zICksIHtcbiAgICAgICAgd2FpdFBlckl0ZW06IG9wdGlvbnMuYWxsQnJhbmNoZXMgPyAxMDAwIDogMTEwLFxuICAgICAgICBjaHVua1NpemU6IG9wdGlvbnMuYWxsQnJhbmNoZXMgPyAyMCA6IDE1XG4gICAgICB9ICk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoIHJlcG9zLm1hcCggcmVwbyA9PiB1cGRhdGVSZXBvKCByZXBvLCByZXBvcyApICkgKTtcbiAgICAgIHJlcG9zLmZvckVhY2goIHJlcG8gPT4gZGF0YVsgcmVwbyBdLmxlbmd0aCA+IDAgJiYgY29uc29sZS5sb2coIGRhdGFbIHJlcG8gXSApICk7XG4gICAgfVxuXG4gICAgY29uc3QgY29sb3IgPSBoYXNOb1B1bGxTdGF0dXNQcm9ibGVtcyA/IGdyZWVuIDogcmVkO1xuICAgIGNvbnNvbGUubG9nKCBgXFxuJHtjb2xvcn0tLS0tLT09PT09XSBmaW5pc2hlZCBwdWxsL3N0YXR1cyAoJHtEYXRlLm5vdygpIC0gc3RhcnRQdWxsU3RhdHVzfW1zKSBbPT09PT0tLS0tLSR7cmVzZXR9XFxuYCApO1xuICB9XG5cbiAgbGV0IG5wbVVwZGF0ZVByb2JsZW1zID0gZmFsc2U7XG4gIGlmICggb3B0aW9ucy5ucG1VcGRhdGUgKSB7XG4gICAgY29uc3Qgc3RhcnROUE0gPSBEYXRlLm5vdygpO1xuXG4gICAgY29uc3QgbnBtVXBkYXRlc05lZWRlZCA9IGdldFJlcG9MaXN0KCAnbnBtLXVwZGF0ZScgKS5maWx0ZXIoIHJlcG8gPT4gcmVwb3MuaW5jbHVkZXMoIHJlcG8gKSApO1xuICAgIHRyeSB7XG5cbiAgICAgIGNvbnN0IHByb21pc2VzOiBQcm9taXNlPEludGVudGlvbmFsUGVyZW5uaWFsQW55PltdID0gbnBtVXBkYXRlc05lZWRlZC5tYXAoIHJlcG8gPT4gbnBtVXBkYXRlKCByZXBvICkgKTtcblxuICAgICAgY29uc3QgY3dkUmVwbyA9IG9wdGlvbnMucmVwbztcbiAgICAgIGN3ZFJlcG8gJiYgIW5wbVVwZGF0ZXNOZWVkZWQuaW5jbHVkZXMoIGN3ZFJlcG8gKSAmJiBmcy5leGlzdHNTeW5jKCBgLi4vJHtjd2RSZXBvfS9wYWNrYWdlLmpzb25gICkgJiYgcHJvbWlzZXMucHVzaCggbnBtVXBkYXRlKCBjd2RSZXBvICkgKTtcblxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoIHByb21pc2VzICk7XG4gICAgfVxuICAgIGNhdGNoKCBlICkge1xuICAgICAgbnBtVXBkYXRlUHJvYmxlbXMgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvciggJ0Vycm9yIG5wbSB1cGRhdGluZzonLCBlICk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coIGAke25wbVVwZGF0ZVByb2JsZW1zID8gcmVkIDogZ3JlZW59LS0tLS09PT09PV0gZmluaXNoZWQgbnBtICgke0RhdGUubm93KCkgLSBzdGFydE5QTX1tcykgWz09PT09LS0tLS0ke3Jlc2V0fVxcbmAgKTtcbiAgfVxuXG4gIGxldCB0cmFuc3BpbGVQcm9ibGVtcyA9IGZhbHNlO1xuICBpZiAoIG9wdGlvbnMudHJhbnNwaWxlICkge1xuICAgIGNvbnN0IHN0YXJ0VHJhbnNwaWxlID0gRGF0ZS5ub3coKTtcblxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRyYW5zcGlsZUFsbCgpO1xuICAgIH1cbiAgICBjYXRjaCggZSApIHtcbiAgICAgIHRyYW5zcGlsZVByb2JsZW1zID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoICdFcnJvciB0cmFuc3BpbGluZzonLCBlICk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCBgJHt0cmFuc3BpbGVQcm9ibGVtcyA/IHJlZCA6IGdyZWVufS0tLS0tPT09PT1dIGZpbmlzaGVkIHRyYW5zcGlsZSAoJHtEYXRlLm5vdygpIC0gc3RhcnRUcmFuc3BpbGV9bXMpIFs9PT09PS0tLS0tJHtyZXNldH1cXG5gICk7XG4gIH1cblxuICBjb25zb2xlLmxvZyggYFxcbnN5bmMgY29tcGxldGUgaW4gJHtEYXRlLm5vdygpIC0gc3RhcnRQdWxsU3RhdHVzfW1zYCApO1xuXG4gIHJldHVybiBoYXNOb1B1bGxTdGF0dXNQcm9ibGVtcyAmJiAhbnBtVXBkYXRlUHJvYmxlbXMgJiYgIXRyYW5zcGlsZVByb2JsZW1zO1xufTsiXSwibmFtZXMiOlsiYXNzZXJ0IiwiZnMiLCJfIiwiZ2V0T3B0aW9uSWZQcm92aWRlZCIsImNsb25lTWlzc2luZ1JlcG9zIiwiZXhlY3V0ZSIsImdldEJyYW5jaGVzIiwiZ2V0UmVwb0xpc3QiLCJnaXRDaGVja291dCIsImdpdEZldGNoIiwiZ2l0SXNDbGVhbiIsImdpdFB1bGxSZWJhc2UiLCJnaXRSZXZQYXJzZSIsIm5wbVVwZGF0ZSIsIlBFUkVOTklBTF9SRVBPX05BTUUiLCJ0cmFuc3BpbGVBbGwiLCJjaHVua0RlbGF5ZWQiLCJERUZBVUxUUyIsInB1bGwiLCJjaGVja291dE1haW4iLCJzdGF0dXMiLCJhbGxCcmFuY2hlcyIsInRyYW5zcGlsZSIsImxvZ1B1bGwiLCJsb2dBbGwiLCJsb2dGb3JtYXR0aW5nIiwib21pdFByaXZhdGUiLCJzbG93UHVsbCIsInJlcG8iLCJyZXBvTGlzdCIsImdldFN5bmNDTElPcHRpb25zIiwicGFyc2VQdWxsUmVzdWx0Iiwic3Rkb3V0IiwidHJpbSIsInN5bmMiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwibWVyZ2UiLCJjbG9uZUZpcnN0IiwibW92ZVJpZ2h0IiwicmVkIiwiZ3JlZW4iLCJib2xkIiwicmVzZXQiLCJkYXRhIiwiaGFzTm9QdWxsU3RhdHVzUHJvYmxlbXMiLCJwdWxsQWxsQnJhbmNoZXMiLCJicmFuY2hlcyIsImJyYW5jaCIsImVycm9ycyIsImNvZGUiLCJlIiwiYXBwZW5kIiwibWVzc2FnZSIsInVwZGF0ZVJlcG8iLCJhbGxSZXBvcyIsInB1bGxSZXN1bHQiLCJleGlzdHNTeW5jIiwiY29uc29sZSIsImxvZyIsImNsb25lTWlzc2luZ1JlcG9zSW50ZXJuYWwiLCJzeW1ib2xpY1JlZiIsInJlcGxhY2UiLCJzaGEiLCJ0cmFjayIsImlzR3JlZW4iLCJjb3JyZWN0QnJhbmNoIiwibGVuZ3RoIiwicmVwb3NUb0NoZWNrIiwibWlzc2luZ1JlcG9zIiwiam9pbiIsImdldFJlcG9zIiwidW5pcSIsInN0YXJ0UHVsbFN0YXR1cyIsIkRhdGUiLCJub3ciLCJyZXBvcyIsIndhaXRQZXJJdGVtIiwiY2h1bmtTaXplIiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsImZvckVhY2giLCJjb2xvciIsIm5wbVVwZGF0ZVByb2JsZW1zIiwic3RhcnROUE0iLCJucG1VcGRhdGVzTmVlZGVkIiwiZmlsdGVyIiwiaW5jbHVkZXMiLCJwcm9taXNlcyIsImN3ZFJlcG8iLCJwdXNoIiwiZXJyb3IiLCJ0cmFuc3BpbGVQcm9ibGVtcyIsInN0YXJ0VHJhbnNwaWxlIl0sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFFdEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQkMsR0FFRCxPQUFPQSxZQUFZLFNBQVM7QUFDNUIsT0FBT0MsUUFBUSxLQUFLO0FBQ3BCLE9BQU9DLE9BQU8sU0FBUztBQUV2QixTQUFTQyxtQkFBbUIsUUFBUSxtQ0FBbUM7QUFDdkUsT0FBT0MsdUJBQXVCLHlCQUF5QjtBQUN2RCxPQUFPQyxhQUFhLGVBQWU7QUFDbkMsT0FBT0MsaUJBQWlCLG1CQUFtQjtBQUMzQyxPQUFPQyxpQkFBaUIsbUJBQW1CO0FBQzNDLE9BQU9DLGlCQUFpQixtQkFBbUI7QUFDM0MsT0FBT0MsY0FBYyxnQkFBZ0I7QUFDckMsT0FBT0MsZ0JBQWdCLGtCQUFrQjtBQUN6QyxPQUFPQyxtQkFBbUIscUJBQXFCO0FBQy9DLE9BQU9DLGlCQUFpQixtQkFBbUI7QUFDM0MsT0FBT0MsZUFBZSxpQkFBaUI7QUFDdkMsU0FBU0MsbUJBQW1CLFFBQVEsMEJBQTBCO0FBQzlELE9BQU9DLGtCQUFrQixvQkFBb0I7QUFDN0MsT0FBT0Msa0JBQWtCLHlCQUF5QjtBQW9EbEQsTUFBTUMsV0FBVztJQUNmQyxNQUFNO0lBQ05DLGNBQWM7SUFDZEMsUUFBUTtJQUNSUCxXQUFXO0lBQ1hRLGFBQWE7SUFDYkMsV0FBVztJQUNYQyxTQUFTO0lBQ1RDLFFBQVE7SUFDUkMsZUFBZTtJQUNmQyxhQUFhO0lBQ2JDLFVBQVU7SUFDVkMsTUFBTWQ7SUFDTmUsVUFBVTtBQUNaO0FBRUEsT0FBTyxNQUFNQyxvQkFBb0I7SUFFL0IsT0FBTztRQUNMWixNQUFNZixvQkFBcUIsUUFBUWMsU0FBU0MsSUFBSTtRQUNoREMsY0FBY2hCLG9CQUFxQixnQkFBZ0JjLFNBQVNFLFlBQVk7UUFDeEVDLFFBQVFqQixvQkFBcUIsVUFBVWMsU0FBU0cs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