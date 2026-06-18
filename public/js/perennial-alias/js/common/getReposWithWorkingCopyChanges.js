// Copyright 2024, University of Colorado Boulder
/**
 * Detect uncommitted changes in each repo.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */ import assert from 'assert';
import _ from 'lodash';
import path from 'path';
import winston from '../npm-dependencies/winston.js';
import dirname from './dirname.js';
import execute from './execute.js';
import getActiveRepos from './getActiveRepos.js';
// @ts-expect-error ok to use import meta here
const __dirname = dirname(import.meta.url);
const RESOLVE_ERRORS = {
    errors: 'resolve'
};
export default async function getReposWithWorkingCopyChanges() {
    const repos = getActiveRepos();
    const changedRepos = [];
    const promises = repos.map(async (repo)=>{
        const cwd = path.resolve(__dirname, '../../../', repo);
        const check = (result)=>{
            result.code !== 0 && changedRepos.push(repo);
            return result.code === 0;
        };
        // Detect uncommitted changes in each repo:
        // https://stackoverflow.com/questions/3878624/how-do-i-programmatically-determine-if-there-are-uncommitted-changes
        // git diff-index --quiet HEAD --
        // This will error if the diff-index shows any changes in the repo, otherwise error is null.
        check(await execute('git', [
            'update-index',
            '--refresh'
        ], cwd, RESOLVE_ERRORS)) && check(await execute('git', [
            'diff-index',
            '--quiet',
            'HEAD',
            '--'
        ], cwd, RESOLVE_ERRORS));
    });
    await Promise.all(promises);
    const changedReposString = changedRepos.join(', ');
    assert(_.isEqual(changedRepos, _.uniq(changedRepos)), `changed repos is not list of unique items: ${changedReposString}`);
    winston.info('detected changed repos: ' + changedReposString);
    return changedRepos;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZ2V0UmVwb3NXaXRoV29ya2luZ0NvcHlDaGFuZ2VzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBEZXRlY3QgdW5jb21taXR0ZWQgY2hhbmdlcyBpbiBlYWNoIHJlcG8uXG4gKlxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBSZXBvIH0gZnJvbSAnLi4vYnJvd3Nlci1hbmQtbm9kZS9QZXJlbm5pYWxUeXBlcy5qcyc7XG5pbXBvcnQgd2luc3RvbiBmcm9tICcuLi9ucG0tZGVwZW5kZW5jaWVzL3dpbnN0b24uanMnO1xuaW1wb3J0IGRpcm5hbWUgZnJvbSAnLi9kaXJuYW1lLmpzJztcbmltcG9ydCBleGVjdXRlLCB7IEV4ZWN1dGVSZXN1bHQgfSBmcm9tICcuL2V4ZWN1dGUuanMnO1xuaW1wb3J0IGdldEFjdGl2ZVJlcG9zIGZyb20gJy4vZ2V0QWN0aXZlUmVwb3MuanMnO1xuXG4vLyBAdHMtZXhwZWN0LWVycm9yIG9rIHRvIHVzZSBpbXBvcnQgbWV0YSBoZXJlXG5jb25zdCBfX2Rpcm5hbWUgPSBkaXJuYW1lKCBpbXBvcnQubWV0YS51cmwgKTtcblxuY29uc3QgUkVTT0xWRV9FUlJPUlMgPSB7IGVycm9yczogJ3Jlc29sdmUnIH0gYXMgY29uc3Q7XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGdldFJlcG9zV2l0aFdvcmtpbmdDb3B5Q2hhbmdlcygpOiBQcm9taXNlPFJlcG9bXT4ge1xuXG4gIGNvbnN0IHJlcG9zID0gZ2V0QWN0aXZlUmVwb3MoKTtcblxuICBjb25zdCBjaGFuZ2VkUmVwb3M6IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3QgcHJvbWlzZXMgPSByZXBvcy5tYXAoIGFzeW5jIHJlcG8gPT4ge1xuICAgIGNvbnN0IGN3ZCA9IHBhdGgucmVzb2x2ZSggX19kaXJuYW1lLCAnLi4vLi4vLi4vJywgcmVwbyApO1xuXG4gICAgY29uc3QgY2hlY2sgPSAoIHJlc3VsdDogRXhlY3V0ZVJlc3VsdCApID0+IHtcbiAgICAgIHJlc3VsdC5jb2RlICE9PSAwICYmIGNoYW5nZWRSZXBvcy5wdXNoKCByZXBvICk7XG4gICAgICByZXR1cm4gcmVzdWx0LmNvZGUgPT09IDA7XG4gICAgfTtcblxuICAgIC8vIERldGVjdCB1bmNvbW1pdHRlZCBjaGFuZ2VzIGluIGVhY2ggcmVwbzpcbiAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zODc4NjI0L2hvdy1kby1pLXByb2dyYW1tYXRpY2FsbHktZGV0ZXJtaW5lLWlmLXRoZXJlLWFyZS11bmNvbW1pdHRlZC1jaGFuZ2VzXG4gICAgLy8gZ2l0IGRpZmYtaW5kZXggLS1xdWlldCBIRUFEIC0tXG4gICAgLy8gVGhpcyB3aWxsIGVycm9yIGlmIHRoZSBkaWZmLWluZGV4IHNob3dzIGFueSBjaGFuZ2VzIGluIHRoZSByZXBvLCBvdGhlcndpc2UgZXJyb3IgaXMgbnVsbC5cbiAgICBjaGVjayggYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFsgJ3VwZGF0ZS1pbmRleCcsICctLXJlZnJlc2gnIF0sIGN3ZCwgUkVTT0xWRV9FUlJPUlMgKSApICYmXG4gICAgY2hlY2soIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdkaWZmLWluZGV4JywgJy0tcXVpZXQnLCAnSEVBRCcsICctLScgXSwgY3dkLCBSRVNPTFZFX0VSUk9SUyApICk7XG4gIH0gKTtcblxuICBhd2FpdCBQcm9taXNlLmFsbCggcHJvbWlzZXMgKTtcblxuICBjb25zdCBjaGFuZ2VkUmVwb3NTdHJpbmcgPSBjaGFuZ2VkUmVwb3Muam9pbiggJywgJyApO1xuICBhc3NlcnQoIF8uaXNFcXVhbCggY2hhbmdlZFJlcG9zLCBfLnVuaXEoIGNoYW5nZWRSZXBvcyApICksIGBjaGFuZ2VkIHJlcG9zIGlzIG5vdCBsaXN0IG9mIHVuaXF1ZSBpdGVtczogJHtjaGFuZ2VkUmVwb3NTdHJpbmd9YCApO1xuICB3aW5zdG9uLmluZm8oICdkZXRlY3RlZCBjaGFuZ2VkIHJlcG9zOiAnICsgY2hhbmdlZFJlcG9zU3RyaW5nICk7XG5cbiAgcmV0dXJuIGNoYW5nZWRSZXBvcztcbn0iXSwibmFtZXMiOlsiYXNzZXJ0IiwiXyIsInBhdGgiLCJ3aW5zdG9uIiwiZGlybmFtZSIsImV4ZWN1dGUiLCJnZXRBY3RpdmVSZXBvcyIsIl9fZGlybmFtZSIsInVybCIsIlJFU09MVkVfRVJST1JTIiwiZXJyb3JzIiwiZ2V0UmVwb3NXaXRoV29ya2luZ0NvcHlDaGFuZ2VzIiwicmVwb3MiLCJjaGFuZ2VkUmVwb3MiLCJwcm9taXNlcyIsIm1hcCIsInJlcG8iLCJjd2QiLCJyZXNvbHZlIiwiY2hlY2siLCJyZXN1bHQiLCJjb2RlIiwicHVzaCIsIlByb21pc2UiLCJhbGwiLCJjaGFuZ2VkUmVwb3NTdHJpbmciLCJqb2luIiwiaXNFcXVhbCIsInVuaXEiLCJpbmZvIl0sIm1hcHBpbmdzIjoiQUFBQSxpREFBaUQ7QUFFakQ7Ozs7O0NBS0MsR0FFRCxPQUFPQSxZQUFZLFNBQVM7QUFDNUIsT0FBT0MsT0FBTyxTQUFTO0FBQ3ZCLE9BQU9DLFVBQVUsT0FBTztBQUV4QixPQUFPQyxhQUFhLGlDQUFpQztBQUNyRCxPQUFPQyxhQUFhLGVBQWU7QUFDbkMsT0FBT0MsYUFBZ0MsZUFBZTtBQUN0RCxPQUFPQyxvQkFBb0Isc0JBQXNCO0FBRWpELDhDQUE4QztBQUM5QyxNQUFNQyxZQUFZSCxRQUFTLFlBQVlJLEdBQUc7QUFFMUMsTUFBTUMsaUJBQWlCO0lBQUVDLFFBQVE7QUFBVTtBQUUzQyxlQUFlLGVBQWVDO0lBRTVCLE1BQU1DLFFBQVFOO0lBRWQsTUFBTU8sZUFBeUIsRUFBRTtJQUVqQyxNQUFNQyxXQUFXRixNQUFNRyxHQUFHLENBQUUsT0FBTUM7UUFDaEMsTUFBTUMsTUFBTWYsS0FBS2dCLE9BQU8sQ0FBRVgsV0FBVyxhQUFhUztRQUVsRCxNQUFNRyxRQUFRLENBQUVDO1lBQ2RBLE9BQU9DLElBQUksS0FBSyxLQUFLUixhQUFhUyxJQUFJLENBQUVOO1lBQ3hDLE9BQU9JLE9BQU9DLElBQUksS0FBSztRQUN6QjtRQUVBLDJDQUEyQztRQUMzQyxtSEFBbUg7UUFDbkgsaUNBQWlDO1FBQ2pDLDRGQUE0RjtRQUM1RkYsTUFBTyxNQUFNZCxRQUFTLE9BQU87WUFBRTtZQUFnQjtTQUFhLEVBQUVZLEtBQUtSLG9CQUNuRVUsTUFBTyxNQUFNZCxRQUFTLE9BQU87WUFBRTtZQUFjO1lBQVc7WUFBUTtTQUFNLEVBQUVZLEtBQUtSO0lBQy9FO0lBRUEsTUFBTWMsUUFBUUMsR0FBRyxDQUFFVjtJQUVuQixNQUFNVyxxQkFBcUJaLGFBQWFhLElBQUksQ0FBRTtJQUM5QzFCLE9BQVFDLEVBQUUwQixPQUFPLENBQUVkLGNBQWNaLEVBQUUyQixJQUFJLENBQUVmLGdCQUFrQixDQUFDLDJDQUEyQyxFQUFFWSxvQkFBb0I7SUFDN0h0QixRQUFRMEIsSUFBSSxDQUFFLDZCQUE2Qko7SUFFM0MsT0FBT1o7QUFDVCJ9