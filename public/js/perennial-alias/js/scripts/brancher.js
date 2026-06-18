// Copyright 2024, University of Colorado Boulder
// This is a prototype and I want to mark areas that need more work.
/* eslint-disable phet/todo-should-have-issue */ /**
 * PROTOTYPE: Careful using this, it is not well tested.
 *
 * This script supports managing feature branches in many repos all at once. You can perform operations like creating,
 * deleting, and merging branches in all active repositories.
 *
 * Ensure branch naming follows PhET conventions: lowerCamelCase with letters and numbers only.
 *
 * Usage: node script.js <command> <branch-name>
 * Commands:
 *   - create: Creates a new branch across all active repositories.
 *   - delete-local: Deletes a branch locally in all repositories.
 *   - delete-remote: Deletes a branch from the remote repository in all repositories.
 *   - checkout: Checks out an existing branch in all repositories.
 *   - merge-into-feature: Merges 'main' into the specified feature branch.
 *   - merge-into-main: Merges a specified feature branch into 'main'.
 *   - check-branch: Prints repos that have commits ahead of main.
 *   - check-main: Prints repos that are missing commits from main.
 *   - check-working: Prints repos that have local uncommitted changes.
 *
 * Examples:
 *   - node script.js create myFeatureBranch
 *   - node script.js delete-local myFeatureBranch
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */ const readline = require('readline');
const { exec } = require('child_process');
// Path to the root directory with all repositories.
const rootPath = `${__dirname}/../../..`;
const fs = require('fs');
const contents = fs.readFileSync(`${__dirname}../../../data/active-repos`, 'utf8').trim();
const repos = contents.split('\n').map((sim)=>sim.trim());
// const repos = [
//   'axon',
//   'aqua'
// ];
/**
 * Runs a git command in a repository asynchronously.
 * @param {string} repo - The name of the repository to execute the git command in.
 * @param {string} command - The git command to execute.
 * @returns {Promise<Buffer>} - A promise that resolves with the result of the command.
 */ const execGitCommand = async (repo, command)=>{
    const path = `${rootPath}/${repo}`;
    return new Promise((resolve, reject)=>{
        // pipe hides results but makes them available for processing
        exec(`git -C ${path} ${command}`, {
            stdio: 'pipe'
        }, (error, stdout, stderr)=>{
            if (error) {
                console.error(`Error executing git command in ${repo}: ${stderr || error.message}`);
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
};
/**
 * Get a y/n response from the user.
 *
 * @param {string} question - y/n is appended to the question
 * @param {async function} onConfirm - callback if the user confirms
 * @param {async function } onCancel - callback if the user cancels
 */ const getConfirmation = (question, onConfirm, onCancel)=>{
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(`${question} (y/n) `, async (answer)=>{
        if (answer.toLowerCase() === 'y') {
            await onConfirm();
        } else {
            await onCancel();
        }
        rl.close();
    });
};
/**
 * Check if a branch exists in a repository.
 * @param repo
 * @param branchName
 * @param checkRemote - check remote as well?
 */ const branchExists = async (repo, branchName, checkRemote)=>{
    try {
        // Check for the branch locally
        const localPromise = await execGitCommand(repo, `branch --list ${branchName}`);
        const localBranches = localPromise.toString().trim();
        if (localBranches) {
            return true;
        }
        if (checkRemote) {
            // Check for the branch remotely
            const remotePromise = await execGitCommand(repo, `branch -r --list origin/${branchName}`);
            const remoteBranches = remotePromise.toString().trim();
            return !!remoteBranches;
        }
        return false;
    } catch (error) {
        console.error(`Error checking branches in ${repo}: ${error.message}`);
        process.exit(1);
        return false;
    }
};
/**
 * Validate a branch name. Convention uses the same as PhET's 'one-off' branches which means only letters and numbers and in
 * lowerCamelCase.
 */ const validateBranchName = (branchName)=>{
    const pattern = /^[a-z]+([A-Z][a-z0-9]+)*$/;
    if (!pattern.test(branchName)) {
        console.error(`Branch name '${branchName}' is invalid. Branch names must be lower camel case and only contain letters and numbers.`);
        process.exit(1);
    }
};
/**
 * Make sure that the branch exists in all repositories. As soon as one repository does not have the branch, the script
 * will exit.
 */ const ensureBranchExists = async (branchName, checkRemote)=>{
    console.log('Checking branch exists in all repositories...');
    for (const repo of repos){
        const exists = await branchExists(repo, branchName, checkRemote);
        if (!exists) {
            console.error(`Branch '${branchName}' does not exist in ${repo}. You may need to pull it from remote.`);
            process.exit(1);
        }
    }
};
/**
 * Creates a new branch in all repositories. Feature branches are alwasy created from main.
 * If the branch already exists in any repository (local or remote), the script will exit.
 * Working copy will be on the new branch after this operation.
 */ const createBranch = async (branchName)=>{
    // Make sure the branchName is valid
    validateBranchName(branchName);
    console.log('Checking out main to create feature branches...');
    for (const repo of repos){
        await execGitCommand(repo, 'checkout main');
    }
    // First, check to see if the provided branch name already exists in the repo.
    console.log('Making sure branch name is available...');
    for (const repo of repos){
        const existsLocal = await branchExists(repo, branchName, false);
        const existsRemote = await branchExists(repo, branchName, true);
        if (existsLocal || existsRemote) {
            console.error(`Branch '${branchName}' already exists in ${repo}. Aborting create.`);
            process.exit(1);
        }
    }
    console.log(`Branch '${branchName}' is available in all repositories. Creating...`);
    for (const repo of repos){
        try {
            await execGitCommand(repo, 'checkout main');
            await execGitCommand(repo, `checkout -b ${branchName}`);
            console.log(`Branch ${branchName} created in ${repo}`);
        } catch (error) {
            console.error(`Error creating branch in ${repo}: ${error.message}`);
            process.exit(1);
        }
    }
    console.log(`Branch '${branchName}' created across all repositories.`);
};
const deleteBranch = async (branchName, remote)=>{
    getConfirmation(`Are you sure you want to delete the branch '${branchName}' ${remote ? 'from REMOTE' : 'locally'} in all repositories?`, async ()=>{
        // Delete the branch in each repository
        for (const repo of repos){
            const exists = await branchExists(repo, branchName, remote);
            if (!exists) {
                // The branch does not exist, skipping.
                console.log(`${repo} does not have branch ${branchName}, skipping delete...`);
                continue;
            }
            try {
                console.log(`Deleting branch '${branchName}' in ${repo}...`);
                await execGitCommand(repo, 'checkout main');
                const command = remote ? `push origin --delete ${branchName}` : `branch -D ${branchName}`;
                await execGitCommand(repo, command);
            } catch (error) {
                console.error(`Error deleting branch in ${repo}: ${error.message}`);
                process.exit(1);
            }
        }
        console.log(`Branch '${branchName}' deleted from all repositories.`);
    }, async ()=>{
        console.log('Aborting delete.');
        process.exit(0);
    });
};
/**
 * Make sure that the working copy is clean in all repositories.
 */ const checkCleanWorkingCopy = async ()=>{
    console.log('Checking working copy...');
    for (const repo of repos){
        try {
            const status = await execGitCommand(repo, 'status --porcelain');
            if (status.toString().trim()) {
                console.error(`Working copy is not clean in ${repo}. Please commit or stash changes before continuing.`);
                process.exit(1);
            }
        } catch (error) {
            console.error(`Error checking working copy in ${repo}: ${error.message}`);
            process.exit(1);
        }
    }
};
// Checkout the branch in each repository
const checkoutBranch = async (branchName)=>{
    // First make sure that the working copy is clean before checking out any branches.
    await checkCleanWorkingCopy();
    for (const repo of repos){
        try {
            await execGitCommand(repo, 'checkout main');
            await execGitCommand(repo, `checkout ${branchName}`);
            console.log(`Checked out branch '${branchName}' in ${repo}`);
        } catch (error) {
            console.error(`Error checking out branch in ${repo}: ${error.message}`);
            process.exit(1);
        }
    }
};
/**
 * Merge main into the feature branch in each repository. This will leave you with all repos on the feature branch.
 * Pull main before running this command.
 * TODO: UNTESTED
 */ const mergeMainIntoFeature = async (branchName)=>{
    // Make sure that branches are available locally for the merge.
    await ensureBranchExists(branchName, false);
    const reposWithCommitsBehind = await getDeviatedRepos(branchName, false);
    // First, check out the branch in all repos
    await checkoutBranch(branchName);
    // Merge main into the feature branch in each repository
    for (const repo of reposWithCommitsBehind){
        try {
            console.log(`Merging main into ${branchName} for ${repo}`);
            const resultsCode = await execGitCommand(repo, 'merge main');
            const results = resultsCode.toString().trim();
            // Check for conflicts
            // TODO: Is there a better check for this?
            if (results.includes('CONFLICT')) {
                console.log(`Conflicts detected in ${repo}. Please resolve conflicts and commit changes before continuing.`);
            }
        } catch (error) {
            console.error(`Error merging main into feature branch in ${repo}: ${error.message}`);
        }
    }
    console.log(`Merged main into feature branch '${branchName}' in all repositories.`);
};
/**
 * Merge the feature branch into main in each repository.
 * Pull main before running this command
 * TODO: UNTESTED
 */ const mergeFeatureIntoMain = async (branchName)=>{
    // Make sure the branch exists locally before merging
    await ensureBranchExists(branchName, false);
    const reposWithCommitsAhead = await getDeviatedRepos(branchName, true);
    // First, checkout main in all repos
    console.log('checking out main...');
    await checkoutBranch('main');
    // Merge the feature branch into main in each repository
    for (const repo of reposWithCommitsAhead){
        try {
            await execGitCommand(repo, 'checkout main');
            console.log(`Merging ${branchName} into main in ${repo}`);
            const resultsPromise = await execGitCommand(repo, `merge ${branchName}`);
            const results = resultsPromise.toString().trim();
            // Check for conflicts
            if (results.includes('CONFLICT')) {
                console.log(`Conflicts detected in ${repo}. Please resolve conflicts and commit changes before continuing.`);
            }
        } catch (error) {
            console.error(`Error merging feature branch into main in ${repo}: ${error.message}`);
        }
    }
};
/**
 * Returns a list of branches that have commits deviating from main.
 * @param branchName
 * @param ahead - If true, returns repos that have commits ahead of main. If false, returns repos that are missing commits from main.
 * @returns {Promise<*[]>}
 */ const getDeviatedRepos = async (branchName, ahead)=>{
    const deviatedRepos = [];
    for (const repo of repos){
        try {
            // Use --left-right to distinguish commits ahead and behind
            const status = await execGitCommand(repo, `rev-list --left-right --count ${branchName}...origin/main`);
            const [aheadCount, behindCount] = status.toString().trim().split('\t').map(Number);
            // leftCount represents commits ahead in the branch, rightCount represents commits ahead in main
            if (ahead && aheadCount > 0) {
                deviatedRepos.push(repo);
            } else if (!ahead && behindCount > 0) {
                deviatedRepos.push(repo);
            }
        } catch (error) {
            console.error(`Error checking branch status in ${repo}: ${error.message}`);
            process.exit(1);
        }
    }
    return deviatedRepos;
};
/**
 * Prints any repos that have commits ahead of main.
 *
 * @param branchName
 * @param ahead - If true, prints repos that have commits ahead of main. If false, prints repos that are missing commits from main.
 */ const checkBranchStatus = async (branchName, ahead)=>{
    console.log('Checking branch status...');
    const deviatedRepos = await getDeviatedRepos(branchName, ahead);
    if (deviatedRepos.length === 0) {
        console.log('All repositories are up to date with main.');
    } else {
        console.log(`The following repositories have commits ${ahead ? 'ahead of' : 'behind'} main:`);
        for (const repo of deviatedRepos){
            console.log(repo);
        }
    }
};
/**
 * Prints a list of repositories that have uncommitted changes.
 * @returns {Promise<void>}
 */ const checkWorkingStatus = async ()=>{
    console.log('The following repositories have uncommitted changes:');
    for (const repo of repos){
        try {
            const status = await execGitCommand(repo, 'status --porcelain');
            if (status.toString().trim()) {
                console.log(repo);
            }
        } catch (error) {
            console.error(`Error checking working status in ${repo}: ${error.message}`);
            process.exit(1);
        }
    }
};
const main = async ()=>{
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node script.js <command> <branch-name>');
        process.exit(1);
    }
    const command = args[0];
    const branchName = args[1];
    switch(command){
        case 'create':
            await createBranch(branchName);
            break;
        case 'delete-local':
            await deleteBranch(branchName, false);
            break;
        case 'delete-remote':
            await deleteBranch(branchName, true);
            break;
        case 'checkout':
            await checkoutBranch(branchName);
            break;
        case 'merge-into-feature':
            await mergeMainIntoFeature(branchName);
            break;
        case 'merge-into-main':
            await mergeFeatureIntoMain(branchName);
            break;
        case 'check-branch':
            await checkBranchStatus(branchName, true);
            break;
        case 'check-main':
            await checkBranchStatus(branchName, false);
            break;
        case 'check-working':
            await checkWorkingStatus();
            break;
        default:
            console.error('Unknown command. Valid commands are: create, delete-local, delete-remote, checkout, merge-into-feature, merge-into-main');
            process.exit(1);
    }
};
main();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL2JyYW5jaGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLy8gVGhpcyBpcyBhIHByb3RvdHlwZSBhbmQgSSB3YW50IHRvIG1hcmsgYXJlYXMgdGhhdCBuZWVkIG1vcmUgd29yay5cbi8qIGVzbGludC1kaXNhYmxlIHBoZXQvdG9kby1zaG91bGQtaGF2ZS1pc3N1ZSAqL1xuXG4vKipcbiAqIFBST1RPVFlQRTogQ2FyZWZ1bCB1c2luZyB0aGlzLCBpdCBpcyBub3Qgd2VsbCB0ZXN0ZWQuXG4gKlxuICogVGhpcyBzY3JpcHQgc3VwcG9ydHMgbWFuYWdpbmcgZmVhdHVyZSBicmFuY2hlcyBpbiBtYW55IHJlcG9zIGFsbCBhdCBvbmNlLiBZb3UgY2FuIHBlcmZvcm0gb3BlcmF0aW9ucyBsaWtlIGNyZWF0aW5nLFxuICogZGVsZXRpbmcsIGFuZCBtZXJnaW5nIGJyYW5jaGVzIGluIGFsbCBhY3RpdmUgcmVwb3NpdG9yaWVzLlxuICpcbiAqIEVuc3VyZSBicmFuY2ggbmFtaW5nIGZvbGxvd3MgUGhFVCBjb252ZW50aW9uczogbG93ZXJDYW1lbENhc2Ugd2l0aCBsZXR0ZXJzIGFuZCBudW1iZXJzIG9ubHkuXG4gKlxuICogVXNhZ2U6IG5vZGUgc2NyaXB0LmpzIDxjb21tYW5kPiA8YnJhbmNoLW5hbWU+XG4gKiBDb21tYW5kczpcbiAqICAgLSBjcmVhdGU6IENyZWF0ZXMgYSBuZXcgYnJhbmNoIGFjcm9zcyBhbGwgYWN0aXZlIHJlcG9zaXRvcmllcy5cbiAqICAgLSBkZWxldGUtbG9jYWw6IERlbGV0ZXMgYSBicmFuY2ggbG9jYWxseSBpbiBhbGwgcmVwb3NpdG9yaWVzLlxuICogICAtIGRlbGV0ZS1yZW1vdGU6IERlbGV0ZXMgYSBicmFuY2ggZnJvbSB0aGUgcmVtb3RlIHJlcG9zaXRvcnkgaW4gYWxsIHJlcG9zaXRvcmllcy5cbiAqICAgLSBjaGVja291dDogQ2hlY2tzIG91dCBhbiBleGlzdGluZyBicmFuY2ggaW4gYWxsIHJlcG9zaXRvcmllcy5cbiAqICAgLSBtZXJnZS1pbnRvLWZlYXR1cmU6IE1lcmdlcyAnbWFpbicgaW50byB0aGUgc3BlY2lmaWVkIGZlYXR1cmUgYnJhbmNoLlxuICogICAtIG1lcmdlLWludG8tbWFpbjogTWVyZ2VzIGEgc3BlY2lmaWVkIGZlYXR1cmUgYnJhbmNoIGludG8gJ21haW4nLlxuICogICAtIGNoZWNrLWJyYW5jaDogUHJpbnRzIHJlcG9zIHRoYXQgaGF2ZSBjb21taXRzIGFoZWFkIG9mIG1haW4uXG4gKiAgIC0gY2hlY2stbWFpbjogUHJpbnRzIHJlcG9zIHRoYXQgYXJlIG1pc3NpbmcgY29tbWl0cyBmcm9tIG1haW4uXG4gKiAgIC0gY2hlY2std29ya2luZzogUHJpbnRzIHJlcG9zIHRoYXQgaGF2ZSBsb2NhbCB1bmNvbW1pdHRlZCBjaGFuZ2VzLlxuICpcbiAqIEV4YW1wbGVzOlxuICogICAtIG5vZGUgc2NyaXB0LmpzIGNyZWF0ZSBteUZlYXR1cmVCcmFuY2hcbiAqICAgLSBub2RlIHNjcmlwdC5qcyBkZWxldGUtbG9jYWwgbXlGZWF0dXJlQnJhbmNoXG4gKlxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmcgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuY29uc3QgcmVhZGxpbmUgPSByZXF1aXJlKCAncmVhZGxpbmUnICk7XG5jb25zdCB7IGV4ZWMgfSA9IHJlcXVpcmUoICdjaGlsZF9wcm9jZXNzJyApO1xuXG4vLyBQYXRoIHRvIHRoZSByb290IGRpcmVjdG9yeSB3aXRoIGFsbCByZXBvc2l0b3JpZXMuXG5jb25zdCByb290UGF0aCA9IGAke19fZGlybmFtZX0vLi4vLi4vLi5gO1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcbmNvbnN0IGNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKCBgJHtfX2Rpcm5hbWV9Li4vLi4vLi4vZGF0YS9hY3RpdmUtcmVwb3NgLCAndXRmOCcgKS50cmltKCk7XG5jb25zdCByZXBvcyA9IGNvbnRlbnRzLnNwbGl0KCAnXFxuJyApLm1hcCggc2ltID0+IHNpbS50cmltKCkgKTtcbi8vIGNvbnN0IHJlcG9zID0gW1xuLy8gICAnYXhvbicsXG4vLyAgICdhcXVhJ1xuLy8gXTtcblxuLyoqXG4gKiBSdW5zIGEgZ2l0IGNvbW1hbmQgaW4gYSByZXBvc2l0b3J5IGFzeW5jaHJvbm91c2x5LlxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgbmFtZSBvZiB0aGUgcmVwb3NpdG9yeSB0byBleGVjdXRlIHRoZSBnaXQgY29tbWFuZCBpbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb21tYW5kIC0gVGhlIGdpdCBjb21tYW5kIHRvIGV4ZWN1dGUuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxCdWZmZXI+fSAtIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIHJlc3VsdCBvZiB0aGUgY29tbWFuZC5cbiAqL1xuY29uc3QgZXhlY0dpdENvbW1hbmQgPSBhc3luYyAoIHJlcG8sIGNvbW1hbmQgKSA9PiB7XG4gIGNvbnN0IHBhdGggPSBgJHtyb290UGF0aH0vJHtyZXBvfWA7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKCAoIHJlc29sdmUsIHJlamVjdCApID0+IHtcblxuICAgIC8vIHBpcGUgaGlkZXMgcmVzdWx0cyBidXQgbWFrZXMgdGhlbSBhdmFpbGFibGUgZm9yIHByb2Nlc3NpbmdcbiAgICBleGVjKCBgZ2l0IC1DICR7cGF0aH0gJHtjb21tYW5kfWAsIHsgc3RkaW86ICdwaXBlJyB9LCAoIGVycm9yLCBzdGRvdXQsIHN0ZGVyciApID0+IHtcbiAgICAgIGlmICggZXJyb3IgKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoIGBFcnJvciBleGVjdXRpbmcgZ2l0IGNvbW1hbmQgaW4gJHtyZXBvfTogJHtzdGRlcnIgfHwgZXJyb3IubWVzc2FnZX1gICk7XG4gICAgICAgIHJlamVjdCggZXJyb3IgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmVzb2x2ZSggc3Rkb3V0ICk7XG4gICAgfSApO1xuICB9ICk7XG59O1xuXG4vKipcbiAqIEdldCBhIHkvbiByZXNwb25zZSBmcm9tIHRoZSB1c2VyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVzdGlvbiAtIHkvbiBpcyBhcHBlbmRlZCB0byB0aGUgcXVlc3Rpb25cbiAqIEBwYXJhbSB7YXN5bmMgZnVuY3Rpb259IG9uQ29uZmlybSAtIGNhbGxiYWNrIGlmIHRoZSB1c2VyIGNvbmZpcm1zXG4gKiBAcGFyYW0ge2FzeW5jIGZ1bmN0aW9uIH0gb25DYW5jZWwgLSBjYWxsYmFjayBpZiB0aGUgdXNlciBjYW5jZWxzXG4gKi9cbmNvbnN0IGdldENvbmZpcm1hdGlvbiA9ICggcXVlc3Rpb24sIG9uQ29uZmlybSwgb25DYW5jZWwgKSA9PiB7XG4gIGNvbnN0IHJsID0gcmVhZGxpbmUuY3JlYXRlSW50ZXJmYWNlKCB7XG4gICAgaW5wdXQ6IHByb2Nlc3Muc3RkaW4sXG4gICAgb3V0cHV0OiBwcm9jZXNzLnN0ZG91dFxuICB9ICk7XG5cbiAgcmwucXVlc3Rpb24oIGAke3F1ZXN0aW9ufSAoeS9uKSBgLCBhc3luYyBhbnN3ZXIgPT4ge1xuICAgIGlmICggYW5zd2VyLnRvTG93ZXJDYXNlKCkgPT09ICd5JyApIHtcbiAgICAgIGF3YWl0IG9uQ29uZmlybSgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGF3YWl0IG9uQ2FuY2VsKCk7XG4gICAgfVxuICAgIHJsLmNsb3NlKCk7XG4gIH0gKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBicmFuY2ggZXhpc3RzIGluIGEgcmVwb3NpdG9yeS5cbiAqIEBwYXJhbSByZXBvXG4gKiBAcGFyYW0gYnJhbmNoTmFtZVxuICogQHBhcmFtIGNoZWNrUmVtb3RlIC0gY2hlY2sgcmVtb3RlIGFzIHdlbGw/XG4gKi9cbmNvbnN0IGJyYW5jaEV4aXN0cyA9IGFzeW5jICggcmVwbywgYnJhbmNoTmFtZSwgY2hlY2tSZW1vdGUgKSA9PiB7XG4gIHRyeSB7XG5cbiAgICAvLyBDaGVjayBmb3IgdGhlIGJyYW5jaCBsb2NhbGx5XG4gICAgY29uc3QgbG9jYWxQcm9taXNlID0gYXdhaXQgZXhlY0dpdENvbW1hbmQoIHJlcG8sIGBicmFuY2ggLS1saXN0ICR7YnJhbmNoTmFtZX1gICk7XG4gICAgY29uc3QgbG9jYWxCcmFuY2hlcyA9IGxvY2FsUHJvbWlzZS50b1N0cmluZygpLnRyaW0oKTtcbiAgICBpZiAoIGxvY2FsQnJhbmNoZXMgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIGNoZWNrUmVtb3RlICkge1xuXG4gICAgICAvLyBDaGVjayBmb3IgdGhlIGJyYW5jaCByZW1vdGVseVxuICAgICAgY29uc3QgcmVtb3RlUHJvbWlzZSA9IGF3YWl0IGV4ZWNHaXRDb21tYW5kKCByZXBvLCBgYnJhbmNoIC1yIC0tbGlzdCBvcmlnaW4vJHticmFuY2hOYW1lfWAgKTtcbiAgICAgIGNvbnN0IHJlbW90ZUJyYW5jaGVzID0gcmVtb3RlUHJvbWlzZS50b1N0cmluZygpLnRyaW0oKTtcbiAgICAgIHJldHVybiAhIXJlbW90ZUJyYW5jaGVzO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjYXRjaCggZXJyb3IgKSB7XG4gICAgY29uc29sZS5lcnJvciggYEVycm9yIGNoZWNraW5nIGJyYW5jaGVzIGluICR7cmVwb306ICR7ZXJyb3IubWVzc2FnZX1gICk7XG4gICAgcHJvY2Vzcy5leGl0KCAxICk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG4vKipcbiAqIFZhbGlkYXRlIGEgYnJhbmNoIG5hbWUuIENvbnZlbnRpb24gdXNlcyB0aGUgc2FtZSBhcyBQaEVUJ3MgJ29uZS1vZmYnIGJyYW5jaGVzIHdoaWNoIG1lYW5zIG9ubHkgbGV0dGVycyBhbmQgbnVtYmVycyBhbmQgaW5cbiAqIGxvd2VyQ2FtZWxDYXNlLlxuICovXG5jb25zdCB2YWxpZGF0ZUJyYW5jaE5hbWUgPSBicmFuY2hOYW1lID0+IHtcbiAgY29uc3QgcGF0dGVybiA9IC9eW2Etel0rKFtBLVpdW2EtejAtOV0rKSokLztcbiAgaWYgKCAhcGF0dGVybi50ZXN0KCBicmFuY2hOYW1lICkgKSB7XG4gICAgY29uc29sZS5lcnJvciggYEJyYW5jaCBuYW1lICcke2JyYW5jaE5hbWV9JyBpcyBpbnZhbGlkLiBCcmFuY2ggbmFtZXMgbXVzdCBiZSBsb3dlciBjYW1lbCBjYXNlIGFuZCBvbmx5IGNvbnRhaW4gbGV0dGVycyBhbmQgbnVtYmVycy5gICk7XG4gICAgcHJvY2Vzcy5leGl0KCAxICk7XG4gIH1cbn07XG5cbi8qKlxuICogTWFrZSBzdXJlIHRoYXQgdGhlIGJyYW5jaCBleGlzdHMgaW4gYWxsIHJlcG9zaXRvcmllcy4gQXMgc29vbiBhcyBvbmUgcmVwb3NpdG9yeSBkb2VzIG5vdCBoYXZlIHRoZSBicmFuY2gsIHRoZSBzY3JpcHRcbiAqIHdpbGwgZXhpdC5cbiAqL1xuY29uc3QgZW5zdXJlQnJhbmNoRXhpc3RzID0gYXN5bmMgKCBicmFuY2hOYW1lLCBjaGVja1JlbW90ZSApID0+IHtcbiAgY29uc29sZS5sb2coICdDaGVja2luZyBicmFuY2ggZXhpc3RzIGluIGFsbCByZXBvc2l0b3JpZXMuLi4nICk7XG5cbiAgZm9yICggY29uc3QgcmVwbyBvZiByZXBvcyApIHtcbiAgICBjb25zdCBleGlzdHMgPSBhd2FpdCBicmFuY2hFeGlzdHMoIHJlcG8sIGJyYW5jaE5hbWUsIGNoZWNrUmVtb3RlICk7XG4gICAgaWYgKCAhZXhpc3RzICkge1xuICAgICAgY29uc29sZS5lcnJvciggYEJyYW5jaCAnJHticmFuY2hOYW1lfScgZG9lcyBub3QgZXhpc3QgaW4gJHtyZXBvfS4gWW91IG1heSBuZWVkIHRvIHB1bGwgaXQgZnJvbSByZW1vdGUuYCApO1xuICAgICAgcHJvY2Vzcy5leGl0KCAxICk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYnJhbmNoIGluIGFsbCByZXBvc2l0b3JpZXMuIEZlYXR1cmUgYnJhbmNoZXMgYXJlIGFsd2FzeSBjcmVhdGVkIGZyb20gbWFpbi5cbiAqIElmIHRoZSBicmFuY2ggYWxyZWFkeSBleGlzdHMgaW4gYW55IHJlcG9zaXRvcnkgKGxvY2FsIG9yIHJlbW90ZSksIHRoZSBzY3JpcHQgd2lsbCBleGl0LlxuICogV29ya2luZyBjb3B5IHdpbGwgYmUgb24gdGhlIG5ldyBicmFuY2ggYWZ0ZXIgdGhpcyBvcGVyYXRpb24uXG4gKi9cbmNvbnN0IGNyZWF0ZUJyYW5jaCA9IGFzeW5jIGJyYW5jaE5hbWUgPT4ge1xuXG4gIC8vIE1ha2Ugc3VyZSB0aGUgYnJhbmNoTmFtZSBpcyB2YWxpZFxuICB2YWxpZGF0ZUJyYW5jaE5hbWUoIGJyYW5jaE5hbWUgKTtcblxuICBjb25zb2xlLmxvZyggJ0NoZWNraW5nIG91dCBtYWluIHRvIGNyZWF0ZSBmZWF0dXJlIGJyYW5jaGVzLi4uJyApO1xuICBmb3IgKCBjb25zdCByZXBvIG9mIHJlcG9zICkge1xuICAgIGF3YWl0IGV4ZWNHaXRDb21tYW5kKCByZXBvLCAnY2hlY2tvdXQgbWFpbicgKTtcbiAgfVxuXG4gIC8vIEZpcnN0LCBjaGVjayB0byBzZWUgaWYgdGhlIHByb3ZpZGVkIGJyYW5jaCBuYW1lIGFscmVhZHkgZXhpc3RzIGluIHRoZSByZXBvLlxuICBjb25zb2xlLmxvZyggJ01ha2luZyBzdXJlIGJyYW5jaCBuYW1lIGlzIGF2YWlsYWJsZS4uLicgKTtcbiAgZm9yICggY29uc3QgcmVwbyBvZiByZXBvcyApIHtcbiAgICBjb25zdCBleGlzdHNMb2NhbCA9IGF3YWl0IGJyYW5jaEV4aXN0cyggcmVwbywgYnJhbmNoTmFtZSwgZmFsc2UgKTtcbiAgICBjb25zdCBleGlzdHNSZW1vdGUgPSBhd2FpdCBicmFuY2hFeGlzdHMoIHJlcG8sIGJyYW5jaE5hbWUsIHRydWUgKTtcbiAgICBpZiAoIGV4aXN0c0xvY2FsIHx8IGV4aXN0c1JlbW90ZSApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoIGBCcmFuY2ggJyR7YnJhbmNoTmFtZX0nIGFscmVhZHkgZXhpc3RzIGluICR7cmVwb30uIEFib3J0aW5nIGNyZWF0ZS5gICk7XG4gICAgICBwcm9jZXNzLmV4aXQoIDEgKTtcbiAgICB9XG4gIH1cblxuICBjb25zb2xlLmxvZyggYEJyYW5jaCAnJHticmFuY2hOYW1lfScgaXMgYXZhaWxhYmxlIGluIGFsbCByZXBvc2l0b3JpZXMuIENyZWF0aW5nLi4uYCApO1xuXG4gIGZvciAoIGNvbnN0IHJlcG8gb2YgcmVwb3MgKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGV4ZWNHaXRDb21tYW5kKCByZXBvLCAnY2hlY2tvdXQgbWFpbicgKTtcbiAgICAgIGF3YWl0IGV4ZWNHaXRDb21tYW5kKCByZXBvLCBgY2hlY2tvdXQgLWIgJHticmFuY2hOYW1lfWAgKTtcbiAgICAgIGNvbnNvbGUubG9nKCBgQnJhbmNoICR7YnJhbmNoTmFtZX0gY3JlYXRlZCBpbiAke3JlcG99YCApO1xuICAgIH1cbiAgICBjYXRjaCggZXJyb3IgKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCBgRXJyb3IgY3JlYXRpbmcgYnJhbmNoIGluICR7cmVwb306ICR7ZXJyb3IubWVzc2FnZX1gICk7XG4gICAgICBwcm9jZXNzLmV4aXQoIDEgKTtcbiAgICB9XG4gIH1cblxuICBjb25zb2xlLmxvZyggYEJyYW5jaCAnJHticmFuY2hOYW1lfScgY3JlYXRlZCBhY3Jvc3MgYWxsIHJlcG9zaXRvcmllcy5gICk7XG59O1xuXG5jb25zdCBkZWxldGVCcmFuY2ggPSBhc3luYyAoIGJyYW5jaE5hbWUsIHJlbW90ZSApID0+IHtcbiAgZ2V0Q29uZmlybWF0aW9uKCBgQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGUgYnJhbmNoICcke2JyYW5jaE5hbWV9JyAke3JlbW90ZSA/ICdmcm9tIFJFTU9URScgOiAnbG9jYWxseSd9IGluIGFsbCByZXBvc2l0b3JpZXM/YCwgYXN5bmMgKCkgPT4ge1xuXG4gICAgLy8gRGVsZXRlIHRoZSBicmFuY2ggaW4gZWFjaCByZXBvc2l0b3J5XG4gICAgZm9yICggY29uc3QgcmVwbyBvZiByZXBvcyApIHtcbiAgICAgIGNvbnN0IGV4aXN0cyA9IGF3YWl0IGJyYW5jaEV4aXN0cyggcmVwbywgYnJhbmNoTmFtZSwgcmVtb3RlICk7XG4gICAgICBpZiAoICFleGlzdHMgKSB7XG5cbiAgICAgICAgLy8gVGhlIGJyYW5jaCBkb2VzIG5vdCBleGlzdCwgc2tpcHBpbmcuXG4gICAgICAgIGNvbnNvbGUubG9nKCBgJHtyZXBvfSBkb2VzIG5vdCBoYXZlIGJyYW5jaCAke2JyYW5jaE5hbWV9LCBza2lwcGluZyBkZWxldGUuLi5gICk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmxvZyggYERlbGV0aW5nIGJyYW5jaCAnJHticmFuY2hOYW1lfScgaW4gJHtyZXBvfS4uLmAgKTtcbiAgICAgICAgYXdhaXQgZXhlY0dpdENvbW1hbmQoIHJlcG8sICdjaGVja291dCBtYWluJyApO1xuICAgICAgICBjb25zdCBjb21tYW5kID0gcmVtb3RlID8gYHB1c2ggb3JpZ2luIC0tZGVsZXRlICR7YnJhbmNoTmFtZX1gIDogYGJyYW5jaCAtRCAke2JyYW5jaE5hbWV9YDtcbiAgICAgICAgYXdhaXQgZXhlY0dpdENvbW1hbmQoIHJlcG8sIGNvbW1hbmQgKTtcbiAgICAgIH1cbiAgICAgIGNhdGNoKCBlcnJvciApIHtcbiAgICAgICAgY29uc29sZS5lcnJvciggYEVycm9yIGRlbGV0aW5nIGJyYW5jaCBpbiAke3JlcG99OiAke2Vycm9yLm1lc3NhZ2V9YCApO1xuICAgICAgICBwcm9jZXNzLmV4aXQoIDEgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyggYEJyYW5jaCAnJHticmFuY2hOYW1lfScgZGVsZXRlZCBmcm9tIGFsbCByZXBvc2l0b3JpZXMuYCApO1xuICB9LCBhc3luYyAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coICdBYm9ydGluZyBkZWxldGUuJyApO1xuICAgIHByb2Nlc3MuZXhpdCggMCApO1xuICB9ICk7XG59O1xuXG4vKipcbiAqIE1ha2Ugc3VyZSB0aGF0IHRoZSB3b3JraW5nIGNvcHkgaXMgY2xlYW4gaW4gYWxsIHJlcG9zaXRvcmllcy5cbiAqL1xuY29uc3QgY2hlY2tDbGVhbldvcmtpbmdDb3B5ID0gYXN5bmMgKCkgPT4ge1xuICBjb25zb2xlLmxvZyggJ0NoZWNraW5nIHdvcmtpbmcgY29weS4uLicgKTtcbiAgZm9yICggY29uc3QgcmVwbyBvZiByZXBvcyApIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgZXhlY0dpdENvbW1hbmQoIHJlcG8sICdzdGF0dXMgLS1wb3JjZWxhaW4nICk7XG4gICAgICBpZiAoIHN0YXR1cy50b1N0cmluZygpLnRyaW0oKSApIHtcbiAgICAgICAgY29uc29sZS5lcnJvciggYFdvcmtpbmcgY29weSBpcyBub3QgY2xlYW4gaW4gJHtyZXBvfS4gUGxlYXNlIGNvbW1pdCBvciBzdGFzaCBjaGFuZ2VzIGJlZm9yZSBjb250aW51aW5nLmAgKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KCAxICk7XG4gICAgICB9XG4gICAgfVxuICAgIGNhdGNoKCBlcnJvciApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoIGBFcnJvciBjaGVja2luZyB3b3JraW5nIGNvcHkgaW4gJHtyZXBvfTogJHtlcnJvci5tZXNzYWdlfWAgKTtcbiAgICAgIHByb2Nlc3MuZXhpdCggMSApO1xuICAgIH1cbiAgfVxufTtcblxuLy8gQ2hlY2tvdXQgdGhlIGJyYW5jaCBpbiBlYWNoIHJlcG9zaXRvcnlcbmNvbnN0IGNoZWNrb3V0QnJhbmNoID0gYXN5bmMgYnJhbmNoTmFtZSA9PiB7XG5cbiAgLy8gRmlyc3QgbWFrZSBzdXJlIHRoYXQgdGhlIHdvcmtpbmcgY29weSBpcyBjbGVhbiBiZWZvcmUgY2hlY2tpbmcgb3V0IGFueSBicmFuY2hlcy5cbiAgYXdhaXQgY2hlY2tDbGVhbldvcmtpbmdDb3B5KCk7XG5cbiAgZm9yICggY29uc3QgcmVwbyBvZiByZXBvcyApIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZXhlY0dpdENvbW1hbmQoIHJlcG8sICdjaGVja291dCBtYWluJyApO1xuICAgICAgYXdhaXQgZXhlY0dpdENvbW1hbmQoIHJlcG8sIGBjaGVja291dCAke2JyYW5jaE5hbWV9YCApO1xuXG4gICAgICBjb25zb2xlLmxvZyggYENoZWNrZWQgb3V0IGJyYW5jaCAnJHticmFuY2hOYW1lfScgaW4gJHtyZXBvfWAgKTtcbiAgICB9XG4gICAgY2F0Y2goIGVycm9yICkge1xuICAgICAgY29uc29sZS5lcnJvciggYEVycm9yIGNoZWNraW5nIG91dCBicmFuY2ggaW4gJHtyZXBvfTogJHtlcnJvci5tZXNzYWdlfWAgKTtcbiAgICAgIHByb2Nlc3MuZXhpdCggMSApO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBNZXJnZSBtYWluIGludG8gdGhlIGZlYXR1cmUgYnJhbmNoIGluIGVhY2ggcmVwb3NpdG9yeS4gVGhpcyB3aWxsIGxlYXZlIHlvdSB3aXRoIGFsbCByZXBvcyBvbiB0aGUgZmVhdHVyZSBicmFuY2guXG4gKiBQdWxsIG1haW4gYmVmb3JlIHJ1bm5pbmcgdGhpcyBjb21tYW5kLlxuICogVE9ETzogVU5URVNURURcbiAqL1xuY29uc3QgbWVyZ2VNYWluSW50b0ZlYXR1cmUgPSBhc3luYyBicmFuY2hOYW1lID0+IHtcblxuICAvLyBNYWtlIHN1cmUgdGhhdCBicmFuY2hlcyBhcmUgYXZhaWxhYmxlIGxvY2FsbHkgZm9yIHRoZSBtZXJnZS5cbiAgYXdhaXQgZW5zdXJlQnJhbmNoRXhpc3RzKCBicmFuY2hOYW1lLCBmYWxzZSApO1xuXG4gIGNvbnN0IHJlcG9zV2l0aENvbW1pdHNCZWhpbmQgPSBhd2FpdCBnZXREZXZpYXRlZFJlcG9zKCBicmFuY2hOYW1lLCBmYWxzZSApO1xuXG4gIC8vIEZpcnN0LCBjaGVjayBvdXQgdGhlIGJyYW5jaCBpbiBhbGwgcmVwb3NcbiAgYXdhaXQgY2hlY2tvdXRCcmFuY2goIGJyYW5jaE5hbWUgKTtcblxuICAvLyBNZXJnZSBtYWluIGludG8gdGhlIGZlYXR1cmUgYnJhbmNoIGluIGVhY2ggcmVwb3NpdG9yeVxuICBmb3IgKCBjb25zdCByZXBvIG9mIHJlcG9zV2l0aENvbW1pdHNCZWhpbmQgKSB7XG4gICAgdHJ5IHtcblxuICAgICAgY29uc29sZS5sb2coIGBNZXJnaW5nIG1haW4gaW50byAke2JyYW5jaE5hbWV9IGZvciAke3JlcG99YCApO1xuICAgICAgY29uc3QgcmVzdWx0c0NvZGUgPSBhd2FpdCBleGVjR2l0Q29tbWFuZCggcmVwbywgJ21lcmdlIG1haW4nICk7XG4gICAgICBjb25zdCByZXN1bHRzID0gcmVzdWx0c0NvZGUudG9TdHJpbmcoKS50cmltKCk7XG5cbiAgICAgIC8vIENoZWNrIGZvciBjb25mbGljdHNcbiAgICAgIC8vIFRPRE86IElzIHRoZXJlIGEgYmV0dGVyIGNoZWNrIGZvciB0aGlzP1xuICAgICAgaWYgKCByZXN1bHRzLmluY2x1ZGVzKCAnQ09ORkxJQ1QnICkgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCBgQ29uZmxpY3RzIGRldGVjdGVkIGluICR7cmVwb30uIFBsZWFzZSByZXNvbHZlIGNvbmZsaWN0cyBhbmQgY29tbWl0IGNoYW5nZXMgYmVmb3JlIGNvbnRpbnVpbmcuYCApO1xuICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCggZXJyb3IgKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCBgRXJyb3IgbWVyZ2luZyBtYWluIGludG8gZmVhdHVyZSBicmFuY2ggaW4gJHtyZXBvfTogJHtlcnJvci5tZXNzYWdlfWAgKTtcbiAgICB9XG4gIH1cblxuICBjb25zb2xlLmxvZyggYE1lcmdlZCBtYWluIGludG8gZmVhdHVyZSBicmFuY2ggJyR7YnJhbmNoTmFtZX0nIGluIGFsbCByZXBvc2l0b3JpZXMuYCApO1xufTtcblxuLyoqXG4gKiBNZXJnZSB0aGUgZmVhdHVyZSBicmFuY2ggaW50byBtYWluIGluIGVhY2ggcmVwb3NpdG9yeS5cbiAqIFB1bGwgbWFpbiBiZWZvcmUgcnVubmluZyB0aGlzIGNvbW1hbmRcbiAqIFRPRE86IFVOVEVTVEVEXG4gKi9cbmNvbnN0IG1lcmdlRmVhdHVyZUludG9NYWluID0gYXN5bmMgYnJhbmNoTmFtZSA9PiB7XG5cbiAgLy8gTWFrZSBzdXJlIHRoZSBicmFuY2ggZXhpc3RzIGxvY2FsbHkgYmVmb3JlIG1lcmdpbmdcbiAgYXdhaXQgZW5zdXJlQnJhbmNoRXhpc3RzKCBicmFuY2hOYW1lLCBmYWxzZSApO1xuXG4gIGNvbnN0IHJlcG9zV2l0aENvbW1pdHNBaGVhZCA9IGF3YWl0IGdldERldmlhdGVkUmVwb3MoIGJyYW5jaE5hbWUsIHRydWUgKTtcblxuICAvLyBGaXJzdCwgY2hlY2tvdXQgbWFpbiBpbiBhbGwgcmVwb3NcbiAgY29uc29sZS5sb2coICdjaGVja2luZyBvdXQgbWFpbi4uLicgKTtcbiAgYXdhaXQgY2hlY2tvdXRCcmFuY2goICdtYWluJyApO1xuXG4gIC8vIE1lcmdlIHRoZSBmZWF0dXJlIGJyYW5jaCBpbnRvIG1haW4gaW4gZWFjaCByZXBvc2l0b3J5XG4gIGZvciAoIGNvbnN0IHJlcG8gb2YgcmVwb3NXaXRoQ29tbWl0c0FoZWFkICkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBleGVjR2l0Q29tbWFuZCggcmVwbywgJ2NoZWNrb3V0IG1haW4nICk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCBgTWVyZ2luZyAke2JyYW5jaE5hbWV9IGludG8gbWFpbiBpbiAke3JlcG99YCApO1xuICAgICAgY29uc3QgcmVzdWx0c1Byb21pc2UgPSBhd2FpdCBleGVjR2l0Q29tbWFuZCggcmVwbywgYG1lcmdlICR7YnJhbmNoTmFtZX1gICk7XG4gICAgICBjb25zdCByZXN1bHRzID0gcmVzdWx0c1Byb21pc2UudG9TdHJpbmcoKS50cmltKCk7XG5cbiAgICAgIC8vIENoZWNrIGZvciBjb25mbGljdHNcbiAgICAgIGlmICggcmVzdWx0cy5pbmNsdWRlcyggJ0NPTkZMSUNUJyApICkge1xuICAgICAgICBjb25zb2xlLmxvZyggYENvbmZsaWN0cyBkZXRlY3RlZCBpbiAke3JlcG99LiBQbGVhc2UgcmVzb2x2ZSBjb25mbGljdHMgYW5kIGNvbW1pdCBjaGFuZ2VzIGJlZm9yZSBjb250aW51aW5nLmAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2goIGVycm9yICkge1xuICAgICAgY29uc29sZS5lcnJvciggYEVycm9yIG1lcmdpbmcgZmVhdHVyZSBicmFuY2ggaW50byBtYWluIGluICR7cmVwb306ICR7ZXJyb3IubWVzc2FnZX1gICk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGJyYW5jaGVzIHRoYXQgaGF2ZSBjb21taXRzIGRldmlhdGluZyBmcm9tIG1haW4uXG4gKiBAcGFyYW0gYnJhbmNoTmFtZVxuICogQHBhcmFtIGFoZWFkIC0gSWYgdHJ1ZSwgcmV0dXJucyByZXBvcyB0aGF0IGhhdmUgY29tbWl0cyBhaGVhZCBvZiBtYWluLiBJZiBmYWxzZSwgcmV0dXJucyByZXBvcyB0aGF0IGFyZSBtaXNzaW5nIGNvbW1pdHMgZnJvbSBtYWluLlxuICogQHJldHVybnMge1Byb21pc2U8KltdPn1cbiAqL1xuY29uc3QgZ2V0RGV2aWF0ZWRSZXBvcyA9IGFzeW5jICggYnJhbmNoTmFtZSwgYWhlYWQgKSA9PiB7XG4gIGNvbnN0IGRldmlhdGVkUmVwb3MgPSBbXTtcblxuICBmb3IgKCBjb25zdCByZXBvIG9mIHJlcG9zICkge1xuICAgIHRyeSB7XG5cbiAgICAgIC8vIFVzZSAtLWxlZnQtcmlnaHQgdG8gZGlzdGluZ3Vpc2ggY29tbWl0cyBhaGVhZCBhbmQgYmVoaW5kXG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBleGVjR2l0Q29tbWFuZCggcmVwbywgYHJldi1saXN0IC0tbGVmdC1yaWdodCAtLWNvdW50ICR7YnJhbmNoTmFtZX0uLi5vcmlnaW4vbWFpbmAgKTtcbiAgICAgIGNvbnN0IFsgYWhlYWRDb3VudCwgYmVoaW5kQ291bnQgXSA9IHN0YXR1cy50b1N0cmluZygpLnRyaW0oKS5zcGxpdCggJ1xcdCcgKS5tYXAoIE51bWJlciApO1xuXG4gICAgICAvLyBsZWZ0Q291bnQgcmVwcmVzZW50cyBjb21taXRzIGFoZWFkIGluIHRoZSBicmFuY2gsIHJpZ2h0Q291bnQgcmVwcmVzZW50cyBjb21taXRzIGFoZWFkIGluIG1haW5cbiAgICAgIGlmICggYWhlYWQgJiYgYWhlYWRDb3VudCA+IDAgKSB7XG4gICAgICAgIGRldmlhdGVkUmVwb3MucHVzaCggcmVwbyApO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoICFhaGVhZCAmJiBiZWhpbmRDb3VudCA+IDAgKSB7XG4gICAgICAgIGRldmlhdGVkUmVwb3MucHVzaCggcmVwbyApO1xuICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCggZXJyb3IgKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCBgRXJyb3IgY2hlY2tpbmcgYnJhbmNoIHN0YXR1cyBpbiAke3JlcG99OiAke2Vycm9yLm1lc3NhZ2V9YCApO1xuICAgICAgcHJvY2Vzcy5leGl0KCAxICk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRldmlhdGVkUmVwb3M7XG59O1xuXG4vKipcbiAqIFByaW50cyBhbnkgcmVwb3MgdGhhdCBoYXZlIGNvbW1pdHMgYWhlYWQgb2YgbWFpbi5cbiAqXG4gKiBAcGFyYW0gYnJhbmNoTmFtZVxuICogQHBhcmFtIGFoZWFkIC0gSWYgdHJ1ZSwgcHJpbnRzIHJlcG9zIHRoYXQgaGF2ZSBjb21taXRzIGFoZWFkIG9mIG1haW4uIElmIGZhbHNlLCBwcmludHMgcmVwb3MgdGhhdCBhcmUgbWlzc2luZyBjb21taXRzIGZyb20gbWFpbi5cbiAqL1xuY29uc3QgY2hlY2tCcmFuY2hTdGF0dXMgPSBhc3luYyAoIGJyYW5jaE5hbWUsIGFoZWFkICkgPT4ge1xuICBjb25zb2xlLmxvZyggJ0NoZWNraW5nIGJyYW5jaCBzdGF0dXMuLi4nICk7XG4gIGNvbnN0IGRldmlhdGVkUmVwb3MgPSBhd2FpdCBnZXREZXZpYXRlZFJlcG9zKCBicmFuY2hOYW1lLCBhaGVhZCApO1xuXG4gIGlmICggZGV2aWF0ZWRSZXBvcy5sZW5ndGggPT09IDAgKSB7XG4gICAgY29uc29sZS5sb2coICdBbGwgcmVwb3NpdG9yaWVzIGFyZSB1cCB0byBkYXRlIHdpdGggbWFpbi4nICk7XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uc29sZS5sb2coIGBUaGUgZm9sbG93aW5nIHJlcG9zaXRvcmllcyBoYXZlIGNvbW1pdHMgJHthaGVhZCA/ICdhaGVhZCBvZicgOiAnYmVoaW5kJ30gbWFpbjpgICk7XG4gICAgZm9yICggY29uc3QgcmVwbyBvZiBkZXZpYXRlZFJlcG9zICkge1xuICAgICAgY29uc29sZS5sb2coIHJlcG8gKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogUHJpbnRzIGEgbGlzdCBvZiByZXBvc2l0b3JpZXMgdGhhdCBoYXZlIHVuY29tbWl0dGVkIGNoYW5nZXMuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAqL1xuY29uc3QgY2hlY2tXb3JraW5nU3RhdHVzID0gYXN5bmMgKCkgPT4ge1xuICBjb25zb2xlLmxvZyggJ1RoZSBmb2xsb3dpbmcgcmVwb3NpdG9yaWVzIGhhdmUgdW5jb21taXR0ZWQgY2hhbmdlczonICk7XG4gIGZvciAoIGNvbnN0IHJlcG8gb2YgcmVwb3MgKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGV4ZWNHaXRDb21tYW5kKCByZXBvLCAnc3RhdHVzIC0tcG9yY2VsYWluJyApO1xuICAgICAgaWYgKCBzdGF0dXMudG9TdHJpbmcoKS50cmltKCkgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCByZXBvICk7XG4gICAgICB9XG4gICAgfVxuICAgIGNhdGNoKCBlcnJvciApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoIGBFcnJvciBjaGVja2luZyB3b3JraW5nIHN0YXR1cyBpbiAke3JlcG99OiAke2Vycm9yLm1lc3NhZ2V9YCApO1xuICAgICAgcHJvY2Vzcy5leGl0KCAxICk7XG4gICAgfVxuICB9XG59O1xuXG5jb25zdCBtYWluID0gYXN5bmMgKCkgPT4ge1xuICBjb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKCAyICk7XG5cbiAgaWYgKCBhcmdzLmxlbmd0aCA8IDIgKSB7XG4gICAgY29uc29sZS5lcnJvciggJ1VzYWdlOiBub2RlIHNjcmlwdC5qcyA8Y29tbWFuZD4gPGJyYW5jaC1uYW1lPicgKTtcbiAgICBwcm9jZXNzLmV4aXQoIDEgKTtcbiAgfVxuXG4gIGNvbnN0IGNvbW1hbmQgPSBhcmdzWyAwIF07XG4gIGNvbnN0IGJyYW5jaE5hbWUgPSBhcmdzWyAxIF07XG5cbiAgc3dpdGNoKCBjb21tYW5kICkge1xuICAgIGNhc2UgJ2NyZWF0ZSc6XG4gICAgICBhd2FpdCBjcmVhdGVCcmFuY2goIGJyYW5jaE5hbWUgKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2RlbGV0ZS1sb2NhbCc6XG4gICAgICBhd2FpdCBkZWxldGVCcmFuY2goIGJyYW5jaE5hbWUsIGZhbHNlICk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdkZWxldGUtcmVtb3RlJzpcbiAgICAgIGF3YWl0IGRlbGV0ZUJyYW5jaCggYnJhbmNoTmFtZSwgdHJ1ZSApO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2hlY2tvdXQnOlxuICAgICAgYXdhaXQgY2hlY2tvdXRCcmFuY2goIGJyYW5jaE5hbWUgKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ21lcmdlLWludG8tZmVhdHVyZSc6XG4gICAgICBhd2FpdCBtZXJnZU1haW5JbnRvRmVhdHVyZSggYnJhbmNoTmFtZSApO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbWVyZ2UtaW50by1tYWluJzpcbiAgICAgIGF3YWl0IG1lcmdlRmVhdHVyZUludG9NYWluKCBicmFuY2hOYW1lICk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjaGVjay1icmFuY2gnOlxuICAgICAgYXdhaXQgY2hlY2tCcmFuY2hTdGF0dXMoIGJyYW5jaE5hbWUsIHRydWUgKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NoZWNrLW1haW4nOlxuICAgICAgYXdhaXQgY2hlY2tCcmFuY2hTdGF0dXMoIGJyYW5jaE5hbWUsIGZhbHNlICk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjaGVjay13b3JraW5nJzpcbiAgICAgIGF3YWl0IGNoZWNrV29ya2luZ1N0YXR1cygpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGNvbnNvbGUuZXJyb3IoICdVbmtub3duIGNvbW1hbmQuIFZhbGlkIGNvbW1hbmRzIGFyZTogY3JlYXRlLCBkZWxldGUtbG9jYWwsIGRlbGV0ZS1yZW1vdGUsIGNoZWNrb3V0LCBtZXJnZS1pbnRvLWZlYXR1cmUsIG1lcmdlLWludG8tbWFpbicgKTtcbiAgICAgIHByb2Nlc3MuZXhpdCggMSApO1xuICB9XG59O1xuXG5tYWluKCk7Il0sIm5hbWVzIjpbInJlYWRsaW5lIiwicmVxdWlyZSIsImV4ZWMiLCJyb290UGF0aCIsIl9fZGlybmFtZSIsImZzIiwiY29udGVudHMiLCJyZWFkRmlsZVN5bmMiLCJ0cmltIiwicmVwb3MiLCJzcGxpdCIsIm1hcCIsInNpbSIsImV4ZWNHaXRDb21tYW5kIiwicmVwbyIsImNvbW1hbmQiLCJwYXRoIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJzdGRpbyIsImVycm9yIiwic3Rkb3V0Iiwic3RkZXJyIiwiY29uc29sZSIsIm1lc3NhZ2UiLCJnZXRDb25maXJtYXRpb24iLCJxdWVzdGlvbiIsIm9uQ29uZmlybSIsIm9uQ2FuY2VsIiwicmwiLCJjcmVhdGVJbnRlcmZhY2UiLCJpbnB1dCIsInByb2Nlc3MiLCJzdGRpbiIsIm91dHB1dCIsImFuc3dlciIsInRvTG93ZXJDYXNlIiwiY2xvc2UiLCJicmFuY2hFeGlzdHMiLCJicmFuY2hOYW1lIiwiY2hlY2tSZW1vdGUiLCJsb2NhbFByb21pc2UiLCJsb2NhbEJyYW5jaGVzIiwidG9TdHJpbmciLCJyZW1vdGVQcm9taXNlIiwicmVtb3RlQnJhbmNoZXMiLCJleGl0IiwidmFsaWRhdGVCcmFuY2hOYW1lIiwicGF0dGVybiIsInRlc3QiLCJlbnN1cmVCcmFuY2hFeGlzdHMiLCJsb2ciLCJleGlzdHMiLCJjcmVhdGVCcmFuY2giLCJleGlzdHNMb2NhbCIsImV4aXN0c1JlbW90ZSIsImRlbGV0ZUJyYW5jaCIsInJlbW90ZSIsImNoZWNrQ2xlYW5Xb3JraW5nQ29weSIsInN0YXR1cyIsImNoZWNrb3V0QnJhbmNoIiwibWVyZ2VNYWluSW50b0ZlYXR1cmUiLCJyZXBvc1dpdGhDb21taXRzQmVoaW5kIiwiZ2V0RGV2aWF0ZWRSZXBvcyIsInJlc3VsdHNDb2RlIiwicmVzdWx0cyIsImluY2x1ZGVzIiwibWVyZ2VGZWF0dXJlSW50b01haW4iLCJyZXBvc1dpdGhDb21taXRzQWhlYWQiLCJyZXN1bHRzUHJvbWlzZSIsImFoZWFkIiwiZGV2aWF0ZWRSZXBvcyIsImFoZWFkQ291bnQiLCJiZWhpbmRDb3VudCIsIk51bWJlciIsInB1c2giLCJjaGVja0JyYW5jaFN0YXR1cyIsImxlbmd0aCIsImNoZWNrV29ya2luZ1N0YXR1cyIsIm1haW4iLCJhcmdzIiwiYXJndiIsInNsaWNlIl0sIm1hcHBpbmdzIjoiQUFBQSxpREFBaUQ7QUFFakQsb0VBQW9FO0FBQ3BFLDhDQUE4QyxHQUU5Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXlCQyxHQUVELE1BQU1BLFdBQVdDLFFBQVM7QUFDMUIsTUFBTSxFQUFFQyxJQUFJLEVBQUUsR0FBR0QsUUFBUztBQUUxQixvREFBb0Q7QUFDcEQsTUFBTUUsV0FBVyxHQUFHQyxVQUFVLFNBQVMsQ0FBQztBQUV4QyxNQUFNQyxLQUFLSixRQUFTO0FBQ3BCLE1BQU1LLFdBQVdELEdBQUdFLFlBQVksQ0FBRSxHQUFHSCxVQUFVLDBCQUEwQixDQUFDLEVBQUUsUUFBU0ksSUFBSTtBQUN6RixNQUFNQyxRQUFRSCxTQUFTSSxLQUFLLENBQUUsTUFBT0MsR0FBRyxDQUFFQyxDQUFBQSxNQUFPQSxJQUFJSixJQUFJO0FBQ3pELGtCQUFrQjtBQUNsQixZQUFZO0FBQ1osV0FBVztBQUNYLEtBQUs7QUFFTDs7Ozs7Q0FLQyxHQUNE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