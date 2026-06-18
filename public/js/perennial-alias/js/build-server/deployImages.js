// Copyright 2020, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)
const execute = require('../common/execute').default;
const gitCheckoutDirectory = require('../common/gitCheckoutDirectory');
const gitCloneOrFetchDirectory = require('../common/gitCloneOrFetchDirectory');
const gitPullDirectory = require('../common/gitPullDirectory');
const npmUpdateDirectory = require('../common/npmUpdateDirectory');
const constants = require('./constants');
const fs = require('fs');
const axios = require('axios');
const imagesReposDir = '../images-repos';
const chipperDir = `${imagesReposDir}/chipper`;
const perennialAliasDir = `${imagesReposDir}/perennial-alias`;
const processSim = async (simulation, brands, version)=>{
    const repoDir = `${imagesReposDir}/${simulation}`;
    // Get main
    await gitCloneOrFetchDirectory(simulation, imagesReposDir);
    await gitCheckoutDirectory('main', repoDir);
    await gitPullDirectory(repoDir);
    let brandsArray;
    let brandsString;
    if (brands) {
        if (brands.split) {
            brandsArray = brands.split(',');
            brandsString = brands;
        } else {
            brandsArray = brands;
            brandsString = brands.join(',');
        }
    } else {
        brandsString = 'phet';
        brandsArray = [
            brandsString
        ];
    }
    // Build screenshots
    await execute('grunt', [
        `--brands=${brandsString}`,
        `--repo=${simulation}`,
        'build-images'
    ], chipperDir);
    // Copy into the document root
    for (const brand of brandsArray){
        if (brand !== 'phet') {
            console.log(`Skipping images for unsupported brand: ${brand}`);
        } else {
            const sourceDir = `${repoDir}/build/${brand}/`;
            const targetDir = `${constants.HTML_SIMS_DIRECTORY}${simulation}/${version}/`;
            const files = fs.readdirSync(sourceDir);
            for (const file of files){
                if (file.endsWith('png')) {
                    console.log(`copying file ${file}`);
                    await execute('cp', [
                        `${sourceDir}${file}`,
                        `${targetDir}${file}`
                    ], '.');
                }
            }
            console.log(`Done copying files for ${simulation}`);
        }
    }
};
const updateRepoDir = async (repo, dir)=>{
    await gitCloneOrFetchDirectory(repo, imagesReposDir);
    await gitCheckoutDirectory('main', dir);
    await gitPullDirectory(dir);
    await npmUpdateDirectory(dir);
};
/**
 * This task deploys all image assets from the main branch to the latest version of all published sims. If specific
 * simulation/version options are provided, it will deploy only that specific one.
 */ const deployImages = async (options)=>{
    console.log(`deploying images with brands ${options.brands}`);
    if (!fs.existsSync(imagesReposDir)) {
        await execute('mkdir', [
            imagesReposDir
        ], '.');
    }
    await updateRepoDir('chipper', chipperDir);
    await updateRepoDir('perennial-alias', perennialAliasDir);
    if (options.simulation && options.version) {
        await processSim(options.simulation, options.brands, options.version);
    } else {
        // Get all published sims
        let response;
        try {
            response = await axios('https://phet.colorado.edu/services/metadata/1.2/simulations?format=json&summary&locale=en&type=html');
        } catch (e) {
            throw new Error(e);
        }
        if (response.status < 200 || response.status > 299) {
            throw new Error(`Bad Status while fetching metadata: ${response.status}`);
        } else {
            let projects;
            try {
                projects = response.data.projects;
            } catch (e) {
                throw new Error(e);
            }
            // Use for index loop to allow async/await
            for (const project of projects){
                for (const simulation of project.simulations){
                    await processSim(simulation.name, options.brands, project.version.string);
                }
            }
        }
    }
};
module.exports = deployImages;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvZGVwbG95SW1hZ2VzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcbi8vIEBhdXRob3IgTWF0dCBQZW5uaW5ndG9uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxuXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4uL2NvbW1vbi9leGVjdXRlJyApLmRlZmF1bHQ7XG5jb25zdCBnaXRDaGVja291dERpcmVjdG9yeSA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0Q2hlY2tvdXREaXJlY3RvcnknICk7XG5jb25zdCBnaXRDbG9uZU9yRmV0Y2hEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi4vY29tbW9uL2dpdENsb25lT3JGZXRjaERpcmVjdG9yeScgKTtcbmNvbnN0IGdpdFB1bGxEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi4vY29tbW9uL2dpdFB1bGxEaXJlY3RvcnknICk7XG5jb25zdCBucG1VcGRhdGVEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi4vY29tbW9uL25wbVVwZGF0ZURpcmVjdG9yeScgKTtcbmNvbnN0IGNvbnN0YW50cyA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKTtcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xuY29uc3QgYXhpb3MgPSByZXF1aXJlKCAnYXhpb3MnICk7XG5cbmNvbnN0IGltYWdlc1JlcG9zRGlyID0gJy4uL2ltYWdlcy1yZXBvcyc7XG5jb25zdCBjaGlwcGVyRGlyID0gYCR7aW1hZ2VzUmVwb3NEaXJ9L2NoaXBwZXJgO1xuY29uc3QgcGVyZW5uaWFsQWxpYXNEaXIgPSBgJHtpbWFnZXNSZXBvc0Rpcn0vcGVyZW5uaWFsLWFsaWFzYDtcblxuY29uc3QgcHJvY2Vzc1NpbSA9IGFzeW5jICggc2ltdWxhdGlvbiwgYnJhbmRzLCB2ZXJzaW9uICkgPT4ge1xuXG4gIGNvbnN0IHJlcG9EaXIgPSBgJHtpbWFnZXNSZXBvc0Rpcn0vJHtzaW11bGF0aW9ufWA7XG5cbiAgLy8gR2V0IG1haW5cbiAgYXdhaXQgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5KCBzaW11bGF0aW9uLCBpbWFnZXNSZXBvc0RpciApO1xuICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggJ21haW4nLCByZXBvRGlyICk7XG4gIGF3YWl0IGdpdFB1bGxEaXJlY3RvcnkoIHJlcG9EaXIgKTtcblxuICBsZXQgYnJhbmRzQXJyYXk7XG4gIGxldCBicmFuZHNTdHJpbmc7XG4gIGlmICggYnJhbmRzICkge1xuICAgIGlmICggYnJhbmRzLnNwbGl0ICkge1xuICAgICAgYnJhbmRzQXJyYXkgPSBicmFuZHMuc3BsaXQoICcsJyApO1xuICAgICAgYnJhbmRzU3RyaW5nID0gYnJhbmRzO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGJyYW5kc0FycmF5ID0gYnJhbmRzO1xuICAgICAgYnJhbmRzU3RyaW5nID0gYnJhbmRzLmpvaW4oICcsJyApO1xuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBicmFuZHNTdHJpbmcgPSAncGhldCc7XG4gICAgYnJhbmRzQXJyYXkgPSBbIGJyYW5kc1N0cmluZyBdO1xuICB9XG5cbiAgLy8gQnVpbGQgc2NyZWVuc2hvdHNcbiAgYXdhaXQgZXhlY3V0ZSggJ2dydW50JywgWyBgLS1icmFuZHM9JHticmFuZHNTdHJpbmd9YCwgYC0tcmVwbz0ke3NpbXVsYXRpb259YCwgJ2J1aWxkLWltYWdlcycgXSwgY2hpcHBlckRpciApO1xuXG4gIC8vIENvcHkgaW50byB0aGUgZG9jdW1lbnQgcm9vdFxuICBmb3IgKCBjb25zdCBicmFuZCBvZiBicmFuZHNBcnJheSApIHtcbiAgICBpZiAoIGJyYW5kICE9PSAncGhldCcgKSB7XG4gICAgICBjb25zb2xlLmxvZyggYFNraXBwaW5nIGltYWdlcyBmb3IgdW5zdXBwb3J0ZWQgYnJhbmQ6ICR7YnJhbmR9YCApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IHNvdXJjZURpciA9IGAke3JlcG9EaXJ9L2J1aWxkLyR7YnJhbmR9L2A7XG4gICAgICBjb25zdCB0YXJnZXREaXIgPSBgJHtjb25zdGFudHMuSFRNTF9TSU1TX0RJUkVDVE9SWX0ke3NpbXVsYXRpb259LyR7dmVyc2lvbn0vYDtcbiAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoIHNvdXJjZURpciApO1xuICAgICAgZm9yICggY29uc3QgZmlsZSBvZiBmaWxlcyApIHtcbiAgICAgICAgaWYgKCBmaWxlLmVuZHNXaXRoKCAncG5nJyApICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCBgY29weWluZyBmaWxlICR7ZmlsZX1gICk7XG4gICAgICAgICAgYXdhaXQgZXhlY3V0ZSggJ2NwJywgWyBgJHtzb3VyY2VEaXJ9JHtmaWxlfWAsIGAke3RhcmdldERpcn0ke2ZpbGV9YCBdLCAnLicgKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyggYERvbmUgY29weWluZyBmaWxlcyBmb3IgJHtzaW11bGF0aW9ufWAgKTtcbiAgICB9XG4gIH1cbn07XG5cbmNvbnN0IHVwZGF0ZVJlcG9EaXIgPSBhc3luYyAoIHJlcG8sIGRpciApID0+IHtcbiAgYXdhaXQgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5KCByZXBvLCBpbWFnZXNSZXBvc0RpciApO1xuICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggJ21haW4nLCBkaXIgKTtcbiAgYXdhaXQgZ2l0UHVsbERpcmVjdG9yeSggZGlyICk7XG4gIGF3YWl0IG5wbVVwZGF0ZURpcmVjdG9yeSggZGlyICk7XG59O1xuXG4vKipcbiAqIFRoaXMgdGFzayBkZXBsb3lzIGFsbCBpbWFnZSBhc3NldHMgZnJvbSB0aGUgbWFpbiBicmFuY2ggdG8gdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIGFsbCBwdWJsaXNoZWQgc2ltcy4gSWYgc3BlY2lmaWNcbiAqIHNpbXVsYXRpb24vdmVyc2lvbiBvcHRpb25zIGFyZSBwcm92aWRlZCwgaXQgd2lsbCBkZXBsb3kgb25seSB0aGF0IHNwZWNpZmljIG9uZS5cbiAqL1xuY29uc3QgZGVwbG95SW1hZ2VzID0gYXN5bmMgb3B0aW9ucyA9PiB7XG4gIGNvbnNvbGUubG9nKCBgZGVwbG95aW5nIGltYWdlcyB3aXRoIGJyYW5kcyAke29wdGlvbnMuYnJhbmRzfWAgKTtcbiAgaWYgKCAhZnMuZXhpc3RzU3luYyggaW1hZ2VzUmVwb3NEaXIgKSApIHtcbiAgICBhd2FpdCBleGVjdXRlKCAnbWtkaXInLCBbIGltYWdlc1JlcG9zRGlyIF0sICcuJyApO1xuICB9XG5cbiAgYXdhaXQgdXBkYXRlUmVwb0RpciggJ2NoaXBwZXInLCBjaGlwcGVyRGlyICk7XG4gIGF3YWl0IHVwZGF0ZVJlcG9EaXIoICdwZXJlbm5pYWwtYWxpYXMnLCBwZXJlbm5pYWxBbGlhc0RpciApO1xuXG4gIGlmICggb3B0aW9ucy5zaW11bGF0aW9uICYmIG9wdGlvbnMudmVyc2lvbiApIHtcbiAgICBhd2FpdCBwcm9jZXNzU2ltKCBvcHRpb25zLnNpbXVsYXRpb24sIG9wdGlvbnMuYnJhbmRzLCBvcHRpb25zLnZlcnNpb24gKTtcbiAgfVxuICBlbHNlIHtcblxuICAgIC8vIEdldCBhbGwgcHVibGlzaGVkIHNpbXNcbiAgICBsZXQgcmVzcG9uc2U7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgYXhpb3MoICdodHRwczovL3BoZXQuY29sb3JhZG8uZWR1L3NlcnZpY2VzL21ldGFkYXRhLzEuMi9zaW11bGF0aW9ucz9mb3JtYXQ9anNvbiZzdW1tYXJ5JmxvY2FsZT1lbiZ0eXBlPWh0bWwnICk7XG4gICAgfVxuICAgIGNhdGNoKCBlICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCBlICk7XG4gICAgfVxuICAgIGlmICggcmVzcG9uc2Uuc3RhdHVzIDwgMjAwIHx8IHJlc3BvbnNlLnN0YXR1cyA+IDI5OSApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvciggYEJhZCBTdGF0dXMgd2hpbGUgZmV0Y2hpbmcgbWV0YWRhdGE6ICR7cmVzcG9uc2Uuc3RhdHVzfWAgKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBsZXQgcHJvamVjdHM7XG4gICAgICB0cnkge1xuICAgICAgICBwcm9qZWN0cyA9IHJlc3BvbnNlLmRhdGEucHJvamVjdHM7XG4gICAgICB9XG4gICAgICBjYXRjaCggZSApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBlICk7XG4gICAgICB9XG5cbiAgICAgIC8vIFVzZSBmb3IgaW5kZXggbG9vcCB0byBhbGxvdyBhc3luYy9hd2FpdFxuICAgICAgZm9yICggY29uc3QgcHJvamVjdCBvZiBwcm9qZWN0cyApIHtcbiAgICAgICAgZm9yICggY29uc3Qgc2ltdWxhdGlvbiBvZiBwcm9qZWN0LnNpbXVsYXRpb25zICkge1xuICAgICAgICAgIGF3YWl0IHByb2Nlc3NTaW0oIHNpbXVsYXRpb24ubmFtZSwgb3B0aW9ucy5icmFuZHMsIHByb2plY3QudmVyc2lvbi5zdHJpbmcgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBkZXBsb3lJbWFnZXM7Il0sIm5hbWVzIjpbImV4ZWN1dGUiLCJyZXF1aXJlIiwiZGVmYXVsdCIsImdpdENoZWNrb3V0RGlyZWN0b3J5IiwiZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5IiwiZ2l0UHVsbERpcmVjdG9yeSIsIm5wbVVwZGF0ZURpcmVjdG9yeSIsImNvbnN0YW50cyIsImZzIiwiYXhpb3MiLCJpbWFnZXNSZXBvc0RpciIsImNoaXBwZXJEaXIiLCJwZXJlbm5pYWxBbGlhc0RpciIsInByb2Nlc3NTaW0iLCJzaW11bGF0aW9uIiwiYnJhbmRzIiwidmVyc2lvbiIsInJlcG9EaXIiLCJicmFuZHNBcnJheSIsImJyYW5kc1N0cmluZyIsInNwbGl0Iiwiam9pbiIsImJyYW5kIiwiY29uc29sZSIsImxvZyIsInNvdXJjZURpciIsInRhcmdldERpciIsIkhUTUxfU0lNU19ESVJFQ1RPUlkiLCJmaWxlcyIsInJlYWRkaXJTeW5jIiwiZmlsZSIsImVuZHNXaXRoIiwidXBkYXRlUmVwb0RpciIsInJlcG8iLCJkaXIiLCJkZXBsb3lJbWFnZXMiLCJvcHRpb25zIiwiZXhpc3RzU3luYyIsInJlc3BvbnNlIiwiZSIsIkVycm9yIiwic3RhdHVzIiwicHJvamVjdHMiLCJkYXRhIiwicHJvamVjdCIsInNpbXVsYXRpb25zIiwibmFtZSIsInN0cmluZyIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBLGlEQUFpRDtBQUNqRCx5REFBeUQ7QUFFekQsTUFBTUEsVUFBVUMsUUFBUyxxQkFBc0JDLE9BQU87QUFDdEQsTUFBTUMsdUJBQXVCRixRQUFTO0FBQ3RDLE1BQU1HLDJCQUEyQkgsUUFBUztBQUMxQyxNQUFNSSxtQkFBbUJKLFFBQVM7QUFDbEMsTUFBTUsscUJBQXFCTCxRQUFTO0FBQ3BDLE1BQU1NLFlBQVlOLFFBQVM7QUFDM0IsTUFBTU8sS0FBS1AsUUFBUztBQUNwQixNQUFNUSxRQUFRUixRQUFTO0FBRXZCLE1BQU1TLGlCQUFpQjtBQUN2QixNQUFNQyxhQUFhLEdBQUdELGVBQWUsUUFBUSxDQUFDO0FBQzlDLE1BQU1FLG9CQUFvQixHQUFHRixlQUFlLGdCQUFnQixDQUFDO0FBRTdELE1BQU1HLGFBQWEsT0FBUUMsWUFBWUMsUUFBUUM7SUFFN0MsTUFBTUMsVUFBVSxHQUFHUCxlQUFlLENBQUMsRUFBRUksWUFBWTtJQUVqRCxXQUFXO0lBQ1gsTUFBTVYseUJBQTBCVSxZQUFZSjtJQUM1QyxNQUFNUCxxQkFBc0IsUUFBUWM7SUFDcEMsTUFBTVosaUJBQWtCWTtJQUV4QixJQUFJQztJQUNKLElBQUlDO0lBQ0osSUFBS0osUUFBUztRQUNaLElBQUtBLE9BQU9LLEtBQUssRUFBRztZQUNsQkYsY0FBY0gsT0FBT0ssS0FBSyxDQUFFO1lBQzVCRCxlQUFlSjtRQUNqQixPQUNLO1lBQ0hHLGNBQWNIO1lBQ2RJLGVBQWVKLE9BQU9NLElBQUksQ0FBRTtRQUM5QjtJQUNGLE9BQ0s7UUFDSEYsZUFB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