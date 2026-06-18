// Copyright 2024-2026, University of Colorado Boulder
/**
 * Prints out a report (with links) for active sims/translation for each locale
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */ const localeInfo = require('../../../chipper/js/data/localeInfo');
const simMetadata = require('../common/simMetadata').default;
const winston = require('winston');
winston.default.transports.console.level = 'error';
const production = process.argv.includes('--production');
const local = process.argv.includes('--local');
const limitString = process.argv.find((arg)=>arg.startsWith('--limit='));
const limit = limitString ? Number(limitString.substring('--limit='.length)) : Number.POSITIVE_INFINITY;
(async ()=>{
    const metadata = await simMetadata();
    const simNamesByLocale = {};
    metadata.projects.forEach((project)=>{
        const simulations = project.simulations;
        if (simulations.length !== 1) {
            throw new Error('Expected exactly one simulation per project in metadata');
        }
        const simulation = simulations[0];
        const name = simulation.name;
        const locales = Object.keys(simulation.localizedSimulations);
        locales.forEach((locale)=>{
            if (!simNamesByLocale[locale]) {
                simNamesByLocale[locale] = [];
            }
            simNamesByLocale[locale].push(name);
        });
    });
    // https://bayes.colorado.edu/dev/phettest/acid-base-solutions/acid-base-solutions_en.html?ea&brand=phet
    const locales = Object.keys(simNamesByLocale).sort();
    for (const locale of locales){
        console.log(`## ${locale} (${localeInfo[locale].name})`);
        console.log('');
        simNamesByLocale[locale].slice(0, Math.min(limit, simNamesByLocale[locale].length)).forEach((simName)=>{
            const links = [];
            if (production) {
                links.push(`[production](https://phet.colorado.edu/sims/html/${simName}/latest/${simName}_all.html?locale=${locale})`);
            }
            if (local) {
                links.push(`[local](http://localhost/${simName}/${simName}_en.html?brand=phet&ea&debugger&locale=${locale})`);
            }
            console.log(`- ${simName} ${links.join(' ')}`);
        });
        console.log('');
    }
})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9zY3JpcHRzL2xvY2FsZS1zaW0tbGlzdC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyNC0yMDI2LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcblxuLyoqXG4gKiBQcmludHMgb3V0IGEgcmVwb3J0ICh3aXRoIGxpbmtzKSBmb3IgYWN0aXZlIHNpbXMvdHJhbnNsYXRpb24gZm9yIGVhY2ggbG9jYWxlXG4gKlxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcbiAqL1xuXG5jb25zdCBsb2NhbGVJbmZvID0gcmVxdWlyZSggJy4uLy4uLy4uL2NoaXBwZXIvanMvZGF0YS9sb2NhbGVJbmZvJyApO1xuY29uc3Qgc2ltTWV0YWRhdGEgPSByZXF1aXJlKCAnLi4vY29tbW9uL3NpbU1ldGFkYXRhJyApLmRlZmF1bHQ7XG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XG5cbndpbnN0b24uZGVmYXVsdC50cmFuc3BvcnRzLmNvbnNvbGUubGV2ZWwgPSAnZXJyb3InO1xuXG5jb25zdCBwcm9kdWN0aW9uID0gcHJvY2Vzcy5hcmd2LmluY2x1ZGVzKCAnLS1wcm9kdWN0aW9uJyApO1xuY29uc3QgbG9jYWwgPSBwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoICctLWxvY2FsJyApO1xuXG5jb25zdCBsaW1pdFN0cmluZyA9IHByb2Nlc3MuYXJndi5maW5kKCBhcmcgPT4gYXJnLnN0YXJ0c1dpdGgoICctLWxpbWl0PScgKSApO1xuY29uc3QgbGltaXQgPSBsaW1pdFN0cmluZyA/IE51bWJlciggbGltaXRTdHJpbmcuc3Vic3RyaW5nKCAnLS1saW1pdD0nLmxlbmd0aCApICkgOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG5cbiggYXN5bmMgKCkgPT4ge1xuXG4gIGNvbnN0IG1ldGFkYXRhID0gYXdhaXQgc2ltTWV0YWRhdGEoKTtcblxuICBjb25zdCBzaW1OYW1lc0J5TG9jYWxlID0ge307XG5cbiAgbWV0YWRhdGEucHJvamVjdHMuZm9yRWFjaCggcHJvamVjdCA9PiB7XG4gICAgY29uc3Qgc2ltdWxhdGlvbnMgPSBwcm9qZWN0LnNpbXVsYXRpb25zO1xuICAgIGlmICggc2ltdWxhdGlvbnMubGVuZ3RoICE9PSAxICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCAnRXhwZWN0ZWQgZXhhY3RseSBvbmUgc2ltdWxhdGlvbiBwZXIgcHJvamVjdCBpbiBtZXRhZGF0YScgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaW11bGF0aW9uID0gc2ltdWxhdGlvbnNbIDAgXTtcbiAgICBjb25zdCBuYW1lID0gc2ltdWxhdGlvbi5uYW1lO1xuICAgIGNvbnN0IGxvY2FsZXMgPSBPYmplY3Qua2V5cyggc2ltdWxhdGlvbi5sb2NhbGl6ZWRTaW11bGF0aW9ucyApO1xuXG4gICAgbG9jYWxlcy5mb3JFYWNoKCBsb2NhbGUgPT4ge1xuICAgICAgaWYgKCAhc2ltTmFtZXNCeUxvY2FsZVsgbG9jYWxlIF0gKSB7XG4gICAgICAgIHNpbU5hbWVzQnlMb2NhbGVbIGxvY2FsZSBdID0gW107XG4gICAgICB9XG4gICAgICBzaW1OYW1lc0J5TG9jYWxlWyBsb2NhbGUgXS5wdXNoKCBuYW1lICk7XG4gICAgfSApO1xuICB9ICk7XG5cbiAgLy8gaHR0cHM6Ly9iYXllcy5jb2xvcmFkby5lZHUvZGV2L3BoZXR0ZXN0L2FjaWQtYmFzZS1zb2x1dGlvbnMvYWNpZC1iYXNlLXNvbHV0aW9uc19lbi5odG1sP2VhJmJyYW5kPXBoZXRcblxuICBjb25zdCBsb2NhbGVzID0gT2JqZWN0LmtleXMoIHNpbU5hbWVzQnlMb2NhbGUgKS5zb3J0KCk7XG5cbiAgZm9yICggY29uc3QgbG9jYWxlIG9mIGxvY2FsZXMgKSB7XG5cbiAgICBjb25zb2xlLmxvZyggYCMjICR7bG9jYWxlfSAoJHtsb2NhbGVJbmZvWyBsb2NhbGUgXS5uYW1lfSlgICk7XG4gICAgY29uc29sZS5sb2coICcnICk7XG4gICAgc2ltTmFtZXNCeUxvY2FsZVsgbG9jYWxlIF0uc2xpY2UoIDAsIE1hdGgubWluKCBsaW1pdCwgc2ltTmFtZXNCeUxvY2FsZVsgbG9jYWxlIF0ubGVuZ3RoICkgKS5mb3JFYWNoKCBzaW1OYW1lID0+IHtcbiAgICAgIGNvbnN0IGxpbmtzID0gW107XG4gICAgICBpZiAoIHByb2R1Y3Rpb24gKSB7XG4gICAgICAgIGxpbmtzLnB1c2goIGBbcHJvZHVjdGlvbl0oaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdS9zaW1zL2h0bWwvJHtzaW1OYW1lfS9sYXRlc3QvJHtzaW1OYW1lfV9hbGwuaHRtbD9sb2NhbGU9JHtsb2NhbGV9KWAgKTtcbiAgICAgIH1cbiAgICAgIGlmICggbG9jYWwgKSB7XG4gICAgICAgIGxpbmtzLnB1c2goIGBbbG9jYWxdKGh0dHA6Ly9sb2NhbGhvc3QvJHtzaW1OYW1lfS8ke3NpbU5hbWV9X2VuLmh0bWw/YnJhbmQ9cGhldCZlYSZkZWJ1Z2dlciZsb2NhbGU9JHtsb2NhbGV9KWAgKTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKCBgLSAke3NpbU5hbWV9ICR7bGlua3Muam9pbiggJyAnICl9YCApO1xuICAgIH0gKTtcbiAgICBjb25zb2xlLmxvZyggJycgKTtcbiAgfVxufSApKCk7Il0sIm5hbWVzIjpbImxvY2FsZUluZm8iLCJyZXF1aXJlIiwic2ltTWV0YWRhdGEiLCJkZWZhdWx0Iiwid2luc3RvbiIsInRyYW5zcG9ydHMiLCJjb25zb2xlIiwibGV2ZWwiLCJwcm9kdWN0aW9uIiwicHJvY2VzcyIsImFyZ3YiLCJpbmNsdWRlcyIsImxvY2FsIiwibGltaXRTdHJpbmciLCJmaW5kIiwiYXJnIiwic3RhcnRzV2l0aCIsImxpbWl0IiwiTnVtYmVyIiwic3Vic3RyaW5nIiwibGVuZ3RoIiwiUE9TSVRJVkVfSU5GSU5JVFkiLCJtZXRhZGF0YSIsInNpbU5hbWVzQnlMb2NhbGUiLCJwcm9qZWN0cyIsImZvckVhY2giLCJwcm9qZWN0Iiwic2ltdWxhdGlvbnMiLCJFcnJvciIsInNpbXVsYXRpb24iLCJuYW1lIiwibG9jYWxlcyIsIk9iamVjdCIsImtleXMiLCJsb2NhbGl6ZWRTaW11bGF0aW9ucyIsImxvY2FsZSIsInB1c2giLCJzb3J0IiwibG9nIiwic2xpY2UiLCJNYXRoIiwibWluIiwic2ltTmFtZSIsImxpbmtzIiwiam9pbiJdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBRXREOzs7O0NBSUMsR0FFRCxNQUFNQSxhQUFhQyxRQUFTO0FBQzVCLE1BQU1DLGNBQWNELFFBQVMseUJBQTBCRSxPQUFPO0FBQzlELE1BQU1DLFVBQVVILFFBQVM7QUFFekJHLFFBQVFELE9BQU8sQ0FBQ0UsVUFBVSxDQUFDQyxPQUFPLENBQUNDLEtBQUssR0FBRztBQUUzQyxNQUFNQyxhQUFhQyxRQUFRQyxJQUFJLENBQUNDLFFBQVEsQ0FBRTtBQUMxQyxNQUFNQyxRQUFRSCxRQUFRQyxJQUFJLENBQUNDLFFBQVEsQ0FBRTtBQUVyQyxNQUFNRSxjQUFjSixRQUFRQyxJQUFJLENBQUNJLElBQUksQ0FBRUMsQ0FBQUEsTUFBT0EsSUFBSUMsVUFBVSxDQUFFO0FBQzlELE1BQU1DLFFBQVFKLGNBQWNLLE9BQVFMLFlBQVlNLFNBQVMsQ0FBRSxXQUFXQyxNQUFNLEtBQU9GLE9BQU9HLGlCQUFpQjtBQUV6RyxDQUFBO0lBRUEsTUFBTUMsV0FBVyxNQUFNcEI7SUFFdkIsTUFBTXFCLG1CQUFtQixDQUFDO0lBRTFCRCxTQUFTRSxRQUFRLENBQUNDLE9BQU8sQ0FBRUMsQ0FBQUE7UUFDekIsTUFBTUMsY0FBY0QsUUFBUUMsV0FBVztRQUN2QyxJQUFLQSxZQUFZUCxNQUFNLEtBQUssR0FBSTtZQUM5QixNQUFNLElBQUlRLE1BQU87UUFDbkI7UUFFQSxNQUFNQyxhQUFhRixXQUFXLENBQUUsRUFBRztRQUNuQyxNQUFNRyxPQUFPRCxXQUFXQyxJQUFJO1FBQzVCLE1BQU1DLFVBQVVDLE9BQU9DLElBQUksQ0FBRUosV0FBV0ssb0JBQW9CO1FBRTVESCxRQUFRTixPQUFPLENBQUVVLENBQUFBO1lBQ2YsSUFBSyxDQUFDWixnQkFBZ0IsQ0FBRVksT0FBUSxFQUFHO2dCQUNqQ1osZ0JBQWdCLENBQUVZLE9BQVEsR0FBRyxFQUFFO1lBQ2pDO1lBQ0FaLGdCQUFnQixDQUFFWSxPQUFRLENBQUNDLElBQUksQ0FBRU47UUFDbkM7SUFDRjtJQUVBLHdHQUF3RztJQUV4RyxNQUFNQyxVQUFVQyxPQUFPQyxJQUFJLENBQUVWLGtCQUFtQmMsSUFBSTtJQUVwRCxLQUFNLE1BQU1GLFVBQVVKLFFBQVU7UUFFOUJ6QixRQUFRZ0MsR0FBRyxDQUFFLENBQUMsR0FBRyxFQUFFSCxPQUFPLEVBQUUsRUFBRW5DLFVBQVUsQ0FBRW1DLE9BQVEsQ0FBQ0wsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxRHhCLFFBQVFnQyxHQUFHLENBQUU7UUFDYmYsZ0JBQWdCLENBQUVZLE9BQVEsQ0FBQ0ksS0FBSyxDQUFFLEdBQUdDLEtBQUtDLEdBQUcsQ0FBRXhCLE9BQU9NLGdCQUFnQixDQUFFWSxPQUFRLENBQUNmLE1BQU0sR0FBS0ssT0FBTyxDQUFFaUIsQ0FBQUE7WUFDbkcsTUFBTUMsUUFBUSxFQUFFO1lBQ2hCLElBQUtuQyxZQUFhO2dCQUNoQm1DLE1BQU1QLElBQUksQ0FBRSxDQUFDLGlEQUFpRCxFQUFFTSxRQUFRLFFBQVEsRUFBRUEsUUFBUSxpQkFBaUIsRUFBRVAsT0FBTyxDQUFDLENBQUM7WUFDeEg7WUFDQSxJQUFLdkIsT0FBUTtnQkFDWCtCLE1BQU1QLElBQUksQ0FBRSxDQUFDLHlCQUF5QixFQUFFTSxRQUFRLENBQUMsRUFBRUEsUUFBUSx1Q0FBdUMsRUFBRVAsT0FBTyxDQUFDLENBQUM7WUFDL0c7WUFDQTdCLFFBQVFnQyxHQUFHLENBQUUsQ0FBQyxFQUFFLEVBQUVJLFFBQVEsQ0FBQyxFQUFFQyxNQUFNQyxJQUFJLENBQUUsTUFBTztRQUNsRDtRQUNBdEMsUUFBUWdDLEdBQUcsQ0FBRTtJQUNmO0FBQ0YsQ0FBQSJ9