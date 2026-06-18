// Copyright 2018-2026, University of Colorado Boulder
/**
 * Represents a modified simulation release branch, with either pending or applied (and not published) changes.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */ import assert from 'assert';
import _ from 'lodash';
import SimVersion from '../browser-and-node/SimVersion.js';
import checkoutDependencies from './checkoutDependencies.js';
import getDependencies from './getDependencies.js';
import gitCheckout from './gitCheckout.js';
import githubCreateIssue from './githubCreateIssue.js';
import gitPull from './gitPull.js';
import ReleaseBranch from './ReleaseBranch.js';
let ModifiedBranch = class ModifiedBranch {
    /**
   * @param releaseBranch
   * @param changedDependencies -
   * @param neededPatches
   * @param pendingMessages - Messages from already-applied patches or other changes NOT included in dependencies.json yet
   * @param pushedMessages - Messages from already-applied patches or other changes that have been included in dependencies.json
   * @param deployedVersion - The deployed version for the latest patches applied. Will be reset to null when updates are made.
   */ constructor(releaseBranch, changedDependencies = {}, neededPatches = [], pendingMessages = [], pushedMessages = [], deployedVersion = null){
        this.releaseBranch = releaseBranch;
        this.changedDependencies = changedDependencies;
        this.neededPatches = neededPatches;
        this.pendingMessages = pendingMessages;
        this.pushedMessages = pushedMessages;
        this.deployedVersion = deployedVersion;
        this.repo = releaseBranch.repo;
        this.branch = releaseBranch.branch;
        this.brands = releaseBranch.brands;
    }
    /**
   * Convert into a plain JS object meant for JSON serialization.
   */ serialize() {
        return {
            releaseBranch: this.releaseBranch.serialize(),
            changedDependencies: this.changedDependencies,
            neededPatches: this.neededPatches.map((patch)=>patch.name),
            pendingMessages: this.pendingMessages,
            pushedMessages: this.pushedMessages,
            deployedVersion: this.deployedVersion ? this.deployedVersion.serialize() : null
        };
    }
    /**
   * Takes a serialized form of the ModifiedBranch and returns an actual instance.
   * For "patches" param, we only want to store patches in one location, so don't fully save the info.
   *
   */ static deserialize({ releaseBranch, changedDependencies, neededPatches = [], pendingMessages, pushedMessages, deployedVersion }, patches) {
        return new ModifiedBranch(ReleaseBranch.deserialize(releaseBranch), changedDependencies, neededPatches.map((name)=>patches.find((patch)=>patch.name === name)), pendingMessages, pushedMessages, deployedVersion ? SimVersion.deserialize(deployedVersion) : null);
    }
    /**
   * Only use this for advanced internal reasons if you are fixing many duplicated ModifiedBranch objects.
   *
   * Clears out deployed versions.
   */ combine(other) {
        if (!this.releaseBranch.equals(other.releaseBranch)) {
            throw new Error('Cannot combine ModifiedBranches');
        }
        return new ModifiedBranch(this.releaseBranch, {
            ...this.changedDependencies,
            ...other.changedDependencies // eslint-disable-line phet/no-object-spread-on-non-literals
        }, _.uniq([
            ...this.neededPatches,
            ...other.neededPatches
        ]), _.uniq([
            ...this.pendingMessages,
            ...other.pendingMessages
        ]), _.uniq([
            ...this.pushedMessages,
            ...other.pushedMessages
        ]), null);
    }
    /**
   * Whether there is no need to keep a reference to us.
   */ get isUnused() {
        return this.neededPatches.length === 0 && Object.keys(this.changedDependencies).length === 0 && this.pushedMessages.length === 0 && this.pendingMessages.length === 0;
    }
    /**
   * Whether it is safe to deploy a release candidate for this branch.
   */ get isReadyForReleaseCandidate() {
        return this.neededPatches.length === 0 && this.pushedMessages.length > 0 && this.deployedVersion === null;
    }
    /**
   * Whether it is safe to deploy a production version for this branch.
   */ get isReadyForProduction() {
        return this.neededPatches.length === 0 && this.pushedMessages.length > 0 && this.deployedVersion !== null && this.deployedVersion.testType === 'rc';
    }
    /**
   * Returns the branch name that should be used in dependency repositories.
   */ get dependencyBranch() {
        return `${this.repo}-${this.branch}`;
    }
    /**
   * Creates an issue to note that un-tested changes were patched into a branch, and should at some point be tested.
   */ async createUnreleasedIssue(additionalNotes = '') {
        await githubCreateIssue(this.repo, `Maintenance patches applied to branch ${this.branch}`, {
            labels: [
                'status:ready-for-qa'
            ],
            body: `This branch (${this.branch}) had changes related to the following applied:

${this.pushedMessages.map((message)=>`- ${message}`).join('\n')}

Presumably one or more of these changes is likely to have been applied after the last RC version, and should be spot-checked by QA in the next RC (or if it was ready for a production release, an additional spot-check RC should be created).
${additionalNotes ? `\n${additionalNotes}` : ''}`
        });
    }
    /**
   * Returns a string that prints out the supported features for the release branch
   */ async getSupportedFeaturesLine() {
        const packageJSON = await this.releaseBranch.getPackageJSON();
        const simFeatures = packageJSON?.phet?.simFeatures ?? {};
        const nonDefaultColorProfiles = simFeatures.colorProfiles?.filter((profile)=>profile !== 'default') ?? [];
        const colorProfilesString = nonDefaultColorProfiles.length ? ` colorProfiles: ${nonDefaultColorProfiles.join(',')}` : '';
        const supportedRegionsAndCultures = simFeatures.supportedRegionsAndCultures ?? [];
        const regionsAndCulturesString = supportedRegionsAndCultures.length ? ` supportedRegionsAndCultures: ${simFeatures.supportedRegionsAndCultures.join(',')}` : '';
        const features = Object.keys(simFeatures).filter((feature)=>feature !== 'colorProfiles' && feature !== 'supportedRegionsAndCultures');
        // console.log( 'features', features );
        // console.log( 'nonDefaultColorProfiles', nonDefaultColorProfiles );
        // console.log( 'simFeatures', simFeatures );
        // console.log( 'packageJSON', packageJSON );
        const mainString = features.join(', ') + colorProfilesString + regionsAndCulturesString;
        return mainString.length ? `- ${mainString}` : '';
    }
    /**
   * Returns a list of deployed links for testing (depending on the brands deployed).
   */ async getDeployedLinkLines(providedOptions) {
        assert(this.deployedVersion !== null);
        const options = _.merge({
            includeMessages: true,
            xhtml: false,
            a11yView: false,
            migration: false
        }, providedOptions);
        const linkSuffixes = [];
        const versionString = this.deployedVersion.toString();
        const standaloneParams = await this.releaseBranch.getPhetioStandaloneQueryParameter();
        const proxiesParams = await this.releaseBranch.usesRelativeSimPath() ? 'relativeSimPath' : 'launchLocalVersion';
        const studioName = this.brands.includes('phet-io') && await this.releaseBranch.usesPhetioStudio() ? 'studio' : 'instance-proxies';
        const studioNameBeautified = studioName === 'studio' ? 'Studio' : 'Instance Proxies';
        const usesChipper2 = await this.releaseBranch.usesChipper2();
        const hasXHTML = await this.releaseBranch.hasXHTML();
        const phetFolder = usesChipper2 ? '/phet' : '';
        const phetioFolder = usesChipper2 ? '/phet-io' : '';
        const phetSuffix = usesChipper2 ? '_phet' : '';
        const phetioSuffix = usesChipper2 ? '_all_phet-io' : '_en-phetio';
        const phetioBrandSuffix = usesChipper2 ? '' : '-phetio';
        const studioPathSuffix = await this.releaseBranch.usesPhetioStudioIndex() ? '' : `/${studioName}.html?sim=${this.repo}&${proxiesParams}`;
        const phetioDevVersion = usesChipper2 ? versionString : versionString.split('-').join('-phetio');
        const hasMigrationWrapper = await this.releaseBranch.hasMigrationWrapper();
        const supportsInteractiveDescription = options.a11yView ? await this.releaseBranch.supportsInteractiveDescription() : false;
        if (this.deployedVersion.testType === 'rc') {
            if (this.brands.includes('phet')) {
                linkSuffixes.push(`](https://phet-dev.colorado.edu/html/${this.repo}/${versionString}${phetFolder}/${this.repo}_all${phetSuffix}.html)`);
                if (options.a11yView && supportsInteractiveDescription) {
                    linkSuffixes.push(` a11y view](https://phet-dev.colorado.edu/html/${this.repo}/${versionString}${phetFolder}/${this.repo}_a11y_view.html)`);
                }
                if (options.xhtml && hasXHTML) {
                    linkSuffixes.push(` xhtml](https://phet-dev.colorado.edu/html/${this.repo}/${versionString}${phetFolder}/xhtml/${this.repo}_all.xhtml)`);
                }
            }
            if (this.brands.includes('phet-io')) {
                linkSuffixes.push(` phet-io](https://phet-dev.colorado.edu/html/${this.repo}/${phetioDevVersion}${phetioFolder}/${this.repo}${phetioSuffix}.html?${standaloneParams})`);
                linkSuffixes.push(` phet-io ${studioNameBeautified}](https://phet-dev.colorado.edu/html/${this.repo}/${phetioDevVersion}${phetioFolder}/wrappers/${studioName}${studioPathSuffix})`);
                if (options.migration && hasMigrationWrapper) {
                    linkSuffixes.push(` phet-io migration](https://phet-dev.colorado.edu/html/${this.repo}/${phetioDevVersion}${phetioFolder}/wrappers/migration/)`);
                }
            }
        } else {
            if (this.brands.includes('phet')) {
                linkSuffixes.push(`](https://phet.colorado.edu/sims/html/${this.repo}/${versionString}/${this.repo}_all.html)`);
                if (options.a11yView && supportsInteractiveDescription) {
                    linkSuffixes.push(` a11y view](https://phet.colorado.edu/sims/html/${this.repo}/${versionString}/${this.repo}_a11y_view.html)`);
                }
                if (options.xhtml && hasXHTML) {
                    linkSuffixes.push(` xhtml](https://phet.colorado.edu/sims/html/${this.repo}/${versionString}/xhtml/${this.repo}_all.xhtml)`);
                }
            }
            if (this.brands.includes('phet-io')) {
                linkSuffixes.push(` phet-io](https://phet-io.colorado.edu/sims/${this.repo}/${versionString}${phetioBrandSuffix}/${this.repo}${phetioSuffix}.html?${standaloneParams})`);
                linkSuffixes.push(` phet-io ${studioNameBeautified}](https://phet-io.colorado.edu/sims/${this.repo}/${versionString}${phetioBrandSuffix}/wrappers/${studioName}${studioPathSuffix})`);
            }
        }
        const results = linkSuffixes.map((link)=>`- [ ] [${this.repo} ${versionString}${link}`);
        if (options.includeMessages) {
            const featuresLine = await this.getSupportedFeaturesLine();
            if (featuresLine.length) {
                results.unshift(featuresLine);
            }
            results.unshift(`\n**${this.repo} ${this.branch}** ${await this.releaseBranch.getDivergingTimestampString()} (${this.pushedMessages.join(', ')})\n`);
        }
        return results;
    }
    /**
   * Checks out the modified branch.
   *
   * @returns - Names of checked out repositories
   */ async checkout(includeNpmUpdate = true) {
        await gitCheckout(this.repo, this.branch);
        await gitPull(this.repo);
        const dependencies = await getDependencies(this.repo);
        for (const key of Object.keys(this.changedDependencies)){
            // This should exist hopefully
            dependencies[key].sha = this.changedDependencies[key];
        }
        return checkoutDependencies(this.repo, dependencies, includeNpmUpdate);
    }
};
export default ModifiedBranch;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vTW9kaWZpZWRCcmFuY2gudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogUmVwcmVzZW50cyBhIG1vZGlmaWVkIHNpbXVsYXRpb24gcmVsZWFzZSBicmFuY2gsIHdpdGggZWl0aGVyIHBlbmRpbmcgb3IgYXBwbGllZCAoYW5kIG5vdCBwdWJsaXNoZWQpIGNoYW5nZXMuXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IFNpbVZlcnNpb24gZnJvbSAnLi4vYnJvd3Nlci1hbmQtbm9kZS9TaW1WZXJzaW9uLmpzJztcbmltcG9ydCBjaGVja291dERlcGVuZGVuY2llcyBmcm9tICcuL2NoZWNrb3V0RGVwZW5kZW5jaWVzLmpzJztcbmltcG9ydCBnZXREZXBlbmRlbmNpZXMgZnJvbSAnLi9nZXREZXBlbmRlbmNpZXMuanMnO1xuaW1wb3J0IGdpdENoZWNrb3V0IGZyb20gJy4vZ2l0Q2hlY2tvdXQuanMnO1xuaW1wb3J0IGdpdGh1YkNyZWF0ZUlzc3VlIGZyb20gJy4vZ2l0aHViQ3JlYXRlSXNzdWUuanMnO1xuaW1wb3J0IGdpdFB1bGwgZnJvbSAnLi9naXRQdWxsLmpzJztcbmltcG9ydCBQYXRjaCBmcm9tICcuL1BhdGNoLmpzJztcbmltcG9ydCBSZWxlYXNlQnJhbmNoIGZyb20gJy4vUmVsZWFzZUJyYW5jaC5qcyc7XG5cbi8vIEtleXMgYXJlIHJlcG8gbmFtZXMsIHZhbHVlcyBhcmUgU0hBc1xudHlwZSBEZXBlbmRlbmNpZXMgPSBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXG50eXBlIE1vZGlmaWVkQnJhbmNoU2VyaWFsaXplZCA9IHtcbiAgcmVsZWFzZUJyYW5jaDogUmV0dXJuVHlwZTxSZWxlYXNlQnJhbmNoWydzZXJpYWxpemUnXT47XG4gIGNoYW5nZWREZXBlbmRlbmNpZXM6IERlcGVuZGVuY2llcztcbiAgbmVlZGVkUGF0Y2hlczogc3RyaW5nW107XG4gIHBlbmRpbmdNZXNzYWdlczogc3RyaW5nW107XG4gIHB1c2hlZE1lc3NhZ2VzOiBzdHJpbmdbXTtcbiAgZGVwbG95ZWRWZXJzaW9uOiBSZXR1cm5UeXBlPFNpbVZlcnNpb25bJ3NlcmlhbGl6ZSddPiB8IG51bGw7XG59O1xuXG5leHBvcnQgdHlwZSBEZXBsb3llZExpbmtPcHRpb25zID0ge1xuXG4gIC8vIFdoZXRoZXIgdG8gaW5jbHVkZSB0aGUgaGVhZGVyIGxpbmUgd2l0aCBwdXNoZWQgbWVzc2FnZXMgYW5kIHN1cHBvcnRlZCBmZWF0dXJlcy5cbiAgaW5jbHVkZU1lc3NhZ2VzPzogYm9vbGVhbjtcblxuICAvLyBXaGV0aGVyIHRvIGluY2x1ZGUgWEhUTUwgbGlua3Mgd2hlbiB0aGUgc2ltIHN1cHBvcnRzIHRoZW0uXG4gIHhodG1sPzogYm9vbGVhbjtcblxuICAvLyBXaGV0aGVyIHRvIGluY2x1ZGUgYTExeSB2aWV3IGxpbmtzIHdoZW4gdGhlIHNpbSBzdXBwb3J0cyB0aGVtLlxuICBhMTF5Vmlldz86IGJvb2xlYW47XG5cbiAgLy8gV2hldGhlciB0byBpbmNsdWRlIG1pZ3JhdGlvbiB3cmFwcGVyIGxpbmtzIHdoZW4gdGhlIHNpbSBzdXBwb3J0cyB0aGVtLlxuICBtaWdyYXRpb24/OiBib29sZWFuO1xufTtcblxuY2xhc3MgTW9kaWZpZWRCcmFuY2gge1xuICBwdWJsaWMgcmVhZG9ubHkgcmVwbzogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgYnJhbmNoOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBicmFuZHM6IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gcmVsZWFzZUJyYW5jaFxuICAgKiBAcGFyYW0gY2hhbmdlZERlcGVuZGVuY2llcyAtXG4gICAqIEBwYXJhbSBuZWVkZWRQYXRjaGVzXG4gICAqIEBwYXJhbSBwZW5kaW5nTWVzc2FnZXMgLSBNZXNzYWdlcyBmcm9tIGFscmVhZHktYXBwbGllZCBwYXRjaGVzIG9yIG90aGVyIGNoYW5nZXMgTk9UIGluY2x1ZGVkIGluIGRlcGVuZGVuY2llcy5qc29uIHlldFxuICAgKiBAcGFyYW0gcHVzaGVkTWVzc2FnZXMgLSBNZXNzYWdlcyBmcm9tIGFscmVhZHktYXBwbGllZCBwYXRjaGVzIG9yIG90aGVyIGNoYW5nZXMgdGhhdCBoYXZlIGJlZW4gaW5jbHVkZWQgaW4gZGVwZW5kZW5jaWVzLmpzb25cbiAgICogQHBhcmFtIGRlcGxveWVkVmVyc2lvbiAtIFRoZSBkZXBsb3llZCB2ZXJzaW9uIGZvciB0aGUgbGF0ZXN0IHBhdGNoZXMgYXBwbGllZC4gV2lsbCBiZSByZXNldCB0byBudWxsIHdoZW4gdXBkYXRlcyBhcmUgbWFkZS5cbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVsZWFzZUJyYW5jaDogUmVsZWFzZUJyYW5jaCxcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2hhbmdlZERlcGVuZGVuY2llczogRGVwZW5kZW5jaWVzID0ge30sXG4gICAgcHVibGljIHJlYWRvbmx5IG5lZWRlZFBhdGNoZXM6IFBhdGNoW10gPSBbXSxcbiAgICBwdWJsaWMgcmVhZG9ubHkgcGVuZGluZ01lc3NhZ2VzOiBzdHJpbmdbXSA9IFtdLFxuICAgIHB1YmxpYyByZWFkb25seSBwdXNoZWRNZXNzYWdlczogc3RyaW5nW10gPSBbXSxcbiAgICBwdWJsaWMgZGVwbG95ZWRWZXJzaW9uOiBTaW1WZXJzaW9uIHwgbnVsbCA9IG51bGwgKSB7XG5cbiAgICB0aGlzLnJlcG8gPSByZWxlYXNlQnJhbmNoLnJlcG87XG4gICAgdGhpcy5icmFuY2ggPSByZWxlYXNlQnJhbmNoLmJyYW5jaDtcbiAgICB0aGlzLmJyYW5kcyA9IHJlbGVhc2VCcmFuY2guYnJhbmRzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgaW50byBhIHBsYWluIEpTIG9iamVjdCBtZWFudCBmb3IgSlNPTiBzZXJpYWxpemF0aW9uLlxuICAgKi9cbiAgcHVibGljIHNlcmlhbGl6ZSgpOiBNb2RpZmllZEJyYW5jaFNlcmlhbGl6ZWQge1xuICAgIHJldHVybiB7XG4gICAgICByZWxlYXNlQnJhbmNoOiB0aGlzLnJlbGVhc2VCcmFuY2guc2VyaWFsaXplKCksXG4gICAgICBjaGFuZ2VkRGVwZW5kZW5jaWVzOiB0aGlzLmNoYW5nZWREZXBlbmRlbmNpZXMsXG4gICAgICBuZWVkZWRQYXRjaGVzOiB0aGlzLm5lZWRlZFBhdGNoZXMubWFwKCBwYXRjaCA9PiBwYXRjaC5uYW1lICksXG4gICAgICBwZW5kaW5nTWVzc2FnZXM6IHRoaXMucGVuZGluZ01lc3NhZ2VzLFxuICAgICAgcHVzaGVkTWVzc2FnZXM6IHRoaXMucHVzaGVkTWVzc2FnZXMsXG4gICAgICBkZXBsb3llZFZlcnNpb246IHRoaXMuZGVwbG95ZWRWZXJzaW9uID8gdGhpcy5kZXBsb3llZFZlcnNpb24uc2VyaWFsaXplKCkgOiBudWxsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHNlcmlhbGl6ZWQgZm9ybSBvZiB0aGUgTW9kaWZpZWRCcmFuY2ggYW5kIHJldHVybnMgYW4gYWN0dWFsIGluc3RhbmNlLlxuICAgKiBGb3IgXCJwYXRjaGVzXCIgcGFyYW0sIHdlIG9ubHkgd2FudCB0byBzdG9yZSBwYXRjaGVzIGluIG9uZSBsb2NhdGlvbiwgc28gZG9uJ3QgZnVsbHkgc2F2ZSB0aGUgaW5mby5cbiAgICpcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgZGVzZXJpYWxpemUoIHsgcmVsZWFzZUJyYW5jaCwgY2hhbmdlZERlcGVuZGVuY2llcywgbmVlZGVkUGF0Y2hlcyA9IFtdLCBwZW5kaW5nTWVzc2FnZXMsIHB1c2hlZE1lc3NhZ2VzLCBkZXBsb3llZFZlcnNpb24gfTogTW9kaWZpZWRCcmFuY2hTZXJpYWxpemVkLCBwYXRjaGVzOiBQYXRjaFtdICk6IE1vZGlmaWVkQnJhbmNoIHtcbiAgICByZXR1cm4gbmV3IE1vZGlmaWVkQnJhbmNoKFxuICAgICAgUmVsZWFzZUJyYW5jaC5kZXNlcmlhbGl6ZSggcmVsZWFzZUJyYW5jaCApLFxuICAgICAgY2hhbmdlZERlcGVuZGVuY2llcyxcbiAgICAgIG5lZWRlZFBhdGNoZXMubWFwKCBuYW1lID0+IHBhdGNoZXMuZmluZCggcGF0Y2ggPT4gcGF0Y2gubmFtZSA9PT0gbmFtZSApISApLFxuICAgICAgcGVuZGluZ01lc3NhZ2VzLFxuICAgICAgcHVzaGVkTWVzc2FnZXMsXG4gICAgICBkZXBsb3llZFZlcnNpb24gPyBTaW1WZXJzaW9uLmRlc2VyaWFsaXplKCBkZXBsb3llZFZlcnNpb24gKSA6IG51bGxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIE9ubHkgdXNlIHRoaXMgZm9yIGFkdmFuY2VkIGludGVybmFsIHJlYXNvbnMgaWYgeW91IGFyZSBmaXhpbmcgbWFueSBkdXBsaWNhdGVkIE1vZGlmaWVkQnJhbmNoIG9iamVjdHMuXG4gICAqXG4gICAqIENsZWFycyBvdXQgZGVwbG95ZWQgdmVyc2lvbnMuXG4gICAqL1xuICBwdWJsaWMgY29tYmluZSggb3RoZXI6IE1vZGlmaWVkQnJhbmNoICk6IE1vZGlmaWVkQnJhbmNoIHtcbiAgICBpZiAoICF0aGlzLnJlbGVhc2VCcmFuY2guZXF1YWxzKCBvdGhlci5yZWxlYXNlQnJhbmNoICkgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoICdDYW5ub3QgY29tYmluZSBNb2RpZmllZEJyYW5jaGVzJyApO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTW9kaWZpZWRCcmFuY2goXG4gICAgICB0aGlzLnJlbGVhc2VCcmFuY2gsXG4gICAgICB7XG4gICAgICAgIC4uLnRoaXMuY2hhbmdlZERlcGVuZGVuY2llcywgLy8gZXNsaW50LWRpc2FibGUtbGluZSBwaGV0L25vLW9iamVjdC1zcHJlYWQtb24tbm9uLWxpdGVyYWxzXG4gICAgICAgIC4uLm90aGVyLmNoYW5nZWREZXBlbmRlbmNpZXMgLy8gZXNsaW50LWRpc2FibGUtbGluZSBwaGV0L25vLW9iamVjdC1zcHJlYWQtb24tbm9uLWxpdGVyYWxzXG4gICAgICB9LFxuICAgICAgXy51bmlxKCBbXG4gICAgICAgIC4uLnRoaXMubmVlZGVkUGF0Y2hlcyxcbiAgICAgICAgLi4ub3RoZXIubmVlZGVkUGF0Y2hlc1xuICAgICAgXSApLFxuICAgICAgXy51bmlxKCBbXG4gICAgICAgIC4uLnRoaXMucGVuZGluZ01lc3NhZ2VzLFxuICAgICAgICAuLi5vdGhlci5wZW5kaW5nTWVzc2FnZXNcbiAgICAgIF0gKSxcbiAgICAgIF8udW5pcSggW1xuICAgICAgICAuLi50aGlzLnB1c2hlZE1lc3NhZ2VzLFxuICAgICAgICAuLi5vdGhlci5wdXNoZWRNZXNzYWdlc1xuICAgICAgXSApLFxuICAgICAgbnVsbFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGVyZSBpcyBubyBuZWVkIHRvIGtlZXAgYSByZWZlcmVuY2UgdG8gdXMuXG4gICAqL1xuICBwdWJsaWMgZ2V0IGlzVW51c2VkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm5lZWRlZFBhdGNoZXMubGVuZ3RoID09PSAwICYmXG4gICAgICAgICAgIE9iamVjdC5rZXlzKCB0aGlzLmNoYW5nZWREZXBlbmRlbmNpZXMgKS5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgdGhpcy5wdXNoZWRNZXNzYWdlcy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgdGhpcy5wZW5kaW5nTWVzc2FnZXMubGVuZ3RoID09PSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgaXQgaXMgc2FmZSB0byBkZXBsb3kgYSByZWxlYXNlIGNhbmRpZGF0ZSBmb3IgdGhpcyBicmFuY2guXG4gICAqL1xuICBwdWJsaWMgZ2V0IGlzUmVhZHlGb3JSZWxlYXNlQ2FuZGlkYXRlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm5lZWRlZFBhdGNoZXMubGVuZ3RoID09PSAwICYmXG4gICAgICAgICAgIHRoaXMucHVzaGVkTWVzc2FnZXMubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICB0aGlzLmRlcGxveWVkVmVyc2lvbiA9PT0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIGl0IGlzIHNhZmUgdG8gZGVwbG95IGEgcHJvZHVjdGlvbiB2ZXJzaW9uIGZvciB0aGlzIGJyYW5jaC5cbiAgICovXG4gIHB1YmxpYyBnZXQgaXNSZWFkeUZvclByb2R1Y3Rpb24oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubmVlZGVkUGF0Y2hlcy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgdGhpcy5wdXNoZWRNZXNzYWdlcy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgIHRoaXMuZGVwbG95ZWRWZXJzaW9uICE9PSBudWxsICYmXG4gICAgICAgICAgIHRoaXMuZGVwbG95ZWRWZXJzaW9uLnRlc3RUeXBlID09PSAncmMnO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGJyYW5jaCBuYW1lIHRoYXQgc2hvdWxkIGJlIHVzZWQgaW4gZGVwZW5kZW5jeSByZXBvc2l0b3JpZXMuXG4gICAqL1xuICBwdWJsaWMgZ2V0IGRlcGVuZGVuY3lCcmFuY2goKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy5yZXBvfS0ke3RoaXMuYnJhbmNofWA7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpc3N1ZSB0byBub3RlIHRoYXQgdW4tdGVzdGVkIGNoYW5nZXMgd2VyZSBwYXRjaGVkIGludG8gYSBicmFuY2gsIGFuZCBzaG91bGQgYXQgc29tZSBwb2ludCBiZSB0ZXN0ZWQuXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgY3JlYXRlVW5yZWxlYXNlZElzc3VlKCBhZGRpdGlvbmFsTm90ZXMgPSAnJyApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBnaXRodWJDcmVhdGVJc3N1ZSggdGhpcy5yZXBvLCBgTWFpbnRlbmFuY2UgcGF0Y2hlcyBhcHBsaWVkIHRvIGJyYW5jaCAke3RoaXMuYnJhbmNofWAsIHtcbiAgICAgIGxhYmVsczogWyAnc3RhdHVzOnJlYWR5LWZvci1xYScgXSxcbiAgICAgIGJvZHk6IGBUaGlzIGJyYW5jaCAoJHt0aGlzLmJyYW5jaH0pIGhhZCBjaGFuZ2VzIHJlbGF0ZWQgdG8gdGhlIGZvbGxvd2luZyBhcHBsaWVkOlxuXG4ke3RoaXMucHVzaGVkTWVzc2FnZXMubWFwKCBtZXNzYWdlID0+IGAtICR7bWVzc2FnZX1gICkuam9pbiggJ1xcbicgKX1cblxuUHJlc3VtYWJseSBvbmUgb3IgbW9yZSBvZiB0aGVzZSBjaGFuZ2VzIGlzIGxpa2VseSB0byBoYXZlIGJlZW4gYXBwbGllZCBhZnRlciB0aGUgbGFzdCBSQyB2ZXJzaW9uLCBhbmQgc2hvdWxkIGJlIHNwb3QtY2hlY2tlZCBieSBRQSBpbiB0aGUgbmV4dCBSQyAob3IgaWYgaXQgd2FzIHJlYWR5IGZvciBhIHByb2R1Y3Rpb24gcmVsZWFzZSwgYW4gYWRkaXRpb25hbCBzcG90LWNoZWNrIFJDIHNob3VsZCBiZSBjcmVhdGVkKS5cbiR7YWRkaXRpb25hbE5vdGVzID8gYFxcbiR7YWRkaXRpb25hbE5vdGVzfWAgOiAnJ31gXG4gICAgfSApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgdGhhdCBwcmludHMgb3V0IHRoZSBzdXBwb3J0ZWQgZmVhdHVyZXMgZm9yIHRoZSByZWxlYXNlIGJyYW5jaFxuICAgKi9cbiAgcHVibGljIGFzeW5jIGdldFN1cHBvcnRlZEZlYXR1cmVzTGluZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHBhY2thZ2VKU09OID0gYXdhaXQgdGhpcy5yZWxlYXNlQnJhbmNoLmdldFBhY2thZ2VKU09OKCk7XG5cbiAgICBjb25zdCBzaW1GZWF0dXJlcyA9IHBhY2thZ2VKU09OPy5waGV0Py5zaW1GZWF0dXJlcyA/PyB7fTtcblxuICAgIGNvbnN0IG5vbkRlZmF1bHRDb2xvclByb2ZpbGVzID0gc2ltRmVhdHVyZXMuY29sb3JQcm9maWxlcz8uZmlsdGVyKCAoIHByb2ZpbGU6IHN0cmluZyApID0+IHByb2ZpbGUgIT09ICdkZWZhdWx0JyApID8/IFtdO1xuICAgIGNvbnN0IGNvbG9yUHJvZmlsZXNTdHJpbmcgPSBub25EZWZhdWx0Q29sb3JQcm9maWxlcy5sZW5ndGggPyBgIGNvbG9yUHJvZmlsZXM6ICR7bm9uRGVmYXVsdENvbG9yUHJvZmlsZXMuam9pbiggJywnICl9YCA6ICcnO1xuXG4gICAgY29uc3Qgc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzID0gc2ltRmVhdHVyZXMuc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzID8/IFtdO1xuICAgIGNvbnN0IHJlZ2lvbnNBbmRDdWx0dXJlc1N0cmluZyA9IHN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlcy5sZW5ndGggPyBgIHN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlczogJHtzaW1GZWF0dXJlcy5zdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMuam9pbiggJywnICl9YCA6ICcnO1xuXG4gICAgY29uc3QgZmVhdHVyZXMgPSBPYmplY3Qua2V5cyggc2ltRmVhdHVyZXMgKS5maWx0ZXIoIGZlYXR1cmUgPT4gZmVhdHVyZSAhPT0gJ2NvbG9yUHJvZmlsZXMnICYmIGZlYXR1cmUgIT09ICdzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMnICk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyggJ2ZlYXR1cmVzJywgZmVhdHVyZXMgKTtcbiAgICAvLyBjb25zb2xlLmxvZyggJ25vbkRlZmF1bHRDb2xvclByb2ZpbGVzJywgbm9uRGVmYXVsdENvbG9yUHJvZmlsZXMgKTtcbiAgICAvLyBjb25zb2xlLmxvZyggJ3NpbUZlYXR1cmVzJywgc2ltRmVhdHVyZXMgKTtcbiAgICAvLyBjb25zb2xlLmxvZyggJ3BhY2thZ2VKU09OJywgcGFja2FnZUpTT04gKTtcblxuICAgIGNvbnN0IG1haW5TdHJpbmcgPSBmZWF0dXJlcy5qb2luKCAnLCAnICkgKyBjb2xvclByb2ZpbGVzU3RyaW5nICsgcmVnaW9uc0FuZEN1bHR1cmVzU3RyaW5nO1xuXG4gICAgcmV0dXJuIG1haW5TdHJpbmcubGVuZ3RoID8gYC0gJHttYWluU3RyaW5nfWAgOiAnJztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbGlzdCBvZiBkZXBsb3llZCBsaW5rcyBmb3IgdGVzdGluZyAoZGVwZW5kaW5nIG9uIHRoZSBicmFuZHMgZGVwbG95ZWQpLlxuICAgKi9cbiAgcHVibGljIGFzeW5jIGdldERlcGxveWVkTGlua0xpbmVzKCBwcm92aWRlZE9wdGlvbnM/OiBEZXBsb3llZExpbmtPcHRpb25zICk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBhc3NlcnQoIHRoaXMuZGVwbG95ZWRWZXJzaW9uICE9PSBudWxsICk7XG5cbiAgICBjb25zdCBvcHRpb25zID0gXy5tZXJnZSgge1xuICAgICAgaW5jbHVkZU1lc3NhZ2VzOiB0cnVlLFxuICAgICAgeGh0bWw6IGZhbHNlLFxuICAgICAgYTExeVZpZXc6IGZhbHNlLFxuICAgICAgbWlncmF0aW9uOiBmYWxzZVxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xuXG4gICAgY29uc3QgbGlua1N1ZmZpeGVzID0gW107XG4gICAgY29uc3QgdmVyc2lvblN0cmluZyA9IHRoaXMuZGVwbG95ZWRWZXJzaW9uLnRvU3RyaW5nKCk7XG5cbiAgICBjb25zdCBzdGFuZGFsb25lUGFyYW1zID0gYXdhaXQgdGhpcy5yZWxlYXNlQnJhbmNoLmdldFBoZXRpb1N0YW5kYWxvbmVRdWVyeVBhcmFtZXRlcigpO1xuICAgIGNvbnN0IHByb3hpZXNQYXJhbXMgPSAoIGF3YWl0IHRoaXMucmVsZWFzZUJyYW5jaC51c2VzUmVsYXRpdmVTaW1QYXRoKCkgKSA/ICdyZWxhdGl2ZVNpbVBhdGgnIDogJ2xhdW5jaExvY2FsVmVyc2lvbic7XG4gICAgY29uc3Qgc3R1ZGlvTmFtZSA9ICggdGhpcy5icmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApICYmIGF3YWl0IHRoaXMucmVsZWFzZUJyYW5jaC51c2VzUGhldGlvU3R1ZGlvKCkgKSA/ICdzdHVkaW8nIDogJ2luc3RhbmNlLXByb3hpZXMnO1xuICAgIGNvbnN0IHN0dWRpb05hbWVCZWF1dGlmaWVkID0gc3R1ZGlvTmFtZSA9PT0gJ3N0dWRpbycgPyAnU3R1ZGlvJyA6ICdJbnN0YW5jZSBQcm94aWVzJztcbiAgICBjb25zdCB1c2VzQ2hpcHBlcjIgPSBhd2FpdCB0aGlzLnJlbGVhc2VCcmFuY2gudXNlc0NoaXBwZXIyKCk7XG4gICAgY29uc3QgaGFzWEhUTUwgPSBhd2FpdCB0aGlzLnJlbGVhc2VCcmFuY2guaGFzWEhUTUwoKTtcbiAgICBjb25zdCBwaGV0Rm9sZGVyID0gdXNlc0NoaXBwZXIyID8gJy9waGV0JyA6ICcnO1xuICAgIGNvbnN0IHBoZXRpb0ZvbGRlciA9IHVzZXNDaGlwcGVyMiA/ICcvcGhldC1pbycgOiAnJztcbiAgICBjb25zdCBwaGV0U3VmZml4ID0gdXNlc0NoaXBwZXIyID8gJ19waGV0JyA6ICcnO1xuICAgIGNvbnN0IHBoZXRpb1N1ZmZpeCA9IHVzZXNDaGlwcGVyMiA/ICdfYWxsX3BoZXQtaW8nIDogJ19lbi1waGV0aW8nO1xuICAgIGNvbnN0IHBoZXRpb0JyYW5kU3VmZml4ID0gdXNlc0NoaXBwZXIyID8gJycgOiAnLXBoZXRpbyc7XG4gICAgY29uc3Qgc3R1ZGlvUGF0aFN1ZmZpeCA9ICggYXdhaXQgdGhpcy5yZWxlYXNlQnJhbmNoLnVzZXNQaGV0aW9TdHVkaW9JbmRleCgpICkgPyAnJyA6IGAvJHtzdHVkaW9OYW1lfS5odG1sP3NpbT0ke3RoaXMucmVwb30mJHtwcm94aWVzUGFyYW1zfWA7XG4gICAgY29uc3QgcGhldGlvRGV2VmVyc2lvbiA9IHVzZXNDaGlwcGVyMiA/IHZlcnNpb25TdHJpbmcgOiB2ZXJzaW9uU3RyaW5nLnNwbGl0KCAnLScgKS5qb2luKCAnLXBoZXRpbycgKTtcbiAgICBjb25zdCBoYXNNaWdyYXRpb25XcmFwcGVyID0gYXdhaXQgdGhpcy5yZWxlYXNlQnJhbmNoLmhhc01pZ3JhdGlvbldyYXBwZXIoKTtcbiAgICBjb25zdCBzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24gPSBvcHRpb25zLmExMXlWaWV3ID8gYXdhaXQgdGhpcy5yZWxlYXNlQnJhbmNoLnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbigpIDogZmFsc2U7XG5cbiAgICBpZiAoIHRoaXMuZGVwbG95ZWRWZXJzaW9uLnRlc3RUeXBlID09PSAncmMnICkge1xuICAgICAgaWYgKCB0aGlzLmJyYW5kcy5pbmNsdWRlcyggJ3BoZXQnICkgKSB7XG4gICAgICAgIGxpbmtTdWZmaXhlcy5wdXNoKCBgXShodHRwczovL3BoZXQtZGV2LmNvbG9yYWRvLmVkdS9odG1sLyR7dGhpcy5yZXBvfS8ke3ZlcnNpb25TdHJpbmd9JHtwaGV0Rm9sZGVyfS8ke3RoaXMucmVwb31fYWxsJHtwaGV0U3VmZml4fS5odG1sKWAgKTtcbiAgICAgICAgaWYgKCBvcHRpb25zLmExMXlWaWV3ICYmIHN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbiApIHtcbiAgICAgICAgICBsaW5rU3VmZml4ZXMucHVzaCggYCBhMTF5IHZpZXddKGh0dHBzOi8vcGhldC1kZXYuY29sb3JhZG8uZWR1L2h0bWwvJHt0aGlzLnJlcG99LyR7dmVyc2lvblN0cmluZ30ke3BoZXRGb2xkZXJ9LyR7dGhpcy5yZXBvfV9hMTF5X3ZpZXcuaHRtbClgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCBvcHRpb25zLnhodG1sICYmIGhhc1hIVE1MICkge1xuICAgICAgICAgIGxpbmtTdWZmaXhlcy5wdXNoKCBgIHhodG1sXShodHRwczovL3BoZXQtZGV2LmNvbG9yYWRvLmVkdS9odG1sLyR7dGhpcy5yZXBvfS8ke3ZlcnNpb25TdHJpbmd9JHtwaGV0Rm9sZGVyfS94aHRtbC8ke3RoaXMucmVwb31fYWxsLnhodG1sKWAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCB0aGlzLmJyYW5kcy5pbmNsdWRlcyggJ3BoZXQtaW8nICkgKSB7XG4gICAgICAgIGxpbmtTdWZmaXhlcy5wdXNoKCBgIHBoZXQtaW9dKGh0dHBzOi8vcGhldC1kZXYuY29sb3JhZG8uZWR1L2h0bWwvJHt0aGlzLnJlcG99LyR7cGhldGlvRGV2VmVyc2lvbn0ke3BoZXRpb0ZvbGRlcn0vJHt0aGlzLnJlcG99JHtwaGV0aW9TdWZmaXh9Lmh0bWw/JHtzdGFuZGFsb25lUGFyYW1zfSlgICk7XG4gICAgICAgIGxpbmtTdWZmaXhlcy5wdXNoKCBgIHBoZXQtaW8gJHtzdHVkaW9OYW1lQmVhdXRpZmllZH1dKGh0dHBzOi8vcGhldC1kZXYuY29sb3JhZG8uZWR1L2h0bWwvJHt0aGlzLnJlcG99LyR7cGhldGlvRGV2VmVyc2lvbn0ke3BoZXRpb0ZvbGRlcn0vd3JhcHBlcnMvJHtzdHVkaW9OYW1lfSR7c3R1ZGlvUGF0aFN1ZmZpeH0pYCApO1xuICAgICAgICBpZiAoIG9wdGlvbnMubWlncmF0aW9uICYmIGhhc01pZ3JhdGlvbldyYXBwZXIgKSB7XG4gICAgICAgICAgbGlua1N1ZmZpeGVzLnB1c2goIGAgcGhldC1pbyBtaWdyYXRpb25dKGh0dHBzOi8vcGhldC1kZXYuY29sb3JhZG8uZWR1L2h0bWwvJHt0aGlzLnJlcG99LyR7cGhldGlvRGV2VmVyc2lvbn0ke3BoZXRpb0ZvbGRlcn0vd3JhcHBlcnMvbWlncmF0aW9uLylgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpZiAoIHRoaXMuYnJhbmRzLmluY2x1ZGVzKCAncGhldCcgKSApIHtcbiAgICAgICAgbGlua1N1ZmZpeGVzLnB1c2goIGBdKGh0dHBzOi8vcGhldC5jb2xvcmFkby5lZHUvc2ltcy9odG1sLyR7dGhpcy5yZXBvfS8ke3ZlcnNpb25TdHJpbmd9LyR7dGhpcy5yZXBvfV9hbGwuaHRtbClgICk7XG4gICAgICAgIGlmICggb3B0aW9ucy5hMTF5VmlldyAmJiBzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24gKSB7XG4gICAgICAgICAgbGlua1N1ZmZpeGVzLnB1c2goIGAgYTExeSB2aWV3XShodHRwczovL3BoZXQuY29sb3JhZG8uZWR1L3NpbXMvaHRtbC8ke3RoaXMucmVwb30vJHt2ZXJzaW9uU3RyaW5nfS8ke3RoaXMucmVwb31fYTExeV92aWV3Lmh0bWwpYCApO1xuICAgICAgICB9XG4gICAgICAgIGlmICggb3B0aW9ucy54aHRtbCAmJiBoYXNYSFRNTCApIHtcbiAgICAgICAgICBsaW5rU3VmZml4ZXMucHVzaCggYCB4aHRtbF0oaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdS9zaW1zL2h0bWwvJHt0aGlzLnJlcG99LyR7dmVyc2lvblN0cmluZ30veGh0bWwvJHt0aGlzLnJlcG99X2FsbC54aHRtbClgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICggdGhpcy5icmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApICkge1xuICAgICAgICBsaW5rU3VmZml4ZXMucHVzaCggYCBwaGV0LWlvXShodHRwczovL3BoZXQtaW8uY29sb3JhZG8uZWR1L3NpbXMvJHt0aGlzLnJlcG99LyR7dmVyc2lvblN0cmluZ30ke3BoZXRpb0JyYW5kU3VmZml4fS8ke3RoaXMucmVwb30ke3BoZXRpb1N1ZmZpeH0uaHRtbD8ke3N0YW5kYWxvbmVQYXJhbXN9KWAgKTtcbiAgICAgICAgbGlua1N1ZmZpeGVzLnB1c2goIGAgcGhldC1pbyAke3N0dWRpb05hbWVCZWF1dGlmaWVkfV0oaHR0cHM6Ly9waGV0LWlvLmNvbG9yYWRvLmVkdS9zaW1zLyR7dGhpcy5yZXBvfS8ke3ZlcnNpb25TdHJpbmd9JHtwaGV0aW9CcmFuZFN1ZmZpeH0vd3JhcHBlcnMvJHtzdHVkaW9OYW1lfSR7c3R1ZGlvUGF0aFN1ZmZpeH0pYCApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdHMgPSBsaW5rU3VmZml4ZXMubWFwKCBsaW5rID0+IGAtIFsgXSBbJHt0aGlzLnJlcG99ICR7dmVyc2lvblN0cmluZ30ke2xpbmt9YCApO1xuICAgIGlmICggb3B0aW9ucy5pbmNsdWRlTWVzc2FnZXMgKSB7XG4gICAgICBjb25zdCBmZWF0dXJlc0xpbmUgPSBhd2FpdCB0aGlzLmdldFN1cHBvcnRlZEZlYXR1cmVzTGluZSgpO1xuICAgICAgaWYgKCBmZWF0dXJlc0xpbmUubGVuZ3RoICkge1xuICAgICAgICByZXN1bHRzLnVuc2hpZnQoIGZlYXR1cmVzTGluZSApO1xuICAgICAgfVxuICAgICAgcmVzdWx0cy51bnNoaWZ0KCBgXFxuKioke3RoaXMucmVwb30gJHt0aGlzLmJyYW5jaH0qKiAke2F3YWl0IHRoaXMucmVsZWFzZUJyYW5jaC5nZXREaXZlcmdpbmdUaW1lc3RhbXBTdHJpbmcoKX0gKCR7dGhpcy5wdXNoZWRNZXNzYWdlcy5qb2luKCAnLCAnICl9KVxcbmAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIG91dCB0aGUgbW9kaWZpZWQgYnJhbmNoLlxuICAgKlxuICAgKiBAcmV0dXJucyAtIE5hbWVzIG9mIGNoZWNrZWQgb3V0IHJlcG9zaXRvcmllc1xuICAgKi9cbiAgcHVibGljIGFzeW5jIGNoZWNrb3V0KCBpbmNsdWRlTnBtVXBkYXRlID0gdHJ1ZSApOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcbiAgICBhd2FpdCBnaXRQdWxsKCB0aGlzLnJlcG8gKTtcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xuICAgIGZvciAoIGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyggdGhpcy5jaGFuZ2VkRGVwZW5kZW5jaWVzICkgKSB7XG4gICAgICAvLyBUaGlzIHNob3VsZCBleGlzdCBob3BlZnVsbHlcbiAgICAgIGRlcGVuZGVuY2llc1sga2V5IF0uc2hhID0gdGhpcy5jaGFuZ2VkRGVwZW5kZW5jaWVzWyBrZXkgXTtcbiAgICB9XG4gICAgcmV0dXJuIGNoZWNrb3V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8sIGRlcGVuZGVuY2llcywgaW5jbHVkZU5wbVVwZGF0ZSApO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1vZGlmaWVkQnJhbmNoOyJdLCJuYW1lcyI6WyJhc3NlcnQiLCJfIiwiU2ltVmVyc2lvbiIsImNoZWNrb3V0RGVwZW5kZW5jaWVzIiwiZ2V0RGVwZW5kZW5jaWVzIiwiZ2l0Q2hlY2tvdXQiLCJnaXRodWJDcmVhdGVJc3N1ZSIsImdpdFB1bGwiLCJSZWxlYXNlQnJhbmNoIiwiTW9kaWZpZWRCcmFuY2giLCJyZWxlYXNlQnJhbmNoIiwiY2hhbmdlZERlcGVuZGVuY2llcyIsIm5lZWRlZFBhdGNoZXMiLCJwZW5kaW5nTWVzc2FnZXMiLCJwdXNoZWRNZXNzYWdlcyIsImRlcGxveWVkVmVyc2lvbiIsInJlcG8iLCJicmFuY2giLCJicmFuZHMiLCJzZXJpYWxpemUiLCJtYXAiLCJwYXRjaCIsIm5hbWUiLCJkZXNlcmlhbGl6ZSIsInBhdGNoZXMiLCJmaW5kIiwiY29tYmluZSIsIm90aGVyIiwiZXF1YWxzIiwiRXJyb3IiLCJ1bmlxIiwiaXNVbnVzZWQiLCJsZW5ndGgiLCJPYmplY3QiLCJrZXlzIiwiaXNSZWFkeUZvclJlbGVhc2VDYW5kaWRhdGUiLCJpc1JlYWR5Rm9yUHJvZHVjdGlvbiIsInRlc3RUeXBlIiwiZGVwZW5kZW5jeUJyYW5jaCIsImNyZWF0ZVVucmVsZWFzZWRJc3N1ZSIsImFkZGl0aW9uYWxOb3RlcyIsImxhYmVscyIsImJvZHkiLCJtZXNzYWdlIiwiam9pbiIsImdldFN1cHBvcnRlZEZlYXR1cmVzTGluZSIsInBhY2thZ2VKU09OIiwiZ2V0UGFja2FnZUpTT04iLCJzaW1GZWF0dXJlcyIsInBoZXQiLCJub25EZWZhdWx0Q29sb3JQcm9maWxlcyIsImNvbG9yUHJvZmlsZXMiLCJmaWx0ZXIiLCJwcm9maWxlIiwiY29sb3JQcm9maWxlc1N0cmluZyIsInN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlcyIsInJlZ2lvbnNBbmRDdWx0dXJlc1N0cmluZyIsImZlYXR1cmVzIiwiZmVhdHVyZSIsIm1haW5TdHJpbmciLCJnZXREZXBsb3llZExpbmtMaW5lcyIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJtZXJnZSIsImluY2x1ZGVNZXNzYWdlcyIsInhodG1sIiwiYTExeVZpZXciLCJtaWdyYXRpb24iLCJsaW5rU3VmZml4ZXMiLCJ2ZXJzaW9uU3RyaW5nIiwidG9TdHJpbmciLCJzdGFuZGFsb25lUGFyYW1zIiwiZ2V0UGhldGlvU3RhbmRhbG9uZVF1ZXJ5UGFyYW1ldGVyIiwicHJveGllc1BhcmFtcyIsInVzZXNSZWxhdGl2ZVNpbVBhdGgiLCJzdHVkaW9OYW1lIiwiaW5jbHVkZXMiLCJ1c2VzUGhldGlvU3R1ZGlvIiwic3R1ZGlvTmFtZUJlYXV0aWZpZWQiLCJ1c2VzQ2hpcHBlcjIiLCJoYXNYSFRNTCIsInBoZXRGb2xkZXIiLCJwaGV0aW9Gb2xkZXIiLCJwaGV0U3VmZml4IiwicGhldGlvU3VmZml4IiwicGhldGlvQnJhbmRTdWZmaXgiLCJzdHVkaW9QYXRoU3VmZml4IiwidXNlc1BoZXRpb1N0dWRpb0luZGV4IiwicGhldGlvRGV2VmVyc2lvbiIsInNwbGl0IiwiaGFzTWlncmF0aW9uV3JhcHBlciIsInN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbiIsInB1c2giLCJyZXN1bHRzIiwibGluayIsImZlYXR1cmVzTGluZSIsInVuc2hpZnQiLCJnZXREaXZlcmdpbmdUaW1lc3RhbXBTdHJpbmciLCJjaGVja291dCIsImluY2x1ZGVOcG1VcGRhdGUiLCJkZXBlbmRlbmNpZXMiLCJrZXkiLCJzaGEiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7Ozs7Q0FLQyxHQUVELE9BQU9BLFlBQVksU0FBUztBQUM1QixPQUFPQyxPQUFPLFNBQVM7QUFDdkIsT0FBT0MsZ0JBQWdCLG9DQUFvQztBQUMzRCxPQUFPQywwQkFBMEIsNEJBQTRCO0FBQzdELE9B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