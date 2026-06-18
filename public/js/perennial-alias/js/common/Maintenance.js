// Copyright 2018-2026, University of Colorado Boulder
/**
 * The main persistent state-bearing object for maintenance releases. Can be loaded from or saved to a dedicated file.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ import assert from 'assert';
// @ts-expect-error - no @types for this project
import asyncQ from 'async-q';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import repl from 'repl';
import winston from 'winston';
import production from '../grunt/production.js';
import rc from '../grunt/rc.js';
import build from './build.js';
import checkoutMain from './checkoutMain.js';
import checkoutTarget from './checkoutTarget.js';
import chipperSupportsOutputJSGruntTasks from './chipperSupportsOutputJSGruntTasks.js';
import ChipperVersion from './ChipperVersion.js';
import execute from './execute.js';
import getActiveRepos from './getActiveRepos.js';
import getBranches from './getBranches.js';
import getBranchMap from './getBranchMap.js';
import getDependencies from './getDependencies.js';
import gitAdd from './gitAdd.js';
import gitCheckout from './gitCheckout.js';
import gitCherryPick from './gitCherryPick.js';
import gitCommit from './gitCommit.js';
import gitCreateBranch from './gitCreateBranch.js';
import gitIsClean from './gitIsClean.js';
import gitPull from './gitPull.js';
import gitPush from './gitPush.js';
import gitRevParse from './gitRevParse.js';
import gruntCommand from './gruntCommand.js';
import ModifiedBranch from './ModifiedBranch.js';
import Patch from './Patch.js';
import { PERENNIAL_ROOT } from './perennialRepoUtils.js';
import ReleaseBranch from './ReleaseBranch.js';
// constants
const MAINTENANCE_FILE = '.maintenance.json';
let Maintenance = class Maintenance {
    constructor(patches = [], modifiedBranches = [], allReleaseBranches = []){
        this.patches = patches;
        this.modifiedBranches = modifiedBranches;
        this.allReleaseBranches = allReleaseBranches;
    }
    /**
   * Resets ALL the maintenance state to a default "blank" state.
   *
   * @param keepCachedReleaseBranches {boolean} - allReleaseBranches take a while to populate, and have little to do
   *                                              with the current MR, so optionally keep them in storage.
   *
   * CAUTION: This will remove any information about any ongoing/complete maintenance release from your
   * .maintenance.json. Generally this should be done before any new maintenance release.
   */ static reset(keepCachedReleaseBranches = false) {
        console.log('PhET-iO simulations require maintaining older release branches. ' + 'If you are patching specific simulations, use `grunt release-branch-list` ' + 'in perennial to generate the list of branches that require patching.');
        const allReleaseBranches = [];
        if (keepCachedReleaseBranches) {
            const maintenance = Maintenance.load();
            allReleaseBranches.push(...maintenance.allReleaseBranches);
        }
        new Maintenance([], [], allReleaseBranches).save();
    }
    /**
   * Runs a number of checks through every release branch.
   *
   *
   * @param filter - Optional filter, release branches will be skipped if this resolves to false
   */ static async checkBranchStatus(filter) {
        for (const repo of getActiveRepos()){
            if (repo !== 'perennial' && !await gitIsClean(repo)) {
                console.log(`Unclean repository: ${repo}, please resolve this and then run checkBranchStatus again`);
                return;
            }
        }
        const releaseBranches = await Maintenance.getMaintenanceBranches(filter);
        // Set up a cache of branchMaps so that we don't make multiple requests
        const branchMaps = {};
        const getBranchMapAsyncCallback = async (repo)=>{
            if (!branchMaps[repo]) {
                // eslint-disable-next-line require-atomic-updates
                branchMaps[repo] = await getBranchMap(repo);
            }
            return branchMaps[repo];
        };
        for (const releaseBranch of releaseBranches){
            if (!filter || filter(releaseBranch)) {
                console.log(`${releaseBranch.repo} ${releaseBranch.branch}`);
                for (const line of (await releaseBranch.getStatus(getBranchMapAsyncCallback))){
                    console.log(`  ${line}`);
                }
            } else {
                console.log(`${releaseBranch.repo} ${releaseBranch.branch} (skipping due to filter)`);
            }
        }
        console.log('Checks completed');
    }
    /**
   * Builds all release branches (so that the state of things can be checked). Puts in in perennial/build.
   */ static async buildAll() {
        const releaseBranches = await Maintenance.getMaintenanceBranches();
        const failed = [];
        for (const releaseBranch of releaseBranches){
            console.log(`building ${releaseBranch.repo} ${releaseBranch.branch}`);
            try {
                await checkoutTarget(releaseBranch.repo, releaseBranch.branch, true); // include npm update
                await build(releaseBranch.repo, {
                    brands: releaseBranch.brands
                });
                throw new Error('UNIMPLEMENTED, copy over');
            } catch (e) {
                failed.push(`${releaseBranch.repo} ${releaseBranch.brands}`);
            }
        }
        if (failed.length) {
            console.log(`Failed builds:\n${failed.join('\n')}`);
        } else {
            console.log('Builds complete');
        }
    }
    /**
   * Displays a listing of the current maintenance status.
   *
   * If timestamp:true is provided, it will include timestamps for when the branches diverged from main, and sort by those timestamps.
   * This is useful for prioritizing which branches to patch first.
   */ static async list(options) {
        const maintenance = Maintenance.load();
        // At the top so that the important items are right above your cursor after calling the function
        if (maintenance.allReleaseBranches.length > 0) {
            console.log(`Total recognized ReleaseBranches: ${maintenance.allReleaseBranches.length}`);
        }
        console.log('\nRelease Branches in MR:', maintenance.patches.length === 0 ? 'None' : '');
        for (const modifiedBranch of maintenance.modifiedBranches){
            const count = maintenance.modifiedBranches.indexOf(modifiedBranch) + 1;
            console.log(`${count}. ${modifiedBranch.repo} ${modifiedBranch.branch} ${modifiedBranch.brands.join(',')}${modifiedBranch.releaseBranch.isReleased ? '' : ' (unreleased)'}`);
            if (modifiedBranch.deployedVersion) {
                console.log(`    deployed: ${modifiedBranch.deployedVersion.toString()}`);
            }
            if (modifiedBranch.neededPatches.length) {
                console.log(`    needs: ${modifiedBranch.neededPatches.map((patch)=>patch.name).join(',')}`);
            }
            if (modifiedBranch.pushedMessages.length) {
                console.log(`    pushedMessages: \n      ${modifiedBranch.pushedMessages.join('\n      ')}`);
            }
            if (modifiedBranch.pendingMessages.length) {
                console.log(`    pendingMessages: \n      ${modifiedBranch.pendingMessages.join('\n      ')}`);
            }
            if (Object.keys(modifiedBranch.changedDependencies).length > 0) {
                console.log('    deps:');
                for (const key of Object.keys(modifiedBranch.changedDependencies)){
                    console.log(`      ${key}: ${modifiedBranch.changedDependencies[key]}`);
                }
            }
        }
        console.log('\nMaintenance Patches in MR:', maintenance.patches.length === 0 ? 'None' : '');
        for (const patch of maintenance.patches){
            const count = maintenance.patches.indexOf(patch) + 1;
            const indexAndSpacing = `${count}. ` + (count > 9 ? '' : ' ');
            console.log(`${indexAndSpacing}[${patch.name}]${patch.name !== patch.repo ? ` (${patch.repo})` : ''} ${patch.message}`);
            for (const sha of patch.shas){
                console.log(`      ${sha}`);
            }
            let modifiedBranches = maintenance.modifiedBranches;
            if (options?.timestamp) {
                // Do a parallel update of cached timestamps on the modified branches, so that we can sort by them.
                await Promise.all(modifiedBranches.map((modifiedBranch)=>{
                    return (async ()=>{
                        if (!modifiedBranch.releaseBranch.cachedTimestampString) {
                            // eslint-disable-next-line require-atomic-updates
                            modifiedBranch.releaseBranch.cachedTimestampString = await modifiedBranch.releaseBranch.getDivergingTimestampString();
                        }
                    })();
                }));
                modifiedBranches = _.sortBy(modifiedBranches, (modifiedBranch)=>{
                    return modifiedBranch.releaseBranch.cachedTimestampString;
                });
            }
            for (const modifiedBranch of modifiedBranches){
                if (modifiedBranch.neededPatches.includes(patch)) {
                    const timestampPrefix = options?.timestamp ? `${modifiedBranch.releaseBranch.cachedTimestampString} ` : '';
                    console.log(`        ${timestampPrefix}${modifiedBranch.repo} ${modifiedBranch.branch} ${modifiedBranch.brands.join(',')}`);
                }
            }
        }
        console.log('\n(list complete)');
    }
    /**
   * A convenience function for list() with timestamp: true. Sorts needed-patch branches by branch date
   */ static async timestampList() {
        await this.list({
            timestamp: true
        });
    }
    /**
   * Shows any required testing links for the simulations.
   * @param filter - Control which branches are shown
   * @param options - options for including specific links
   */ static async listLinks(filter = ()=>true, options) {
        const maintenance = Maintenance.load();
        const deployedBranches = maintenance.modifiedBranches.filter((modifiedBranch)=>!!modifiedBranch.deployedVersion && filter(modifiedBranch));
        const productionBranches = deployedBranches.filter((modifiedBranch)=>modifiedBranch.deployedVersion?.testType === null);
        const releaseCandidateBranches = deployedBranches.filter((modifiedBranch)=>modifiedBranch.deployedVersion?.testType === 'rc');
        if (productionBranches.length) {
            console.log('\nProduction links\n');
            for (const modifiedBranch of productionBranches){
                const links = await modifiedBranch.getDeployedLinkLines(options);
                for (const link of links){
                    console.log(link);
                }
            }
        }
        if (releaseCandidateBranches.length) {
            console.log('\nRelease Candidate links\n');
            for (const modifiedBranch of releaseCandidateBranches){
                const links = await modifiedBranch.getDeployedLinkLines(options);
                for (const link of links){
                    console.log(link);
                }
            }
        }
    }
    /**
   * Creates an issue to note patches on all unreleased branches that include a pushed message.
   */ static async createUnreleasedIssues(additionalNotes = '') {
        const maintenance = Maintenance.load();
        for (const modifiedBranch of maintenance.modifiedBranches){
            if (!modifiedBranch.releaseBranch.isReleased && modifiedBranch.pushedMessages.length > 0) {
                console.log(`Creating issue for ${modifiedBranch.releaseBranch.toString()}`);
                await modifiedBranch.createUnreleasedIssue(additionalNotes);
            }
        }
        console.log('Finished creating unreleased issues');
    }
    /**
   * Creates a patch
   * @param [patchName] - If no name is provided, the repo string will be used.
   */ static async createPatch(repo, message, patchName) {
        const maintenance = Maintenance.load();
        patchName = patchName || repo;
        for (const patch of maintenance.patches){
            if (patch.name === patchName) {
                throw new Error('Multiple patches with the same name are not concurrently supported');
            }
        }
        maintenance.patches.push(new Patch(repo, patchName, message));
        maintenance.save();
        console.log(`Created patch for ${repo} with message: ${message}`);
    }
    /**
   * Removes a patch
   */ static async removePatch(patchName) {
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        for (const branch of maintenance.modifiedBranches){
            if (branch.neededPatches.includes(patch)) {
                throw new Error('Patch is marked as needed by at least one branch');
            }
        }
        maintenance.patches.splice(maintenance.patches.indexOf(patch), 1);
        maintenance.save();
        console.log(`Removed patch for ${patchName}`);
    }
    /**
   * Adds a particular SHA (to cherry-pick) to a patch.
   */ static async addPatchSHA(patchName, sha) {
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        if (!sha) {
            sha = await gitRevParse(patch.repo, 'HEAD');
            console.log(`SHA not provided, detecting SHA: ${sha}`);
        }
        patch.shas.push(sha);
        maintenance.save();
        console.log(`Added SHA ${sha} to patch ${patchName}`);
    }
    /**
   * Removes a particular SHA (to cherry-pick) from a patch.
   */ static async removePatchSHA(patchName, sha) {
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        const index = patch.shas.indexOf(sha);
        assert(index >= 0, 'SHA not found');
        patch.shas.splice(index, 1);
        maintenance.save();
        console.log(`Removed SHA ${sha} from patch ${patchName}`);
    }
    /**
   * Removes all patch SHAs for a particular patch.
   */ static async removeAllPatchSHAs(patchName) {
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        for (const sha of patch.shas){
            console.log(`Removing SHA ${sha} from patch ${patchName}`);
        }
        patch.shas.length = 0;
        maintenance.save();
    }
    /**
   * Adds a needed patch to a given modified branch.
   */ static async addNeededPatch(repo, branch, patchName) {
        const maintenance = Maintenance.load();
        assert(repo !== patchName, 'Cannot patch a release branch repo, yet.'); // TODO: remove in https://github.com/phetsims/perennial/issues/312
        const patch = maintenance.findPatch(patchName);
        const modifiedBranch = await maintenance.ensureModifiedBranch(repo, branch);
        modifiedBranch.neededPatches.push(patch);
        maintenance.save();
        console.log(`Added patch ${patchName} as needed for ${repo} ${branch}`);
    }
    /**
   * Adds a needed patch to a given release branch
   */ static async addNeededPatchReleaseBranch(releaseBranch, patchName) {
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        // Use an ensured modified branch instead of creating one directly.
        const modifiedBranch = await maintenance.ensureModifiedBranch(releaseBranch.repo, releaseBranch.branch);
        modifiedBranch.neededPatches.push(patch);
        maintenance.save();
        console.log(`Added patch ${patchName} as needed for ${releaseBranch.repo} ${releaseBranch.branch}`);
    }
    /**
   * Adds a needed patch to whatever subset of release branches match the filter.
   */ static async addNeededPatches(patchName, filter) {
        // getMaintenanceBranches needs to cache its branches and maintenance.save() them, so do it before loading
        // Maintenance for this function.
        const releaseBranches = await Maintenance.getMaintenanceBranches();
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        let count = 0;
        for (const releaseBranch of releaseBranches){
            const needsPatch = await filter(releaseBranch);
            if (!needsPatch) {
                console.log(`  skipping ${releaseBranch.repo} ${releaseBranch.branch}`);
                continue;
            }
            const modifiedBranch = await maintenance.ensureModifiedBranch(releaseBranch.repo, releaseBranch.branch, false, releaseBranches);
            if (!modifiedBranch.neededPatches.includes(patch)) {
                modifiedBranch.neededPatches.push(patch);
                console.log(`Added needed patch ${patchName} to ${releaseBranch.repo} ${releaseBranch.branch}`);
                count++;
                maintenance.save(); // save here in case a future failure would "revert" things
            } else {
                console.log(`Patch ${patchName} already included in ${releaseBranch.repo} ${releaseBranch.branch}`);
            }
        }
        console.log(`Added ${count} releaseBranches to patch: ${patchName}`);
        maintenance.save();
    }
    /**
   * Adds a needed patch to all release branches.
   */ static async addAllNeededPatches(patchName) {
        await Maintenance.addNeededPatches(patchName, async ()=>true);
    }
    /**
   * Adds a needed patch to all release branches that do NOT include the given commit on the repo
   */ static async addNeededPatchesBefore(patchName, sha) {
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        await Maintenance.addNeededPatches(patchName, async (releaseBranch)=>{
            return releaseBranch.isMissingSHA(patch.repo, sha);
        });
    }
    /**
   * Adds a needed patch to all release branches that DO include the given commit on the repo
   */ static async addNeededPatchesAfter(patchName, sha) {
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        await Maintenance.addNeededPatches(patchName, async (releaseBranch)=>{
            return releaseBranch.includesSHA(patch.repo, sha);
        });
    }
    /**
   * Adds a needed patch to all release branches that satisfy the given filter( releaseBranch, builtFileString )
   * where it builds the simulation with the defaults (brand=phet) and provides it as a string.
   */ static async addNeededPatchesBuildFilter(patchName, filter) {
        await Maintenance.addNeededPatches(patchName, async (releaseBranch)=>{
            await checkoutTarget(releaseBranch.repo, releaseBranch.branch, true);
            await gitPull(releaseBranch.repo);
            await build(releaseBranch.repo);
            const chipperVersion = ChipperVersion.getFromRepository();
            let filename;
            if (chipperVersion.major !== 0) {
                filename = `../${releaseBranch.repo}/build/phet/${releaseBranch.repo}_en_phet.html`;
            } else {
                filename = `../${releaseBranch.repo}/build/${releaseBranch.repo}_en.html`;
            }
            return filter(releaseBranch, fs.readFileSync(filename, 'utf8'));
        });
    }
    /**
   * Removes a needed patch from a given modified branch.
   */ static async removeNeededPatch(repo, branch, patchName) {
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        const modifiedBranch = await maintenance.ensureModifiedBranch(repo, branch);
        const index = modifiedBranch.neededPatches.indexOf(patch);
        assert(index >= 0, 'Could not find needed patch on the modified branch');
        modifiedBranch.neededPatches.splice(index, 1);
        maintenance.tryRemovingModifiedBranch(modifiedBranch);
        maintenance.save();
        console.log(`Removed patch ${patchName} from ${repo} ${branch}`);
    }
    /**
   * Removes a needed patch from whatever subset of (current) release branches match the filter.
   */ static async removeNeededPatches(patchName, filter) {
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        let count = 0;
        for (const modifiedBranch of maintenance.modifiedBranches){
            // Check if there's actually something to remove (for running the potentially-expensive filter function)
            const index = modifiedBranch.neededPatches.indexOf(patch);
            if (index < 0) {
                continue;
            }
            const needsRemoval = await filter(modifiedBranch.releaseBranch);
            if (!needsRemoval) {
                console.log(`  skipping ${modifiedBranch.repo} ${modifiedBranch.branch}`);
                continue;
            }
            modifiedBranch.neededPatches.splice(index, 1);
            maintenance.tryRemovingModifiedBranch(modifiedBranch);
            count++;
            console.log(`Removed needed patch ${patchName} from ${modifiedBranch.repo} ${modifiedBranch.branch}`);
        }
        console.log(`Removed ${count} releaseBranches from patch: ${patchName}`);
        maintenance.save();
    }
    /**
   * Removes a needed patch from all release branches that do NOT include the given commit on the repo
   */ static async removeNeededPatchesBefore(patchName, sha) {
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        await Maintenance.removeNeededPatches(patchName, async (releaseBranch)=>{
            return releaseBranch.isMissingSHA(patch.repo, sha);
        });
    }
    /**
   * Removes a needed patch from all release branches that DO include the given commit on the repo
   */ static async removeNeededPatchesAfter(patchName, sha) {
        const maintenance = Maintenance.load();
        const patch = maintenance.findPatch(patchName);
        await Maintenance.removeNeededPatches(patchName, async (releaseBranch)=>{
            return releaseBranch.includesSHA(patch.repo, sha);
        });
    }
    /**
   * Helper for adding patches based on specific patterns, e.g.:
   * Maintenance.addNeededPatches( 'phetmarks', Maintenance.singleFileReleaseBranchFilter( '../phetmarks/js/phetmarks.ts' ), content => content.includes( 'data/wrappers' ) );
   */ static singleFileReleaseBranchFilter(fileName, predicate) {
        return async (releaseBranch)=>{
            await releaseBranch.checkout(false);
            if (fs.existsSync(fileName)) {
                const contents = fs.readFileSync(fileName, 'utf-8');
                return predicate(contents);
            }
            return false;
        };
    }
    /**
   * Checks out a specific Release Branch (using local commit data as necessary).
   * @param repo
   * @param branch
   * @param outputJS - if true, once checked out this will also run `grunt output-js-project`
   * @param npmUpdate - do a npm update after checking out shas
   */ static async checkoutBranch(repo, branch, outputJS = false, npmUpdate = true) {
        const maintenance = Maintenance.load();
        const modifiedBranch = await maintenance.ensureModifiedBranch(repo, branch, true);
        await modifiedBranch.checkout(npmUpdate);
        if (outputJS && chipperSupportsOutputJSGruntTasks()) {
            console.log('Running output-js-project');
            // We might not be able to run this command!
            await execute(gruntCommand, [
                'output-js-project',
                '--silent'
            ], `../${repo}`, {
                errors: 'resolve'
            });
        }
        // No need to save, shouldn't be changing things
        console.log(`Checked out ${repo} ${branch}`);
    }
    /**
   * Checks out a single branch for a repo, then builds it.
   * @param repo
   * @param branch
   * @param buildOptions - Optional build options forwarded to build()
   */ static async checkoutAndBuild(repo, branch, buildOptions) {
        await Maintenance.checkoutBranch(repo, branch);
        await Maintenance.cleanBuildDirectory(repo);
        await build(repo, buildOptions);
        console.log(`Built ${repo} ${branch}`);
    }
    /**
   * Deletes the build/ directory for a repo to avoid legacy grunt clean issues that
   * attempt to delete outside the current working directory.
   * See https://github.com/phetsims/perennial/issues/480
   */ static async cleanBuildDirectory(repo) {
        console.log('Cleaning repo build directory');
        const buildDirectory = path.resolve(PERENNIAL_ROOT, '..', repo, 'build');
        await fs.promises.rm(buildDirectory, {
            recursive: true,
            force: true
        });
    }
    /**
   * Attempts to apply patches to the modified branches that are marked as needed.
   */ static async applyPatches() {
        winston.info('applying patches');
        let success = true;
        const maintenance = Maintenance.load();
        let numApplied = 0;
        for (const modifiedBranch of maintenance.modifiedBranches){
            if (modifiedBranch.neededPatches.length === 0) {
                continue;
            }
            const repo = modifiedBranch.repo;
            const branch = modifiedBranch.branch;
            let simSuccess = false;
            // Defensive copy, since we modify it during iteration
            for (const patch of modifiedBranch.neededPatches.slice()){
                if (patch.shas.length === 0) {
                    continue;
                }
                const patchRepo = patch.repo;
                try {
                    let patchRepoCurrentSHA;
                    // Checkout whatever the latest patched SHA is (if we've patched it)
                    if (modifiedBranch.changedDependencies[patchRepo]) {
                        patchRepoCurrentSHA = modifiedBranch.changedDependencies[patchRepo];
                    } else {
                        // Look up the SHA to check out at the tip of the release branch dependencies.json
                        await gitCheckout(repo, branch);
                        await gitPull(repo);
                        const dependencies = await getDependencies(repo);
                        patchRepoCurrentSHA = dependencies[patchRepo].sha;
                        await gitCheckout(repo, 'main'); // TODO: this assumes we were on main when we started running this. https://github.com/phetsims/perennial/issues/368
                    // TODO: see if the patchRepo has a branch for this release branch, and if so, pull it to make sure we have the above SHA https://github.com/phetsims/perennial/issues/368
                    }
                    // Then check it out
                    await gitCheckout(patchRepo, patchRepoCurrentSHA);
                    console.log(`Checked out ${patchRepo} for ${repo} ${branch}, SHA: ${patchRepoCurrentSHA}`);
                    for (const sha of patch.shas){
                        // If the sha doesn't exist in the repo, then give a specific error for that.
                        const hasSha = (await execute('git', [
                            'cat-file',
                            '-e',
                            sha
                        ], `../${patchRepo}`, {
                            errors: 'resolve'
                        })).code === 0;
                        if (!hasSha) {
                            throw new Error(`SHA not found in ${patchRepo}: ${sha}`);
                        }
                        const cherryPickSuccess = await gitCherryPick(patchRepo, sha);
                        if (cherryPickSuccess) {
                            const currentSHA = await gitRevParse(patchRepo, 'HEAD');
                            console.log(`Cherry-pick success for ${sha}, result is ${currentSHA}`);
                            simSuccess = true;
                            modifiedBranch.changedDependencies[patchRepo] = currentSHA;
                            modifiedBranch.neededPatches.splice(modifiedBranch.neededPatches.indexOf(patch), 1);
                            numApplied++;
                            // Don't include duplicate messages, since multiple patches might be for a single issue
                            if (!modifiedBranch.pendingMessages.includes(patch.message)) {
                                modifiedBranch.pendingMessages.push(patch.message);
                            }
                            break;
                        } else {
                            console.log(`Could not cherry-pick ${sha}`);
                        }
                    }
                } catch (e) {
                    maintenance.save();
                    throw new Error(`Failure applying patch ${patchRepo} to ${repo} ${branch}: ${e}`);
                }
            }
            await gitCheckout(modifiedBranch.repo, 'main');
            success = success && simSuccess;
        }
        maintenance.save();
        console.log(`${numApplied} patches applied`);
        return success;
    }
    /**
   * Pushes local changes up to GitHub.
   *
   *
   * @param filter - Optional filter, modified branches will be skipped if this resolves to false
   */ static async updateDependencies(filter) {
        winston.info('update dependencies');
        const maintenance = Maintenance.load();
        for (const modifiedBranch of maintenance.modifiedBranches){
            const changedRepos = Object.keys(modifiedBranch.changedDependencies);
            if (changedRepos.length === 0) {
                continue;
            }
            if (filter && !await filter(modifiedBranch)) {
                console.log(`Skipping dependency update for ${modifiedBranch.repo} ${modifiedBranch.branch}`);
                continue;
            }
            try {
                // No NPM needed
                await checkoutTarget(modifiedBranch.repo, modifiedBranch.branch, false);
                console.log(`Checked out ${modifiedBranch.repo} ${modifiedBranch.branch}`);
                const dependenciesJSONFile = `../${modifiedBranch.repo}/dependencies.json`;
                const dependenciesJSON = JSON.parse(fs.readFileSync(dependenciesJSONFile, 'utf-8'));
                // Modify the "self" in the dependencies.json as expected
                dependenciesJSON[modifiedBranch.repo].sha = await gitRevParse(modifiedBranch.repo, modifiedBranch.branch);
                for (const dependency of changedRepos){
                    const dependencyBranch = modifiedBranch.dependencyBranch;
                    const branches = await getBranches(dependency);
                    const sha = modifiedBranch.changedDependencies[dependency];
                    dependenciesJSON[dependency].sha = sha;
                    if (branches.includes(dependencyBranch)) {
                        console.log(`Branch ${dependencyBranch} already exists in ${dependency}`);
                        await gitCheckout(dependency, dependencyBranch);
                        await gitPull(dependency);
                        const currentSHA = await gitRevParse(dependency, 'HEAD');
                        if (sha !== currentSHA) {
                            console.log(`Attempting to (hopefully fast-forward) merge ${sha}`);
                            await execute('git', [
                                'merge',
                                sha
                            ], `../${dependency}`);
                            await gitPush(dependency, dependencyBranch);
                        }
                    } else {
                        console.log(`Branch ${dependencyBranch} does not exist in ${dependency}, creating.`);
                        await gitCheckout(dependency, sha);
                        await gitCreateBranch(dependency, dependencyBranch);
                        await gitPush(dependency, dependencyBranch);
                    }
                    delete modifiedBranch.changedDependencies[dependency];
                    modifiedBranch.deployedVersion = null;
                    maintenance.save(); // save here in case a future failure would "revert" things
                }
                const message = modifiedBranch.pendingMessages.join(' and ');
                fs.writeFileSync(dependenciesJSONFile, JSON.stringify(dependenciesJSON, null, 2));
                await gitAdd(modifiedBranch.repo, 'dependencies.json');
                await gitCommit(modifiedBranch.repo, `updated dependencies.json for ${message}`);
                await gitPush(modifiedBranch.repo, modifiedBranch.branch);
                // Move messages from pending to pushed
                for (const message of modifiedBranch.pendingMessages){
                    if (!modifiedBranch.pushedMessages.includes(message)) {
                        modifiedBranch.pushedMessages.push(message);
                    }
                }
                modifiedBranch.pendingMessages.length = 0;
                maintenance.save(); // save here in case a future failure would "revert" things
                await checkoutMain(modifiedBranch.repo, false);
            } catch (e) {
                maintenance.save();
                throw new Error(`Failure updating dependencies for ${modifiedBranch.repo} to ${modifiedBranch.branch}: ${e}`);
            }
        }
        maintenance.save();
        console.log('Dependencies updated');
    }
    /**
   * Cleans chipper/dist, see https://github.com/phetsims/perennial/issues/461#issuecomment-3837518242
   *
   * Our TypeScript setup is now unreliable, and we need to clear out temporary files to prevent it from bugging out
   * (having stale TS data from OTHER release branches being used in DIFFERENT release branches --- can trigger or hide
   * errors).
   */ static async cleanChipperDist() {
        const distPath = path.resolve(PERENNIAL_ROOT, '..', 'chipper', 'dist');
        console.log('cleaning chipper/dist');
        await fs.promises.rm(distPath, {
            recursive: true,
            force: true
        });
    }
    /**
   * Deploys RC versions of the modified branches that need it.
   *
   *
   * @param filter - Optional filter, modified branches will be skipped if this resolves to false
   */ static async deployReleaseCandidates(filter) {
        const maintenance = Maintenance.load();
        for (const modifiedBranch of maintenance.modifiedBranches){
            if (!modifiedBranch.isReadyForReleaseCandidate || !modifiedBranch.releaseBranch.isReleased) {
                continue;
            }
            console.log('================================================');
            if (filter && !await filter(modifiedBranch)) {
                console.log(`Skipping RC deploy for ${modifiedBranch.repo} ${modifiedBranch.branch}`);
                continue;
            }
            try {
                console.log(`Running RC deploy for ${modifiedBranch.repo} ${modifiedBranch.branch}`);
                await Maintenance.cleanChipperDist();
                await Maintenance.cleanBuildDirectory(modifiedBranch.repo);
                const version = await rc(modifiedBranch.repo, modifiedBranch.branch, modifiedBranch.brands, true, modifiedBranch.pushedMessages.join(', '));
                modifiedBranch.deployedVersion = version;
                maintenance.save(); // save here in case a future failure would "revert" things
            } catch (e) {
                maintenance.save();
                console.error(`Failure with RC deploy for ${modifiedBranch.repo} to ${modifiedBranch.branch}: ${e}`);
            }
        }
        maintenance.save();
        console.log('RC versions deployed');
    }
    /**
   * Deploys production versions of the modified branches that need it.
   * @param filter - Optional filter, modified branches will be skipped if this resolves to false
   */ static async deployProduction(filter) {
        const maintenance = Maintenance.load();
        for (const modifiedBranch of maintenance.modifiedBranches){
            if (!modifiedBranch.isReadyForProduction || !modifiedBranch.releaseBranch.isReleased) {
                continue;
            }
            if (filter && !await filter(modifiedBranch)) {
                console.log(`Skipping production deploy for ${modifiedBranch.repo} ${modifiedBranch.branch}`);
                continue;
            }
            try {
                console.log(`Running production deploy for ${modifiedBranch.repo} ${modifiedBranch.branch}`);
                await Maintenance.cleanChipperDist();
                await Maintenance.cleanBuildDirectory(modifiedBranch.repo);
                const version = await production(modifiedBranch.repo, modifiedBranch.branch, modifiedBranch.brands, true, false, modifiedBranch.pushedMessages.join(', '));
                modifiedBranch.deployedVersion = version;
                modifiedBranch.pushedMessages.length = 0;
                maintenance.save(); // save here in case a future failure would "revert" things
            } catch (e) {
                maintenance.save();
                throw new Error(`Failure with production deploy for ${modifiedBranch.repo} to ${modifiedBranch.branch}: ${e}`);
            }
        }
        maintenance.save();
        console.log('production versions deployed');
    }
    /**
   * Create a separate directory for each release branch. This does not interface with the saved maintenance state at
   * all, and instead just looks at the committed dependencies.json when updating.
   *
   *
   * @param filter - Optional filter, release branches will be skipped if this resolves to false
   * @param providedOptions
   */ static async updateCheckouts(filter, providedOptions) {
        const options = _.merge({
            concurrent: 5,
            build: true,
            transpile: true,
            buildOptions: {
                lint: true
            }
        }, providedOptions);
        console.log(`Updating checkouts (running in parallel with ${options.concurrent} threads)`);
        const releaseBranches = await Maintenance.getMaintenanceBranches();
        const filteredBranches = [];
        // Run all filtering in a step before the parallel step. This way the filter has full access to repos and git commands without race conditions, https://github.com/phetsims/perennial/issues/341
        for (const releaseBranch of releaseBranches){
            if (!filter || await filter(releaseBranch)) {
                filteredBranches.push(releaseBranch);
            }
        }
        console.log(`Filter applied. Updating ${filteredBranches.length}:`, filteredBranches.map((x)=>x.toString()));
        const asyncFunctions = filteredBranches.map((releaseBranch)=>async ()=>{
                console.log('Beginning: ', releaseBranch.toString());
                try {
                    await releaseBranch.updateCheckout();
                    options.transpile && await releaseBranch.transpile();
                    try {
                        options.build && await releaseBranch.build(options.buildOptions);
                        console.log('Finished: ', releaseBranch.toString());
                    } catch (e) {
                        console.log(`failed to build ${releaseBranch.toString()}: ${e}`);
                    }
                } catch (e) {
                    console.log(`failed to update releaseBranch ${releaseBranch.toString()}: ${e}`);
                }
            });
        await asyncQ.parallelLimit(asyncFunctions, options.concurrent);
        console.log('Done');
    }
    /**
   * @param filter - Optional filter, release branches will be skipped if this resolves to false
   */ static async checkUnbuiltCheckouts(filter) {
        console.log('Checking unbuilt checkouts');
        const releaseBranches = await Maintenance.getMaintenanceBranches();
        for (const releaseBranch of releaseBranches){
            if (!filter || await filter(releaseBranch)) {
                console.log(releaseBranch.toString());
                const unbuiltResult = await releaseBranch.checkUnbuilt();
                if (unbuiltResult) {
                    console.log(unbuiltResult);
                }
            }
        }
    }
    /**
   * @param filter - Optional filter, release branches will be skipped if this resolves to false
   */ static async checkBuiltCheckouts(filter) {
        console.log('Checking built checkouts');
        const releaseBranches = await Maintenance.getMaintenanceBranches();
        for (const releaseBranch of releaseBranches){
            if (!filter || await filter(releaseBranch)) {
                console.log(releaseBranch.toString());
                const builtResult = await releaseBranch.checkBuilt();
                if (builtResult) {
                    console.log(builtResult);
                }
            }
        }
    }
    /**
   * Redeploys production versions of all release branches (or those matching a specific filter
   *
   *
   * NOTE: This does not use the current maintenance state!
   * @param message - Generally an issue to reference
   * @param filter - Optional filter, release branches will be skipped if this resolves to false
   */ static async redeployAllProduction(message, filter) {
        // Ignore unreleased branches!
        const releaseBranches = await Maintenance.getMaintenanceBranches(()=>true, false);
        for (const releaseBranch of releaseBranches){
            if (filter && !await filter(releaseBranch)) {
                continue;
            }
            console.log(releaseBranch.toString());
            await rc(releaseBranch.repo, releaseBranch.branch, releaseBranch.brands, true, message);
            await production(releaseBranch.repo, releaseBranch.branch, releaseBranch.brands, true, false, message);
        }
        console.log('Finished redeploying');
    }
    /**
   * The prototype copy of Maintenance.getMaintenanceBranches(), in which we will mutate the class's allReleaseBranches
   * to ensure there is no save/load order dependency problems.
   *
   *
   * @param filter - return false if the ReleaseBranch should be excluded.
   * @param checkUnreleasedBranches - If false, will skip checking for unreleased branches. This checking needs all repos checked out
   * @param forceCacheBreak - true if you want to force a recalculation of all ReleaseBranches
   * @rejects {ExecuteError}
   */ async getMaintenanceBranches(filter = ()=>true, checkUnreleasedBranches = true, forceCacheBreak = false) {
        return Maintenance.getMaintenanceBranches(filter, checkUnreleasedBranches, forceCacheBreak, this);
    }
    /**
   *
   * @param filter - return false if the ReleaseBranch should be excluded.
   * @param checkUnreleasedBranches - If false, will skip checking for unreleased branches. This checking needs all repos checked out
   * @param forceCacheBreak - true if you want to force a recalculation of all ReleaseBranches
   * @param maintenance - by default load from saved file the current maintenance instance.
   * @rejects {ExecuteError}
   */ static async getMaintenanceBranches(filter = ()=>true, checkUnreleasedBranches = true, forceCacheBreak = false, maintenance = Maintenance.load()) {
        const releaseBranches = await Maintenance.loadAllMaintenanceBranches(forceCacheBreak, maintenance);
        return releaseBranches.filter((releaseBranch)=>{
            if (!checkUnreleasedBranches && !releaseBranch.isReleased) {
                return false;
            }
            return filter(releaseBranch);
        });
    }
    /**
   * Loads every potential ReleaseBranch (published phet and phet-io brands, as well as unreleased branches), and
   * saves it to the maintenance state.
   *
   *
   * Call this with true to break the cache and force a recalculation of all ReleaseBranches
   * @param forceCacheBreak - true if you want to force a recalculation of all ReleaseBranches
   * @param maintenance - by default load from saved file the current maintenance instance.
   */ static async loadAllMaintenanceBranches(forceCacheBreak = false, maintenance = Maintenance.load()) {
        let releaseBranches = null;
        if (maintenance.allReleaseBranches.length > 0 && !forceCacheBreak) {
            assert(maintenance.allReleaseBranches[0] instanceof ReleaseBranch, 'deserialization check');
            releaseBranches = maintenance.allReleaseBranches;
        } else {
            // cache miss
            releaseBranches = await ReleaseBranch.getAllMaintenanceBranches();
            // eslint-disable-next-line require-atomic-updates
            maintenance.allReleaseBranches = releaseBranches;
            maintenance.save();
        }
        return releaseBranches;
    }
    /**
   * Used to fix BUGGY situations (multiple ModifiedBranch objects for the same actual release branch).
   * NOT NEEDED FOR NORMAL USE.
   *
   * Don't use this unless you've talked with JO about the consequences. He had horribly duplicated ModifiedBranches due
   * to addNeededPatchReleaseBranch creating many copies. This may be useful in the future if similar types of issues
   * happen. Fun fact, you can't remove needed patches if this happens. RIP the 2026 CC BY-NC release, you will be missed.
   * Never forget "deduplicated from 933 to 151".
   */ static fixDuplicatedModifiedBranches() {
        const maintenance = Maintenance.load();
        const modifiedBranchMap = {};
        const startingCount = maintenance.modifiedBranches.length;
        for (const modifiedBranch of maintenance.modifiedBranches){
            // Does not include brands. Will fail out on purpose in the combine() later if we have brand mismatches
            const key = `${modifiedBranch.releaseBranch.repo}-${modifiedBranch.releaseBranch.branch}`;
            if (modifiedBranchMap[key]) {
                modifiedBranchMap[key] = modifiedBranchMap[key].combine(modifiedBranch);
            } else {
                modifiedBranchMap[key] = modifiedBranch;
            }
        }
        maintenance.modifiedBranches.length = 0;
        maintenance.modifiedBranches.push(...Object.values(modifiedBranchMap));
        maintenance.save();
        console.log(`deduplicated from ${startingCount} to ${maintenance.modifiedBranches.length}`);
    }
    /**
   * Convert into a plain JS object meant for JSON serialization.
   */ serialize() {
        return {
            patches: this.patches.map((patch)=>patch.serialize()),
            modifiedBranches: this.modifiedBranches.map((modifiedBranch)=>modifiedBranch.serialize()),
            allReleaseBranches: this.allReleaseBranches.map((releaseBranch)=>releaseBranch.serialize())
        };
    }
    /**
   * Takes a serialized form of the Maintenance and returns an actual instance.
   */ static deserialize({ patches = [], modifiedBranches = [], allReleaseBranches = [] }) {
        // Pass in patch references to branch deserialization
        const deserializedPatches = patches.map(Patch.deserialize);
        const modifiedBranchesDeserialized = modifiedBranches.map((modifiedBranch)=>ModifiedBranch.deserialize(modifiedBranch, deserializedPatches));
        modifiedBranchesDeserialized.sort((a, b)=>{
            if (a.repo !== b.repo) {
                return a.repo < b.repo ? -1 : 1;
            }
            if (a.branch !== b.branch) {
                return a.branch < b.branch ? -1 : 1;
            }
            return 0;
        });
        const deserializedReleaseBranches = allReleaseBranches.map((releaseBranch)=>ReleaseBranch.deserialize(releaseBranch));
        return new Maintenance(deserializedPatches, modifiedBranchesDeserialized, deserializedReleaseBranches);
    }
    /**
   * Saves the state of this object into the maintenance file.
   */ save() {
        return fs.writeFileSync(MAINTENANCE_FILE, JSON.stringify(this.serialize(), null, 2));
    }
    /**
   * Loads a new Maintenance object (if possible) from the maintenance file.
   */ static load() {
        if (fs.existsSync(MAINTENANCE_FILE)) {
            return Maintenance.deserialize(JSON.parse(fs.readFileSync(MAINTENANCE_FILE, 'utf8')));
        } else {
            return new Maintenance();
        }
    }
    /**
   * Starts a command-line REPL with features loaded.
   */ static startREPL() {
        return new Promise((resolve, reject)=>{
            winston.default.transports.console.level = 'error';
            const session = repl.start({
                prompt: 'maintenance> ',
                useColors: true,
                replMode: repl.REPL_MODE_STRICT,
                ignoreUndefined: true
            });
            // Wait for promises before being ready for input
            const nodeEval = session.eval;
            // @ts-expect-error - docs say readonly, but MK isn't going to change this working code
            session['eval'] = async (cmd, context, filename, callback)=>{
                nodeEval.call(session, cmd, context, filename, (_, result)=>{
                    if (result instanceof Promise) {
                        result.then((val)=>callback(_, val)).catch((e)=>{
                            if (e.stack) {
                                console.error(`Maintenance task failed:\n${e.stack}\nFull Error details:\n${JSON.stringify(e, null, 2)}`);
                            } else if (typeof e === 'string') {
                                console.error(`Maintenance task failed: ${e}`);
                            } else {
                                console.error(`Maintenance task failed with unknown error: ${JSON.stringify(e, null, 2)}`);
                            }
                        });
                    } else {
                        callback(_, result);
                    }
                });
            };
            // Only autocomplete "public" API functions for Maintenance.
            // const nodeCompleter = session.completer;
            // session.completer = function( text, cb ) {
            //   nodeCompleter( text, ( _, [ completions, completed ] ) => {
            //     const match = completed.match( /^Maintenance\.(\w*)+/ );
            //     if ( match ) {
            //       const funcStart = match[ 1 ];
            //       cb( null, [ PUBLIC_FUNCTIONS.filter( f => f.startsWith( funcStart ) ).map( f => `Maintenance.${f}` ), completed ] );
            //     }
            //     else {
            //       cb( null, [ completions, completed ] );
            //     }
            //   } );
            // };
            // Allow controlling verbosity
            Object.defineProperty(global, 'verbose', {
                get () {
                    return winston.default.transports.console.level === 'info';
                },
                set (value) {
                    winston.default.transports.console.level = value ? 'info' : 'error';
                }
            });
            session.context.Maintenance = Maintenance;
            session.context.m = Maintenance;
            session.context.M = Maintenance;
            session.context.ReleaseBranch = ReleaseBranch;
            session.context.rb = ReleaseBranch;
            session.on('exit', resolve);
        });
    }
    /**
   * Looks up a patch by its name.
   */ findPatch(patchName) {
        // TODO: assert if two patches have the same name, https://github.com/phetsims/perennial/issues/369
        const patch = this.patches.find((p)=>p.name === patchName);
        assert(patch, `Patch not found for ${patchName}`);
        return patch;
    }
    /**
   * Looks up (or adds) a ModifiedBranch by its identifying information.
   * @param repo
   * @param branch
   * @param [errorIfMissing]
   * @param [releaseBranches] - If provided, it will speed up the process
   */ async ensureModifiedBranch(repo, branch, errorIfMissing = false, releaseBranches = null) {
        let modifiedBranch = this.modifiedBranches.find((modifiedBranch)=>modifiedBranch.repo === repo && modifiedBranch.branch === branch);
        if (!modifiedBranch) {
            if (errorIfMissing) {
                throw new Error(`Could not find a tracked modified branch for ${repo} ${branch}`);
            }
            // Use the instance version of getMaintenanceBranches to make sure that this Maintenance instance is updated with new ReleaseBranches.
            releaseBranches = releaseBranches || await this.getMaintenanceBranches((releaseBranch)=>releaseBranch.repo === repo);
            const releaseBranch = releaseBranches.find((release)=>release.repo === repo && release.branch === branch);
            assert(releaseBranch, `Could not find a release branch for repo=${repo} branch=${branch}`);
            modifiedBranch = new ModifiedBranch(releaseBranch);
            // If we are creating it, add it to our list.
            this.modifiedBranches.push(modifiedBranch);
        }
        return modifiedBranch;
    }
    /**
   * Attempts to remove a modified branch (if it doesn't need to be kept around).
   */ tryRemovingModifiedBranch(modifiedBranch) {
        if (modifiedBranch.isUnused) {
            const index = this.modifiedBranches.indexOf(modifiedBranch);
            assert(index >= 0);
            this.modifiedBranches.splice(index, 1);
        }
    }
};
export default Maintenance;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vTWFpbnRlbmFuY2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogVGhlIG1haW4gcGVyc2lzdGVudCBzdGF0ZS1iZWFyaW5nIG9iamVjdCBmb3IgbWFpbnRlbmFuY2UgcmVsZWFzZXMuIENhbiBiZSBsb2FkZWQgZnJvbSBvciBzYXZlZCB0byBhIGRlZGljYXRlZCBmaWxlLlxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuLy8gQHRzLWV4cGVjdC1lcnJvciAtIG5vIEB0eXBlcyBmb3IgdGhpcyBwcm9qZWN0XG5pbXBvcnQgYXN5bmNRIGZyb20gJ2FzeW5jLXEnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCByZXBsIGZyb20gJ3JlcGwnO1xuaW1wb3J0IHdpbnN0b24gZnJvbSAnd2luc3Rvbic7XG5pbXBvcnQgcHJvZHVjdGlvbiBmcm9tICcuLi9ncnVudC9wcm9kdWN0aW9uLmpzJztcbmltcG9ydCByYyBmcm9tICcuLi9ncnVudC9yYy5qcyc7XG5pbXBvcnQgYnVpbGQgZnJvbSAnLi9idWlsZC5qcyc7XG5pbXBvcnQgY2hlY2tvdXRNYWluIGZyb20gJy4vY2hlY2tvdXRNYWluLmpzJztcbmltcG9ydCBjaGVja291dFRhcmdldCBmcm9tICcuL2NoZWNrb3V0VGFyZ2V0LmpzJztcbmltcG9ydCBjaGlwcGVyU3VwcG9ydHNPdXRwdXRKU0dydW50VGFza3MgZnJvbSAnLi9jaGlwcGVyU3VwcG9ydHNPdXRwdXRKU0dydW50VGFza3MuanMnO1xuaW1wb3J0IENoaXBwZXJWZXJzaW9uIGZyb20gJy4vQ2hpcHBlclZlcnNpb24uanMnO1xuaW1wb3J0IGV4ZWN1dGUgZnJvbSAnLi9leGVjdXRlLmpzJztcbmltcG9ydCBnZXRBY3RpdmVSZXBvcyBmcm9tICcuL2dldEFjdGl2ZVJlcG9zLmpzJztcbmltcG9ydCBnZXRCcmFuY2hlcyBmcm9tICcuL2dldEJyYW5jaGVzLmpzJztcbmltcG9ydCBnZXRCcmFuY2hNYXAgZnJvbSAnLi9nZXRCcmFuY2hNYXAuanMnO1xuaW1wb3J0IHR5cGUgeyBCdWlsZE9wdGlvbnMgfSBmcm9tICcuL2dldEJ1aWxkQXJndW1lbnRzLmpzJztcbmltcG9ydCBnZXREZXBlbmRlbmNpZXMgZnJvbSAnLi9nZXREZXBlbmRlbmNpZXMuanMnO1xuaW1wb3J0IGdpdEFkZCBmcm9tICcuL2dpdEFkZC5qcyc7XG5pbXBvcnQgZ2l0Q2hlY2tvdXQgZnJvbSAnLi9naXRDaGVja291dC5qcyc7XG5pbXBvcnQgZ2l0Q2hlcnJ5UGljayBmcm9tICcuL2dpdENoZXJyeVBpY2suanMnO1xuaW1wb3J0IGdpdENvbW1pdCBmcm9tICcuL2dpdENvbW1pdC5qcyc7XG5pbXBvcnQgZ2l0Q3JlYXRlQnJhbmNoIGZyb20gJy4vZ2l0Q3JlYXRlQnJhbmNoLmpzJztcbmltcG9ydCBnaXRJc0NsZWFuIGZyb20gJy4vZ2l0SXNDbGVhbi5qcyc7XG5pbXBvcnQgZ2l0UHVsbCBmcm9tICcuL2dpdFB1bGwuanMnO1xuaW1wb3J0IGdpdFB1c2ggZnJvbSAnLi9naXRQdXNoLmpzJztcbmltcG9ydCBnaXRSZXZQYXJzZSBmcm9tICcuL2dpdFJldlBhcnNlLmpzJztcbmltcG9ydCBncnVudENvbW1hbmQgZnJvbSAnLi9ncnVudENvbW1hbmQuanMnO1xuaW1wb3J0IE1vZGlmaWVkQnJhbmNoLCB7IHR5cGUgRGVwbG95ZWRMaW5rT3B0aW9ucyB9IGZyb20gJy4vTW9kaWZpZWRCcmFuY2guanMnO1xuaW1wb3J0IFBhdGNoIGZyb20gJy4vUGF0Y2guanMnO1xuaW1wb3J0IHsgUEVSRU5OSUFMX1JPT1QgfSBmcm9tICcuL3BlcmVubmlhbFJlcG9VdGlscy5qcyc7XG5pbXBvcnQgUmVsZWFzZUJyYW5jaCBmcm9tICcuL1JlbGVhc2VCcmFuY2guanMnO1xuXG4vLyBjb25zdGFudHNcbmNvbnN0IE1BSU5URU5BTkNFX0ZJTEUgPSAnLm1haW50ZW5hbmNlLmpzb24nO1xuXG4vLyBjb25zdCBQVUJMSUNfRlVOQ1RJT05TID0gW1xuLy8gICAnYWRkQWxsTmVlZGVkUGF0Y2hlcycsXG4vLyAgICdhZGROZWVkZWRQYXRjaCcsXG4vLyAgICdhZGROZWVkZWRQYXRjaGVzJyxcbi8vICAgJ2FkZE5lZWRlZFBhdGNoZXNBZnRlcicsXG4vLyAgICdhZGROZWVkZWRQYXRjaGVzQmVmb3JlJyxcbi8vICAgJ2FkZE5lZWRlZFBhdGNoZXNCdWlsZEZpbHRlcicsXG4vLyAgICdhZGROZWVkZWRQYXRjaFJlbGVhc2VCcmFuY2gnLFxuLy8gICAnYWRkUGF0Y2hTSEEnLFxuLy8gICAnYXBwbHlQYXRjaGVzJyxcbi8vICAgJ2J1aWxkQWxsJyxcbi8vICAgJ2NoZWNrQnJhbmNoU3RhdHVzJyxcbi8vICAgJ2NoZWNrb3V0QnJhbmNoJyxcbi8vICAgJ2NoZWNrb3V0QW5kQnVpbGQnLFxuLy8gICAnY3JlYXRlUGF0Y2gnLFxuLy8gICAnZGVwbG95UHJvZHVjdGlvbicsXG4vLyAgICdkZXBsb3lSZWxlYXNlQ2FuZGlkYXRlcycsXG4vLyAgICdsaXN0Jyxcbi8vICAgJ2xpc3RMaW5rcycsXG4vLyAgICdyZW1vdmVOZWVkZWRQYXRjaCcsXG4vLyAgICdyZW1vdmVOZWVkZWRQYXRjaGVzJyxcbi8vICAgJ3JlbW92ZU5lZWRlZFBhdGNoZXNBZnRlcicsXG4vLyAgICdyZW1vdmVOZWVkZWRQYXRjaGVzQmVmb3JlJyxcbi8vICAgJ3JlbW92ZVBhdGNoJyxcbi8vICAgJ3JlbW92ZVBhdGNoU0hBJyxcbi8vICAgJ3Jlc2V0Jyxcbi8vICAgJ3VwZGF0ZURlcGVuZGVuY2llcydcbi8vICAgJ2dldEFsbE1haW50ZW5hbmNlQnJhbmNoZXMnXG4vLyBdO1xuXG50eXBlIE1haW50ZW5hbmNlU2VyaWFsaXplZCA9IHtcbiAgcGF0Y2hlczogUmV0dXJuVHlwZTxQYXRjaFsnc2VyaWFsaXplJ10+W107XG4gIG1vZGlmaWVkQnJhbmNoZXM6IFJldHVyblR5cGU8TW9kaWZpZWRCcmFuY2hbJ3NlcmlhbGl6ZSddPltdO1xuICBhbGxSZWxlYXNlQnJhbmNoZXM6IFJldHVyblR5cGU8UmVsZWFzZUJyYW5jaFsnc2VyaWFsaXplJ10+W107XG59O1xuXG50eXBlIFVwZGF0ZUNoZWNrb3V0c09wdGlvbnMgPSB7XG4gIGNvbmN1cnJlbnQ6IG51bWJlcjtcbiAgYnVpbGQ6IGJvb2xlYW47XG4gIHRyYW5zcGlsZTogYm9vbGVhbjtcbiAgYnVpbGRPcHRpb25zOiBQYXJ0aWFsPEJ1aWxkT3B0aW9ucz47XG59O1xuXG50eXBlIEZpbHRlclN5bmNSQiA9ICggcmVsZWFzZUJyYW5jaDogUmVsZWFzZUJyYW5jaCApID0+IGJvb2xlYW47XG50eXBlIEZpbHRlclN5bmNNQiA9ICggcmVsZWFzZUJyYW5jaDogTW9kaWZpZWRCcmFuY2ggKSA9PiBib29sZWFuO1xudHlwZSBGaWx0ZXJSQiA9ICggcmVsZWFzZUJyYW5jaDogUmVsZWFzZUJyYW5jaCApID0+IFByb21pc2U8Ym9vbGVhbj47XG50eXBlIEZpbHRlck1CID0gKCByZWxlYXNlQnJhbmNoOiBNb2RpZmllZEJyYW5jaCApID0+IFByb21pc2U8Ym9vbGVhbj47XG5cbmNsYXNzIE1haW50ZW5hbmNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyByZWFkb25seSBwYXRjaGVzOiBQYXRjaFtdID0gW10sXG4gICAgcHVibGljIHJlYWRvbmx5IG1vZGlmaWVkQnJhbmNoZXM6IE1vZGlmaWVkQnJhbmNoW10gPSBbXSxcbiAgICBwdWJsaWMgYWxsUmVsZWFzZUJyYW5jaGVzOiBSZWxlYXNlQnJhbmNoW10gPSBbXSApIHt9XG5cbiAgLyoqXG4gICAqIFJlc2V0cyBBTEwgdGhlIG1haW50ZW5hbmNlIHN0YXRlIHRvIGEgZGVmYXVsdCBcImJsYW5rXCIgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSBrZWVwQ2FjaGVkUmVsZWFzZUJyYW5jaGVzIHtib29sZWFufSAtIGFsbFJlbGVhc2VCcmFuY2hlcyB0YWtlIGEgd2hpbGUgdG8gcG9wdWxhdGUsIGFuZCBoYXZlIGxpdHRsZSB0byBkb1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoIHRoZSBjdXJyZW50IE1SLCBzbyBvcHRpb25hbGx5IGtlZXAgdGhlbSBpbiBzdG9yYWdlLlxuICAgKlxuICAgKiBDQVVUSU9OOiBUaGlzIHdpbGwgcmVtb3ZlIGFueSBpbmZvcm1hdGlvbiBhYm91dCBhbnkgb25nb2luZy9jb21wbGV0ZSBtYWludGVuYW5jZSByZWxlYXNlIGZyb20geW91clxuICAgKiAubWFpbnRlbmFuY2UuanNvbi4gR2VuZXJhbGx5IHRoaXMgc2hvdWxkIGJlIGRvbmUgYmVmb3JlIGFueSBuZXcgbWFpbnRlbmFuY2UgcmVsZWFzZS5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVzZXQoIGtlZXBDYWNoZWRSZWxlYXNlQnJhbmNoZXMgPSBmYWxzZSApOiB2b2lkIHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICdQaEVULWlPIHNpbXVsYXRpb25zIHJlcXVpcmUgbWFpbnRhaW5pbmcgb2xkZXIgcmVsZWFzZSBicmFuY2hlcy4gJyArXG4gICAgICAnSWYgeW91IGFyZSBwYXRjaGluZyBzcGVjaWZpYyBzaW11bGF0aW9ucywgdXNlIGBncnVudCByZWxlYXNlLWJyYW5jaC1saXN0YCAnICtcbiAgICAgICdpbiBwZXJlbm5pYWwgdG8gZ2VuZXJhdGUgdGhlIGxpc3Qgb2YgYnJhbmNoZXMgdGhhdCByZXF1aXJlIHBhdGNoaW5nLidcbiAgICApO1xuXG4gICAgY29uc3QgYWxsUmVsZWFzZUJyYW5jaGVzID0gW107XG4gICAgaWYgKCBrZWVwQ2FjaGVkUmVsZWFzZUJyYW5jaGVzICkge1xuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XG4gICAgICBhbGxSZWxlYXNlQnJhbmNoZXMucHVzaCggLi4ubWFpbnRlbmFuY2UuYWxsUmVsZWFzZUJyYW5jaGVzICk7XG4gICAgfVxuICAgIG5ldyBNYWludGVuYW5jZSggW10sIFtdLCBhbGxSZWxlYXNlQnJhbmNoZXMgKS5zYXZlKCk7XG4gIH1cblxuICAvKipcbiAgICogUnVucyBhIG51bWJlciBvZiBjaGVja3MgdGhyb3VnaCBldmVyeSByZWxlYXNlIGJyYW5jaC5cbiAgICpcbiAgICpcbiAgICogQHBhcmFtIGZpbHRlciAtIE9wdGlvbmFsIGZpbHRlciwgcmVsZWFzZSBicmFuY2hlcyB3aWxsIGJlIHNraXBwZWQgaWYgdGhpcyByZXNvbHZlcyB0byBmYWxzZVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyBjaGVja0JyYW5jaFN0YXR1cyggZmlsdGVyPzogRmlsdGVyU3luY1JCICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGZvciAoIGNvbnN0IHJlcG8gb2YgZ2V0QWN0aXZlUmVwb3MoKSApIHtcbiAgICAgIGlmICggcmVwbyAhPT0gJ3BlcmVubmlhbCcgJiYgISggYXdhaXQgZ2l0SXNDbGVhbiggcmVwbyApICkgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCBgVW5jbGVhbiByZXBvc2l0b3J5OiAke3JlcG99LCBwbGVhc2UgcmVzb2x2ZSB0aGlzIGFuZCB0aGVuIHJ1biBjaGVja0JyYW5jaFN0YXR1cyBhZ2FpbmAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHJlbGVhc2VCcmFuY2hlcyA9IGF3YWl0IE1haW50ZW5hbmNlLmdldE1haW50ZW5hbmNlQnJhbmNoZXMoIGZpbHRlciApO1xuXG4gICAgLy8gU2V0IHVwIGEgY2FjaGUgb2YgYnJhbmNoTWFwcyBzbyB0aGF0IHdlIGRvbid0IG1ha2UgbXVsdGlwbGUgcmVxdWVzdHNcbiAgICBjb25zdCBicmFuY2hNYXBzOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+PiA9IHt9O1xuICAgIGNvbnN0IGdldEJyYW5jaE1hcEFzeW5jQ2FsbGJhY2sgPSBhc3luYyAoIHJlcG86IHN0cmluZyApID0+IHtcbiAgICAgIGlmICggIWJyYW5jaE1hcHNbIHJlcG8gXSApIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlcXVpcmUtYXRvbWljLXVwZGF0ZXNcbiAgICAgICAgYnJhbmNoTWFwc1sgcmVwbyBdID0gYXdhaXQgZ2V0QnJhbmNoTWFwKCByZXBvICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYnJhbmNoTWFwc1sgcmVwbyBdO1xuICAgIH07XG5cbiAgICBmb3IgKCBjb25zdCByZWxlYXNlQnJhbmNoIG9mIHJlbGVhc2VCcmFuY2hlcyApIHtcbiAgICAgIGlmICggIWZpbHRlciB8fCBmaWx0ZXIoIHJlbGVhc2VCcmFuY2ggKSApIHtcbiAgICAgICAgY29uc29sZS5sb2coIGAke3JlbGVhc2VCcmFuY2gucmVwb30gJHtyZWxlYXNlQnJhbmNoLmJyYW5jaH1gICk7XG4gICAgICAgIGZvciAoIGNvbnN0IGxpbmUgb2YgYXdhaXQgcmVsZWFzZUJyYW5jaC5nZXRTdGF0dXMoIGdldEJyYW5jaE1hcEFzeW5jQ2FsbGJhY2sgKSApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgJHtsaW5lfWAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCBgJHtyZWxlYXNlQnJhbmNoLnJlcG99ICR7cmVsZWFzZUJyYW5jaC5icmFuY2h9IChza2lwcGluZyBkdWUgdG8gZmlsdGVyKWAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS5sb2coICdDaGVja3MgY29tcGxldGVkJyApO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkcyBhbGwgcmVsZWFzZSBicmFuY2hlcyAoc28gdGhhdCB0aGUgc3RhdGUgb2YgdGhpbmdzIGNhbiBiZSBjaGVja2VkKS4gUHV0cyBpbiBpbiBwZXJlbm5pYWwvYnVpbGQuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGJ1aWxkQWxsKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlbGVhc2VCcmFuY2hlcyA9IGF3YWl0IE1haW50ZW5hbmNlLmdldE1haW50ZW5hbmNlQnJhbmNoZXMoKTtcblxuICAgIGNvbnN0IGZhaWxlZCA9IFtdO1xuXG4gICAgZm9yICggY29uc3QgcmVsZWFzZUJyYW5jaCBvZiByZWxlYXNlQnJhbmNoZXMgKSB7XG4gICAgICBjb25zb2xlLmxvZyggYGJ1aWxkaW5nICR7cmVsZWFzZUJyYW5jaC5yZXBvfSAke3JlbGVhc2VCcmFuY2guYnJhbmNofWAgKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGNoZWNrb3V0VGFyZ2V0KCByZWxlYXNlQnJhbmNoLnJlcG8sIHJlbGVhc2VCcmFuY2guYnJhbmNoLCB0cnVlICk7IC8vIGluY2x1ZGUgbnBtIHVwZGF0ZVxuICAgICAgICBhd2FpdCBidWlsZCggcmVsZWFzZUJyYW5jaC5yZXBvLCB7XG4gICAgICAgICAgYnJhbmRzOiByZWxlYXNlQnJhbmNoLmJyYW5kc1xuICAgICAgICB9ICk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggJ1VOSU1QTEVNRU5URUQsIGNvcHkgb3ZlcicgKTtcbiAgICAgIH1cbiAgICAgIGNhdGNoKCBlICkge1xuICAgICAgICBmYWlsZWQucHVzaCggYCR7cmVsZWFzZUJyYW5jaC5yZXBvfSAke3JlbGVhc2VCcmFuY2guYnJhbmRzfWAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIGZhaWxlZC5sZW5ndGggKSB7XG4gICAgICBjb25zb2xlLmxvZyggYEZhaWxlZCBidWlsZHM6XFxuJHtmYWlsZWQuam9pbiggJ1xcbicgKX1gICk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coICdCdWlsZHMgY29tcGxldGUnICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERpc3BsYXlzIGEgbGlzdGluZyBvZiB0aGUgY3VycmVudCBtYWludGVuYW5jZSBzdGF0dXMuXG4gICAqXG4gICAqIElmIHRpbWVzdGFtcDp0cnVlIGlzIHByb3ZpZGVkLCBpdCB3aWxsIGluY2x1ZGUgdGltZXN0YW1wcyBmb3Igd2hlbiB0aGUgYnJhbmNoZXMgZGl2ZXJnZWQgZnJvbSBtYWluLCBhbmQgc29ydCBieSB0aG9zZSB0aW1lc3RhbXBzLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgcHJpb3JpdGl6aW5nIHdoaWNoIGJyYW5jaGVzIHRvIHBhdGNoIGZpcnN0LlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyBsaXN0KCBvcHRpb25zPzogeyB0aW1lc3RhbXA/OiBib29sZWFuIH0gKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XG5cbiAgICAvLyBBdCB0aGUgdG9wIHNvIHRoYXQgdGhlIGltcG9ydGFudCBpdGVtcyBhcmUgcmlnaHQgYWJvdmUgeW91ciBjdXJzb3IgYWZ0ZXIgY2FsbGluZyB0aGUgZnVuY3Rpb25cbiAgICBpZiAoIG1haW50ZW5hbmNlLmFsbFJlbGVhc2VCcmFuY2hlcy5sZW5ndGggPiAwICkge1xuICAgICAgY29uc29sZS5sb2coIGBUb3RhbCByZWNvZ25pemVkIFJlbGVhc2VCcmFuY2hlczogJHttYWludGVuYW5jZS5hbGxSZWxlYXNlQnJhbmNoZXMubGVuZ3RofWAgKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyggJ1xcblJlbGVhc2UgQnJhbmNoZXMgaW4gTVI6JywgbWFpbnRlbmFuY2UucGF0Y2hlcy5sZW5ndGggPT09IDAgPyAnTm9uZScgOiAnJyApO1xuICAgIGZvciAoIGNvbnN0IG1vZGlmaWVkQnJhbmNoIG9mIG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMgKSB7XG4gICAgICBjb25zdCBjb3VudCA9IG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMuaW5kZXhPZiggbW9kaWZpZWRCcmFuY2ggKSArIDE7XG4gICAgICBjb25zb2xlLmxvZyggYCR7Y291bnR9LiAke21vZGlmaWVkQnJhbmNoLnJlcG99ICR7bW9kaWZpZWRCcmFuY2guYnJhbmNofSAke21vZGlmaWVkQnJhbmNoLmJyYW5kcy5qb2luKCAnLCcgKX0ke21vZGlmaWVkQnJhbmNoLnJlbGVhc2VCcmFuY2guaXNSZWxlYXNlZCA/ICcnIDogJyAodW5yZWxlYXNlZCknfWAgKTtcbiAgICAgIGlmICggbW9kaWZpZWRCcmFuY2guZGVwbG95ZWRWZXJzaW9uICkge1xuICAgICAgICBjb25zb2xlLmxvZyggYCAgICBkZXBsb3llZDogJHttb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24udG9TdHJpbmcoKX1gICk7XG4gICAgICB9XG4gICAgICBpZiAoIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMubGVuZ3RoICkge1xuICAgICAgICBjb25zb2xlLmxvZyggYCAgICBuZWVkczogJHttb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLm1hcCggcGF0Y2ggPT4gcGF0Y2gubmFtZSApLmpvaW4oICcsJyApfWAgKTtcbiAgICAgIH1cbiAgICAgIGlmICggbW9kaWZpZWRCcmFuY2gucHVzaGVkTWVzc2FnZXMubGVuZ3RoICkge1xuICAgICAgICBjb25zb2xlLmxvZyggYCAgICBwdXNoZWRNZXNzYWdlczogXFxuICAgICAgJHttb2RpZmllZEJyYW5jaC5wdXNoZWRNZXNzYWdlcy5qb2luKCAnXFxuICAgICAgJyApfWAgKTtcbiAgICAgIH1cbiAgICAgIGlmICggbW9kaWZpZWRCcmFuY2gucGVuZGluZ01lc3NhZ2VzLmxlbmd0aCApIHtcbiAgICAgICAgY29uc29sZS5sb2coIGAgICAgcGVuZGluZ01lc3NhZ2VzOiBcXG4gICAgICAke21vZGlmaWVkQnJhbmNoLnBlbmRpbmdNZXNzYWdlcy5qb2luKCAnXFxuICAgICAgJyApfWAgKTtcbiAgICAgIH1cbiAgICAgIGlmICggT2JqZWN0LmtleXMoIG1vZGlmaWVkQnJhbmNoLmNoYW5nZWREZXBlbmRlbmNpZXMgKS5sZW5ndGggPiAwICkge1xuICAgICAgICBjb25zb2xlLmxvZyggJyAgICBkZXBzOicgKTtcbiAgICAgICAgZm9yICggY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKCBtb2RpZmllZEJyYW5jaC5jaGFuZ2VkRGVwZW5kZW5jaWVzICkgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coIGAgICAgICAke2tleX06ICR7bW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llc1sga2V5IF19YCApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coICdcXG5NYWludGVuYW5jZSBQYXRjaGVzIGluIE1SOicsIG1haW50ZW5hbmNlLnBhdGNoZXMubGVuZ3RoID09PSAwID8gJ05vbmUnIDogJycgKTtcblxuICAgIGZvciAoIGNvbnN0IHBhdGNoIG9mIG1haW50ZW5hbmNlLnBhdGNoZXMgKSB7XG4gICAgICBjb25zdCBjb3VudCA9IG1haW50ZW5hbmNlLnBhdGNoZXMuaW5kZXhPZiggcGF0Y2ggKSArIDE7XG4gICAgICBjb25zdCBpbmRleEFuZFNwYWNpbmcgPSBgJHtjb3VudH0uIGAgKyAoIGNvdW50ID4gOSA/ICcnIDogJyAnICk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCBgJHtpbmRleEFuZFNwYWNpbmd9WyR7cGF0Y2gubmFtZX1dJHtwYXRjaC5uYW1lICE9PSBwYXRjaC5yZXBvID8gYCAoJHtwYXRjaC5yZXBvfSlgIDogJyd9ICR7cGF0Y2gubWVzc2FnZX1gICk7XG4gICAgICBmb3IgKCBjb25zdCBzaGEgb2YgcGF0Y2guc2hhcyApIHtcbiAgICAgICAgY29uc29sZS5sb2coIGAgICAgICAke3NoYX1gICk7XG4gICAgICB9XG5cbiAgICAgIGxldCBtb2RpZmllZEJyYW5jaGVzID0gbWFpbnRlbmFuY2UubW9kaWZpZWRCcmFuY2hlcztcbiAgICAgIGlmICggb3B0aW9ucz8udGltZXN0YW1wICkge1xuICAgICAgICAvLyBEbyBhIHBhcmFsbGVsIHVwZGF0ZSBvZiBjYWNoZWQgdGltZXN0YW1wcyBvbiB0aGUgbW9kaWZpZWQgYnJhbmNoZXMsIHNvIHRoYXQgd2UgY2FuIHNvcnQgYnkgdGhlbS5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoIG1vZGlmaWVkQnJhbmNoZXMubWFwKCBtb2RpZmllZEJyYW5jaCA9PiB7XG4gICAgICAgICAgcmV0dXJuICggYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2gucmVsZWFzZUJyYW5jaC5jYWNoZWRUaW1lc3RhbXBTdHJpbmcgKSB7XG4gICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZXF1aXJlLWF0b21pYy11cGRhdGVzXG4gICAgICAgICAgICAgIG1vZGlmaWVkQnJhbmNoLnJlbGVhc2VCcmFuY2guY2FjaGVkVGltZXN0YW1wU3RyaW5nID0gYXdhaXQgbW9kaWZpZWRCcmFuY2gucmVsZWFzZUJyYW5jaC5nZXREaXZlcmdpbmdUaW1lc3RhbXBTdHJpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9ICkoKTtcbiAgICAgICAgfSApICk7XG5cbiAgICAgICAgbW9kaWZpZWRCcmFuY2hlcyA9IF8uc29ydEJ5KCBtb2RpZmllZEJyYW5jaGVzLCBtb2RpZmllZEJyYW5jaCA9PiB7XG4gICAgICAgICAgcmV0dXJuIG1vZGlmaWVkQnJhbmNoLnJlbGVhc2VCcmFuY2guY2FjaGVkVGltZXN0YW1wU3RyaW5nO1xuICAgICAgICB9ICk7XG4gICAgICB9XG5cbiAgICAgIGZvciAoIGNvbnN0IG1vZGlmaWVkQnJhbmNoIG9mIG1vZGlmaWVkQnJhbmNoZXMgKSB7XG4gICAgICAgIGlmICggbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5pbmNsdWRlcyggcGF0Y2ggKSApIHtcbiAgICAgICAgICBjb25zdCB0aW1lc3RhbXBQcmVmaXggPSBvcHRpb25zPy50aW1lc3RhbXAgPyBgJHttb2RpZmllZEJyYW5jaC5yZWxlYXNlQnJhbmNoLmNhY2hlZFRpbWVzdGFtcFN0cmluZ30gYCA6ICcnO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCBgICAgICAgICAke3RpbWVzdGFtcFByZWZpeH0ke21vZGlmaWVkQnJhbmNoLnJlcG99ICR7bW9kaWZpZWRCcmFuY2guYnJhbmNofSAke21vZGlmaWVkQnJhbmNoLmJyYW5kcy5qb2luKCAnLCcgKX1gICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyggJ1xcbihsaXN0IGNvbXBsZXRlKScgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBsaXN0KCkgd2l0aCB0aW1lc3RhbXA6IHRydWUuIFNvcnRzIG5lZWRlZC1wYXRjaCBicmFuY2hlcyBieSBicmFuY2ggZGF0ZVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyB0aW1lc3RhbXBMaXN0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubGlzdCggeyB0aW1lc3RhbXA6IHRydWUgfSApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNob3dzIGFueSByZXF1aXJlZCB0ZXN0aW5nIGxpbmtzIGZvciB0aGUgc2ltdWxhdGlvbnMuXG4gICAqIEBwYXJhbSBmaWx0ZXIgLSBDb250cm9sIHdoaWNoIGJyYW5jaGVzIGFyZSBzaG93blxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIG9wdGlvbnMgZm9yIGluY2x1ZGluZyBzcGVjaWZpYyBsaW5rc1xuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyBsaXN0TGlua3MoIGZpbHRlcjogRmlsdGVyU3luY01CID0gKCkgPT4gdHJ1ZSwgb3B0aW9ucz86IERlcGxveWVkTGlua09wdGlvbnMgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XG5cbiAgICBjb25zdCBkZXBsb3llZEJyYW5jaGVzID0gbWFpbnRlbmFuY2UubW9kaWZpZWRCcmFuY2hlcy5maWx0ZXIoIG1vZGlmaWVkQnJhbmNoID0+ICEhbW9kaWZpZWRCcmFuY2guZGVwbG95ZWRWZXJzaW9uICYmIGZpbHRlciggbW9kaWZpZWRCcmFuY2ggKSApO1xuICAgIGNvbnN0IHByb2R1Y3Rpb25CcmFuY2hlcyA9IGRlcGxveWVkQnJhbmNoZXMuZmlsdGVyKCBtb2RpZmllZEJyYW5jaCA9PiBtb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24/LnRlc3RUeXBlID09PSBudWxsICk7XG4gICAgY29uc3QgcmVsZWFzZUNhbmRpZGF0ZUJyYW5jaGVzID0gZGVwbG95ZWRCcmFuY2hlcy5maWx0ZXIoIG1vZGlmaWVkQnJhbmNoID0+IG1vZGlmaWVkQnJhbmNoLmRlcGxveWVkVmVyc2lvbj8udGVzdFR5cGUgPT09ICdyYycgKTtcblxuICAgIGlmICggcHJvZHVjdGlvbkJyYW5jaGVzLmxlbmd0aCApIHtcbiAgICAgIGNvbnNvbGUubG9nKCAnXFxuUHJvZHVjdGlvbiBsaW5rc1xcbicgKTtcblxuICAgICAgZm9yICggY29uc3QgbW9kaWZpZWRCcmFuY2ggb2YgcHJvZHVjdGlvbkJyYW5jaGVzICkge1xuICAgICAgICBjb25zdCBsaW5rcyA9IGF3YWl0IG1vZGlmaWVkQnJhbmNoLmdldERlcGxveWVkTGlua0xpbmVzKCBvcHRpb25zICk7XG4gICAgICAgIGZvciAoIGNvbnN0IGxpbmsgb2YgbGlua3MgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coIGxpbmsgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICggcmVsZWFzZUNhbmRpZGF0ZUJyYW5jaGVzLmxlbmd0aCApIHtcbiAgICAgIGNvbnNvbGUubG9nKCAnXFxuUmVsZWFzZSBDYW5kaWRhdGUgbGlua3NcXG4nICk7XG5cbiAgICAgIGZvciAoIGNvbnN0IG1vZGlmaWVkQnJhbmNoIG9mIHJlbGVhc2VDYW5kaWRhdGVCcmFuY2hlcyApIHtcbiAgICAgICAgY29uc3QgbGlua3MgPSBhd2FpdCBtb2RpZmllZEJyYW5jaC5nZXREZXBsb3llZExpbmtMaW5lcyggb3B0aW9ucyApO1xuICAgICAgICBmb3IgKCBjb25zdCBsaW5rIG9mIGxpbmtzICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCBsaW5rICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpc3N1ZSB0byBub3RlIHBhdGNoZXMgb24gYWxsIHVucmVsZWFzZWQgYnJhbmNoZXMgdGhhdCBpbmNsdWRlIGEgcHVzaGVkIG1lc3NhZ2UuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGNyZWF0ZVVucmVsZWFzZWRJc3N1ZXMoIGFkZGl0aW9uYWxOb3RlcyA9ICcnICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xuXG4gICAgZm9yICggY29uc3QgbW9kaWZpZWRCcmFuY2ggb2YgbWFpbnRlbmFuY2UubW9kaWZpZWRCcmFuY2hlcyApIHtcbiAgICAgIGlmICggIW1vZGlmaWVkQnJhbmNoLnJlbGVhc2VCcmFuY2guaXNSZWxlYXNlZCAmJiBtb2RpZmllZEJyYW5jaC5wdXNoZWRNZXNzYWdlcy5sZW5ndGggPiAwICkge1xuICAgICAgICBjb25zb2xlLmxvZyggYENyZWF0aW5nIGlzc3VlIGZvciAke21vZGlmaWVkQnJhbmNoLnJlbGVhc2VCcmFuY2gudG9TdHJpbmcoKX1gICk7XG4gICAgICAgIGF3YWl0IG1vZGlmaWVkQnJhbmNoLmNyZWF0ZVVucmVsZWFzZWRJc3N1ZSggYWRkaXRpb25hbE5vdGVzICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coICdGaW5pc2hlZCBjcmVhdGluZyB1bnJlbGVhc2VkIGlzc3VlcycgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcGF0Y2hcbiAgICogQHBhcmFtIFtwYXRjaE5hbWVdIC0gSWYgbm8gbmFtZSBpcyBwcm92aWRlZCwgdGhlIHJlcG8gc3RyaW5nIHdpbGwgYmUgdXNlZC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgY3JlYXRlUGF0Y2goIHJlcG86IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCBwYXRjaE5hbWU/OiBzdHJpbmcgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XG5cbiAgICBwYXRjaE5hbWUgPSBwYXRjaE5hbWUgfHwgcmVwbztcblxuICAgIGZvciAoIGNvbnN0IHBhdGNoIG9mIG1haW50ZW5hbmNlLnBhdGNoZXMgKSB7XG4gICAgICBpZiAoIHBhdGNoLm5hbWUgPT09IHBhdGNoTmFtZSApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnTXVsdGlwbGUgcGF0Y2hlcyB3aXRoIHRoZSBzYW1lIG5hbWUgYXJlIG5vdCBjb25jdXJyZW50bHkgc3VwcG9ydGVkJyApO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1haW50ZW5hbmNlLnBhdGNoZXMucHVzaCggbmV3IFBhdGNoKCByZXBvLCBwYXRjaE5hbWUsIG1lc3NhZ2UgKSApO1xuXG4gICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuXG4gICAgY29uc29sZS5sb2coIGBDcmVhdGVkIHBhdGNoIGZvciAke3JlcG99IHdpdGggbWVzc2FnZTogJHttZXNzYWdlfWAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgcGF0Y2hcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgcmVtb3ZlUGF0Y2goIHBhdGNoTmFtZTogc3RyaW5nICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xuXG4gICAgY29uc3QgcGF0Y2ggPSBtYWludGVuYW5jZS5maW5kUGF0Y2goIHBhdGNoTmFtZSApO1xuXG4gICAgZm9yICggY29uc3QgYnJhbmNoIG9mIG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMgKSB7XG4gICAgICBpZiAoIGJyYW5jaC5uZWVkZWRQYXRjaGVzLmluY2x1ZGVzKCBwYXRjaCApICkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdQYXRjaCBpcyBtYXJrZWQgYXMgbmVlZGVkIGJ5IGF0IGxlYXN0IG9uZSBicmFuY2gnICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbWFpbnRlbmFuY2UucGF0Y2hlcy5zcGxpY2UoIG1haW50ZW5hbmNlLnBhdGNoZXMuaW5kZXhPZiggcGF0Y2ggKSwgMSApO1xuXG4gICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuXG4gICAgY29uc29sZS5sb2coIGBSZW1vdmVkIHBhdGNoIGZvciAke3BhdGNoTmFtZX1gICk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIHBhcnRpY3VsYXIgU0hBICh0byBjaGVycnktcGljaykgdG8gYSBwYXRjaC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgYWRkUGF0Y2hTSEEoIHBhdGNoTmFtZTogc3RyaW5nLCBzaGE/OiBzdHJpbmcgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XG5cbiAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XG5cbiAgICBpZiAoICFzaGEgKSB7XG4gICAgICBzaGEgPSBhd2FpdCBnaXRSZXZQYXJzZSggcGF0Y2gucmVwbywgJ0hFQUQnICk7XG4gICAgICBjb25zb2xlLmxvZyggYFNIQSBub3QgcHJvdmlkZWQsIGRldGVjdGluZyBTSEE6ICR7c2hhfWAgKTtcbiAgICB9XG5cbiAgICBwYXRjaC5zaGFzLnB1c2goIHNoYSApO1xuXG4gICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuXG4gICAgY29uc29sZS5sb2coIGBBZGRlZCBTSEEgJHtzaGF9IHRvIHBhdGNoICR7cGF0Y2hOYW1lfWAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgcGFydGljdWxhciBTSEEgKHRvIGNoZXJyeS1waWNrKSBmcm9tIGEgcGF0Y2guXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIHJlbW92ZVBhdGNoU0hBKCBwYXRjaE5hbWU6IHN0cmluZywgc2hhOiBzdHJpbmcgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XG5cbiAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XG5cbiAgICBjb25zdCBpbmRleCA9IHBhdGNoLnNoYXMuaW5kZXhPZiggc2hhICk7XG4gICAgYXNzZXJ0KCBpbmRleCA+PSAwLCAnU0hBIG5vdCBmb3VuZCcgKTtcblxuICAgIHBhdGNoLnNoYXMuc3BsaWNlKCBpbmRleCwgMSApO1xuXG4gICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuXG4gICAgY29uc29sZS5sb2coIGBSZW1vdmVkIFNIQSAke3NoYX0gZnJvbSBwYXRjaCAke3BhdGNoTmFtZX1gICk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgcGF0Y2ggU0hBcyBmb3IgYSBwYXJ0aWN1bGFyIHBhdGNoLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyByZW1vdmVBbGxQYXRjaFNIQXMoIHBhdGNoTmFtZTogc3RyaW5nICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xuXG4gICAgY29uc3QgcGF0Y2ggPSBtYWludGVuYW5jZS5maW5kUGF0Y2goIHBhdGNoTmFtZSApO1xuXG4gICAgZm9yICggY29uc3Qgc2hhIG9mIHBhdGNoLnNoYXMgKSB7XG4gICAgICBjb25zb2xlLmxvZyggYFJlbW92aW5nIFNIQSAke3NoYX0gZnJvbSBwYXRjaCAke3BhdGNoTmFtZX1gICk7XG4gICAgfVxuXG4gICAgcGF0Y2guc2hhcy5sZW5ndGggPSAwO1xuXG4gICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBuZWVkZWQgcGF0Y2ggdG8gYSBnaXZlbiBtb2RpZmllZCBicmFuY2guXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGFkZE5lZWRlZFBhdGNoKCByZXBvOiBzdHJpbmcsIGJyYW5jaDogc3RyaW5nLCBwYXRjaE5hbWU6IHN0cmluZyApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcbiAgICBhc3NlcnQoIHJlcG8gIT09IHBhdGNoTmFtZSwgJ0Nhbm5vdCBwYXRjaCBhIHJlbGVhc2UgYnJhbmNoIHJlcG8sIHlldC4nICk7IC8vIFRPRE86IHJlbW92ZSBpbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy8zMTJcblxuICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcblxuICAgIGNvbnN0IG1vZGlmaWVkQnJhbmNoID0gYXdhaXQgbWFpbnRlbmFuY2UuZW5zdXJlTW9kaWZpZWRCcmFuY2goIHJlcG8sIGJyYW5jaCApO1xuICAgIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMucHVzaCggcGF0Y2ggKTtcblxuICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcblxuICAgIGNvbnNvbGUubG9nKCBgQWRkZWQgcGF0Y2ggJHtwYXRjaE5hbWV9IGFzIG5lZWRlZCBmb3IgJHtyZXBvfSAke2JyYW5jaH1gICk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG5lZWRlZCBwYXRjaCB0byBhIGdpdmVuIHJlbGVhc2UgYnJhbmNoXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGFkZE5lZWRlZFBhdGNoUmVsZWFzZUJyYW5jaCggcmVsZWFzZUJyYW5jaDogUmVsZWFzZUJyYW5jaCwgcGF0Y2hOYW1lOiBzdHJpbmcgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XG5cbiAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XG5cbiAgICAvLyBVc2UgYW4gZW5zdXJlZCBtb2RpZmllZCBicmFuY2ggaW5zdGVhZCBvZiBjcmVhdGluZyBvbmUgZGlyZWN0bHkuXG4gICAgY29uc3QgbW9kaWZpZWRCcmFuY2ggPSBhd2FpdCBtYWludGVuYW5jZS5lbnN1cmVNb2RpZmllZEJyYW5jaCggcmVsZWFzZUJyYW5jaC5yZXBvLCByZWxlYXNlQnJhbmNoLmJyYW5jaCApO1xuICAgIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMucHVzaCggcGF0Y2ggKTtcblxuICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcblxuICAgIGNvbnNvbGUubG9nKCBgQWRkZWQgcGF0Y2ggJHtwYXRjaE5hbWV9IGFzIG5lZWRlZCBmb3IgJHtyZWxlYXNlQnJhbmNoLnJlcG99ICR7cmVsZWFzZUJyYW5jaC5icmFuY2h9YCApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBuZWVkZWQgcGF0Y2ggdG8gd2hhdGV2ZXIgc3Vic2V0IG9mIHJlbGVhc2UgYnJhbmNoZXMgbWF0Y2ggdGhlIGZpbHRlci5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgYWRkTmVlZGVkUGF0Y2hlcyggcGF0Y2hOYW1lOiBzdHJpbmcsIGZpbHRlcjogRmlsdGVyUkIgKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAvLyBnZXRNYWludGVuYW5jZUJyYW5jaGVzIG5lZWRzIHRvIGNhY2hlIGl0cyBicmFuY2hlcyBhbmQgbWFpbnRlbmFuY2Uuc2F2ZSgpIHRoZW0sIHNvIGRvIGl0IGJlZm9yZSBsb2FkaW5nXG4gICAgLy8gTWFpbnRlbmFuY2UgZm9yIHRoaXMgZnVuY3Rpb24uXG4gICAgY29uc3QgcmVsZWFzZUJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcygpO1xuICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xuXG4gICAgY29uc3QgcGF0Y2ggPSBtYWludGVuYW5jZS5maW5kUGF0Y2goIHBhdGNoTmFtZSApO1xuXG4gICAgbGV0IGNvdW50ID0gMDtcblxuICAgIGZvciAoIGNvbnN0IHJlbGVhc2VCcmFuY2ggb2YgcmVsZWFzZUJyYW5jaGVzICkge1xuICAgICAgY29uc3QgbmVlZHNQYXRjaCA9IGF3YWl0IGZpbHRlciggcmVsZWFzZUJyYW5jaCApO1xuXG4gICAgICBpZiAoICFuZWVkc1BhdGNoICkge1xuICAgICAgICBjb25zb2xlLmxvZyggYCAgc2tpcHBpbmcgJHtyZWxlYXNlQnJhbmNoLnJlcG99ICR7cmVsZWFzZUJyYW5jaC5icmFuY2h9YCApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbW9kaWZpZWRCcmFuY2ggPSBhd2FpdCBtYWludGVuYW5jZS5lbnN1cmVNb2RpZmllZEJyYW5jaCggcmVsZWFzZUJyYW5jaC5yZXBvLCByZWxlYXNlQnJhbmNoLmJyYW5jaCwgZmFsc2UsIHJlbGVhc2VCcmFuY2hlcyApO1xuICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5pbmNsdWRlcyggcGF0Y2ggKSApIHtcbiAgICAgICAgbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5wdXNoKCBwYXRjaCApO1xuICAgICAgICBjb25zb2xlLmxvZyggYEFkZGVkIG5lZWRlZCBwYXRjaCAke3BhdGNoTmFtZX0gdG8gJHtyZWxlYXNlQnJhbmNoLnJlcG99ICR7cmVsZWFzZUJyYW5jaC5icmFuY2h9YCApO1xuICAgICAgICBjb3VudCsrO1xuICAgICAgICBtYWludGVuYW5jZS5zYXZlKCk7IC8vIHNhdmUgaGVyZSBpbiBjYXNlIGEgZnV0dXJlIGZhaWx1cmUgd291bGQgXCJyZXZlcnRcIiB0aGluZ3NcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyggYFBhdGNoICR7cGF0Y2hOYW1lfSBhbHJlYWR5IGluY2x1ZGVkIGluICR7cmVsZWFzZUJyYW5jaC5yZXBvfSAke3JlbGVhc2VCcmFuY2guYnJhbmNofWAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyggYEFkZGVkICR7Y291bnR9IHJlbGVhc2VCcmFuY2hlcyB0byBwYXRjaDogJHtwYXRjaE5hbWV9YCApO1xuXG4gICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBuZWVkZWQgcGF0Y2ggdG8gYWxsIHJlbGVhc2UgYnJhbmNoZXMuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGFkZEFsbE5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZTogc3RyaW5nICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IE1haW50ZW5hbmNlLmFkZE5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgKCkgPT4gdHJ1ZSApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBuZWVkZWQgcGF0Y2ggdG8gYWxsIHJlbGVhc2UgYnJhbmNoZXMgdGhhdCBkbyBOT1QgaW5jbHVkZSB0aGUgZ2l2ZW4gY29tbWl0IG9uIHRoZSByZXBvXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGFkZE5lZWRlZFBhdGNoZXNCZWZvcmUoIHBhdGNoTmFtZTogc3RyaW5nLCBzaGE6IHN0cmluZyApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcbiAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XG5cbiAgICBhd2FpdCBNYWludGVuYW5jZS5hZGROZWVkZWRQYXRjaGVzKCBwYXRjaE5hbWUsIGFzeW5jIHJlbGVhc2VCcmFuY2ggPT4ge1xuICAgICAgcmV0dXJuIHJlbGVhc2VCcmFuY2guaXNNaXNzaW5nU0hBKCBwYXRjaC5yZXBvLCBzaGEgKTtcbiAgICB9ICk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG5lZWRlZCBwYXRjaCB0byBhbGwgcmVsZWFzZSBicmFuY2hlcyB0aGF0IERPIGluY2x1ZGUgdGhlIGdpdmVuIGNvbW1pdCBvbiB0aGUgcmVwb1xuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyBhZGROZWVkZWRQYXRjaGVzQWZ0ZXIoIHBhdGNoTmFtZTogc3RyaW5nLCBzaGE6IHN0cmluZyApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcbiAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XG5cbiAgICBhd2FpdCBNYWludGVuYW5jZS5hZGROZWVkZWRQYXRjaGVzKCBwYXRjaE5hbWUsIGFzeW5jIHJlbGVhc2VCcmFuY2ggPT4ge1xuICAgICAgcmV0dXJuIHJlbGVhc2VCcmFuY2guaW5jbHVkZXNTSEEoIHBhdGNoLnJlcG8sIHNoYSApO1xuICAgIH0gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbmVlZGVkIHBhdGNoIHRvIGFsbCByZWxlYXNlIGJyYW5jaGVzIHRoYXQgc2F0aXNmeSB0aGUgZ2l2ZW4gZmlsdGVyKCByZWxlYXNlQnJhbmNoLCBidWlsdEZpbGVTdHJpbmcgKVxuICAgKiB3aGVyZSBpdCBidWlsZHMgdGhlIHNpbXVsYXRpb24gd2l0aCB0aGUgZGVmYXVsdHMgKGJyYW5kPXBoZXQpIGFuZCBwcm92aWRlcyBpdCBhcyBhIHN0cmluZy5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgYWRkTmVlZGVkUGF0Y2hlc0J1aWxkRmlsdGVyKCBwYXRjaE5hbWU6IHN0cmluZywgZmlsdGVyOiAoIHJlbGVhc2VCcmFuY2g6IFJlbGVhc2VCcmFuY2gsIGZpbGVDb250ZW50czogc3RyaW5nICkgPT4gUHJvbWlzZTxib29sZWFuPiApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBNYWludGVuYW5jZS5hZGROZWVkZWRQYXRjaGVzKCBwYXRjaE5hbWUsIGFzeW5jIHJlbGVhc2VCcmFuY2ggPT4ge1xuICAgICAgYXdhaXQgY2hlY2tvdXRUYXJnZXQoIHJlbGVhc2VCcmFuY2gucmVwbywgcmVsZWFzZUJyYW5jaC5icmFuY2gsIHRydWUgKTtcbiAgICAgIGF3YWl0IGdpdFB1bGwoIHJlbGVhc2VCcmFuY2gucmVwbyApO1xuICAgICAgYXdhaXQgYnVpbGQoIHJlbGVhc2VCcmFuY2gucmVwbyApO1xuICAgICAgY29uc3QgY2hpcHBlclZlcnNpb24gPSBDaGlwcGVyVmVyc2lvbi5nZXRGcm9tUmVwb3NpdG9yeSgpO1xuICAgICAgbGV0IGZpbGVuYW1lO1xuICAgICAgaWYgKCBjaGlwcGVyVmVyc2lvbi5tYWpvciAhPT0gMCApIHtcbiAgICAgICAgZmlsZW5hbWUgPSBgLi4vJHtyZWxlYXNlQnJhbmNoLnJlcG99L2J1aWxkL3BoZXQvJHtyZWxlYXNlQnJhbmNoLnJlcG99X2VuX3BoZXQuaHRtbGA7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZmlsZW5hbWUgPSBgLi4vJHtyZWxlYXNlQnJhbmNoLnJlcG99L2J1aWxkLyR7cmVsZWFzZUJyYW5jaC5yZXBvfV9lbi5odG1sYDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWx0ZXIoIHJlbGVhc2VCcmFuY2gsIGZzLnJlYWRGaWxlU3luYyggZmlsZW5hbWUsICd1dGY4JyApICk7XG4gICAgfSApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBuZWVkZWQgcGF0Y2ggZnJvbSBhIGdpdmVuIG1vZGlmaWVkIGJyYW5jaC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgcmVtb3ZlTmVlZGVkUGF0Y2goIHJlcG86IHN0cmluZywgYnJhbmNoOiBzdHJpbmcsIHBhdGNoTmFtZTogc3RyaW5nICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xuXG4gICAgY29uc3QgcGF0Y2ggPSBtYWludGVuYW5jZS5maW5kUGF0Y2goIHBhdGNoTmFtZSApO1xuXG4gICAgY29uc3QgbW9kaWZpZWRCcmFuY2ggPSBhd2FpdCBtYWludGVuYW5jZS5lbnN1cmVNb2RpZmllZEJyYW5jaCggcmVwbywgYnJhbmNoICk7XG4gICAgY29uc3QgaW5kZXggPSBtb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLmluZGV4T2YoIHBhdGNoICk7XG4gICAgYXNzZXJ0KCBpbmRleCA+PSAwLCAnQ291bGQgbm90IGZpbmQgbmVlZGVkIHBhdGNoIG9uIHRoZSBtb2RpZmllZCBicmFuY2gnICk7XG5cbiAgICBtb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLnNwbGljZSggaW5kZXgsIDEgKTtcbiAgICBtYWludGVuYW5jZS50cnlSZW1vdmluZ01vZGlmaWVkQnJhbmNoKCBtb2RpZmllZEJyYW5jaCApO1xuXG4gICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuXG4gICAgY29uc29sZS5sb2coIGBSZW1vdmVkIHBhdGNoICR7cGF0Y2hOYW1lfSBmcm9tICR7cmVwb30gJHticmFuY2h9YCApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBuZWVkZWQgcGF0Y2ggZnJvbSB3aGF0ZXZlciBzdWJzZXQgb2YgKGN1cnJlbnQpIHJlbGVhc2UgYnJhbmNoZXMgbWF0Y2ggdGhlIGZpbHRlci5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgcmVtb3ZlTmVlZGVkUGF0Y2hlcyggcGF0Y2hOYW1lOiBzdHJpbmcsIGZpbHRlcjogRmlsdGVyUkIgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XG5cbiAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XG5cbiAgICBsZXQgY291bnQgPSAwO1xuXG4gICAgZm9yICggY29uc3QgbW9kaWZpZWRCcmFuY2ggb2YgbWFpbnRlbmFuY2UubW9kaWZpZWRCcmFuY2hlcyApIHtcbiAgICAgIC8vIENoZWNrIGlmIHRoZXJlJ3MgYWN0dWFsbHkgc29tZXRoaW5nIHRvIHJlbW92ZSAoZm9yIHJ1bm5pbmcgdGhlIHBvdGVudGlhbGx5LWV4cGVuc2l2ZSBmaWx0ZXIgZnVuY3Rpb24pXG4gICAgICBjb25zdCBpbmRleCA9IG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMuaW5kZXhPZiggcGF0Y2ggKTtcbiAgICAgIGlmICggaW5kZXggPCAwICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmVlZHNSZW1vdmFsID0gYXdhaXQgZmlsdGVyKCBtb2RpZmllZEJyYW5jaC5yZWxlYXNlQnJhbmNoICk7XG5cbiAgICAgIGlmICggIW5lZWRzUmVtb3ZhbCApIHtcbiAgICAgICAgY29uc29sZS5sb2coIGAgIHNraXBwaW5nICR7bW9kaWZpZWRCcmFuY2gucmVwb30gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9YCApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5zcGxpY2UoIGluZGV4LCAxICk7XG4gICAgICBtYWludGVuYW5jZS50cnlSZW1vdmluZ01vZGlmaWVkQnJhbmNoKCBtb2RpZmllZEJyYW5jaCApO1xuICAgICAgY291bnQrKztcbiAgICAgIGNvbnNvbGUubG9nKCBgUmVtb3ZlZCBuZWVkZWQgcGF0Y2ggJHtwYXRjaE5hbWV9IGZyb20gJHttb2RpZmllZEJyYW5jaC5yZXBvfSAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH1gICk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCBgUmVtb3ZlZCAke2NvdW50fSByZWxlYXNlQnJhbmNoZXMgZnJvbSBwYXRjaDogJHtwYXRjaE5hbWV9YCApO1xuXG4gICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBuZWVkZWQgcGF0Y2ggZnJvbSBhbGwgcmVsZWFzZSBicmFuY2hlcyB0aGF0IGRvIE5PVCBpbmNsdWRlIHRoZSBnaXZlbiBjb21taXQgb24gdGhlIHJlcG9cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgcmVtb3ZlTmVlZGVkUGF0Y2hlc0JlZm9yZSggcGF0Y2hOYW1lOiBzdHJpbmcsIHNoYTogc3RyaW5nICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xuICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcblxuICAgIGF3YWl0IE1haW50ZW5hbmNlLnJlbW92ZU5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgcmVsZWFzZUJyYW5jaCA9PiB7XG4gICAgICByZXR1cm4gcmVsZWFzZUJyYW5jaC5pc01pc3NpbmdTSEEoIHBhdGNoLnJlcG8sIHNoYSApO1xuICAgIH0gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgbmVlZGVkIHBhdGNoIGZyb20gYWxsIHJlbGVhc2UgYnJhbmNoZXMgdGhhdCBETyBpbmNsdWRlIHRoZSBnaXZlbiBjb21taXQgb24gdGhlIHJlcG9cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgcmVtb3ZlTmVlZGVkUGF0Y2hlc0FmdGVyKCBwYXRjaE5hbWU6IHN0cmluZywgc2hhOiBzdHJpbmcgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XG4gICAgY29uc3QgcGF0Y2ggPSBtYWludGVuYW5jZS5maW5kUGF0Y2goIHBhdGNoTmFtZSApO1xuXG4gICAgYXdhaXQgTWFpbnRlbmFuY2UucmVtb3ZlTmVlZGVkUGF0Y2hlcyggcGF0Y2hOYW1lLCBhc3luYyByZWxlYXNlQnJhbmNoID0+IHtcbiAgICAgIHJldHVybiByZWxlYXNlQnJhbmNoLmluY2x1ZGVzU0hBKCBwYXRjaC5yZXBvLCBzaGEgKTtcbiAgICB9ICk7XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZvciBhZGRpbmcgcGF0Y2hlcyBiYXNlZCBvbiBzcGVjaWZpYyBwYXR0ZXJucywgZS5nLjpcbiAgICogTWFpbnRlbmFuY2UuYWRkTmVlZGVkUGF0Y2hlcyggJ3BoZXRtYXJrcycsIE1haW50ZW5hbmNlLnNpbmdsZUZpbGVSZWxlYXNlQnJhbmNoRmlsdGVyKCAnLi4vcGhldG1hcmtzL2pzL3BoZXRtYXJrcy50cycgKSwgY29udGVudCA9PiBjb250ZW50LmluY2x1ZGVzKCAnZGF0YS93cmFwcGVycycgKSApO1xuICAgKi9cbiAgcHVibGljIHN0YXRpYyBzaW5nbGVGaWxlUmVsZWFzZUJyYW5jaEZpbHRlciggZmlsZU5hbWU6IHN0cmluZywgcHJlZGljYXRlOiAoIGZpbGVDb250ZW50czogc3RyaW5nICkgPT4gYm9vbGVhbiApOiBGaWx0ZXJSQiB7XG4gICAgcmV0dXJuIGFzeW5jIHJlbGVhc2VCcmFuY2ggPT4ge1xuICAgICAgYXdhaXQgcmVsZWFzZUJyYW5jaC5jaGVja291dCggZmFsc2UgKTtcblxuICAgICAgaWYgKCBmcy5leGlzdHNTeW5jKCBmaWxlTmFtZSApICkge1xuICAgICAgICBjb25zdCBjb250ZW50cyA9IGZzLnJlYWRGaWxlU3luYyggZmlsZU5hbWUsICd1dGYtOCcgKTtcbiAgICAgICAgcmV0dXJuIHByZWRpY2F0ZSggY29udGVudHMgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIG91dCBhIHNwZWNpZmljIFJlbGVhc2UgQnJhbmNoICh1c2luZyBsb2NhbCBjb21taXQgZGF0YSBhcyBuZWNlc3NhcnkpLlxuICAgKiBAcGFyYW0gcmVwb1xuICAgKiBAcGFyYW0gYnJhbmNoXG4gICAqIEBwYXJhbSBvdXRwdXRKUyAtIGlmIHRydWUsIG9uY2UgY2hlY2tlZCBvdXQgdGhpcyB3aWxsIGFsc28gcnVuIGBncnVudCBvdXRwdXQtanMtcHJvamVjdGBcbiAgICogQHBhcmFtIG5wbVVwZGF0ZSAtIGRvIGEgbnBtIHVwZGF0ZSBhZnRlciBjaGVja2luZyBvdXQgc2hhc1xuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyBjaGVja291dEJyYW5jaCggcmVwbzogc3RyaW5nLCBicmFuY2g6IHN0cmluZywgb3V0cHV0SlMgPSBmYWxzZSwgbnBtVXBkYXRlID0gdHJ1ZSApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcblxuICAgIGNvbnN0IG1vZGlmaWVkQnJhbmNoID0gYXdhaXQgbWFpbnRlbmFuY2UuZW5zdXJlTW9kaWZpZWRCcmFuY2goIHJlcG8sIGJyYW5jaCwgdHJ1ZSApO1xuICAgIGF3YWl0IG1vZGlmaWVkQnJhbmNoLmNoZWNrb3V0KCBucG1VcGRhdGUgKTtcblxuICAgIGlmICggb3V0cHV0SlMgJiYgY2hpcHBlclN1cHBvcnRzT3V0cHV0SlNHcnVudFRhc2tzKCkgKSB7XG4gICAgICBjb25zb2xlLmxvZyggJ1J1bm5pbmcgb3V0cHV0LWpzLXByb2plY3QnICk7XG5cbiAgICAgIC8vIFdlIG1pZ2h0IG5vdCBiZSBhYmxlIHRvIHJ1biB0aGlzIGNvbW1hbmQhXG4gICAgICBhd2FpdCBleGVjdXRlKCBncnVudENvbW1hbmQsIFsgJ291dHB1dC1qcy1wcm9qZWN0JywgJy0tc2lsZW50JyBdLCBgLi4vJHtyZXBvfWAsIHtcbiAgICAgICAgZXJyb3JzOiAncmVzb2x2ZSdcbiAgICAgIH0gKTtcbiAgICB9XG5cbiAgICAvLyBObyBuZWVkIHRvIHNhdmUsIHNob3VsZG4ndCBiZSBjaGFuZ2luZyB0aGluZ3NcbiAgICBjb25zb2xlLmxvZyggYENoZWNrZWQgb3V0ICR7cmVwb30gJHticmFuY2h9YCApO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBvdXQgYSBzaW5nbGUgYnJhbmNoIGZvciBhIHJlcG8sIHRoZW4gYnVpbGRzIGl0LlxuICAgKiBAcGFyYW0gcmVwb1xuICAgKiBAcGFyYW0gYnJhbmNoXG4gICAqIEBwYXJhbSBidWlsZE9wdGlvbnMgLSBPcHRpb25hbCBidWlsZCBvcHRpb25zIGZvcndhcmRlZCB0byBidWlsZCgpXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGNoZWNrb3V0QW5kQnVpbGQoIHJlcG86IHN0cmluZywgYnJhbmNoOiBzdHJpbmcsIGJ1aWxkT3B0aW9ucz86IFBhcnRpYWw8QnVpbGRPcHRpb25zPiApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBNYWludGVuYW5jZS5jaGVja291dEJyYW5jaCggcmVwbywgYnJhbmNoICk7XG4gICAgYXdhaXQgTWFpbnRlbmFuY2UuY2xlYW5CdWlsZERpcmVjdG9yeSggcmVwbyApO1xuICAgIGF3YWl0IGJ1aWxkKCByZXBvLCBidWlsZE9wdGlvbnMgKTtcbiAgICBjb25zb2xlLmxvZyggYEJ1aWx0ICR7cmVwb30gJHticmFuY2h9YCApO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgdGhlIGJ1aWxkLyBkaXJlY3RvcnkgZm9yIGEgcmVwbyB0byBhdm9pZCBsZWdhY3kgZ3J1bnQgY2xlYW4gaXNzdWVzIHRoYXRcbiAgICogYXR0ZW1wdCB0byBkZWxldGUgb3V0c2lkZSB0aGUgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeS5cbiAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9wZXJlbm5pYWwvaXNzdWVzLzQ4MFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgY2xlYW5CdWlsZERpcmVjdG9yeSggcmVwbzogc3RyaW5nICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCAnQ2xlYW5pbmcgcmVwbyBidWlsZCBkaXJlY3RvcnknICk7XG4gICAgY29uc3QgYnVpbGREaXJlY3RvcnkgPSBwYXRoLnJlc29sdmUoIFBFUkVOTklBTF9ST09ULCAnLi4nLCByZXBvLCAnYnVpbGQnICk7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMucm0oIGJ1aWxkRGlyZWN0b3J5LCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSApO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGVtcHRzIHRvIGFwcGx5IHBhdGNoZXMgdG8gdGhlIG1vZGlmaWVkIGJyYW5jaGVzIHRoYXQgYXJlIG1hcmtlZCBhcyBuZWVkZWQuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGFwcGx5UGF0Y2hlcygpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB3aW5zdG9uLmluZm8oICdhcHBseWluZyBwYXRjaGVzJyApO1xuXG4gICAgbGV0IHN1Y2Nlc3MgPSB0cnVlO1xuICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xuICAgIGxldCBudW1BcHBsaWVkID0gMDtcblxuICAgIGZvciAoIGNvbnN0IG1vZGlmaWVkQnJhbmNoIG9mIG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMgKSB7XG4gICAgICBpZiAoIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMubGVuZ3RoID09PSAwICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVwbyA9IG1vZGlmaWVkQnJhbmNoLnJlcG87XG4gICAgICBjb25zdCBicmFuY2ggPSBtb2RpZmllZEJyYW5jaC5icmFuY2g7XG5cbiAgICAgIGxldCBzaW1TdWNjZXNzID0gZmFsc2U7XG5cbiAgICAgIC8vIERlZmVuc2l2ZSBjb3B5LCBzaW5jZSB3ZSBtb2RpZnkgaXQgZHVyaW5nIGl0ZXJhdGlvblxuICAgICAgZm9yICggY29uc3QgcGF0Y2ggb2YgbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5zbGljZSgpICkge1xuICAgICAgICBpZiAoIHBhdGNoLnNoYXMubGVuZ3RoID09PSAwICkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGF0Y2hSZXBvID0gcGF0Y2gucmVwbztcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGxldCBwYXRjaFJlcG9DdXJyZW50U0hBO1xuXG4gICAgICAgICAgLy8gQ2hlY2tvdXQgd2hhdGV2ZXIgdGhlIGxhdGVzdCBwYXRjaGVkIFNIQSBpcyAoaWYgd2UndmUgcGF0Y2hlZCBpdClcbiAgICAgICAgICBpZiAoIG1vZGlmaWVkQnJhbmNoLmNoYW5nZWREZXBlbmRlbmNpZXNbIHBhdGNoUmVwbyBdICkge1xuICAgICAgICAgICAgcGF0Y2hSZXBvQ3VycmVudFNIQSA9IG1vZGlmaWVkQnJhbmNoLmNoYW5nZWREZXBlbmRlbmNpZXNbIHBhdGNoUmVwbyBdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIExvb2sgdXAgdGhlIFNIQSB0byBjaGVjayBvdXQgYXQgdGhlIHRpcCBvZiB0aGUgcmVsZWFzZSBicmFuY2ggZGVwZW5kZW5jaWVzLmpzb25cbiAgICAgICAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCByZXBvLCBicmFuY2ggKTtcbiAgICAgICAgICAgIGF3YWl0IGdpdFB1bGwoIHJlcG8gKTtcbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggcmVwbyApO1xuICAgICAgICAgICAgcGF0Y2hSZXBvQ3VycmVudFNIQSA9IGRlcGVuZGVuY2llc1sgcGF0Y2hSZXBvIF0uc2hhO1xuICAgICAgICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHJlcG8sICdtYWluJyApOyAvLyBUT0RPOiB0aGlzIGFzc3VtZXMgd2Ugd2VyZSBvbiBtYWluIHdoZW4gd2Ugc3RhcnRlZCBydW5uaW5nIHRoaXMuIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9wZXJlbm5pYWwvaXNzdWVzLzM2OFxuICAgICAgICAgICAgLy8gVE9ETzogc2VlIGlmIHRoZSBwYXRjaFJlcG8gaGFzIGEgYnJhbmNoIGZvciB0aGlzIHJlbGVhc2UgYnJhbmNoLCBhbmQgaWYgc28sIHB1bGwgaXQgdG8gbWFrZSBzdXJlIHdlIGhhdmUgdGhlIGFib3ZlIFNIQSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy8zNjhcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBUaGVuIGNoZWNrIGl0IG91dFxuICAgICAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCBwYXRjaFJlcG8sIHBhdGNoUmVwb0N1cnJlbnRTSEEgKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyggYENoZWNrZWQgb3V0ICR7cGF0Y2hSZXBvfSBmb3IgJHtyZXBvfSAke2JyYW5jaH0sIFNIQTogJHtwYXRjaFJlcG9DdXJyZW50U0hBfWAgKTtcblxuICAgICAgICAgIGZvciAoIGNvbnN0IHNoYSBvZiBwYXRjaC5zaGFzICkge1xuXG4gICAgICAgICAgICAvLyBJZiB0aGUgc2hhIGRvZXNuJ3QgZXhpc3QgaW4gdGhlIHJlcG8sIHRoZW4gZ2l2ZSBhIHNwZWNpZmljIGVycm9yIGZvciB0aGF0LlxuICAgICAgICAgICAgY29uc3QgaGFzU2hhID0gKCBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnY2F0LWZpbGUnLCAnLWUnLCBzaGEgXSwgYC4uLyR7cGF0Y2hSZXBvfWAsIHsgZXJyb3JzOiAncmVzb2x2ZScgfSApICkuY29kZSA9PT0gMDtcbiAgICAgICAgICAgIGlmICggIWhhc1NoYSApIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgU0hBIG5vdCBmb3VuZCBpbiAke3BhdGNoUmVwb306ICR7c2hhfWAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY2hlcnJ5UGlja1N1Y2Nlc3MgPSBhd2FpdCBnaXRDaGVycnlQaWNrKCBwYXRjaFJlcG8sIHNoYSApO1xuXG4gICAgICAgICAgICBpZiAoIGNoZXJyeVBpY2tTdWNjZXNzICkge1xuICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U0hBID0gYXdhaXQgZ2l0UmV2UGFyc2UoIHBhdGNoUmVwbywgJ0hFQUQnICk7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgQ2hlcnJ5LXBpY2sgc3VjY2VzcyBmb3IgJHtzaGF9LCByZXN1bHQgaXMgJHtjdXJyZW50U0hBfWAgKTtcbiAgICAgICAgICAgICAgc2ltU3VjY2VzcyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llc1sgcGF0Y2hSZXBvIF0gPSBjdXJyZW50U0hBO1xuICAgICAgICAgICAgICBtb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLnNwbGljZSggbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5pbmRleE9mKCBwYXRjaCApLCAxICk7XG4gICAgICAgICAgICAgIG51bUFwcGxpZWQrKztcblxuICAgICAgICAgICAgICAvLyBEb24ndCBpbmNsdWRlIGR1cGxpY2F0ZSBtZXNzYWdlcywgc2luY2UgbXVsdGlwbGUgcGF0Y2hlcyBtaWdodCBiZSBmb3IgYSBzaW5nbGUgaXNzdWVcbiAgICAgICAgICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2gucGVuZGluZ01lc3NhZ2VzLmluY2x1ZGVzKCBwYXRjaC5tZXNzYWdlICkgKSB7XG4gICAgICAgICAgICAgICAgbW9kaWZpZWRCcmFuY2gucGVuZGluZ01lc3NhZ2VzLnB1c2goIHBhdGNoLm1lc3NhZ2UgKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgQ291bGQgbm90IGNoZXJyeS1waWNrICR7c2hhfWAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goIGUgKSB7XG4gICAgICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgRmFpbHVyZSBhcHBseWluZyBwYXRjaCAke3BhdGNoUmVwb30gdG8gJHtyZXBvfSAke2JyYW5jaH06ICR7ZX1gICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIG1vZGlmaWVkQnJhbmNoLnJlcG8sICdtYWluJyApO1xuICAgICAgc3VjY2VzcyA9IHN1Y2Nlc3MgJiYgc2ltU3VjY2VzcztcbiAgICB9XG5cbiAgICBtYWludGVuYW5jZS5zYXZlKCk7XG5cbiAgICBjb25zb2xlLmxvZyggYCR7bnVtQXBwbGllZH0gcGF0Y2hlcyBhcHBsaWVkYCApO1xuXG4gICAgcmV0dXJuIHN1Y2Nlc3M7XG4gIH1cblxuICAvKipcbiAgICogUHVzaGVzIGxvY2FsIGNoYW5nZXMgdXAgdG8gR2l0SHViLlxuICAgKlxuICAgKlxuICAgKiBAcGFyYW0gZmlsdGVyIC0gT3B0aW9uYWwgZmlsdGVyLCBtb2RpZmllZCBicmFuY2hlcyB3aWxsIGJlIHNraXBwZWQgaWYgdGhpcyByZXNvbHZlcyB0byBmYWxzZVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyB1cGRhdGVEZXBlbmRlbmNpZXMoIGZpbHRlcj86IEZpbHRlck1CICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHdpbnN0b24uaW5mbyggJ3VwZGF0ZSBkZXBlbmRlbmNpZXMnICk7XG5cbiAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcblxuICAgIGZvciAoIGNvbnN0IG1vZGlmaWVkQnJhbmNoIG9mIG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMgKSB7XG4gICAgICBjb25zdCBjaGFuZ2VkUmVwb3MgPSBPYmplY3Qua2V5cyggbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llcyApO1xuICAgICAgaWYgKCBjaGFuZ2VkUmVwb3MubGVuZ3RoID09PSAwICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCBmaWx0ZXIgJiYgISggYXdhaXQgZmlsdGVyKCBtb2RpZmllZEJyYW5jaCApICkgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCBgU2tpcHBpbmcgZGVwZW5kZW5jeSB1cGRhdGUgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9YCApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gTm8gTlBNIG5lZWRlZFxuICAgICAgICBhd2FpdCBjaGVja291dFRhcmdldCggbW9kaWZpZWRCcmFuY2gucmVwbywgbW9kaWZpZWRCcmFuY2guYnJhbmNoLCBmYWxzZSApO1xuICAgICAgICBjb25zb2xlLmxvZyggYENoZWNrZWQgb3V0ICR7bW9kaWZpZWRCcmFuY2gucmVwb30gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9YCApO1xuXG4gICAgICAgIGNvbnN0IGRlcGVuZGVuY2llc0pTT05GaWxlID0gYC4uLyR7bW9kaWZpZWRCcmFuY2gucmVwb30vZGVwZW5kZW5jaWVzLmpzb25gO1xuICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXNKU09OID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBkZXBlbmRlbmNpZXNKU09ORmlsZSwgJ3V0Zi04JyApICk7XG5cbiAgICAgICAgLy8gTW9kaWZ5IHRoZSBcInNlbGZcIiBpbiB0aGUgZGVwZW5kZW5jaWVzLmpzb24gYXMgZXhwZWN0ZWRcbiAgICAgICAgZGVwZW5kZW5jaWVzSlNPTlsgbW9kaWZpZWRCcmFuY2gucmVwbyBdLnNoYSA9IGF3YWl0IGdpdFJldlBhcnNlKCBtb2RpZmllZEJyYW5jaC5yZXBvLCBtb2RpZmllZEJyYW5jaC5icmFuY2ggKTtcblxuICAgICAgICBmb3IgKCBjb25zdCBkZXBlbmRlbmN5IG9mIGNoYW5nZWRSZXBvcyApIHtcbiAgICAgICAgICBjb25zdCBkZXBlbmRlbmN5QnJhbmNoID0gbW9kaWZpZWRCcmFuY2guZGVwZW5kZW5jeUJyYW5jaDtcbiAgICAgICAgICBjb25zdCBicmFuY2hlcyA9IGF3YWl0IGdldEJyYW5jaGVzKCBkZXBlbmRlbmN5ICk7XG4gICAgICAgICAgY29uc3Qgc2hhID0gbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llc1sgZGVwZW5kZW5jeSBdO1xuXG4gICAgICAgICAgZGVwZW5kZW5jaWVzSlNPTlsgZGVwZW5kZW5jeSBdLnNoYSA9IHNoYTtcblxuICAgICAgICAgIGlmICggYnJhbmNoZXMuaW5jbHVkZXMoIGRlcGVuZGVuY3lCcmFuY2ggKSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgQnJhbmNoICR7ZGVwZW5kZW5jeUJyYW5jaH0gYWxyZWFkeSBleGlzdHMgaW4gJHtkZXBlbmRlbmN5fWAgKTtcbiAgICAgICAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCBkZXBlbmRlbmN5LCBkZXBlbmRlbmN5QnJhbmNoICk7XG4gICAgICAgICAgICBhd2FpdCBnaXRQdWxsKCBkZXBlbmRlbmN5ICk7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U0hBID0gYXdhaXQgZ2l0UmV2UGFyc2UoIGRlcGVuZGVuY3ksICdIRUFEJyApO1xuXG4gICAgICAgICAgICBpZiAoIHNoYSAhPT0gY3VycmVudFNIQSApIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coIGBBdHRlbXB0aW5nIHRvIChob3BlZnVsbHkgZmFzdC1mb3J3YXJkKSBtZXJnZSAke3NoYX1gICk7XG4gICAgICAgICAgICAgIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdtZXJnZScsIHNoYSBdLCBgLi4vJHtkZXBlbmRlbmN5fWAgKTtcbiAgICAgICAgICAgICAgYXdhaXQgZ2l0UHVzaCggZGVwZW5kZW5jeSwgZGVwZW5kZW5jeUJyYW5jaCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgQnJhbmNoICR7ZGVwZW5kZW5jeUJyYW5jaH0gZG9lcyBub3QgZXhpc3QgaW4gJHtkZXBlbmRlbmN5fSwgY3JlYXRpbmcuYCApO1xuICAgICAgICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIGRlcGVuZGVuY3ksIHNoYSApO1xuICAgICAgICAgICAgYXdhaXQgZ2l0Q3JlYXRlQnJhbmNoKCBkZXBlbmRlbmN5LCBkZXBlbmRlbmN5QnJhbmNoICk7XG4gICAgICAgICAgICBhd2FpdCBnaXRQdXNoKCBkZXBlbmRlbmN5LCBkZXBlbmRlbmN5QnJhbmNoICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZGVsZXRlIG1vZGlmaWVkQnJhbmNoLmNoYW5nZWREZXBlbmRlbmNpZXNbIGRlcGVuZGVuY3kgXTtcbiAgICAgICAgICBtb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24gPSBudWxsO1xuICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTsgLy8gc2F2ZSBoZXJlIGluIGNhc2UgYSBmdXR1cmUgZmFpbHVyZSB3b3VsZCBcInJldmVydFwiIHRoaW5nc1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IG1vZGlmaWVkQnJhbmNoLnBlbmRpbmdNZXNzYWdlcy5qb2luKCAnIGFuZCAnICk7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoIGRlcGVuZGVuY2llc0pTT05GaWxlLCBKU09OLnN0cmluZ2lmeSggZGVwZW5kZW5jaWVzSlNPTiwgbnVsbCwgMiApICk7XG4gICAgICAgIGF3YWl0IGdpdEFkZCggbW9kaWZpZWRCcmFuY2gucmVwbywgJ2RlcGVuZGVuY2llcy5qc29uJyApO1xuICAgICAgICBhd2FpdCBnaXRDb21taXQoIG1vZGlmaWVkQnJhbmNoLnJlcG8sIGB1cGRhdGVkIGRlcGVuZGVuY2llcy5qc29uIGZvciAke21lc3NhZ2V9YCApO1xuICAgICAgICBhd2FpdCBnaXRQdXNoKCBtb2RpZmllZEJyYW5jaC5yZXBvLCBtb2RpZmllZEJyYW5jaC5icmFuY2ggKTtcblxuICAgICAgICAvLyBNb3ZlIG1lc3NhZ2VzIGZyb20gcGVuZGluZyB0byBwdXNoZWRcbiAgICAgICAgZm9yICggY29uc3QgbWVzc2FnZSBvZiBtb2RpZmllZEJyYW5jaC5wZW5kaW5nTWVzc2FnZXMgKSB7XG4gICAgICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2gucHVzaGVkTWVzc2FnZXMuaW5jbHVkZXMoIG1lc3NhZ2UgKSApIHtcbiAgICAgICAgICAgIG1vZGlmaWVkQnJhbmNoLnB1c2hlZE1lc3NhZ2VzLnB1c2goIG1lc3NhZ2UgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbW9kaWZpZWRCcmFuY2gucGVuZGluZ01lc3NhZ2VzLmxlbmd0aCA9IDA7XG4gICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTsgLy8gc2F2ZSBoZXJlIGluIGNhc2UgYSBmdXR1cmUgZmFpbHVyZSB3b3VsZCBcInJldmVydFwiIHRoaW5nc1xuXG4gICAgICAgIGF3YWl0IGNoZWNrb3V0TWFpbiggbW9kaWZpZWRCcmFuY2gucmVwbywgZmFsc2UgKTtcbiAgICAgIH1cbiAgICAgIGNhdGNoKCBlICkge1xuICAgICAgICBtYWludGVuYW5jZS5zYXZlKCk7XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgRmFpbHVyZSB1cGRhdGluZyBkZXBlbmRlbmNpZXMgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gdG8gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9OiAke2V9YCApO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcblxuICAgIGNvbnNvbGUubG9nKCAnRGVwZW5kZW5jaWVzIHVwZGF0ZWQnICk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIGNoaXBwZXIvZGlzdCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9wZXJlbm5pYWwvaXNzdWVzLzQ2MSNpc3N1ZWNvbW1lbnQtMzgzNzUxODI0MlxuICAgKlxuICAgKiBPdXIgVHlwZVNjcmlwdCBzZXR1cCBpcyBub3cgdW5yZWxpYWJsZSwgYW5kIHdlIG5lZWQgdG8gY2xlYXIgb3V0IHRlbXBvcmFyeSBmaWxlcyB0byBwcmV2ZW50IGl0IGZyb20gYnVnZ2luZyBvdXRcbiAgICogKGhhdmluZyBzdGFsZSBUUyBkYXRhIGZyb20gT1RIRVIgcmVsZWFzZSBicmFuY2hlcyBiZWluZyB1c2VkIGluIERJRkZFUkVOVCByZWxlYXNlIGJyYW5jaGVzIC0tLSBjYW4gdHJpZ2dlciBvciBoaWRlXG4gICAqIGVycm9ycykuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGNsZWFuQ2hpcHBlckRpc3QoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGlzdFBhdGggPSBwYXRoLnJlc29sdmUoIFBFUkVOTklBTF9ST09ULCAnLi4nLCAnY2hpcHBlcicsICdkaXN0JyApO1xuXG4gICAgY29uc29sZS5sb2coICdjbGVhbmluZyBjaGlwcGVyL2Rpc3QnICk7XG5cbiAgICBhd2FpdCBmcy5wcm9taXNlcy5ybSggZGlzdFBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9ICk7XG4gIH1cblxuICAvKipcbiAgICogRGVwbG95cyBSQyB2ZXJzaW9ucyBvZiB0aGUgbW9kaWZpZWQgYnJhbmNoZXMgdGhhdCBuZWVkIGl0LlxuICAgKlxuICAgKlxuICAgKiBAcGFyYW0gZmlsdGVyIC0gT3B0aW9uYWwgZmlsdGVyLCBtb2RpZmllZCBicmFuY2hlcyB3aWxsIGJlIHNraXBwZWQgaWYgdGhpcyByZXNvbHZlcyB0byBmYWxzZVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyBkZXBsb3lSZWxlYXNlQ2FuZGlkYXRlcyggZmlsdGVyPzogRmlsdGVyTUIgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XG5cbiAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xuICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2guaXNSZWFkeUZvclJlbGVhc2VDYW5kaWRhdGUgfHwgIW1vZGlmaWVkQnJhbmNoLnJlbGVhc2VCcmFuY2guaXNSZWxlYXNlZCApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCAnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09JyApO1xuXG4gICAgICBpZiAoIGZpbHRlciAmJiAhKCBhd2FpdCBmaWx0ZXIoIG1vZGlmaWVkQnJhbmNoICkgKSApIHtcbiAgICAgICAgY29uc29sZS5sb2coIGBTa2lwcGluZyBSQyBkZXBsb3kgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9YCApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc29sZS5sb2coIGBSdW5uaW5nIFJDIGRlcGxveSBmb3IgJHttb2RpZmllZEJyYW5jaC5yZXBvfSAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH1gICk7XG5cbiAgICAgICAgYXdhaXQgTWFpbnRlbmFuY2UuY2xlYW5DaGlwcGVyRGlzdCgpO1xuICAgICAgICBhd2FpdCBNYWludGVuYW5jZS5jbGVhbkJ1aWxkRGlyZWN0b3J5KCBtb2RpZmllZEJyYW5jaC5yZXBvICk7XG5cbiAgICAgICAgY29uc3QgdmVyc2lvbiA9IGF3YWl0IHJjKCBtb2RpZmllZEJyYW5jaC5yZXBvLCBtb2RpZmllZEJyYW5jaC5icmFuY2gsIG1vZGlmaWVkQnJhbmNoLmJyYW5kcywgdHJ1ZSwgbW9kaWZpZWRCcmFuY2gucHVzaGVkTWVzc2FnZXMuam9pbiggJywgJyApICk7XG4gICAgICAgIG1vZGlmaWVkQnJhbmNoLmRlcGxveWVkVmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTsgLy8gc2F2ZSBoZXJlIGluIGNhc2UgYSBmdXR1cmUgZmFpbHVyZSB3b3VsZCBcInJldmVydFwiIHRoaW5nc1xuICAgICAgfVxuICAgICAgY2F0Y2goIGUgKSB7XG4gICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcblxuICAgICAgICBjb25zb2xlLmVycm9yKCBgRmFpbHVyZSB3aXRoIFJDIGRlcGxveSBmb3IgJHttb2RpZmllZEJyYW5jaC5yZXBvfSB0byAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH06ICR7ZX1gICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuXG4gICAgY29uc29sZS5sb2coICdSQyB2ZXJzaW9ucyBkZXBsb3llZCcgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXBsb3lzIHByb2R1Y3Rpb24gdmVyc2lvbnMgb2YgdGhlIG1vZGlmaWVkIGJyYW5jaGVzIHRoYXQgbmVlZCBpdC5cbiAgICogQHBhcmFtIGZpbHRlciAtIE9wdGlvbmFsIGZpbHRlciwgbW9kaWZpZWQgYnJhbmNoZXMgd2lsbCBiZSBza2lwcGVkIGlmIHRoaXMgcmVzb2x2ZXMgdG8gZmFsc2VcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgZGVwbG95UHJvZHVjdGlvbiggZmlsdGVyOiBGaWx0ZXJNQiApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcblxuICAgIGZvciAoIGNvbnN0IG1vZGlmaWVkQnJhbmNoIG9mIG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMgKSB7XG4gICAgICBpZiAoICFtb2RpZmllZEJyYW5jaC5pc1JlYWR5Rm9yUHJvZHVjdGlvbiB8fCAhbW9kaWZpZWRCcmFuY2gucmVsZWFzZUJyYW5jaC5pc1JlbGVhc2VkICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCBmaWx0ZXIgJiYgISggYXdhaXQgZmlsdGVyKCBtb2RpZmllZEJyYW5jaCApICkgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCBgU2tpcHBpbmcgcHJvZHVjdGlvbiBkZXBsb3kgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9YCApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc29sZS5sb2coIGBSdW5uaW5nIHByb2R1Y3Rpb24gZGVwbG95IGZvciAke21vZGlmaWVkQnJhbmNoLnJlcG99ICR7bW9kaWZpZWRCcmFuY2guYnJhbmNofWAgKTtcblxuICAgICAgICBhd2FpdCBNYWludGVuYW5jZS5jbGVhbkNoaXBwZXJEaXN0KCk7XG4gICAgICAgIGF3YWl0IE1haW50ZW5hbmNlLmNsZWFuQnVpbGREaXJlY3RvcnkoIG1vZGlmaWVkQnJhbmNoLnJlcG8gKTtcblxuICAgICAgICBjb25zdCB2ZXJzaW9uID0gYXdhaXQgcHJvZHVjdGlvbiggbW9kaWZpZWRCcmFuY2gucmVwbywgbW9kaWZpZWRCcmFuY2guYnJhbmNoLCBtb2RpZmllZEJyYW5jaC5icmFuZHMsIHRydWUsIGZhbHNlLCBtb2RpZmllZEJyYW5jaC5wdXNoZWRNZXNzYWdlcy5qb2luKCAnLCAnICkgKTtcbiAgICAgICAgbW9kaWZpZWRCcmFuY2guZGVwbG95ZWRWZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgbW9kaWZpZWRCcmFuY2gucHVzaGVkTWVzc2FnZXMubGVuZ3RoID0gMDtcbiAgICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpOyAvLyBzYXZlIGhlcmUgaW4gY2FzZSBhIGZ1dHVyZSBmYWlsdXJlIHdvdWxkIFwicmV2ZXJ0XCIgdGhpbmdzXG4gICAgICB9XG4gICAgICBjYXRjaCggZSApIHtcbiAgICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYEZhaWx1cmUgd2l0aCBwcm9kdWN0aW9uIGRlcGxveSBmb3IgJHttb2RpZmllZEJyYW5jaC5yZXBvfSB0byAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH06ICR7ZX1gICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xuXG4gICAgY29uc29sZS5sb2coICdwcm9kdWN0aW9uIHZlcnNpb25zIGRlcGxveWVkJyApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIHNlcGFyYXRlIGRpcmVjdG9yeSBmb3IgZWFjaCByZWxlYXNlIGJyYW5jaC4gVGhpcyBkb2VzIG5vdCBpbnRlcmZhY2Ugd2l0aCB0aGUgc2F2ZWQgbWFpbnRlbmFuY2Ugc3RhdGUgYXRcbiAgICogYWxsLCBhbmQgaW5zdGVhZCBqdXN0IGxvb2tzIGF0IHRoZSBjb21taXR0ZWQgZGVwZW5kZW5jaWVzLmpzb24gd2hlbiB1cGRhdGluZy5cbiAgICpcbiAgICpcbiAgICogQHBhcmFtIGZpbHRlciAtIE9wdGlvbmFsIGZpbHRlciwgcmVsZWFzZSBicmFuY2hlcyB3aWxsIGJlIHNraXBwZWQgaWYgdGhpcyByZXNvbHZlcyB0byBmYWxzZVxuICAgKiBAcGFyYW0gcHJvdmlkZWRPcHRpb25zXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIHVwZGF0ZUNoZWNrb3V0cyggZmlsdGVyPzogRmlsdGVyUkIsIHByb3ZpZGVkT3B0aW9ucz86IFBhcnRpYWw8VXBkYXRlQ2hlY2tvdXRzT3B0aW9ucz4gKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IF8ubWVyZ2UoIHtcbiAgICAgIGNvbmN1cnJlbnQ6IDUsXG4gICAgICBidWlsZDogdHJ1ZSxcbiAgICAgIHRyYW5zcGlsZTogdHJ1ZSxcbiAgICAgIGJ1aWxkT3B0aW9uczogeyBsaW50OiB0cnVlIH1cbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcblxuICAgIGNvbnNvbGUubG9nKCBgVXBkYXRpbmcgY2hlY2tvdXRzIChydW5uaW5nIGluIHBhcmFsbGVsIHdpdGggJHtvcHRpb25zLmNvbmN1cnJlbnR9IHRocmVhZHMpYCApO1xuXG4gICAgY29uc3QgcmVsZWFzZUJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcygpO1xuXG4gICAgY29uc3QgZmlsdGVyZWRCcmFuY2hlcyA9IFtdO1xuXG4gICAgLy8gUnVuIGFsbCBmaWx0ZXJpbmcgaW4gYSBzdGVwIGJlZm9yZSB0aGUgcGFyYWxsZWwgc3RlcC4gVGhpcyB3YXkgdGhlIGZpbHRlciBoYXMgZnVsbCBhY2Nlc3MgdG8gcmVwb3MgYW5kIGdpdCBjb21tYW5kcyB3aXRob3V0IHJhY2UgY29uZGl0aW9ucywgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BlcmVubmlhbC9pc3N1ZXMvMzQxXG4gICAgZm9yICggY29uc3QgcmVsZWFzZUJyYW5jaCBvZiByZWxlYXNlQnJhbmNoZXMgKSB7XG4gICAgICBpZiAoICFmaWx0ZXIgfHwgYXdhaXQgZmlsdGVyKCByZWxlYXNlQnJhbmNoICkgKSB7XG4gICAgICAgIGZpbHRlcmVkQnJhbmNoZXMucHVzaCggcmVsZWFzZUJyYW5jaCApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCBgRmlsdGVyIGFwcGxpZWQuIFVwZGF0aW5nICR7ZmlsdGVyZWRCcmFuY2hlcy5sZW5ndGh9OmAsIGZpbHRlcmVkQnJhbmNoZXMubWFwKCB4ID0+IHgudG9TdHJpbmcoKSApICk7XG5cbiAgICBjb25zdCBhc3luY0Z1bmN0aW9ucyA9IGZpbHRlcmVkQnJhbmNoZXMubWFwKCByZWxlYXNlQnJhbmNoID0+ICggYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coICdCZWdpbm5pbmc6ICcsIHJlbGVhc2VCcmFuY2gudG9TdHJpbmcoKSApO1xuICAgICAgdHJ5IHtcblxuICAgICAgICBhd2FpdCByZWxlYXNlQnJhbmNoLnVwZGF0ZUNoZWNrb3V0KCk7XG5cbiAgICAgICAgb3B0aW9ucy50cmFuc3BpbGUgJiYgYXdhaXQgcmVsZWFzZUJyYW5jaC50cmFuc3BpbGUoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBvcHRpb25zLmJ1aWxkICYmIGF3YWl0IHJlbGVhc2VCcmFuY2guYnVpbGQoIG9wdGlvbnMuYnVpbGRPcHRpb25zICk7XG4gICAgICAgICAgY29uc29sZS5sb2coICdGaW5pc2hlZDogJywgcmVsZWFzZUJyYW5jaC50b1N0cmluZygpICk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goIGUgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coIGBmYWlsZWQgdG8gYnVpbGQgJHtyZWxlYXNlQnJhbmNoLnRvU3RyaW5nKCl9OiAke2V9YCApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjYXRjaCggZSApIHtcbiAgICAgICAgY29uc29sZS5sb2coIGBmYWlsZWQgdG8gdXBkYXRlIHJlbGVhc2VCcmFuY2ggJHtyZWxlYXNlQnJhbmNoLnRvU3RyaW5nKCl9OiAke2V9YCApO1xuICAgICAgfVxuICAgIH0gKSApO1xuXG4gICAgYXdhaXQgYXN5bmNRLnBhcmFsbGVsTGltaXQoIGFzeW5jRnVuY3Rpb25zLCBvcHRpb25zLmNvbmN1cnJlbnQgKTtcblxuICAgIGNvbnNvbGUubG9nKCAnRG9uZScgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gZmlsdGVyIC0gT3B0aW9uYWwgZmlsdGVyLCByZWxlYXNlIGJyYW5jaGVzIHdpbGwgYmUgc2tpcHBlZCBpZiB0aGlzIHJlc29sdmVzIHRvIGZhbHNlXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGNoZWNrVW5idWlsdENoZWNrb3V0cyggZmlsdGVyOiBGaWx0ZXJSQiApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZyggJ0NoZWNraW5nIHVuYnVpbHQgY2hlY2tvdXRzJyApO1xuXG4gICAgY29uc3QgcmVsZWFzZUJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcygpO1xuICAgIGZvciAoIGNvbnN0IHJlbGVhc2VCcmFuY2ggb2YgcmVsZWFzZUJyYW5jaGVzICkge1xuICAgICAgaWYgKCAhZmlsdGVyIHx8IGF3YWl0IGZpbHRlciggcmVsZWFzZUJyYW5jaCApICkge1xuICAgICAgICBjb25zb2xlLmxvZyggcmVsZWFzZUJyYW5jaC50b1N0cmluZygpICk7XG4gICAgICAgIGNvbnN0IHVuYnVpbHRSZXN1bHQgPSBhd2FpdCByZWxlYXNlQnJhbmNoLmNoZWNrVW5idWlsdCgpO1xuICAgICAgICBpZiAoIHVuYnVpbHRSZXN1bHQgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coIHVuYnVpbHRSZXN1bHQgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gZmlsdGVyIC0gT3B0aW9uYWwgZmlsdGVyLCByZWxlYXNlIGJyYW5jaGVzIHdpbGwgYmUgc2tpcHBlZCBpZiB0aGlzIHJlc29sdmVzIHRvIGZhbHNlXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGNoZWNrQnVpbHRDaGVja291dHMoIGZpbHRlcj86IEZpbHRlclJCICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCAnQ2hlY2tpbmcgYnVpbHQgY2hlY2tvdXRzJyApO1xuXG4gICAgY29uc3QgcmVsZWFzZUJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcygpO1xuICAgIGZvciAoIGNvbnN0IHJlbGVhc2VCcmFuY2ggb2YgcmVsZWFzZUJyYW5jaGVzICkge1xuICAgICAgaWYgKCAhZmlsdGVyIHx8IGF3YWl0IGZpbHRlciggcmVsZWFzZUJyYW5jaCApICkge1xuICAgICAgICBjb25zb2xlLmxvZyggcmVsZWFzZUJyYW5jaC50b1N0cmluZygpICk7XG4gICAgICAgIGNvbnN0IGJ1aWx0UmVzdWx0ID0gYXdhaXQgcmVsZWFzZUJyYW5jaC5jaGVja0J1aWx0KCk7XG4gICAgICAgIGlmICggYnVpbHRSZXN1bHQgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coIGJ1aWx0UmVzdWx0ICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVkZXBsb3lzIHByb2R1Y3Rpb24gdmVyc2lvbnMgb2YgYWxsIHJlbGVhc2UgYnJhbmNoZXMgKG9yIHRob3NlIG1hdGNoaW5nIGEgc3BlY2lmaWMgZmlsdGVyXG4gICAqXG4gICAqXG4gICAqIE5PVEU6IFRoaXMgZG9lcyBub3QgdXNlIHRoZSBjdXJyZW50IG1haW50ZW5hbmNlIHN0YXRlIVxuICAgKiBAcGFyYW0gbWVzc2FnZSAtIEdlbmVyYWxseSBhbiBpc3N1ZSB0byByZWZlcmVuY2VcbiAgICogQHBhcmFtIGZpbHRlciAtIE9wdGlvbmFsIGZpbHRlciwgcmVsZWFzZSBicmFuY2hlcyB3aWxsIGJlIHNraXBwZWQgaWYgdGhpcyByZXNvbHZlcyB0byBmYWxzZVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyByZWRlcGxveUFsbFByb2R1Y3Rpb24oIG1lc3NhZ2U6IHN0cmluZywgZmlsdGVyPzogRmlsdGVyUkIgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gSWdub3JlIHVucmVsZWFzZWQgYnJhbmNoZXMhXG4gICAgY29uc3QgcmVsZWFzZUJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcyggKCkgPT4gdHJ1ZSwgZmFsc2UgKTtcblxuICAgIGZvciAoIGNvbnN0IHJlbGVhc2VCcmFuY2ggb2YgcmVsZWFzZUJyYW5jaGVzICkge1xuICAgICAgaWYgKCBmaWx0ZXIgJiYgISggYXdhaXQgZmlsdGVyKCByZWxlYXNlQnJhbmNoICkgKSApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCByZWxlYXNlQnJhbmNoLnRvU3RyaW5nKCkgKTtcbiAgICAgIGF3YWl0IHJjKCByZWxlYXNlQnJhbmNoLnJlcG8sIHJlbGVhc2VCcmFuY2guYnJhbmNoLCByZWxlYXNlQnJhbmNoLmJyYW5kcywgdHJ1ZSwgbWVzc2FnZSApO1xuICAgICAgYXdhaXQgcHJvZHVjdGlvbiggcmVsZWFzZUJyYW5jaC5yZXBvLCByZWxlYXNlQnJhbmNoLmJyYW5jaCwgcmVsZWFzZUJyYW5jaC5icmFuZHMsIHRydWUsIGZhbHNlLCBtZXNzYWdlICk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coICdGaW5pc2hlZCByZWRlcGxveWluZycgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcHJvdG90eXBlIGNvcHkgb2YgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcygpLCBpbiB3aGljaCB3ZSB3aWxsIG11dGF0ZSB0aGUgY2xhc3MncyBhbGxSZWxlYXNlQnJhbmNoZXNcbiAgICogdG8gZW5zdXJlIHRoZXJlIGlzIG5vIHNhdmUvbG9hZCBvcmRlciBkZXBlbmRlbmN5IHByb2JsZW1zLlxuICAgKlxuICAgKlxuICAgKiBAcGFyYW0gZmlsdGVyIC0gcmV0dXJuIGZhbHNlIGlmIHRoZSBSZWxlYXNlQnJhbmNoIHNob3VsZCBiZSBleGNsdWRlZC5cbiAgICogQHBhcmFtIGNoZWNrVW5yZWxlYXNlZEJyYW5jaGVzIC0gSWYgZmFsc2UsIHdpbGwgc2tpcCBjaGVja2luZyBmb3IgdW5yZWxlYXNlZCBicmFuY2hlcy4gVGhpcyBjaGVja2luZyBuZWVkcyBhbGwgcmVwb3MgY2hlY2tlZCBvdXRcbiAgICogQHBhcmFtIGZvcmNlQ2FjaGVCcmVhayAtIHRydWUgaWYgeW91IHdhbnQgdG8gZm9yY2UgYSByZWNhbGN1bGF0aW9uIG9mIGFsbCBSZWxlYXNlQnJhbmNoZXNcbiAgICogQHJlamVjdHMge0V4ZWN1dGVFcnJvcn1cbiAgICovXG4gIHB1YmxpYyBhc3luYyBnZXRNYWludGVuYW5jZUJyYW5jaGVzKCBmaWx0ZXI6IEZpbHRlclN5bmNSQiA9ICgpID0+IHRydWUsIGNoZWNrVW5yZWxlYXNlZEJyYW5jaGVzID0gdHJ1ZSwgZm9yY2VDYWNoZUJyZWFrID0gZmFsc2UgKTogUHJvbWlzZTxSZWxlYXNlQnJhbmNoW10+IHtcbiAgICByZXR1cm4gTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcyggZmlsdGVyLCBjaGVja1VucmVsZWFzZWRCcmFuY2hlcywgZm9yY2VDYWNoZUJyZWFrLCB0aGlzICk7XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGZpbHRlciAtIHJldHVybiBmYWxzZSBpZiB0aGUgUmVsZWFzZUJyYW5jaCBzaG91bGQgYmUgZXhjbHVkZWQuXG4gICAqIEBwYXJhbSBjaGVja1VucmVsZWFzZWRCcmFuY2hlcyAtIElmIGZhbHNlLCB3aWxsIHNraXAgY2hlY2tpbmcgZm9yIHVucmVsZWFzZWQgYnJhbmNoZXMuIFRoaXMgY2hlY2tpbmcgbmVlZHMgYWxsIHJlcG9zIGNoZWNrZWQgb3V0XG4gICAqIEBwYXJhbSBmb3JjZUNhY2hlQnJlYWsgLSB0cnVlIGlmIHlvdSB3YW50IHRvIGZvcmNlIGEgcmVjYWxjdWxhdGlvbiBvZiBhbGwgUmVsZWFzZUJyYW5jaGVzXG4gICAqIEBwYXJhbSBtYWludGVuYW5jZSAtIGJ5IGRlZmF1bHQgbG9hZCBmcm9tIHNhdmVkIGZpbGUgdGhlIGN1cnJlbnQgbWFpbnRlbmFuY2UgaW5zdGFuY2UuXG4gICAqIEByZWplY3RzIHtFeGVjdXRlRXJyb3J9XG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGdldE1haW50ZW5hbmNlQnJhbmNoZXMoIGZpbHRlcjogRmlsdGVyU3luY1JCID0gKCkgPT4gdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1VucmVsZWFzZWRCcmFuY2hlcyA9IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VDYWNoZUJyZWFrID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCkgKTogUHJvbWlzZTxSZWxlYXNlQnJhbmNoW10+IHtcbiAgICBjb25zdCByZWxlYXNlQnJhbmNoZXMgPSBhd2FpdCBNYWludGVuYW5jZS5sb2FkQWxsTWFpbnRlbmFuY2VCcmFuY2hlcyggZm9yY2VDYWNoZUJyZWFrLCBtYWludGVuYW5jZSApO1xuXG4gICAgcmV0dXJuIHJlbGVhc2VCcmFuY2hlcy5maWx0ZXIoIHJlbGVhc2VCcmFuY2ggPT4ge1xuICAgICAgaWYgKCAhY2hlY2tVbnJlbGVhc2VkQnJhbmNoZXMgJiYgIXJlbGVhc2VCcmFuY2guaXNSZWxlYXNlZCApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbHRlciggcmVsZWFzZUJyYW5jaCApO1xuICAgIH0gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBldmVyeSBwb3RlbnRpYWwgUmVsZWFzZUJyYW5jaCAocHVibGlzaGVkIHBoZXQgYW5kIHBoZXQtaW8gYnJhbmRzLCBhcyB3ZWxsIGFzIHVucmVsZWFzZWQgYnJhbmNoZXMpLCBhbmRcbiAgICogc2F2ZXMgaXQgdG8gdGhlIG1haW50ZW5hbmNlIHN0YXRlLlxuICAgKlxuICAgKlxuICAgKiBDYWxsIHRoaXMgd2l0aCB0cnVlIHRvIGJyZWFrIHRoZSBjYWNoZSBhbmQgZm9yY2UgYSByZWNhbGN1bGF0aW9uIG9mIGFsbCBSZWxlYXNlQnJhbmNoZXNcbiAgICogQHBhcmFtIGZvcmNlQ2FjaGVCcmVhayAtIHRydWUgaWYgeW91IHdhbnQgdG8gZm9yY2UgYSByZWNhbGN1bGF0aW9uIG9mIGFsbCBSZWxlYXNlQnJhbmNoZXNcbiAgICogQHBhcmFtIG1haW50ZW5hbmNlIC0gYnkgZGVmYXVsdCBsb2FkIGZyb20gc2F2ZWQgZmlsZSB0aGUgY3VycmVudCBtYWludGVuYW5jZSBpbnN0YW5jZS5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgbG9hZEFsbE1haW50ZW5hbmNlQnJhbmNoZXMoIGZvcmNlQ2FjaGVCcmVhayA9IGZhbHNlLCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKSApOiBQcm9taXNlPFJlbGVhc2VCcmFuY2hbXT4ge1xuXG4gICAgbGV0IHJlbGVhc2VCcmFuY2hlcyA9IG51bGw7XG4gICAgaWYgKCBtYWludGVuYW5jZS5hbGxSZWxlYXNlQnJhbmNoZXMubGVuZ3RoID4gMCAmJiAhZm9yY2VDYWNoZUJyZWFrICkge1xuICAgICAgYXNzZXJ0KCBtYWludGVuYW5jZS5hbGxSZWxlYXNlQnJhbmNoZXNbIDAgXSBpbnN0YW5jZW9mIFJlbGVhc2VCcmFuY2gsICdkZXNlcmlhbGl6YXRpb24gY2hlY2snICk7XG4gICAgICByZWxlYXNlQnJhbmNoZXMgPSBtYWludGVuYW5jZS5hbGxSZWxlYXNlQnJhbmNoZXM7XG4gICAgfVxuICAgIGVsc2Uge1xuXG4gICAgICAvLyBjYWNoZSBtaXNzXG4gICAgICByZWxlYXNlQnJhbmNoZXMgPSBhd2FpdCBSZWxlYXNlQnJhbmNoLmdldEFsbE1haW50ZW5hbmNlQnJhbmNoZXMoKTtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZXF1aXJlLWF0b21pYy11cGRhdGVzXG4gICAgICBtYWludGVuYW5jZS5hbGxSZWxlYXNlQnJhbmNoZXMgPSByZWxlYXNlQnJhbmNoZXM7XG4gICAgICBtYWludGVuYW5jZS5zYXZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlbGVhc2VCcmFuY2hlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGZpeCBCVUdHWSBzaXR1YXRpb25zIChtdWx0aXBsZSBNb2RpZmllZEJyYW5jaCBvYmplY3RzIGZvciB0aGUgc2FtZSBhY3R1YWwgcmVsZWFzZSBicmFuY2gpLlxuICAgKiBOT1QgTkVFREVEIEZPUiBOT1JNQUwgVVNFLlxuICAgKlxuICAgKiBEb24ndCB1c2UgdGhpcyB1bmxlc3MgeW91J3ZlIHRhbGtlZCB3aXRoIEpPIGFib3V0IHRoZSBjb25zZXF1ZW5jZXMuIEhlIGhhZCBob3JyaWJseSBkdXBsaWNhdGVkIE1vZGlmaWVkQnJhbmNoZXMgZHVlXG4gICAqIHRvIGFkZE5lZWRlZFBhdGNoUmVsZWFzZUJyYW5jaCBjcmVhdGluZyBtYW55IGNvcGllcy4gVGhpcyBtYXkgYmUgdXNlZnVsIGluIHRoZSBmdXR1cmUgaWYgc2ltaWxhciB0eXBlcyBvZiBpc3N1ZXNcbiAgICogaGFwcGVuLiBGdW4gZmFjdCwgeW91IGNhbid0IHJlbW92ZSBuZWVkZWQgcGF0Y2hlcyBpZiB0aGlzIGhhcHBlbnMuIFJJUCB0aGUgMjAyNiBDQyBCWS1OQyByZWxlYXNlLCB5b3Ugd2lsbCBiZSBtaXNzZWQuXG4gICAqIE5ldmVyIGZvcmdldCBcImRlZHVwbGljYXRlZCBmcm9tIDkzMyB0byAxNTFcIi5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgZml4RHVwbGljYXRlZE1vZGlmaWVkQnJhbmNoZXMoKTogdm9pZCB7XG4gICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XG5cbiAgICBjb25zdCBtb2RpZmllZEJyYW5jaE1hcDogUmVjb3JkPHN0cmluZywgTW9kaWZpZWRCcmFuY2g+ID0ge307XG5cbiAgICBjb25zdCBzdGFydGluZ0NvdW50ID0gbWFpbnRlbmFuY2UubW9kaWZpZWRCcmFuY2hlcy5sZW5ndGg7XG5cbiAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xuICAgICAgLy8gRG9lcyBub3QgaW5jbHVkZSBicmFuZHMuIFdpbGwgZmFpbCBvdXQgb24gcHVycG9zZSBpbiB0aGUgY29tYmluZSgpIGxhdGVyIGlmIHdlIGhhdmUgYnJhbmQgbWlzbWF0Y2hlc1xuICAgICAgY29uc3Qga2V5ID0gYCR7bW9kaWZpZWRCcmFuY2gucmVsZWFzZUJyYW5jaC5yZXBvfS0ke21vZGlmaWVkQnJhbmNoLnJlbGVhc2VCcmFuY2guYnJhbmNofWA7XG5cbiAgICAgIGlmICggbW9kaWZpZWRCcmFuY2hNYXBbIGtleSBdICkge1xuICAgICAgICBtb2RpZmllZEJyYW5jaE1hcFsga2V5IF0gPSBtb2RpZmllZEJyYW5jaE1hcFsga2V5IF0uY29tYmluZSggbW9kaWZpZWRCcmFuY2ggKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBtb2RpZmllZEJyYW5jaE1hcFsga2V5IF0gPSBtb2RpZmllZEJyYW5jaDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzLmxlbmd0aCA9IDA7XG4gICAgbWFpbnRlbmFuY2UubW9kaWZpZWRCcmFuY2hlcy5wdXNoKCAuLi5PYmplY3QudmFsdWVzKCBtb2RpZmllZEJyYW5jaE1hcCApICk7XG5cbiAgICBtYWludGVuYW5jZS5zYXZlKCk7XG5cbiAgICBjb25zb2xlLmxvZyggYGRlZHVwbGljYXRlZCBmcm9tICR7c3RhcnRpbmdDb3VudH0gdG8gJHttYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzLmxlbmd0aH1gICk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBpbnRvIGEgcGxhaW4gSlMgb2JqZWN0IG1lYW50IGZvciBKU09OIHNlcmlhbGl6YXRpb24uXG4gICAqL1xuICBwdWJsaWMgc2VyaWFsaXplKCk6IE1haW50ZW5hbmNlU2VyaWFsaXplZCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhdGNoZXM6IHRoaXMucGF0Y2hlcy5tYXAoIHBhdGNoID0+IHBhdGNoLnNlcmlhbGl6ZSgpICksXG4gICAgICBtb2RpZmllZEJyYW5jaGVzOiB0aGlzLm1vZGlmaWVkQnJhbmNoZXMubWFwKCBtb2RpZmllZEJyYW5jaCA9PiBtb2RpZmllZEJyYW5jaC5zZXJpYWxpemUoKSApLFxuICAgICAgYWxsUmVsZWFzZUJyYW5jaGVzOiB0aGlzLmFsbFJlbGVhc2VCcmFuY2hlcy5tYXAoIHJlbGVhc2VCcmFuY2ggPT4gcmVsZWFzZUJyYW5jaC5zZXJpYWxpemUoKSApXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHNlcmlhbGl6ZWQgZm9ybSBvZiB0aGUgTWFpbnRlbmFuY2UgYW5kIHJldHVybnMgYW4gYWN0dWFsIGluc3RhbmNlLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBkZXNlcmlhbGl6ZSggeyBwYXRjaGVzID0gW10sIG1vZGlmaWVkQnJhbmNoZXMgPSBbXSwgYWxsUmVsZWFzZUJyYW5jaGVzID0gW10gfTogTWFpbnRlbmFuY2VTZXJpYWxpemVkICk6IE1haW50ZW5hbmNlIHtcbiAgICAvLyBQYXNzIGluIHBhdGNoIHJlZmVyZW5jZXMgdG8gYnJhbmNoIGRlc2VyaWFsaXphdGlvblxuICAgIGNvbnN0IGRlc2VyaWFsaXplZFBhdGNoZXMgPSBwYXRjaGVzLm1hcCggUGF0Y2guZGVzZXJpYWxpemUgKTtcbiAgICBjb25zdCBtb2RpZmllZEJyYW5jaGVzRGVzZXJpYWxpemVkID0gbW9kaWZpZWRCcmFuY2hlcy5tYXAoIG1vZGlmaWVkQnJhbmNoID0+IE1vZGlmaWVkQnJhbmNoLmRlc2VyaWFsaXplKCBtb2RpZmllZEJyYW5jaCwgZGVzZXJpYWxpemVkUGF0Y2hlcyApICk7XG4gICAgbW9kaWZpZWRCcmFuY2hlc0Rlc2VyaWFsaXplZC5zb3J0KCAoIGEsIGIgKSA9PiB7XG4gICAgICBpZiAoIGEucmVwbyAhPT0gYi5yZXBvICkge1xuICAgICAgICByZXR1cm4gYS5yZXBvIDwgYi5yZXBvID8gLTEgOiAxO1xuICAgICAgfVxuICAgICAgaWYgKCBhLmJyYW5jaCAhPT0gYi5icmFuY2ggKSB7XG4gICAgICAgIHJldHVybiBhLmJyYW5jaCA8IGIuYnJhbmNoID8gLTEgOiAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfSApO1xuICAgIGNvbnN0IGRlc2VyaWFsaXplZFJlbGVhc2VCcmFuY2hlcyA9IGFsbFJlbGVhc2VCcmFuY2hlcy5tYXAoIHJlbGVhc2VCcmFuY2ggPT4gUmVsZWFzZUJyYW5jaC5kZXNlcmlhbGl6ZSggcmVsZWFzZUJyYW5jaCApICk7XG5cbiAgICByZXR1cm4gbmV3IE1haW50ZW5hbmNlKCBkZXNlcmlhbGl6ZWRQYXRjaGVzLCBtb2RpZmllZEJyYW5jaGVzRGVzZXJpYWxpemVkLCBkZXNlcmlhbGl6ZWRSZWxlYXNlQnJhbmNoZXMgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTYXZlcyB0aGUgc3RhdGUgb2YgdGhpcyBvYmplY3QgaW50byB0aGUgbWFpbnRlbmFuY2UgZmlsZS5cbiAgICovXG4gIHB1YmxpYyBzYXZlKCk6IHZvaWQge1xuICAgIHJldHVybiBmcy53cml0ZUZpbGVTeW5jKCBNQUlOVEVOQU5DRV9GSUxFLCBKU09OLnN0cmluZ2lmeSggdGhpcy5zZXJpYWxpemUoKSwgbnVsbCwgMiApICk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYSBuZXcgTWFpbnRlbmFuY2Ugb2JqZWN0IChpZiBwb3NzaWJsZSkgZnJvbSB0aGUgbWFpbnRlbmFuY2UgZmlsZS5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgbG9hZCgpOiBNYWludGVuYW5jZSB7XG4gICAgaWYgKCBmcy5leGlzdHNTeW5jKCBNQUlOVEVOQU5DRV9GSUxFICkgKSB7XG4gICAgICByZXR1cm4gTWFpbnRlbmFuY2UuZGVzZXJpYWxpemUoIEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggTUFJTlRFTkFOQ0VfRklMRSwgJ3V0ZjgnICkgKSApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgTWFpbnRlbmFuY2UoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RhcnRzIGEgY29tbWFuZC1saW5lIFJFUEwgd2l0aCBmZWF0dXJlcyBsb2FkZWQuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHN0YXJ0UkVQTCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT4ge1xuICAgICAgd2luc3Rvbi5kZWZhdWx0LnRyYW5zcG9ydHMuY29uc29sZS5sZXZlbCA9ICdlcnJvcic7XG5cbiAgICAgIGNvbnN0IHNlc3Npb24gPSByZXBsLnN0YXJ0KCB7XG4gICAgICAgIHByb21wdDogJ21haW50ZW5hbmNlPiAnLFxuICAgICAgICB1c2VDb2xvcnM6IHRydWUsXG4gICAgICAgIHJlcGxNb2RlOiByZXBsLlJFUExfTU9ERV9TVFJJQ1QsXG4gICAgICAgIGlnbm9yZVVuZGVmaW5lZDogdHJ1ZVxuICAgICAgfSApO1xuXG4gICAgICAvLyBXYWl0IGZvciBwcm9taXNlcyBiZWZvcmUgYmVpbmcgcmVhZHkgZm9yIGlucHV0XG4gICAgICBjb25zdCBub2RlRXZhbCA9IHNlc3Npb24uZXZhbDtcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBkb2NzIHNheSByZWFkb25seSwgYnV0IE1LIGlzbid0IGdvaW5nIHRvIGNoYW5nZSB0aGlzIHdvcmtpbmcgY29kZVxuICAgICAgc2Vzc2lvblsgJ2V2YWwnIF0gPSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9kb3Qtbm90YXRpb25cbiAgICAgICAgKCBhc3luYyAoIGNtZCwgY29udGV4dCwgZmlsZW5hbWUsIGNhbGxiYWNrICkgPT4ge1xuICAgICAgICAgIG5vZGVFdmFsLmNhbGwoIHNlc3Npb24sIGNtZCwgY29udGV4dCwgZmlsZW5hbWUsICggXywgcmVzdWx0ICkgPT4ge1xuICAgICAgICAgICAgaWYgKCByZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlICkge1xuICAgICAgICAgICAgICByZXN1bHQudGhlbiggdmFsID0+IGNhbGxiYWNrKCBfLCB2YWwgKSApLmNhdGNoKCBlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIGUuc3RhY2sgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCBgTWFpbnRlbmFuY2UgdGFzayBmYWlsZWQ6XFxuJHtlLnN0YWNrfVxcbkZ1bGwgRXJyb3IgZGV0YWlsczpcXG4ke0pTT04uc3RyaW5naWZ5KCBlLCBudWxsLCAyICl9YCApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICggdHlwZW9mIGUgPT09ICdzdHJpbmcnICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvciggYE1haW50ZW5hbmNlIHRhc2sgZmFpbGVkOiAke2V9YCApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoIGBNYWludGVuYW5jZSB0YXNrIGZhaWxlZCB3aXRoIHVua25vd24gZXJyb3I6ICR7SlNPTi5zdHJpbmdpZnkoIGUsIG51bGwsIDIgKX1gICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9ICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2soIF8sIHJlc3VsdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gKTtcbiAgICAgICAgfSApIGFzIHR5cGVvZiBzZXNzaW9uLmV2YWw7XG5cbiAgICAgIC8vIE9ubHkgYXV0b2NvbXBsZXRlIFwicHVibGljXCIgQVBJIGZ1bmN0aW9ucyBmb3IgTWFpbnRlbmFuY2UuXG4gICAgICAvLyBjb25zdCBub2RlQ29tcGxldGVyID0gc2Vzc2lvbi5jb21wbGV0ZXI7XG4gICAgICAvLyBzZXNzaW9uLmNvbXBsZXRlciA9IGZ1bmN0aW9uKCB0ZXh0LCBjYiApIHtcbiAgICAgIC8vICAgbm9kZUNvbXBsZXRlciggdGV4dCwgKCBfLCBbIGNvbXBsZXRpb25zLCBjb21wbGV0ZWQgXSApID0+IHtcbiAgICAgIC8vICAgICBjb25zdCBtYXRjaCA9IGNvbXBsZXRlZC5tYXRjaCggL15NYWludGVuYW5jZVxcLihcXHcqKSsvICk7XG4gICAgICAvLyAgICAgaWYgKCBtYXRjaCApIHtcbiAgICAgIC8vICAgICAgIGNvbnN0IGZ1bmNTdGFydCA9IG1hdGNoWyAxIF07XG4gICAgICAvLyAgICAgICBjYiggbnVsbCwgWyBQVUJMSUNfRlVOQ1RJT05TLmZpbHRlciggZiA9PiBmLnN0YXJ0c1dpdGgoIGZ1bmNTdGFydCApICkubWFwKCBmID0+IGBNYWludGVuYW5jZS4ke2Z9YCApLCBjb21wbGV0ZWQgXSApO1xuICAgICAgLy8gICAgIH1cbiAgICAgIC8vICAgICBlbHNlIHtcbiAgICAgIC8vICAgICAgIGNiKCBudWxsLCBbIGNvbXBsZXRpb25zLCBjb21wbGV0ZWQgXSApO1xuICAgICAgLy8gICAgIH1cbiAgICAgIC8vICAgfSApO1xuICAgICAgLy8gfTtcblxuICAgICAgLy8gQWxsb3cgY29udHJvbGxpbmcgdmVyYm9zaXR5XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIGdsb2JhbCwgJ3ZlcmJvc2UnLCB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gd2luc3Rvbi5kZWZhdWx0LnRyYW5zcG9ydHMuY29uc29sZS5sZXZlbCA9PT0gJ2luZm8nO1xuICAgICAgICB9LFxuICAgICAgICBzZXQoIHZhbHVlICkge1xuICAgICAgICAgIHdpbnN0b24uZGVmYXVsdC50cmFuc3BvcnRzLmNvbnNvbGUubGV2ZWwgPSB2YWx1ZSA/ICdpbmZvJyA6ICdlcnJvcic7XG4gICAgICAgIH1cbiAgICAgIH0gKTtcblxuICAgICAgc2Vzc2lvbi5jb250ZXh0Lk1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2U7XG4gICAgICBzZXNzaW9uLmNvbnRleHQubSA9IE1haW50ZW5hbmNlO1xuICAgICAgc2Vzc2lvbi5jb250ZXh0Lk0gPSBNYWludGVuYW5jZTtcbiAgICAgIHNlc3Npb24uY29udGV4dC5SZWxlYXNlQnJhbmNoID0gUmVsZWFzZUJyYW5jaDtcbiAgICAgIHNlc3Npb24uY29udGV4dC5yYiA9IFJlbGVhc2VCcmFuY2g7XG5cbiAgICAgIHNlc3Npb24ub24oICdleGl0JywgcmVzb2x2ZSApO1xuICAgIH0gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb29rcyB1cCBhIHBhdGNoIGJ5IGl0cyBuYW1lLlxuICAgKi9cbiAgcHVibGljIGZpbmRQYXRjaCggcGF0Y2hOYW1lOiBzdHJpbmcgKTogUGF0Y2gge1xuICAgIC8vIFRPRE86IGFzc2VydCBpZiB0d28gcGF0Y2hlcyBoYXZlIHRoZSBzYW1lIG5hbWUsIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9wZXJlbm5pYWwvaXNzdWVzLzM2OVxuICAgIGNvbnN0IHBhdGNoID0gdGhpcy5wYXRjaGVzLmZpbmQoIHAgPT4gcC5uYW1lID09PSBwYXRjaE5hbWUgKTtcbiAgICBhc3NlcnQoIHBhdGNoLCBgUGF0Y2ggbm90IGZvdW5kIGZvciAke3BhdGNoTmFtZX1gICk7XG5cbiAgICByZXR1cm4gcGF0Y2g7XG4gIH1cblxuICAvKipcbiAgICogTG9va3MgdXAgKG9yIGFkZHMpIGEgTW9kaWZpZWRCcmFuY2ggYnkgaXRzIGlkZW50aWZ5aW5nIGluZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0gcmVwb1xuICAgKiBAcGFyYW0gYnJhbmNoXG4gICAqIEBwYXJhbSBbZXJyb3JJZk1pc3NpbmddXG4gICAqIEBwYXJhbSBbcmVsZWFzZUJyYW5jaGVzXSAtIElmIHByb3ZpZGVkLCBpdCB3aWxsIHNwZWVkIHVwIHRoZSBwcm9jZXNzXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgZW5zdXJlTW9kaWZpZWRCcmFuY2goIHJlcG86IHN0cmluZywgYnJhbmNoOiBzdHJpbmcsIGVycm9ySWZNaXNzaW5nID0gZmFsc2UsIHJlbGVhc2VCcmFuY2hlczogUmVsZWFzZUJyYW5jaFtdIHwgbnVsbCA9IG51bGwgKTogUHJvbWlzZTxNb2RpZmllZEJyYW5jaD4ge1xuICAgIGxldCBtb2RpZmllZEJyYW5jaCA9IHRoaXMubW9kaWZpZWRCcmFuY2hlcy5maW5kKCBtb2RpZmllZEJyYW5jaCA9PiBtb2RpZmllZEJyYW5jaC5yZXBvID09PSByZXBvICYmIG1vZGlmaWVkQnJhbmNoLmJyYW5jaCA9PT0gYnJhbmNoICk7XG5cbiAgICBpZiAoICFtb2RpZmllZEJyYW5jaCApIHtcbiAgICAgIGlmICggZXJyb3JJZk1pc3NpbmcgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYENvdWxkIG5vdCBmaW5kIGEgdHJhY2tlZCBtb2RpZmllZCBicmFuY2ggZm9yICR7cmVwb30gJHticmFuY2h9YCApO1xuICAgICAgfVxuXG4gICAgICAvLyBVc2UgdGhlIGluc3RhbmNlIHZlcnNpb24gb2YgZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcyB0byBtYWtlIHN1cmUgdGhhdCB0aGlzIE1haW50ZW5hbmNlIGluc3RhbmNlIGlzIHVwZGF0ZWQgd2l0aCBuZXcgUmVsZWFzZUJyYW5jaGVzLlxuICAgICAgcmVsZWFzZUJyYW5jaGVzID0gcmVsZWFzZUJyYW5jaGVzIHx8IGF3YWl0IHRoaXMuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcyggcmVsZWFzZUJyYW5jaCA9PiByZWxlYXNlQnJhbmNoLnJlcG8gPT09IHJlcG8gKTtcbiAgICAgIGNvbnN0IHJlbGVhc2VCcmFuY2ggPSByZWxlYXNlQnJhbmNoZXMuZmluZCggcmVsZWFzZSA9PiByZWxlYXNlLnJlcG8gPT09IHJlcG8gJiYgcmVsZWFzZS5icmFuY2ggPT09IGJyYW5jaCApO1xuICAgICAgYXNzZXJ0KCByZWxlYXNlQnJhbmNoLCBgQ291bGQgbm90IGZpbmQgYSByZWxlYXNlIGJyYW5jaCBmb3IgcmVwbz0ke3JlcG99IGJyYW5jaD0ke2JyYW5jaH1gICk7XG5cbiAgICAgIG1vZGlmaWVkQnJhbmNoID0gbmV3IE1vZGlmaWVkQnJhbmNoKCByZWxlYXNlQnJhbmNoICk7XG5cbiAgICAgIC8vIElmIHdlIGFyZSBjcmVhdGluZyBpdCwgYWRkIGl0IHRvIG91ciBsaXN0LlxuICAgICAgdGhpcy5tb2RpZmllZEJyYW5jaGVzLnB1c2goIG1vZGlmaWVkQnJhbmNoICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZGlmaWVkQnJhbmNoO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGVtcHRzIHRvIHJlbW92ZSBhIG1vZGlmaWVkIGJyYW5jaCAoaWYgaXQgZG9lc24ndCBuZWVkIHRvIGJlIGtlcHQgYXJvdW5kKS5cbiAgICovXG4gIHB1YmxpYyB0cnlSZW1vdmluZ01vZGlmaWVkQnJhbmNoKCBtb2RpZmllZEJyYW5jaDogTW9kaWZpZWRCcmFuY2ggKTogdm9pZCB7XG4gICAgaWYgKCBtb2RpZmllZEJyYW5jaC5pc1VudXNlZCApIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5tb2RpZmllZEJyYW5jaGVzLmluZGV4T2YoIG1vZGlmaWVkQnJhbmNoICk7XG4gICAgICBhc3NlcnQoIGluZGV4ID49IDAgKTtcblxuICAgICAgdGhpcy5tb2RpZmllZEJyYW5jaGVzLnNwbGljZSggaW5kZXgsIDEgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTWFpbnRlbmFuY2U7Il0sIm5hbWVzIjpbImFzc2VydCIsImFzeW5jUSIsImZzIiwiXyIsInBhdGgiLCJyZXBsIiwid2luc3RvbiIsInByb2R1Y3Rpb24iLCJyYyIsImJ1aWxkIiwiY2hlY2tvdXRNYWluIiwiY2hlY2tvdXRUYXJnZXQiLCJjaGlwcGVyU3VwcG9ydHNPdXRwdXRKU0dydW50VGFza3MiLCJDaGlwcGVyVmVyc2lvbiIsImV4ZWN1dGUiLCJnZXRBY3RpdmVSZXBvcyIsImdldEJyYW5jaGVzIiwiZ2V0QnJhbmNoTWFwIiwiZ2V0RGVwZW5kZW5jaWVzIiwiZ2l0QWRkIiwiZ2l0Q2hlY2tvdXQiLCJnaXRDaGVycnlQaWNrIiwiZ2l0Q29tbWl0IiwiZ2l0Q3JlYXRlQnJhbmNoIiwiZ2l0SXNDbGVhbiIsImdpdFB1bGwiLCJnaXRQdXNoIiwiZ2l0UmV2UGFyc2UiLCJncnVudENvbW1hbmQiLCJNb2RpZmllZEJyYW5jaCIsIlBhdGNoIiwiUEVSRU5OSUFMX1JPT1QiLCJSZWxlYXNlQnJhbmNoIiwiTUFJTlRFTkFOQ0VfRklMRSIsIk1haW50ZW5hbmNlIiwicGF0Y2hlcyIsIm1vZGlmaWVkQnJhbmNoZXMiLCJhbGxSZWxlYXNlQnJhbmNoZXMiLCJyZXNldCIsImtlZXBDYWNoZWRSZWxlYXNlQnJhbmNoZXMiLCJjb25zb2xlIiwibG9nIiwibWFpbnRlbmFuY2UiLCJsb2FkIiwicHVzaCIsInNhdmUiLCJjaGVja0JyYW5jaFN0YXR1cyIsImZpbHRlciIsInJlcG8iLCJyZWxlYXNlQnJhbmNoZXMiLCJnZXRNYWludGVuYW5jZUJyYW5jaGVzIiwiYnJhbmNoTWFwcyIsImdldEJyYW5jaE1hcEFzeW5jQ2FsbGJhY2siLCJyZWxlYXNlQnJhbmNoIiwiYnJhbmNoIiwibGluZSIsImdldFN0YXR1cyIsImJ1aWxkQWxsIiwiZmFpbGVkIiwiYnJhbmRzIiwiRXJyb3IiLCJlIiwibGVuZ3RoIiwiam9pbiIsImxpc3QiLCJvcHRpb25zIiwibW9kaWZpZWRCcmFuY2giLCJjb3VudCIsImluZGV4T2YiLCJpc1JlbGVhc2VkIiwiZGVwbG95ZWRWZXJzaW9uIiwidG9TdHJpbmciLCJuZWVkZWRQYXRjaGVzIiwibWFwIiwicGF0Y2giLCJuYW1lIiwicHVzaGVkTWVzc2FnZXMiLCJwZW5kaW5nTWVzc2FnZXMiLCJPYmplY3QiLCJrZXlzIiwiY2hhbmdlZERlcGVuZGVuY2llcyIsImtleSIsImluZGV4QW5kU3BhY2luZyIsIm1lc3NhZ2UiLCJzaGEiLCJzaGFzIiwidGltZXN0YW1wIiwiUHJvbWlzZSIsImFsbCIsImNhY2hlZFRpbWVzdGFtcFN0cmluZyIsImdldERpdmVyZ2luZ1RpbWVzdGFtcFN0cmluZyIsInNvcnRCeSIsImluY2x1ZGVzIiwidGltZXN0YW1wUHJlZml4IiwidGltZXN0YW1wTGlzdCIsImxpc3RMaW5rcyIsImRlcGxveWVkQnJhbmNoZXMiLCJwcm9kdWN0aW9uQnJhbmNoZXMiLCJ0ZXN0VHlwZSIsInJlbGVhc2VDYW5kaWRhdGVCcmFuY2hlcyIsImxpbmtzIiwiZ2V0RGVwbG95ZWRMaW5rTGluZXMiLCJsaW5rIiwiY3JlYXRlVW5yZWxlYXNlZElzc3VlcyIsImFkZGl0aW9uYWxOb3RlcyIsImNyZWF0ZVVucmVsZWFzZWRJc3N1ZSIsImNyZWF0ZVBhdGNoIiwicGF0Y2hOYW1lIiwicmVtb3ZlUGF0Y2giLCJmaW5kUGF0Y2giLCJzcGxpY2UiLCJhZGRQYXRjaFNIQSIsInJlbW92ZVBhdGNoU0hBIiwiaW5kZXgiLCJyZW1vdmVBbGxQYXRjaFNIQXMiLCJhZGROZWVkZWRQYXRjaCIsImVuc3VyZU1vZGlmaWVkQnJhbmNoIiwiYWRkTmVlZGVkUGF0Y2hSZWxlYXNlQnJhbmNoIiwiYWRkTmVlZGVkUGF0Y2hlcyIsIm5lZWRzUGF0Y2giLCJhZGRBbGxOZWVkZWRQYXRjaGVzIiwiYWRkTmVlZGVkUGF0Y2hlc0JlZm9yZSIsImlzTWlzc2luZ1NIQSIsImFkZE5lZWRlZFBhdGNoZXNBZnRlciIsImluY2x1ZGVzU0hBIiwiYWRkTmVlZGVkUGF0Y2hlc0J1aWxkRmlsdGVyIiwiY2hpcHBlclZlcnNpb24iLCJnZXRGcm9tUmVwb3NpdG9yeSIsImZpbGVuYW1lIiwibWFqb3IiLCJyZWFkRmlsZVN5bmMiLCJyZW1vdmVOZWVkZWRQYXRjaCIsInRyeVJlbW92aW5nTW9kaWZpZWRCcmFuY2giLCJyZW1vdmVOZWVkZWRQYXRjaGVzIiwibmVlZHNSZW1vdmFsIiwicmVtb3ZlTmVlZGVkUGF0Y2hlc0JlZm9yZSIsInJlbW92ZU5lZWRlZFBhdGNoZXNBZnRlciIsInNpbmdsZUZpbGVSZWxlYXNlQnJhbmNoRmlsdGVyIiwiZmlsZU5hbWUiLCJwcmVkaWNhdGUiLCJjaGVja291dCIsImV4aXN0c1N5bmMiLCJjb250ZW50cyIsImNoZWNrb3V0QnJhbmNoIiwib3V0cHV0SlMiLCJucG1VcGRhdGUiLCJlcnJvcnMiLCJjaGVja291dEFuZEJ1aWxkIiwiYnVpbGRPcHRpb25zIiwiY2xlYW5CdWlsZERpcmVjdG9yeSIsImJ1aWxkRGlyZWN0b3J5IiwicmVzb2x2ZSIsInByb21pc2VzIiwicm0iLCJyZWN1cnNpdmUiLCJmb3JjZSIsImFwcGx5UGF0Y2hlcyIsImluZm8iLCJzdWNjZXNzIiwibnVtQXBwbGllZCIsInNpbVN1Y2Nlc3MiLCJzbGljZSIsInBhdGNoUmVwbyIsInBhdGNoUmVwb0N1cnJlbnRTSEEiLCJkZXBlbmRlbmNpZXMiLCJoYXNTaGEiLCJjb2RlIiwiY2hlcnJ5UGlja1N1Y2Nlc3MiLCJjdXJyZW50U0hBIiwidXBkYXRlRGVwZW5kZW5jaWVzIiwiY2hhbmdlZFJlcG9zIiwiZGVwZW5kZW5jaWVzSlNPTkZpbGUiLCJkZXBlbmRlbmNpZXNKU09OIiwiSlNPTiIsInBhcnNlIiwiZGVwZW5kZW5jeSIsImRlcGVuZGVuY3lCcmFuY2giLCJicmFuY2hlcyIsIndyaXRlRmlsZVN5bmMiLCJzdHJpbmdpZnkiLCJjbGVhbkNoaXBwZXJEaXN0IiwiZGlzdFBhdGgiLCJkZXBsb3lSZWxlYXNlQ2FuZGlkYXRlcyIsImlzUmVhZHlGb3JSZWxlYXNlQ2FuZGlkYXRlIiwidmVyc2lvbiIsImVycm9yIiwiZGVwbG95UHJvZHVjdGlvbiIsImlzUmVhZHlGb3JQcm9kdWN0aW9uIiwidXBkYXRlQ2hlY2tvdXRzIiwicHJvdmlkZWRPcHRpb25zIiwibWVyZ2UiLCJjb25jdXJyZW50IiwidHJhbnNwaWxlIiwibGludCIsImZpbHRlcmVkQnJhbmNoZXMiLCJ4IiwiYXN5bmNGdW5jdGlvbnMiLCJ1cGRhdGVDaGVja291dCIsInBhcmFsbGVsTGltaXQiLCJjaGVja1VuYnVpbHRDaGVja291dHMiLCJ1bmJ1aWx0UmVzdWx0IiwiY2hlY2tVbmJ1aWx0IiwiY2hlY2tCdWlsdENoZWNrb3V0cyIsImJ1aWx0UmVzdWx0IiwiY2hlY2tCdWlsdCIsInJlZGVwbG95QWxsUHJvZHVjdGlvbiIsImNoZWNrVW5yZWxlYXNlZEJyYW5jaGVzIiwiZm9yY2VDYWNoZUJyZWFrIiwibG9hZEFsbE1haW50ZW5hbmNlQnJhbmNoZXMiLCJnZXRBbGxNYWludGVuYW5jZUJyYW5jaGVzIiwiZml4RHVwbGljYXRlZE1vZGlmaWVkQnJhbmNoZXMiLCJtb2RpZmllZEJyYW5jaE1hcCIsInN0YXJ0aW5nQ291bnQiLCJjb21iaW5lIiwidmFsdWVzIiwic2VyaWFsaXplIiwiZGVzZXJpYWxpemUiLCJkZXNlcmlhbGl6ZWRQYXRjaGVzIiwibW9kaWZpZWRCcmFuY2hlc0Rlc2VyaWFsaXplZCIsInNvcnQiLCJhIiwiYiIsImRlc2VyaWFsaXplZFJlbGVhc2VCcmFuY2hlcyIsInN0YXJ0UkVQTCIsInJlamVjdCIsImRlZmF1bHQiLCJ0cmFuc3BvcnRzIiwibGV2ZWwiLCJzZXNzaW9uIiwic3RhcnQiLCJwcm9tcHQiLCJ1c2VDb2xvcnMiLCJyZXBsTW9kZSIsIlJFUExfTU9ERV9TVFJJQ1QiLCJpZ25vcmVVbmRlZmluZWQiLCJub2RlRXZhbCIsImV2YWwiLCJjbWQiLCJjb250ZXh0IiwiY2FsbGJhY2siLCJjYWxsIiwicmVzdWx0IiwidGhlbiIsInZhbCIsImNhdGNoIiwic3RhY2siLCJkZWZpbmVQcm9wZXJ0eSIsImdsb2JhbCIsImdldCIsInNldCIsInZhbHVlIiwibSIsIk0iLCJyYiIsIm9uIiwiZmluZCIsInAiLCJlcnJvcklmTWlzc2luZyIsInJlbGVhc2UiLCJpc1VudXNlZCJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7O0NBSUMsR0FFRCxPQUFPQSxZQUFZLFNBQVM7QUFDNUIsZ0RBQWdEO0FBQ2hELE9BQU9DLFlBQVksVUFBVTtBQUM3QixPQUFPQyxRQUFRLEtBQUs7QUFDcEIsT0FBT0MsT0FBTyxTQUFTO0FBQ3ZCLE9BQU9DLFVBQVUsT0FBTztBQUN4QixPQUFPQyxVQUFVLE9BQU87QUFDeEIsT0FBT0MsYUFBYSxVQUFVO0FBQzlCLE9BQU9DLGdCQUFnQix5QkFBeUI7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