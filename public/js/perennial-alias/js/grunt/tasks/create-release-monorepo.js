// Copyright 2026, University of Colorado Boulder
/**
 * Creates a release branch for a simulation in the totality monorepo.
 * --repo : The sim repo
 * --branch : The branch name, which should be {{MAJOR}}.{{MINOR}}, e.g. 1.0
 * --brands : The supported brands for the release, comma separated
 * --message : An optional message appended to the commit message
 * --skip-push : If set, do everything locally but skip pushing to origin; leaves the worktree for inspection
 * --skip-version-bump : If set, skip bumping main's version to the next dev version
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */ import assert from 'assert';
import assertIsValidRepoName from '../../common/assertIsValidRepoName.js';
import createReleaseMonorepo from '../createReleaseMonorepo.js';
import getOption from './util/getOption.js';
(async ()=>{
    const repo = getOption('repo');
    const branch = getOption('branch');
    const brands = getOption('brands');
    const message = getOption('message');
    const skipPush = !!getOption('skip-push');
    const skipVersionBump = !!getOption('skip-version-bump');
    assert(repo, 'Requires --repo={{REPO}}');
    assert(branch, 'Requires --branch={{MAJOR}}.{{MINOR}}');
    assert(brands, 'Requires --brands={{BRANDS}} (comma-separated)');
    assertIsValidRepoName(repo);
    await createReleaseMonorepo({
        repo: repo,
        branch: branch,
        brands: brands.split(','),
        message: message,
        skipPush: skipPush,
        skipVersionBump: skipVersionBump
    });
    process.exit(0);
})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9ncnVudC90YXNrcy9jcmVhdGUtcmVsZWFzZS1tb25vcmVwby50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyNiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXG5cbi8qKlxuICogQ3JlYXRlcyBhIHJlbGVhc2UgYnJhbmNoIGZvciBhIHNpbXVsYXRpb24gaW4gdGhlIHRvdGFsaXR5IG1vbm9yZXBvLlxuICogLS1yZXBvIDogVGhlIHNpbSByZXBvXG4gKiAtLWJyYW5jaCA6IFRoZSBicmFuY2ggbmFtZSwgd2hpY2ggc2hvdWxkIGJlIHt7TUFKT1J9fS57e01JTk9SfX0sIGUuZy4gMS4wXG4gKiAtLWJyYW5kcyA6IFRoZSBzdXBwb3J0ZWQgYnJhbmRzIGZvciB0aGUgcmVsZWFzZSwgY29tbWEgc2VwYXJhdGVkXG4gKiAtLW1lc3NhZ2UgOiBBbiBvcHRpb25hbCBtZXNzYWdlIGFwcGVuZGVkIHRvIHRoZSBjb21taXQgbWVzc2FnZVxuICogLS1za2lwLXB1c2ggOiBJZiBzZXQsIGRvIGV2ZXJ5dGhpbmcgbG9jYWxseSBidXQgc2tpcCBwdXNoaW5nIHRvIG9yaWdpbjsgbGVhdmVzIHRoZSB3b3JrdHJlZSBmb3IgaW5zcGVjdGlvblxuICogLS1za2lwLXZlcnNpb24tYnVtcCA6IElmIHNldCwgc2tpcCBidW1waW5nIG1haW4ncyB2ZXJzaW9uIHRvIHRoZSBuZXh0IGRldiB2ZXJzaW9uXG4gKlxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgYXNzZXJ0SXNWYWxpZFJlcG9OYW1lIGZyb20gJy4uLy4uL2NvbW1vbi9hc3NlcnRJc1ZhbGlkUmVwb05hbWUuanMnO1xuaW1wb3J0IGNyZWF0ZVJlbGVhc2VNb25vcmVwbyBmcm9tICcuLi9jcmVhdGVSZWxlYXNlTW9ub3JlcG8uanMnO1xuaW1wb3J0IGdldE9wdGlvbiBmcm9tICcuL3V0aWwvZ2V0T3B0aW9uLmpzJztcblxuKCBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHJlcG8gPSBnZXRPcHRpb24oICdyZXBvJyApO1xuICBjb25zdCBicmFuY2ggPSBnZXRPcHRpb24oICdicmFuY2gnICk7XG4gIGNvbnN0IGJyYW5kcyA9IGdldE9wdGlvbiggJ2JyYW5kcycgKTtcbiAgY29uc3QgbWVzc2FnZSA9IGdldE9wdGlvbiggJ21lc3NhZ2UnICk7XG4gIGNvbnN0IHNraXBQdXNoID0gISFnZXRPcHRpb24oICdza2lwLXB1c2gnICk7XG4gIGNvbnN0IHNraXBWZXJzaW9uQnVtcCA9ICEhZ2V0T3B0aW9uKCAnc2tpcC12ZXJzaW9uLWJ1bXAnICk7XG5cbiAgYXNzZXJ0KCByZXBvLCAnUmVxdWlyZXMgLS1yZXBvPXt7UkVQT319JyApO1xuICBhc3NlcnQoIGJyYW5jaCwgJ1JlcXVpcmVzIC0tYnJhbmNoPXt7TUFKT1J9fS57e01JTk9SfX0nICk7XG4gIGFzc2VydCggYnJhbmRzLCAnUmVxdWlyZXMgLS1icmFuZHM9e3tCUkFORFN9fSAoY29tbWEtc2VwYXJhdGVkKScgKTtcbiAgYXNzZXJ0SXNWYWxpZFJlcG9OYW1lKCByZXBvICk7XG5cbiAgYXdhaXQgY3JlYXRlUmVsZWFzZU1vbm9yZXBvKCB7XG4gICAgcmVwbzogcmVwbyxcbiAgICBicmFuY2g6IGJyYW5jaCxcbiAgICBicmFuZHM6IGJyYW5kcy5zcGxpdCggJywnICksXG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBza2lwUHVzaDogc2tpcFB1c2gsXG4gICAgc2tpcFZlcnNpb25CdW1wOiBza2lwVmVyc2lvbkJ1bXBcbiAgfSApO1xuXG4gIHByb2Nlc3MuZXhpdCggMCApO1xufSApKCk7XG4iXSwibmFtZXMiOlsiYXNzZXJ0IiwiYXNzZXJ0SXNWYWxpZFJlcG9OYW1lIiwiY3JlYXRlUmVsZWFzZU1vbm9yZXBvIiwiZ2V0T3B0aW9uIiwicmVwbyIsImJyYW5jaCIsImJyYW5kcyIsIm1lc3NhZ2UiLCJza2lwUHVzaCIsInNraXBWZXJzaW9uQnVtcCIsInNwbGl0IiwicHJvY2VzcyIsImV4aXQiXSwibWFwcGluZ3MiOiJBQUFBLGlEQUFpRDtBQUVqRDs7Ozs7Ozs7OztDQVVDLEdBRUQsT0FBT0EsWUFBWSxTQUFTO0FBQzVCLE9BQU9DLDJCQUEyQix3Q0FBd0M7QUFDMUUsT0FBT0MsMkJBQTJCLDhCQUE4QjtBQUNoRSxPQUFPQyxlQUFlLHNCQUFzQjtBQUUxQyxDQUFBO0lBQ0EsTUFBTUMsT0FBT0QsVUFBVztJQUN4QixNQUFNRSxTQUFTRixVQUFXO0lBQzFCLE1BQU1HLFNBQVNILFVBQVc7SUFDMUIsTUFBTUksVUFBVUosVUFBVztJQUMzQixNQUFNSyxXQUFXLENBQUMsQ0FBQ0wsVUFBVztJQUM5QixNQUFNTSxrQkFBa0IsQ0FBQyxDQUFDTixVQUFXO0lBRXJDSCxPQUFRSSxNQUFNO0lBQ2RKLE9BQVFLLFFBQVE7SUFDaEJMLE9BQVFNLFFBQVE7SUFDaEJMLHNCQUF1Qkc7SUFFdkIsTUFBTUYsc0JBQXVCO1FBQzNCRSxNQUFNQTtRQUNOQyxRQUFRQTtRQUNSQyxRQUFRQSxPQUFPSSxLQUFLLENBQUU7UUFDdEJILFNBQVNBO1FBQ1RDLFVBQVVBO1FBQ1ZDLGlCQUFpQkE7SUFDbkI7SUFFQUUsUUFBUUMsSUFBSSxDQUFFO0FBQ2hCLENBQUEifQ==