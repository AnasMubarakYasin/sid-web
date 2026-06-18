// Copyright 2024-2026, University of Colorado Boulder
/**
 * Updates the gh-pages branches for various repos, including building of dot/kite/scenery
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ import winston from 'winston';
import execute from '../common/execute.js';
import gitAdd from '../common/gitAdd.js';
import gitCheckout from '../common/gitCheckout.js';
import gitCommit from '../common/gitCommit.js';
import gitIsClean from '../common/gitIsClean.js';
import gitPull from '../common/gitPull.js';
import gitPush from '../common/gitPush.js';
import gruntCommand from '../common/gruntCommand.js';
import npmUpdate from '../common/npmUpdate.js';
(async ()=>{
    winston.info('Updating GitHub pages');
    const taggedRepos = [
        {
            repo: 'assert'
        },
        {
            repo: 'aqua'
        },
        {
            repo: 'tandem'
        },
        {
            repo: 'query-string-machine'
        },
        {
            repo: 'phet-core'
        },
        {
            repo: 'chipper'
        },
        {
            repo: 'sherpa'
        },
        {
            repo: 'axon'
        },
        {
            repo: 'dot',
            build: true
        },
        {
            repo: 'kite',
            build: true
        },
        {
            repo: 'scenery',
            build: true
        }
    ];
    for (const taggedRepo of taggedRepos){
        const repo = taggedRepo.repo;
        winston.info(`Updating ${repo}`);
        await gitCheckout(repo, 'gh-pages');
        await gitPull(repo);
        await execute('git', [
            'merge',
            'main',
            '-m',
            'Update for gh-pages'
        ], `../${repo}`);
        if (taggedRepo.build) {
            await npmUpdate(repo);
            winston.info(`Building ${repo}`);
            await execute(gruntCommand, [], `../${repo}`);
            if (!await gitIsClean(repo)) {
                await gitAdd(repo, 'build');
                await gitCommit(repo, 'Updating for gh-pages build');
            }
        }
        await gitPush(repo, 'gh-pages');
        await gitCheckout(repo, 'main');
    }
})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL3VwZGF0ZS1naC1wYWdlcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyNC0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBnaC1wYWdlcyBicmFuY2hlcyBmb3IgdmFyaW91cyByZXBvcywgaW5jbHVkaW5nIGJ1aWxkaW5nIG9mIGRvdC9raXRlL3NjZW5lcnlcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXG4gKi9cblxuaW1wb3J0IHdpbnN0b24gZnJvbSAnd2luc3Rvbic7XG5pbXBvcnQgZXhlY3V0ZSBmcm9tICcuLi9jb21tb24vZXhlY3V0ZS5qcyc7XG5pbXBvcnQgZ2l0QWRkIGZyb20gJy4uL2NvbW1vbi9naXRBZGQuanMnO1xuaW1wb3J0IGdpdENoZWNrb3V0IGZyb20gJy4uL2NvbW1vbi9naXRDaGVja291dC5qcyc7XG5pbXBvcnQgZ2l0Q29tbWl0IGZyb20gJy4uL2NvbW1vbi9naXRDb21taXQuanMnO1xuaW1wb3J0IGdpdElzQ2xlYW4gZnJvbSAnLi4vY29tbW9uL2dpdElzQ2xlYW4uanMnO1xuaW1wb3J0IGdpdFB1bGwgZnJvbSAnLi4vY29tbW9uL2dpdFB1bGwuanMnO1xuaW1wb3J0IGdpdFB1c2ggZnJvbSAnLi4vY29tbW9uL2dpdFB1c2guanMnO1xuaW1wb3J0IGdydW50Q29tbWFuZCBmcm9tICcuLi9jb21tb24vZ3J1bnRDb21tYW5kLmpzJztcbmltcG9ydCBucG1VcGRhdGUgZnJvbSAnLi4vY29tbW9uL25wbVVwZGF0ZS5qcyc7XG5cbiggKCBhc3luYyAoKSA9PiB7XG5cbiAgd2luc3Rvbi5pbmZvKCAnVXBkYXRpbmcgR2l0SHViIHBhZ2VzJyApO1xuXG4gIGNvbnN0IHRhZ2dlZFJlcG9zID0gW1xuICAgIHsgcmVwbzogJ2Fzc2VydCcgfSxcbiAgICB7IHJlcG86ICdhcXVhJyB9LFxuICAgIHsgcmVwbzogJ3RhbmRlbScgfSxcbiAgICB7IHJlcG86ICdxdWVyeS1zdHJpbmctbWFjaGluZScgfSxcbiAgICB7IHJlcG86ICdwaGV0LWNvcmUnIH0sXG4gICAgeyByZXBvOiAnY2hpcHBlcicgfSxcbiAgICB7IHJlcG86ICdzaGVycGEnIH0sXG4gICAgeyByZXBvOiAnYXhvbicgfSxcbiAgICB7IHJlcG86ICdkb3QnLCBidWlsZDogdHJ1ZSB9LFxuICAgIHsgcmVwbzogJ2tpdGUnLCBidWlsZDogdHJ1ZSB9LFxuICAgIHsgcmVwbzogJ3NjZW5lcnknLCBidWlsZDogdHJ1ZSB9XG4gIF07XG5cbiAgZm9yICggY29uc3QgdGFnZ2VkUmVwbyBvZiB0YWdnZWRSZXBvcyApIHtcbiAgICBjb25zdCByZXBvID0gdGFnZ2VkUmVwby5yZXBvO1xuXG4gICAgd2luc3Rvbi5pbmZvKCBgVXBkYXRpbmcgJHtyZXBvfWAgKTtcblxuICAgIGF3YWl0IGdpdENoZWNrb3V0KCByZXBvLCAnZ2gtcGFnZXMnICk7XG4gICAgYXdhaXQgZ2l0UHVsbCggcmVwbyApO1xuICAgIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdtZXJnZScsICdtYWluJywgJy1tJywgJ1VwZGF0ZSBmb3IgZ2gtcGFnZXMnIF0sIGAuLi8ke3JlcG99YCApO1xuXG4gICAgaWYgKCB0YWdnZWRSZXBvLmJ1aWxkICkge1xuICAgICAgYXdhaXQgbnBtVXBkYXRlKCByZXBvICk7XG4gICAgICB3aW5zdG9uLmluZm8oIGBCdWlsZGluZyAke3JlcG99YCApO1xuICAgICAgYXdhaXQgZXhlY3V0ZSggZ3J1bnRDb21tYW5kLCBbXSwgYC4uLyR7cmVwb31gICk7XG5cbiAgICAgIGlmICggIWF3YWl0IGdpdElzQ2xlYW4oIHJlcG8gKSApIHtcbiAgICAgICAgYXdhaXQgZ2l0QWRkKCByZXBvLCAnYnVpbGQnICk7XG4gICAgICAgIGF3YWl0IGdpdENvbW1pdCggcmVwbywgJ1VwZGF0aW5nIGZvciBnaC1wYWdlcyBidWlsZCcgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhd2FpdCBnaXRQdXNoKCByZXBvLCAnZ2gtcGFnZXMnICk7XG4gICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHJlcG8sICdtYWluJyApO1xuICB9XG59ICkgKSgpOyJdLCJuYW1lcyI6WyJ3aW5zdG9uIiwiZXhlY3V0ZSIsImdpdEFkZCIsImdpdENoZWNrb3V0IiwiZ2l0Q29tbWl0IiwiZ2l0SXNDbGVhbiIsImdpdFB1bGwiLCJnaXRQdXNoIiwiZ3J1bnRDb21tYW5kIiwibnBtVXBkYXRlIiwiaW5mbyIsInRhZ2dlZFJlcG9zIiwicmVwbyIsImJ1aWxkIiwidGFnZ2VkUmVwbyJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7Q0FHQyxHQUVELE9BQU9BLGFBQWEsVUFBVTtBQUM5QixPQUFPQyxhQUFhLHVCQUF1QjtBQUMzQyxPQUFPQyxZQUFZLHNCQUFzQjtBQUN6QyxPQUFPQyxpQkFBaUIsMkJBQTJCO0FBQ25ELE9BQU9DLGVBQWUseUJBQXlCO0FBQy9DLE9BQU9DLGdCQUFnQiwwQkFBMEI7QUFDakQsT0FBT0MsYUFBYSx1QkFBdUI7QUFDM0MsT0FBT0MsYUFBYSx1QkFBdUI7QUFDM0MsT0FBT0Msa0JBQWtCLDRCQUE0QjtBQUNyRCxPQUFPQyxlQUFlLHlCQUF5QjtBQUUzQyxDQUFBO0lBRUZULFFBQVFVLElBQUksQ0FBRTtJQUVkLE1BQU1DLGNBQWM7UUFDbEI7WUFBRUMsTUFBTTtRQUFTO1FBQ2pCO1lBQUVBLE1BQU07UUFBTztRQUNmO1lBQUVBLE1BQU07UUFBUztRQUNqQjtZQUFFQSxNQUFNO1FBQXVCO1FBQy9CO1lBQUVBLE1BQU07UUFBWTtRQUNwQjtZQUFFQSxNQUFNO1FBQVU7UUFDbEI7WUFBRUEsTUFBTTtRQUFTO1FBQ2pCO1lBQUVBLE1BQU07UUFBTztRQUNmO1lBQUVBLE1BQU07WUFBT0MsT0FBTztRQUFLO1FBQzNCO1lBQUVELE1BQU07WUFBUUMsT0FBTztRQUFLO1FBQzVCO1lBQUVELE1BQU07WUFBV0MsT0FBTztRQUFLO0tBQ2hDO0lBRUQsS0FBTSxNQUFNQyxjQUFjSCxZQUFjO1FBQ3RDLE1BQU1DLE9BQU9FLFdBQVdGLElBQUk7UUFFNUJaLFFBQVFVLElBQUksQ0FBRSxDQUFDLFNBQVMsRUFBRUUsTUFBTTtRQUVoQyxNQUFNVCxZQUFhUyxNQUFNO1FBQ3pCLE1BQU1OLFFBQVNNO1FBQ2YsTUFBTVgsUUFBUyxPQUFPO1lBQUU7WUFBUztZQUFRO1lBQU07U0FBdUIsRUFBRSxDQUFDLEdBQUcsRUFBRVcsTUFBTTtRQUVwRixJQUFLRSxXQUFXRCxLQUFLLEVBQUc7WUFDdEIsTUFBTUosVUFBV0c7WUFDakJaLFFBQVFVLElBQUksQ0FBRSxDQUFDLFNBQVMsRUFBRUUsTUFBTTtZQUNoQyxNQUFNWCxRQUFTTyxjQUFjLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRUksTUFBTTtZQUU3QyxJQUFLLENBQUMsTUFBTVAsV0FBWU8sT0FBUztnQkFDL0IsTUFBTVYsT0FBUVUsTUFBTTtnQkFDcEIsTUFBTVIsVUFBV1EsTUFBTTtZQUN6QjtRQUNGO1FBRUEsTUFBTUwsUUFBU0ssTUFBTTtRQUNyQixNQUFNVCxZQUFhUyxNQUFNO0lBQzNCO0FBQ0YsQ0FBQSJ9