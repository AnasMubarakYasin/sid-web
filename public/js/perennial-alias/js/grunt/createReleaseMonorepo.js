// Copyright 2026, University of Colorado Boulder
/**
 * Creates a release branch for a simulation in the totality monorepo.
 *
 * Creates a branch `releases/{repo}/{major}.{minor}` seeded from origin/main, pruned to the
 * transitive phetLibs for the given brands, with the sim's package.json bumped to {major}.{minor}.0-rc.0
 * and phet.supportedBrands set. Operates entirely in a git worktree so the primary checkout is untouched.
 *
 * See `grunt create-release-monorepo`. The rc.ts and build-server flows are deliberately
 * left out of this first slice and will be wired in follow-up tasks.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */ import assert from 'assert';
import fs from 'fs';
import path from 'path';
import winston from 'winston';
import SimVersion from '../browser-and-node/SimVersion.js';
import dirname from '../common/dirname.js';
import execute from '../common/execute.js';
// @ts-expect-error - until we have "type": "module" in our package.json
const __dirname = dirname(import.meta.url);
// perennial-alias/js/grunt/ → totality root is three levels up.
const TOTALITY_ROOT = path.resolve(__dirname, '../../../');
// Tooling repos we always keep on a release branch, even if phetLibs wouldn't list them.
const ALWAYS_KEEP_REPOS = [
    'perennial-alias',
    'chipper',
    '_totality'
];
// Babel is treated as a live translation database at build time, not a snapshot. Never commit it
// on a release branch; build-server pulls babel from its own main.
const ALWAYS_DROP_REPOS = [
    'babel'
];
/**
 * Computes the set of repo directories to keep on a release branch for the given sim + brands.
 * Reimplements the logic from chipper/js/grunt/getPhetLibs.ts because perennial cannot depend on chipper.
 */ function computeKeepRepos(repo, brands) {
    const packageObject = JSON.parse(fs.readFileSync(path.join(TOTALITY_ROOT, repo, 'package.json'), 'utf8'));
    const buildObject = JSON.parse(fs.readFileSync(path.join(TOTALITY_ROOT, 'chipper', 'build.json'), 'utf8'));
    const repos = new Set();
    repos.add(repo);
    ALWAYS_KEEP_REPOS.forEach((r)=>repos.add(r));
    (packageObject?.phet?.phetLibs ?? []).forEach((r)=>repos.add(r));
    (buildObject.common?.phetLibs ?? []).forEach((r)=>repos.add(r));
    for (const brand of brands){
        (buildObject[brand]?.phetLibs ?? []).forEach((r)=>repos.add(r));
        (packageObject?.phet?.[brand]?.phetLibs ?? []).forEach((r)=>repos.add(r));
        if (brand === 'phet-io') {
            const wrappers = packageObject?.phet?.[brand]?.wrappers ?? [];
            wrappers.filter((w)=>!w.includes('/')).forEach((w)=>repos.add(w));
        }
    }
    ALWAYS_DROP_REPOS.forEach((r)=>repos.delete(r));
    return repos;
}
async function git(args, cwd) {
    return execute('git', args, cwd);
}
export default async function createReleaseMonorepo(options) {
    const { repo, branch, brands, message, skipPush, skipVersionBump } = options;
    assert(/^\d+\.\d+$/.test(branch), `Branch should be {{MAJOR}}.{{MINOR}}, got: ${branch}`);
    assert(Array.isArray(brands) && brands.length >= 1, 'At least one brand required');
    assert(fs.existsSync(path.join(TOTALITY_ROOT, repo, 'package.json')), `Sim package.json not found: ${repo}/package.json`);
    const [majorStr, minorStr] = branch.split('.');
    const major = Number(majorStr);
    const minor = Number(minorStr);
    assert(major > 0, 'Major version must be > 0');
    assert(minor >= 0, 'Minor version must be >= 0');
    const releaseBranch = `releases/${repo}/${branch}`;
    const worktreePath = path.resolve(TOTALITY_ROOT, '..', `totality-${repo}-${branch.replace('.', '_')}`);
    const rcVersion = new SimVersion(major, minor, 0, {
        testType: 'rc',
        testNumber: 0
    });
    winston.info(`Creating release branch ${releaseBranch} for ${repo} with brands=[${brands.join(',')}]`);
    await git([
        'fetch',
        '--quiet',
        'origin'
    ], TOTALITY_ROOT);
    const remoteLs = await git([
        'ls-remote',
        '--heads',
        'origin',
        releaseBranch
    ], TOTALITY_ROOT);
    assert(remoteLs.trim().length === 0, `Remote branch already exists: ${releaseBranch}`);
    const localCheck = await execute('git', [
        'rev-parse',
        '--verify',
        '--quiet',
        `refs/heads/${releaseBranch}`
    ], TOTALITY_ROOT, {
        errors: 'resolve'
    });
    assert(localCheck.code !== 0, `Local branch already exists: ${releaseBranch}. Delete it first or prune stale worktrees with 'git worktree prune'.`);
    assert(!fs.existsSync(worktreePath), `Worktree path already exists: ${worktreePath}. Remove it first.`);
    const keepRepos = computeKeepRepos(repo, brands);
    winston.info(`Keep set (${keepRepos.size} repos): ${Array.from(keepRepos).sort().join(', ')}`);
    winston.info(`Adding worktree at ${worktreePath} on branch ${releaseBranch} from origin/main`);
    await git([
        'worktree',
        'add',
        '-b',
        releaseBranch,
        worktreePath,
        'origin/main'
    ], TOTALITY_ROOT);
    try {
        const rootEntries = fs.readdirSync(worktreePath, {
            withFileTypes: true
        });
        let pruned = 0;
        for (const entry of rootEntries){
            // Keep all files at the root (package.json, tsconfig.json, README, etc.), and keep hidden
            // entries like .git, .github, .gitignore untouched.
            if (!entry.isDirectory() || entry.name.startsWith('.')) {
                continue;
            }
            if (keepRepos.has(entry.name)) {
                continue;
            }
            fs.rmSync(path.join(worktreePath, entry.name), {
                recursive: true,
                force: true
            });
            pruned++;
        }
        winston.info(`Pruned ${pruned} directories`);
        const simPackagePath = path.join(worktreePath, repo, 'package.json');
        const simPackage = JSON.parse(fs.readFileSync(simPackagePath, 'utf8'));
        simPackage.version = rcVersion.toString();
        simPackage.phet = simPackage.phet ?? {};
        simPackage.phet.supportedBrands = brands;
        fs.writeFileSync(simPackagePath, `${JSON.stringify(simPackage, null, 2)}\n`);
        const simLockPath = path.join(worktreePath, repo, 'package-lock.json');
        if (fs.existsSync(simLockPath)) {
            const simLock = JSON.parse(fs.readFileSync(simLockPath, 'utf8'));
            simLock.version = rcVersion.toString();
            if (simLock.packages && simLock.packages['']) {
                simLock.packages[''].version = rcVersion.toString();
            }
            fs.writeFileSync(simLockPath, `${JSON.stringify(simLock, null, 2)}\n`);
        }
        await git([
            'add',
            '-A'
        ], worktreePath);
        const commitMessage = `Create release branch ${releaseBranch} with brands=[${brands.join(',')}], version ${rcVersion.toString()}${message ? `, ${message}` : ''}`;
        await git([
            'commit',
            '-m',
            commitMessage
        ], worktreePath);
        if (skipPush) {
            winston.info([
                '--skip-push set: skipping remote push.',
                `Worktree left at: ${worktreePath}`,
                'To finish manually:',
                `  git -C ${worktreePath} push -u origin ${releaseBranch}`,
                `  git -C ${TOTALITY_ROOT} worktree remove ${worktreePath}`
            ].join('\n'));
        } else {
            winston.info(`Pushing ${releaseBranch} to origin`);
            await git([
                'push',
                '-u',
                'origin',
                releaseBranch
            ], worktreePath);
            winston.info(`Removing worktree ${worktreePath}`);
            await git([
                'worktree',
                'remove',
                worktreePath
            ], TOTALITY_ROOT);
        }
        if (!skipVersionBump) {
            const currentBranch = (await git([
                'rev-parse',
                '--abbrev-ref',
                'HEAD'
            ], TOTALITY_ROOT)).trim();
            assert(currentBranch === 'main', `Primary checkout must be on main to bump version, but is on: ${currentBranch}. Use --skip-version-bump to skip.`);
            const devVersion = new SimVersion(major, minor + 1, 0, {
                testType: 'dev',
                testNumber: 0
            });
            const mainPackagePath = path.join(TOTALITY_ROOT, repo, 'package.json');
            const mainPackage = JSON.parse(fs.readFileSync(mainPackagePath, 'utf8'));
            mainPackage.version = devVersion.toString();
            fs.writeFileSync(mainPackagePath, `${JSON.stringify(mainPackage, null, 2)}\n`);
            const mainLockPath = path.join(TOTALITY_ROOT, repo, 'package-lock.json');
            if (fs.existsSync(mainLockPath)) {
                const mainLock = JSON.parse(fs.readFileSync(mainLockPath, 'utf8'));
                mainLock.version = devVersion.toString();
                if (mainLock.packages && mainLock.packages['']) {
                    mainLock.packages[''].version = devVersion.toString();
                }
                fs.writeFileSync(mainLockPath, `${JSON.stringify(mainLock, null, 2)}\n`);
            }
            winston.info(`Bumped ${repo} to ${devVersion.toString()} on main (not committed). Next steps:`);
            winston.info(`  1. Inspect changes in ${repo}/package.json`);
            winston.info(`  2. Run: npm run grunt -- update --repo=${repo}`);
            winston.info('  3. Review, commit, and push main');
        }
        winston.info(`Done. Release branch ${releaseBranch} created${skipPush ? ' (not pushed)' : ' and pushed'}.`);
    } catch (error) {
        winston.error(`Failure during release creation. Worktree left in place for debugging: ${worktreePath}`);
        throw error;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9ncnVudC9jcmVhdGVSZWxlYXNlTW9ub3JlcG8udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjYsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIENyZWF0ZXMgYSByZWxlYXNlIGJyYW5jaCBmb3IgYSBzaW11bGF0aW9uIGluIHRoZSB0b3RhbGl0eSBtb25vcmVwby5cbiAqXG4gKiBDcmVhdGVzIGEgYnJhbmNoIGByZWxlYXNlcy97cmVwb30ve21ham9yfS57bWlub3J9YCBzZWVkZWQgZnJvbSBvcmlnaW4vbWFpbiwgcHJ1bmVkIHRvIHRoZVxuICogdHJhbnNpdGl2ZSBwaGV0TGlicyBmb3IgdGhlIGdpdmVuIGJyYW5kcywgd2l0aCB0aGUgc2ltJ3MgcGFja2FnZS5qc29uIGJ1bXBlZCB0byB7bWFqb3J9LnttaW5vcn0uMC1yYy4wXG4gKiBhbmQgcGhldC5zdXBwb3J0ZWRCcmFuZHMgc2V0LiBPcGVyYXRlcyBlbnRpcmVseSBpbiBhIGdpdCB3b3JrdHJlZSBzbyB0aGUgcHJpbWFyeSBjaGVja291dCBpcyB1bnRvdWNoZWQuXG4gKlxuICogU2VlIGBncnVudCBjcmVhdGUtcmVsZWFzZS1tb25vcmVwb2AuIFRoZSByYy50cyBhbmQgYnVpbGQtc2VydmVyIGZsb3dzIGFyZSBkZWxpYmVyYXRlbHlcbiAqIGxlZnQgb3V0IG9mIHRoaXMgZmlyc3Qgc2xpY2UgYW5kIHdpbGwgYmUgd2lyZWQgaW4gZm9sbG93LXVwIHRhc2tzLlxuICpcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHdpbnN0b24gZnJvbSAnd2luc3Rvbic7XG5pbXBvcnQgU2ltVmVyc2lvbiBmcm9tICcuLi9icm93c2VyLWFuZC1ub2RlL1NpbVZlcnNpb24uanMnO1xuaW1wb3J0IGRpcm5hbWUgZnJvbSAnLi4vY29tbW9uL2Rpcm5hbWUuanMnO1xuaW1wb3J0IGV4ZWN1dGUgZnJvbSAnLi4vY29tbW9uL2V4ZWN1dGUuanMnO1xuXG4vLyBAdHMtZXhwZWN0LWVycm9yIC0gdW50aWwgd2UgaGF2ZSBcInR5cGVcIjogXCJtb2R1bGVcIiBpbiBvdXIgcGFja2FnZS5qc29uXG5jb25zdCBfX2Rpcm5hbWUgPSBkaXJuYW1lKCBpbXBvcnQubWV0YS51cmwgKTtcblxuLy8gcGVyZW5uaWFsLWFsaWFzL2pzL2dydW50LyDihpIgdG90YWxpdHkgcm9vdCBpcyB0aHJlZSBsZXZlbHMgdXAuXG5jb25zdCBUT1RBTElUWV9ST09UID0gcGF0aC5yZXNvbHZlKCBfX2Rpcm5hbWUsICcuLi8uLi8uLi8nICk7XG5cbmV4cG9ydCB0eXBlIENyZWF0ZVJlbGVhc2VNb25vcmVwb09wdGlvbnMgPSB7XG4gIHJlcG86IHN0cmluZztcbiAgYnJhbmNoOiBzdHJpbmc7ICAgICAgIC8vIFwie21ham9yfS57bWlub3J9XCIgZS5nLiBcIjEuN1wiXG4gIGJyYW5kczogc3RyaW5nW107ICAgICAvLyBlLmcuIFsgJ3BoZXQnIF0gb3IgWyAncGhldCcsICdwaGV0LWlvJyBdXG4gIG1lc3NhZ2U/OiBzdHJpbmc7ICAgICAvLyBPcHRpb25hbCBmcmVlZm9ybSBtZXNzYWdlIGFwcGVuZGVkIHRvIHRoZSBjb21taXQgbWVzc2FnZS5cbiAgc2tpcFB1c2g/OiBib29sZWFuOyAgIC8vIElmIHRydWUsIGRvIGV2ZXJ5dGhpbmcgbG9jYWxseSBidXQgc2tpcCB0aGUgcHVzaDsgbGVhdmUgdGhlIHdvcmt0cmVlIGZvciBpbnNwZWN0aW9uLlxuICBza2lwVmVyc2lvbkJ1bXA/OiBib29sZWFuOyAvLyBJZiB0cnVlLCBza2lwIGJ1bXBpbmcgbWFpbidzIHZlcnNpb24gdG8gdGhlIG5leHQgZGV2IHZlcnNpb24uXG59O1xuXG4vLyBUb29saW5nIHJlcG9zIHdlIGFsd2F5cyBrZWVwIG9uIGEgcmVsZWFzZSBicmFuY2gsIGV2ZW4gaWYgcGhldExpYnMgd291bGRuJ3QgbGlzdCB0aGVtLlxuY29uc3QgQUxXQVlTX0tFRVBfUkVQT1MgPSBbICdwZXJlbm5pYWwtYWxpYXMnLCAnY2hpcHBlcicsICdfdG90YWxpdHknIF07XG5cbi8vIEJhYmVsIGlzIHRyZWF0ZWQgYXMgYSBsaXZlIHRyYW5zbGF0aW9uIGRhdGFiYXNlIGF0IGJ1aWxkIHRpbWUsIG5vdCBhIHNuYXBzaG90LiBOZXZlciBjb21taXQgaXRcbi8vIG9uIGEgcmVsZWFzZSBicmFuY2g7IGJ1aWxkLXNlcnZlciBwdWxscyBiYWJlbCBmcm9tIGl0cyBvd24gbWFpbi5cbmNvbnN0IEFMV0FZU19EUk9QX1JFUE9TID0gWyAnYmFiZWwnIF07XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIHNldCBvZiByZXBvIGRpcmVjdG9yaWVzIHRvIGtlZXAgb24gYSByZWxlYXNlIGJyYW5jaCBmb3IgdGhlIGdpdmVuIHNpbSArIGJyYW5kcy5cbiAqIFJlaW1wbGVtZW50cyB0aGUgbG9naWMgZnJvbSBjaGlwcGVyL2pzL2dydW50L2dldFBoZXRMaWJzLnRzIGJlY2F1c2UgcGVyZW5uaWFsIGNhbm5vdCBkZXBlbmQgb24gY2hpcHBlci5cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUtlZXBSZXBvcyggcmVwbzogc3RyaW5nLCBicmFuZHM6IHN0cmluZ1tdICk6IFNldDxzdHJpbmc+IHtcbiAgY29uc3QgcGFja2FnZU9iamVjdCA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggcGF0aC5qb2luKCBUT1RBTElUWV9ST09ULCByZXBvLCAncGFja2FnZS5qc29uJyApLCAndXRmOCcgKSApO1xuICBjb25zdCBidWlsZE9iamVjdCA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggcGF0aC5qb2luKCBUT1RBTElUWV9ST09ULCAnY2hpcHBlcicsICdidWlsZC5qc29uJyApLCAndXRmOCcgKSApO1xuXG4gIGNvbnN0IHJlcG9zID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHJlcG9zLmFkZCggcmVwbyApO1xuICBBTFdBWVNfS0VFUF9SRVBPUy5mb3JFYWNoKCByID0+IHJlcG9zLmFkZCggciApICk7XG5cbiAgKCBwYWNrYWdlT2JqZWN0Py5waGV0Py5waGV0TGlicyA/PyBbXSApLmZvckVhY2goICggcjogc3RyaW5nICkgPT4gcmVwb3MuYWRkKCByICkgKTtcbiAgKCBidWlsZE9iamVjdC5jb21tb24/LnBoZXRMaWJzID8/IFtdICkuZm9yRWFjaCggKCByOiBzdHJpbmcgKSA9PiByZXBvcy5hZGQoIHIgKSApO1xuXG4gIGZvciAoIGNvbnN0IGJyYW5kIG9mIGJyYW5kcyApIHtcbiAgICAoIGJ1aWxkT2JqZWN0WyBicmFuZCBdPy5waGV0TGlicyA/PyBbXSApLmZvckVhY2goICggcjogc3RyaW5nICkgPT4gcmVwb3MuYWRkKCByICkgKTtcbiAgICAoIHBhY2thZ2VPYmplY3Q/LnBoZXQ/LlsgYnJhbmQgXT8ucGhldExpYnMgPz8gW10gKS5mb3JFYWNoKCAoIHI6IHN0cmluZyApID0+IHJlcG9zLmFkZCggciApICk7XG5cbiAgICBpZiAoIGJyYW5kID09PSAncGhldC1pbycgKSB7XG4gICAgICBjb25zdCB3cmFwcGVyczogc3RyaW5nW10gPSBwYWNrYWdlT2JqZWN0Py5waGV0Py5bIGJyYW5kIF0/LndyYXBwZXJzID8/IFtdO1xuICAgICAgd3JhcHBlcnMuZmlsdGVyKCB3ID0+ICF3LmluY2x1ZGVzKCAnLycgKSApLmZvckVhY2goIHcgPT4gcmVwb3MuYWRkKCB3ICkgKTtcbiAgICB9XG4gIH1cblxuICBBTFdBWVNfRFJPUF9SRVBPUy5mb3JFYWNoKCByID0+IHJlcG9zLmRlbGV0ZSggciApICk7XG5cbiAgcmV0dXJuIHJlcG9zO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnaXQoIGFyZ3M6IHN0cmluZ1tdLCBjd2Q6IHN0cmluZyApOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gZXhlY3V0ZSggJ2dpdCcsIGFyZ3MsIGN3ZCApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBjcmVhdGVSZWxlYXNlTW9ub3JlcG8oIG9wdGlvbnM6IENyZWF0ZVJlbGVhc2VNb25vcmVwb09wdGlvbnMgKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHsgcmVwbywgYnJhbmNoLCBicmFuZHMsIG1lc3NhZ2UsIHNraXBQdXNoLCBza2lwVmVyc2lvbkJ1bXAgfSA9IG9wdGlvbnM7XG5cbiAgYXNzZXJ0KCAvXlxcZCtcXC5cXGQrJC8udGVzdCggYnJhbmNoICksIGBCcmFuY2ggc2hvdWxkIGJlIHt7TUFKT1J9fS57e01JTk9SfX0sIGdvdDogJHticmFuY2h9YCApO1xuICBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIGJyYW5kcyApICYmIGJyYW5kcy5sZW5ndGggPj0gMSwgJ0F0IGxlYXN0IG9uZSBicmFuZCByZXF1aXJlZCcgKTtcbiAgYXNzZXJ0KCBmcy5leGlzdHNTeW5jKCBwYXRoLmpvaW4oIFRPVEFMSVRZX1JPT1QsIHJlcG8sICdwYWNrYWdlLmpzb24nICkgKSwgYFNpbSBwYWNrYWdlLmpzb24gbm90IGZvdW5kOiAke3JlcG99L3BhY2thZ2UuanNvbmAgKTtcblxuICBjb25zdCBbIG1ham9yU3RyLCBtaW5vclN0ciBdID0gYnJhbmNoLnNwbGl0KCAnLicgKTtcbiAgY29uc3QgbWFqb3IgPSBOdW1iZXIoIG1ham9yU3RyICk7XG4gIGNvbnN0IG1pbm9yID0gTnVtYmVyKCBtaW5vclN0ciApO1xuICBhc3NlcnQoIG1ham9yID4gMCwgJ01ham9yIHZlcnNpb24gbXVzdCBiZSA+IDAnICk7XG4gIGFzc2VydCggbWlub3IgPj0gMCwgJ01pbm9yIHZlcnNpb24gbXVzdCBiZSA+PSAwJyApO1xuXG4gIGNvbnN0IHJlbGVhc2VCcmFuY2ggPSBgcmVsZWFzZXMvJHtyZXBvfS8ke2JyYW5jaH1gO1xuICBjb25zdCB3b3JrdHJlZVBhdGggPSBwYXRoLnJlc29sdmUoIFRPVEFMSVRZX1JPT1QsICcuLicsIGB0b3RhbGl0eS0ke3JlcG99LSR7YnJhbmNoLnJlcGxhY2UoICcuJywgJ18nICl9YCApO1xuICBjb25zdCByY1ZlcnNpb24gPSBuZXcgU2ltVmVyc2lvbiggbWFqb3IsIG1pbm9yLCAwLCB7IHRlc3RUeXBlOiAncmMnLCB0ZXN0TnVtYmVyOiAwIH0gKTtcblxuICB3aW5zdG9uLmluZm8oIGBDcmVhdGluZyByZWxlYXNlIGJyYW5jaCAke3JlbGVhc2VCcmFuY2h9IGZvciAke3JlcG99IHdpdGggYnJhbmRzPVske2JyYW5kcy5qb2luKCAnLCcgKX1dYCApO1xuXG4gIGF3YWl0IGdpdCggWyAnZmV0Y2gnLCAnLS1xdWlldCcsICdvcmlnaW4nIF0sIFRPVEFMSVRZX1JPT1QgKTtcblxuICBjb25zdCByZW1vdGVMcyA9IGF3YWl0IGdpdCggWyAnbHMtcmVtb3RlJywgJy0taGVhZHMnLCAnb3JpZ2luJywgcmVsZWFzZUJyYW5jaCBdLCBUT1RBTElUWV9ST09UICk7XG4gIGFzc2VydCggcmVtb3RlTHMudHJpbSgpLmxlbmd0aCA9PT0gMCwgYFJlbW90ZSBicmFuY2ggYWxyZWFkeSBleGlzdHM6ICR7cmVsZWFzZUJyYW5jaH1gICk7XG5cbiAgY29uc3QgbG9jYWxDaGVjayA9IGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdyZXYtcGFyc2UnLCAnLS12ZXJpZnknLCAnLS1xdWlldCcsIGByZWZzL2hlYWRzLyR7cmVsZWFzZUJyYW5jaH1gIF0sIFRPVEFMSVRZX1JPT1QsIHsgZXJyb3JzOiAncmVzb2x2ZScgfSApO1xuICBhc3NlcnQoIGxvY2FsQ2hlY2suY29kZSAhPT0gMCwgYExvY2FsIGJyYW5jaCBhbHJlYWR5IGV4aXN0czogJHtyZWxlYXNlQnJhbmNofS4gRGVsZXRlIGl0IGZpcnN0IG9yIHBydW5lIHN0YWxlIHdvcmt0cmVlcyB3aXRoICdnaXQgd29ya3RyZWUgcHJ1bmUnLmAgKTtcblxuICBhc3NlcnQoICFmcy5leGlzdHNTeW5jKCB3b3JrdHJlZVBhdGggKSwgYFdvcmt0cmVlIHBhdGggYWxyZWFkeSBleGlzdHM6ICR7d29ya3RyZWVQYXRofS4gUmVtb3ZlIGl0IGZpcnN0LmAgKTtcblxuICBjb25zdCBrZWVwUmVwb3MgPSBjb21wdXRlS2VlcFJlcG9zKCByZXBvLCBicmFuZHMgKTtcbiAgd2luc3Rvbi5pbmZvKCBgS2VlcCBzZXQgKCR7a2VlcFJlcG9zLnNpemV9IHJlcG9zKTogJHtBcnJheS5mcm9tKCBrZWVwUmVwb3MgKS5zb3J0KCkuam9pbiggJywgJyApfWAgKTtcblxuICB3aW5zdG9uLmluZm8oIGBBZGRpbmcgd29ya3RyZWUgYXQgJHt3b3JrdHJlZVBhdGh9IG9uIGJyYW5jaCAke3JlbGVhc2VCcmFuY2h9IGZyb20gb3JpZ2luL21haW5gICk7XG4gIGF3YWl0IGdpdCggWyAnd29ya3RyZWUnLCAnYWRkJywgJy1iJywgcmVsZWFzZUJyYW5jaCwgd29ya3RyZWVQYXRoLCAnb3JpZ2luL21haW4nIF0sIFRPVEFMSVRZX1JPT1QgKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHJvb3RFbnRyaWVzID0gZnMucmVhZGRpclN5bmMoIHdvcmt0cmVlUGF0aCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0gKTtcbiAgICBsZXQgcHJ1bmVkID0gMDtcbiAgICBmb3IgKCBjb25zdCBlbnRyeSBvZiByb290RW50cmllcyApIHtcblxuICAgICAgLy8gS2VlcCBhbGwgZmlsZXMgYXQgdGhlIHJvb3QgKHBhY2thZ2UuanNvbiwgdHNjb25maWcuanNvbiwgUkVBRE1FLCBldGMuKSwgYW5kIGtlZXAgaGlkZGVuXG4gICAgICAvLyBlbnRyaWVzIGxpa2UgLmdpdCwgLmdpdGh1YiwgLmdpdGlnbm9yZSB1bnRvdWNoZWQuXG4gICAgICBpZiAoICFlbnRyeS5pc0RpcmVjdG9yeSgpIHx8IGVudHJ5Lm5hbWUuc3RhcnRzV2l0aCggJy4nICkgKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKCBrZWVwUmVwb3MuaGFzKCBlbnRyeS5uYW1lICkgKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgZnMucm1TeW5jKCBwYXRoLmpvaW4oIHdvcmt0cmVlUGF0aCwgZW50cnkubmFtZSApLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSApO1xuICAgICAgcHJ1bmVkKys7XG4gICAgfVxuICAgIHdpbnN0b24uaW5mbyggYFBydW5lZCAke3BydW5lZH0gZGlyZWN0b3JpZXNgICk7XG5cbiAgICBjb25zdCBzaW1QYWNrYWdlUGF0aCA9IHBhdGguam9pbiggd29ya3RyZWVQYXRoLCByZXBvLCAncGFja2FnZS5qc29uJyApO1xuICAgIGNvbnN0IHNpbVBhY2thZ2UgPSBKU09OLnBhcnNlKCBmcy5yZWFkRmlsZVN5bmMoIHNpbVBhY2thZ2VQYXRoLCAndXRmOCcgKSApO1xuICAgIHNpbVBhY2thZ2UudmVyc2lvbiA9IHJjVmVyc2lvbi50b1N0cmluZygpO1xuICAgIHNpbVBhY2thZ2UucGhldCA9IHNpbVBhY2thZ2UucGhldCA/PyB7fTtcbiAgICBzaW1QYWNrYWdlLnBoZXQuc3VwcG9ydGVkQnJhbmRzID0gYnJhbmRzO1xuICAgIGZzLndyaXRlRmlsZVN5bmMoIHNpbVBhY2thZ2VQYXRoLCBgJHtKU09OLnN0cmluZ2lmeSggc2ltUGFja2FnZSwgbnVsbCwgMiApfVxcbmAgKTtcblxuICAgIGNvbnN0IHNpbUxvY2tQYXRoID0gcGF0aC5qb2luKCB3b3JrdHJlZVBhdGgsIHJlcG8sICdwYWNrYWdlLWxvY2suanNvbicgKTtcbiAgICBpZiAoIGZzLmV4aXN0c1N5bmMoIHNpbUxvY2tQYXRoICkgKSB7XG4gICAgICBjb25zdCBzaW1Mb2NrID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBzaW1Mb2NrUGF0aCwgJ3V0ZjgnICkgKTtcbiAgICAgIHNpbUxvY2sudmVyc2lvbiA9IHJjVmVyc2lvbi50b1N0cmluZygpO1xuICAgICAgaWYgKCBzaW1Mb2NrLnBhY2thZ2VzICYmIHNpbUxvY2sucGFja2FnZXNbICcnIF0gKSB7XG4gICAgICAgIHNpbUxvY2sucGFja2FnZXNbICcnIF0udmVyc2lvbiA9IHJjVmVyc2lvbi50b1N0cmluZygpO1xuICAgICAgfVxuICAgICAgZnMud3JpdGVGaWxlU3luYyggc2ltTG9ja1BhdGgsIGAke0pTT04uc3RyaW5naWZ5KCBzaW1Mb2NrLCBudWxsLCAyICl9XFxuYCApO1xuICAgIH1cblxuICAgIGF3YWl0IGdpdCggWyAnYWRkJywgJy1BJyBdLCB3b3JrdHJlZVBhdGggKTtcbiAgICBjb25zdCBjb21taXRNZXNzYWdlID0gYENyZWF0ZSByZWxlYXNlIGJyYW5jaCAke3JlbGVhc2VCcmFuY2h9IHdpdGggYnJhbmRzPVske2JyYW5kcy5qb2luKCAnLCcgKX1dLCB2ZXJzaW9uICR7cmNWZXJzaW9uLnRvU3RyaW5nKCl9JHttZXNzYWdlID8gYCwgJHttZXNzYWdlfWAgOiAnJ31gO1xuICAgIGF3YWl0IGdpdCggWyAnY29tbWl0JywgJy1tJywgY29tbWl0TWVzc2FnZSBdLCB3b3JrdHJlZVBhdGggKTtcblxuICAgIGlmICggc2tpcFB1c2ggKSB7XG4gICAgICB3aW5zdG9uLmluZm8oIFtcbiAgICAgICAgJy0tc2tpcC1wdXNoIHNldDogc2tpcHBpbmcgcmVtb3RlIHB1c2guJyxcbiAgICAgICAgYFdvcmt0cmVlIGxlZnQgYXQ6ICR7d29ya3RyZWVQYXRofWAsXG4gICAgICAgICdUbyBmaW5pc2ggbWFudWFsbHk6JyxcbiAgICAgICAgYCAgZ2l0IC1DICR7d29ya3RyZWVQYXRofSBwdXNoIC11IG9yaWdpbiAke3JlbGVhc2VCcmFuY2h9YCxcbiAgICAgICAgYCAgZ2l0IC1DICR7VE9UQUxJVFlfUk9PVH0gd29ya3RyZWUgcmVtb3ZlICR7d29ya3RyZWVQYXRofWBcbiAgICAgIF0uam9pbiggJ1xcbicgKSApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHdpbnN0b24uaW5mbyggYFB1c2hpbmcgJHtyZWxlYXNlQnJhbmNofSB0byBvcmlnaW5gICk7XG4gICAgICBhd2FpdCBnaXQoIFsgJ3B1c2gnLCAnLXUnLCAnb3JpZ2luJywgcmVsZWFzZUJyYW5jaCBdLCB3b3JrdHJlZVBhdGggKTtcblxuICAgICAgd2luc3Rvbi5pbmZvKCBgUmVtb3Zpbmcgd29ya3RyZWUgJHt3b3JrdHJlZVBhdGh9YCApO1xuICAgICAgYXdhaXQgZ2l0KCBbICd3b3JrdHJlZScsICdyZW1vdmUnLCB3b3JrdHJlZVBhdGggXSwgVE9UQUxJVFlfUk9PVCApO1xuICAgIH1cblxuICAgIGlmICggIXNraXBWZXJzaW9uQnVtcCApIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRCcmFuY2ggPSAoIGF3YWl0IGdpdCggWyAncmV2LXBhcnNlJywgJy0tYWJicmV2LXJlZicsICdIRUFEJyBdLCBUT1RBTElUWV9ST09UICkgKS50cmltKCk7XG4gICAgICBhc3NlcnQoIGN1cnJlbnRCcmFuY2ggPT09ICdtYWluJywgYFByaW1hcnkgY2hlY2tvdXQgbXVzdCBiZSBvbiBtYWluIHRvIGJ1bXAgdmVyc2lvbiwgYnV0IGlzIG9uOiAke2N1cnJlbnRCcmFuY2h9LiBVc2UgLS1za2lwLXZlcnNpb24tYnVtcCB0byBza2lwLmAgKTtcblxuICAgICAgY29uc3QgZGV2VmVyc2lvbiA9IG5ldyBTaW1WZXJzaW9uKCBtYWpvciwgbWlub3IgKyAxLCAwLCB7IHRlc3RUeXBlOiAnZGV2JywgdGVzdE51bWJlcjogMCB9ICk7XG4gICAgICBjb25zdCBtYWluUGFja2FnZVBhdGggPSBwYXRoLmpvaW4oIFRPVEFMSVRZX1JPT1QsIHJlcG8sICdwYWNrYWdlLmpzb24nICk7XG4gICAgICBjb25zdCBtYWluUGFja2FnZSA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggbWFpblBhY2thZ2VQYXRoLCAndXRmOCcgKSApO1xuICAgICAgbWFpblBhY2thZ2UudmVyc2lvbiA9IGRldlZlcnNpb24udG9TdHJpbmcoKTtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoIG1haW5QYWNrYWdlUGF0aCwgYCR7SlNPTi5zdHJpbmdpZnkoIG1haW5QYWNrYWdlLCBudWxsLCAyICl9XFxuYCApO1xuXG4gICAgICBjb25zdCBtYWluTG9ja1BhdGggPSBwYXRoLmpvaW4oIFRPVEFMSVRZX1JPT1QsIHJlcG8sICdwYWNrYWdlLWxvY2suanNvbicgKTtcbiAgICAgIGlmICggZnMuZXhpc3RzU3luYyggbWFpbkxvY2tQYXRoICkgKSB7XG4gICAgICAgIGNvbnN0IG1haW5Mb2NrID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBtYWluTG9ja1BhdGgsICd1dGY4JyApICk7XG4gICAgICAgIG1haW5Mb2NrLnZlcnNpb24gPSBkZXZWZXJzaW9uLnRvU3RyaW5nKCk7XG4gICAgICAgIGlmICggbWFpbkxvY2sucGFja2FnZXMgJiYgbWFpbkxvY2sucGFja2FnZXNbICcnIF0gKSB7XG4gICAgICAgICAgbWFpbkxvY2sucGFja2FnZXNbICcnIF0udmVyc2lvbiA9IGRldlZlcnNpb24udG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKCBtYWluTG9ja1BhdGgsIGAke0pTT04uc3RyaW5naWZ5KCBtYWluTG9jaywgbnVsbCwgMiApfVxcbmAgKTtcbiAgICAgIH1cblxuICAgICAgd2luc3Rvbi5pbmZvKCBgQnVtcGVkICR7cmVwb30gdG8gJHtkZXZWZXJzaW9uLnRvU3RyaW5nKCl9IG9uIG1haW4gKG5vdCBjb21taXR0ZWQpLiBOZXh0IHN0ZXBzOmAgKTtcbiAgICAgIHdpbnN0b24uaW5mbyggYCAgMS4gSW5zcGVjdCBjaGFuZ2VzIGluICR7cmVwb30vcGFja2FnZS5qc29uYCApO1xuICAgICAgd2luc3Rvbi5pbmZvKCBgICAyLiBSdW46IG5wbSBydW4gZ3J1bnQgLS0gdXBkYXRlIC0tcmVwbz0ke3JlcG99YCApO1xuICAgICAgd2luc3Rvbi5pbmZvKCAnICAzLiBSZXZpZXcsIGNvbW1pdCwgYW5kIHB1c2ggbWFpbicgKTtcbiAgICB9XG5cbiAgICB3aW5zdG9uLmluZm8oIGBEb25lLiBSZWxlYXNlIGJyYW5jaCAke3JlbGVhc2VCcmFuY2h9IGNyZWF0ZWQke3NraXBQdXNoID8gJyAobm90IHB1c2hlZCknIDogJyBhbmQgcHVzaGVkJ30uYCApO1xuICB9XG4gIGNhdGNoKCBlcnJvciApIHtcbiAgICB3aW5zdG9uLmVycm9yKCBgRmFpbHVyZSBkdXJpbmcgcmVsZWFzZSBjcmVhdGlvbi4gV29ya3RyZWUgbGVmdCBpbiBwbGFjZSBmb3IgZGVidWdnaW5nOiAke3dvcmt0cmVlUGF0aH1gICk7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJhc3NlcnQiLCJmcyIsInBhdGgiLCJ3aW5zdG9uIiwiU2ltVmVyc2lvbiIsImRpcm5hbWUiLCJleGVjdXRlIiwiX19kaXJuYW1lIiwidXJsIiwiVE9UQUxJVFlfUk9PVCIsInJlc29sdmUiLCJBTFdBWVNfS0VFUF9SRVBPUyIsIkFMV0FZU19EUk9QX1JFUE9TIiwiY29tcHV0ZUtlZXBSZXBvcyIsInJlcG8iLCJicmFuZHMiLCJwYWNrYWdlT2JqZWN0IiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwiam9pbiIsImJ1aWxkT2JqZWN0IiwicmVwb3MiLCJTZXQiLCJhZGQiLCJmb3JFYWNoIiwiciIsInBoZXQiLCJwaGV0TGlicyIsImNvbW1vbiIsImJyYW5kIiwid3JhcHBlcnMiLCJmaWx0ZXIiLCJ3IiwiaW5jbHVkZXMiLCJkZWxldGUiLCJnaXQiLCJhcmdzIiwiY3dkIiwiY3JlYXRlUmVsZWFzZU1vbm9yZXBvIiwib3B0aW9ucyIsImJyYW5jaCIsIm1lc3NhZ2UiLCJza2lwUHVzaCIsInNraXBWZXJzaW9uQnVtcCIsInRlc3QiLCJBcnJheSIsImlzQXJyYXkiLCJsZW5ndGgiLCJleGlzdHNTeW5jIiwibWFqb3JTdHIiLCJtaW5vclN0ciIsInNwbGl0IiwibWFqb3IiLCJOdW1iZXIiLCJtaW5vciIsInJlbGVhc2VCcmFuY2giLCJ3b3JrdHJlZVBhdGgiLCJyZXBsYWNlIiwicmNWZXJzaW9uIiwidGVzdFR5cGUiLCJ0ZXN0TnVtYmVyIiwiaW5mbyIsInJlbW90ZUxzIiwidHJpbSIsImxvY2FsQ2hlY2siLCJlcnJvcnMiLCJjb2RlIiwia2VlcFJlcG9zIiwic2l6ZSIsImZyb20iLCJzb3J0Iiwicm9vdEVudHJpZXMiLCJyZWFkZGlyU3luYyIsIndpdGhGaWxlVHlwZXMiLCJwcnVuZWQiLCJlbnRyeSIsImlzRGlyZWN0b3J5IiwibmFtZSIsInN0YXJ0c1dpdGgiLCJoYXMiLCJybVN5bmMiLCJyZWN1cnNpdmUiLCJmb3JjZSIsInNpbVBhY2thZ2VQYXRoIiwic2ltUGFja2FnZSIsInZlcnNpb24iLCJ0b1N0cmluZyIsInN1cHBvcnRlZEJyYW5kcyIsIndyaXRlRmlsZVN5bmMiLCJzdHJpbmdpZnkiLCJzaW1Mb2NrUGF0aCIsInNpbUxvY2siLCJwYWNrYWdlcyIsImNvbW1pdE1lc3NhZ2UiLCJjdXJyZW50QnJhbmNoIiwiZGV2VmVyc2lvbiIsIm1haW5QYWNrYWdlUGF0aCIsIm1haW5QYWNrYWdlIiwibWFpbkxvY2tQYXRoIiwibWFpbkxvY2siLCJlcnJvciJdLCJtYXBwaW5ncyI6IkFBQUEsaURBQWlEO0FBRWpEOzs7Ozs7Ozs7OztDQVdDLEdBRUQsT0FBT0EsWUFBWSxTQUFTO0FBQzVCLE9BQU9DLFFBQVEsS0FBSztBQUNwQixPQUFPQyxVQUFVLE9BQU87QUFDeEIsT0FBT0MsYUFBYSxVQUFVO0FBQzlCLE9BQU9DLGdCQUFnQixvQ0FBb0M7QUFDM0QsT0FBT0MsYUFBYSx1QkFBdUI7QUFDM0MsT0FBT0MsYUFBYSx1QkFBdUI7QUFFM0Msd0VBQXdFO0FBQ3hFLE1BQU1DLFlBQVlGLFFBQVMsWUFBWUcsR0FBRztBQUUxQyxnRUFBZ0U7QUFDaEUsTUFBTUMsZ0JBQWdCUCxLQUFLUSxPQUFPLENBQUVILFdBQVc7QUFXL0MseUZBQXlGO0FBQ3pGLE1BQU1JLG9CQUFvQjtJQUFFO0lBQW1CO0lBQVc7Q0FBYTtBQUV2RSxpR0FBaUc7QUFDakcsbUVBQW1FO0FBQ25FLE1BQU1DLG9CQUFvQjtJQUFFO0NBQVM7QUFFckM7OztDQUdDLEdBQ0QsU0FBU0MsaUJBQWtCQyxJQUFZLEVBQUVDLE1BQWdCO0lBQ3ZELE1BQU1DLGdCQUFnQkMsS0FBS0MsS0FBSyxDQUFFakIsR0FBR2tC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