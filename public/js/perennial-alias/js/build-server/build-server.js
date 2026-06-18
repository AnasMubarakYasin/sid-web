// Copyright 2002-2017, University of Colorado Boulder
/**
 * PhET build and deploy server. The server is designed to run on the same host as the production site (phet-server.int.colorado.edu).
 * This file initializes the app and the main process queue.
 *
 * @author Aaron Davis
 * @author Matt Pennington
 */ const constants = require('./constants');
const childProcess = require('child_process');
const winston = require('./log'); // eslint-disable-line phet/require-statement-match
const logRequest = require('./logRequest');
const sendEmail = require('./sendEmail');
const taskWorker = require('./taskWorker');
const async = require('async');
const bodyParser = require('body-parser');
const express = require('express');
const _ = require('lodash');
const parseArgs = require('minimist'); // eslint-disable-line phet/require-statement-match
const persistentQueue = require('./persistentQueue');
const getStatus = require('./getStatus');
// set this process up with the appropriate permissions, value is in octal
process.umask(0o0002);
/**
 * Handle command line input
 * First 2 args provide info about executables, ignore
 */ const parsedCommandLineOptions = parseArgs(process.argv.slice(2), {
    boolean: true
});
const defaultOptions = {
    verbose: constants.BUILD_SERVER_CONFIG.verbose,
    // options for supporting help
    help: false,
    h: false
};
for(const key in parsedCommandLineOptions){
    if (key !== '_' && parsedCommandLineOptions.hasOwnProperty(key) && !defaultOptions.hasOwnProperty(key)) {
        console.error(`Unrecognized option: ${key}`);
        console.error('try --help for usage information.');
        process.exit(1);
    }
}
// If help flag, print help and usage info
if (parsedCommandLineOptions.hasOwnProperty('help') || parsedCommandLineOptions.hasOwnProperty('h')) {
    console.log('Usage:');
    console.log('  node build-server.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help (print usage and exit)\n' + '    type: bool  default: false\n' + '  --verbose (output grunt logs in addition to build-server)\n' + '    type: bool  default: false\n');
    process.exit(1);
}
// Merge the default and supplied options.
const options = _.assignIn(defaultOptions, parsedCommandLineOptions);
const verbose = options.verbose;
const taskQueue = async.queue(taskWorker, 1); // 1 is the max number of tasks that can run concurrently
/**
 * Handle chipper 1.0 requests
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {String} key - one of 'query' or 'body', used to differentiate query parameters or POST data.
 */ const queueDeployApiVersion1 = (req, res, key)=>{
    const repos = JSON.parse(decodeURIComponent(req[key][constants.REPOS_KEY]));
    const simName = decodeURIComponent(req[key][constants.SIM_NAME_KEY]);
    const version = decodeURIComponent(req[key][constants.VERSION_KEY]);
    const locales = decodeURIComponent(req[key][constants.LOCALES_KEY]) || null;
    const option = decodeURIComponent(req[key][constants.OPTION_KEY]) || 'default';
    const email = decodeURIComponent(req[key][constants.EMAIL_KEY]) || null;
    const translatorId = decodeURIComponent(req[key][constants.USER_ID_KEY]) || null;
    const authorizationKey = decodeURIComponent(req[key][constants.AUTHORIZATION_KEY]);
    const branch = decodeURIComponent(req[key][constants.BRANCH_KEY]) || repos[simName].branch;
    // TODO https://github.com/phetsims/perennial/issues/167 determine if this comment needs updating for chipper 1.0 deploys
    // For RC deploys, only send to the dev server.  For production deploys, the local build will send to the dev server so the build-server
    // only sends to the production server (phet-server2).
    const servers = option === 'rc' ? [
        constants.DEV_SERVER
    ] : [
        constants.PRODUCTION_SERVER
    ];
    const brands = version.indexOf('phetio') < 0 ? [
        constants.PHET_BRAND
    ] : [
        constants.PHET_IO_BRAND
    ];
    queueDeploy('1.0', repos, simName, version, locales, brands, servers, email, translatorId, branch, authorizationKey, req, res);
};
const getQueueDeploy = (req, res)=>{
    logRequest(req, 'query', winston);
    queueDeployApiVersion1(req, res, 'query');
};
const postQueueDeploy = (req, res)=>{
    logRequest(req, 'body', winston);
    const api = decodeURIComponent(req.body[constants.API_KEY]);
    if (api && api.startsWith('2.')) {
        const repos = JSON.parse(req.body[constants.DEPENDENCIES_KEY]);
        const simName = req.body[constants.SIM_NAME_KEY];
        const version = req.body[constants.VERSION_KEY];
        const locales = req.body[constants.LOCALES_KEY] || null;
        const servers = req.body[constants.SERVERS_KEY];
        const brands = req.body[constants.BRANDS_KEY];
        const authorizationKey = req.body[constants.AUTHORIZATION_KEY];
        const translatorId = req.body[constants.TRANSLATOR_ID_KEY] || null;
        const email = req.body[constants.EMAIL_KEY] || null;
        const branch = req.body[constants.BRANCH_KEY] || null;
        queueDeploy(api, repos, simName, version, locales, brands, servers, email, translatorId, branch, authorizationKey, req, res);
    } else {
        queueDeployApiVersion1(req, res, 'body');
    }
};
/**
 * Adds the request to the processing queue and handles email notifications about success or failures
 *
 * @param {String} api
 * @param {Object} repos
 * @param {String} simName
 * @param {String} version
 * @param {Array.<String>} locales
 * @param {Array.<String>} brands
 * @param {Array.<String>} servers
 * @param {String} email
 * @param {String} userId
 * @param {String} branch
 * @param {String} authorizationKey
 * @param {express.Request} req
 * @param {express.Response} res
 */ const queueDeploy = (api, repos, simName, version, locales, brands, servers, email, userId, branch, authorizationKey, req, res)=>{
    if (repos && simName && version && authorizationKey) {
        const productionBrands = [
            constants.PHET_BRAND,
            constants.PHET_IO_BRAND
        ];
        if (authorizationKey !== constants.BUILD_SERVER_CONFIG.buildServerAuthorizationCode) {
            const err = 'wrong authorization code';
            winston.log('error', err);
            res.status(401);
            res.send(err);
        } else if (servers.indexOf(constants.PRODUCTION_SERVER) >= 0 && brands.some((brand)=>!productionBrands.includes(brand))) {
            const err = 'Cannot complete production deploys for brands outside of phet and phet-io';
            winston.log('error', err);
            res.status(400);
            res.send(err);
        } else {
            winston.log('info', `queuing build for ${simName} ${version}`);
            const task = {
                api: api,
                repos: repos,
                simName: simName,
                version: version,
                locales: locales,
                servers: servers,
                brands: brands,
                email: email,
                userId: userId,
                branch: branch
            };
            persistentQueue.addTask(task);
            taskQueue.push(task, buildCallback(task));
            res.status(api === '1.0' ? 200 : 202);
            res.send('build process initiated, check logs for details');
        }
    } else {
        const errorString = 'missing one or more required query parameters: dependencies, simName, version, authorizationCode';
        winston.log('error', errorString);
        res.status(400);
        res.send(errorString);
    }
};
const buildCallback = (task)=>{
    return (err)=>{
        const simInfoString = `Sim = ${task.simName} Version = ${task.version} Brands = ${task.brands} Locales = ${task.locales}`;
        if (err) {
            let shas = task.repos;
            // try to format the JSON nicely for the email, but don't worry if it is invalid JSON
            try {
                shas = JSON.stringify(JSON.parse(shas), null, 2);
            } catch (e) {
            // invalid JSON
            }
            const errorMessage = `Build failure: ${err}. ${simInfoString} Shas = ${JSON.stringify(shas)}`;
            winston.log('error', errorMessage);
            sendEmail('BUILD ERROR', errorMessage, task.email);
        } else {
            winston.log('info', `build for ${task.simName} finished successfully`);
            persistentQueue.finishTask();
            sendEmail('Build Succeeded', simInfoString, task.email, true);
        }
    };
};
const postQueueImageDeploy = (req, res)=>{
    logRequest(req, 'body', winston);
    const authorizationKey = req.body[constants.AUTHORIZATION_KEY];
    if (authorizationKey !== constants.BUILD_SERVER_CONFIG.buildServerAuthorizationCode) {
        const err = 'wrong authorization code';
        winston.log('error', err);
        res.status(401);
        res.send(err);
        return;
    }
    const branch = req.body[constants.BRANCH_KEY] || 'main';
    const brands = req.body[constants.BRANDS_KEY] || 'phet';
    const email = req.body[constants.EMAIL_KEY] || null;
    const simulation = req.body[constants.SIM_NAME_KEY] || null;
    const version = req.body[constants.VERSION_KEY] || null;
    const emailBodyText = 'Not implemented';
    taskQueue.push({
        deployImages: true,
        branch: branch,
        brands: brands,
        simulation: simulation,
        version: version
    }, (err)=>{
        if (err) {
            const errorMessage = `Image deploy failure: ${err}`;
            winston.log('error', errorMessage);
            sendEmail('IMAGE DEPLOY ERROR', errorMessage, email);
        } else {
            winston.log('info', 'Image deploy finished successfully');
            sendEmail('Image deploy succeeded', emailBodyText, email, true);
        }
    });
    res.status(202);
    res.send('build process initiated, check logs for details');
};
// Create the ExpressJS app
const app = express();
// to support JSON-encoded bodies
app.use(bodyParser.json());
// add the route to build and deploy
app.get('/deploy-html-simulation', getQueueDeploy);
app.post('/deploy-html-simulation', postQueueDeploy);
app.post('/deploy-images', postQueueImageDeploy);
app.set('views', './views');
app.set('view engine', 'pug');
app.get('/deploy-status', getStatus);
// start the server
app.listen(constants.LISTEN_PORT, ()=>{
    winston.log('info', `Listening on port ${constants.LISTEN_PORT}`);
    winston.log('info', `Verbose mode: ${verbose}`);
    // log the SHA of perennial - this may make it easier to duplicate and track down problems
    try {
        const sha = childProcess.execSync('git rev-parse HEAD');
        winston.info(`current SHA: ${sha.toString()}`);
    } catch (err) {
        winston.warn(`unable to get SHA from git, err: ${err}`);
    }
    // Recreate queue
    try {
        const queue = persistentQueue.getQueue().queue;
        for (const task of queue){
            console.log('Resuming task from persistent queue: ', task);
            taskQueue.push(task, buildCallback(task));
        }
    } catch (e) {
        console.error('could not resume queue');
    }
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9idWlsZC1zZXJ2ZXIvYnVpbGQtc2VydmVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDAyLTIwMTcsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxuXG4vKipcbiAqIFBoRVQgYnVpbGQgYW5kIGRlcGxveSBzZXJ2ZXIuIFRoZSBzZXJ2ZXIgaXMgZGVzaWduZWQgdG8gcnVuIG9uIHRoZSBzYW1lIGhvc3QgYXMgdGhlIHByb2R1Y3Rpb24gc2l0ZSAocGhldC1zZXJ2ZXIuaW50LmNvbG9yYWRvLmVkdSkuXG4gKiBUaGlzIGZpbGUgaW5pdGlhbGl6ZXMgdGhlIGFwcCBhbmQgdGhlIG1haW4gcHJvY2VzcyBxdWV1ZS5cbiAqXG4gKiBAYXV0aG9yIEFhcm9uIERhdmlzXG4gKiBAYXV0aG9yIE1hdHQgUGVubmluZ3RvblxuICovXG5cblxuY29uc3QgY29uc3RhbnRzID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApO1xuY29uc3QgY2hpbGRQcm9jZXNzID0gcmVxdWlyZSggJ2NoaWxkX3Byb2Nlc3MnICk7XG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJy4vbG9nJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHBoZXQvcmVxdWlyZS1zdGF0ZW1lbnQtbWF0Y2hcbmNvbnN0IGxvZ1JlcXVlc3QgPSByZXF1aXJlKCAnLi9sb2dSZXF1ZXN0JyApO1xuY29uc3Qgc2VuZEVtYWlsID0gcmVxdWlyZSggJy4vc2VuZEVtYWlsJyApO1xuY29uc3QgdGFza1dvcmtlciA9IHJlcXVpcmUoICcuL3Rhc2tXb3JrZXInICk7XG5jb25zdCBhc3luYyA9IHJlcXVpcmUoICdhc3luYycgKTtcbmNvbnN0IGJvZHlQYXJzZXIgPSByZXF1aXJlKCAnYm9keS1wYXJzZXInICk7XG5jb25zdCBleHByZXNzID0gcmVxdWlyZSggJ2V4cHJlc3MnICk7XG5jb25zdCBfID0gcmVxdWlyZSggJ2xvZGFzaCcgKTtcbmNvbnN0IHBhcnNlQXJncyA9IHJlcXVpcmUoICdtaW5pbWlzdCcgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBwaGV0L3JlcXVpcmUtc3RhdGVtZW50LW1hdGNoXG5jb25zdCBwZXJzaXN0ZW50UXVldWUgPSByZXF1aXJlKCAnLi9wZXJzaXN0ZW50UXVldWUnICk7XG5jb25zdCBnZXRTdGF0dXMgPSByZXF1aXJlKCAnLi9nZXRTdGF0dXMnICk7XG5cbi8vIHNldCB0aGlzIHByb2Nlc3MgdXAgd2l0aCB0aGUgYXBwcm9wcmlhdGUgcGVybWlzc2lvbnMsIHZhbHVlIGlzIGluIG9jdGFsXG5wcm9jZXNzLnVtYXNrKCAwbzAwMDIgKTtcblxuLyoqXG4gKiBIYW5kbGUgY29tbWFuZCBsaW5lIGlucHV0XG4gKiBGaXJzdCAyIGFyZ3MgcHJvdmlkZSBpbmZvIGFib3V0IGV4ZWN1dGFibGVzLCBpZ25vcmVcbiAqL1xuY29uc3QgcGFyc2VkQ29tbWFuZExpbmVPcHRpb25zID0gcGFyc2VBcmdzKCBwcm9jZXNzLmFyZ3Yuc2xpY2UoIDIgKSwge1xuICBib29sZWFuOiB0cnVlXG59ICk7XG5cbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICB2ZXJib3NlOiBjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy52ZXJib3NlLCAvLyBjYW4gYmUgb3ZlcnJpZGRlbiBieSBhIGZsYWcgb24gdGhlIGNvbW1hbmQgbGluZVxuXG4gIC8vIG9wdGlvbnMgZm9yIHN1cHBvcnRpbmcgaGVscFxuICBoZWxwOiBmYWxzZSxcbiAgaDogZmFsc2Vcbn07XG5cbmZvciAoIGNvbnN0IGtleSBpbiBwYXJzZWRDb21tYW5kTGluZU9wdGlvbnMgKSB7XG4gIGlmICgga2V5ICE9PSAnXycgJiYgcGFyc2VkQ29tbWFuZExpbmVPcHRpb25zLmhhc093blByb3BlcnR5KCBrZXkgKSAmJiAhZGVmYXVsdE9wdGlvbnMuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xuICAgIGNvbnNvbGUuZXJyb3IoIGBVbnJlY29nbml6ZWQgb3B0aW9uOiAke2tleX1gICk7XG4gICAgY29uc29sZS5lcnJvciggJ3RyeSAtLWhlbHAgZm9yIHVzYWdlIGluZm9ybWF0aW9uLicgKTtcbiAgICBwcm9jZXNzLmV4aXQoIDEgKTtcbiAgfVxufVxuXG4vLyBJZiBoZWxwIGZsYWcsIHByaW50IGhlbHAgYW5kIHVzYWdlIGluZm9cbmlmICggcGFyc2VkQ29tbWFuZExpbmVPcHRpb25zLmhhc093blByb3BlcnR5KCAnaGVscCcgKSB8fCBwYXJzZWRDb21tYW5kTGluZU9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdoJyApICkge1xuICBjb25zb2xlLmxvZyggJ1VzYWdlOicgKTtcbiAgY29uc29sZS5sb2coICcgIG5vZGUgYnVpbGQtc2VydmVyLmpzIFtvcHRpb25zXScgKTtcbiAgY29uc29sZS5sb2coICcnICk7XG4gIGNvbnNvbGUubG9nKCAnT3B0aW9uczonICk7XG4gIGNvbnNvbGUubG9nKFxuICAgICcgIC0taGVscCAocHJpbnQgdXNhZ2UgYW5kIGV4aXQpXFxuJyArXG4gICAgJyAgICB0eXBlOiBib29sICBkZWZhdWx0OiBmYWxzZVxcbicgK1xuICAgICcgIC0tdmVyYm9zZSAob3V0cHV0IGdydW50IGxvZ3MgaW4gYWRkaXRpb24gdG8gYnVpbGQtc2VydmVyKVxcbicgK1xuICAgICcgICAgdHlwZTogYm9vbCAgZGVmYXVsdDogZmFsc2VcXG4nXG4gICk7XG4gIHByb2Nlc3MuZXhpdCggMSApO1xufVxuXG4vLyBNZXJnZSB0aGUgZGVmYXVsdCBhbmQgc3VwcGxpZWQgb3B0aW9ucy5cbmNvbnN0IG9wdGlvbnMgPSBfLmFzc2lnbkluKCBkZWZhdWx0T3B0aW9ucywgcGFyc2VkQ29tbWFuZExpbmVPcHRpb25zICk7XG5jb25zdCB2ZXJib3NlID0gb3B0aW9ucy52ZXJib3NlO1xuXG5jb25zdCB0YXNrUXVldWUgPSBhc3luYy5xdWV1ZSggdGFza1dvcmtlciwgMSApOyAvLyAxIGlzIHRoZSBtYXggbnVtYmVyIG9mIHRhc2tzIHRoYXQgY2FuIHJ1biBjb25jdXJyZW50bHlcblxuLyoqXG4gKiBIYW5kbGUgY2hpcHBlciAxLjAgcmVxdWVzdHNcbiAqXG4gKiBAcGFyYW0ge2V4cHJlc3MuUmVxdWVzdH0gcmVxXG4gKiBAcGFyYW0ge2V4cHJlc3MuUmVzcG9uc2V9IHJlc1xuICogQHBhcmFtIHtTdHJpbmd9IGtleSAtIG9uZSBvZiAncXVlcnknIG9yICdib2R5JywgdXNlZCB0byBkaWZmZXJlbnRpYXRlIHF1ZXJ5IHBhcmFtZXRlcnMgb3IgUE9TVCBkYXRhLlxuICovXG5jb25zdCBxdWV1ZURlcGxveUFwaVZlcnNpb24xID0gKCByZXEsIHJlcywga2V5ICkgPT4ge1xuICBjb25zdCByZXBvcyA9IEpTT04ucGFyc2UoIGRlY29kZVVSSUNvbXBvbmVudCggcmVxWyBrZXkgXVsgY29uc3RhbnRzLlJFUE9TX0tFWSBdICkgKTtcbiAgY29uc3Qgc2ltTmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudCggcmVxWyBrZXkgXVsgY29uc3RhbnRzLlNJTV9OQU1FX0tFWSBdICk7XG4gIGNvbnN0IHZlcnNpb24gPSBkZWNvZGVVUklDb21wb25lbnQoIHJlcVsga2V5IF1bIGNvbnN0YW50cy5WRVJTSU9OX0tFWSBdICk7XG4gIGNvbnN0IGxvY2FsZXMgPSBkZWNvZGVVUklDb21wb25lbnQoIHJlcVsga2V5IF1bIGNvbnN0YW50cy5MT0NBTEVTX0tFWSBdICkgfHwgbnVsbDtcbiAgY29uc3Qgb3B0aW9uID0gZGVjb2RlVVJJQ29tcG9uZW50KCByZXFbIGtleSBdWyBjb25zdGFudHMuT1BUSU9OX0tFWSBdICkgfHwgJ2RlZmF1bHQnO1xuICBjb25zdCBlbWFpbCA9IGRlY29kZVVSSUNvbXBvbmVudCggcmVxWyBrZXkgXVsgY29uc3RhbnRzLkVNQUlMX0tFWSBdICkgfHwgbnVsbDtcbiAgY29uc3QgdHJhbnNsYXRvcklkID0gZGVjb2RlVVJJQ29tcG9uZW50KCByZXFbIGtleSBdWyBjb25zdGFudHMuVVNFUl9JRF9LRVkgXSApIHx8IG51bGw7XG4gIGNvbnN0IGF1dGhvcml6YXRpb25LZXkgPSBkZWNvZGVVUklDb21wb25lbnQoIHJlcVsga2V5IF1bIGNvbnN0YW50cy5BVVRIT1JJWkFUSU9OX0tFWSBdICk7XG4gIGNvbnN0IGJyYW5jaCA9IGRlY29kZVVSSUNvbXBvbmVudCggcmVxWyBrZXkgXVsgY29uc3RhbnRzLkJSQU5DSF9LRVkgXSApIHx8IHJlcG9zWyBzaW1OYW1lIF0uYnJhbmNoO1xuXG4gIC8vIFRPRE8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BlcmVubmlhbC9pc3N1ZXMvMTY3IGRldGVybWluZSBpZiB0aGlzIGNvbW1lbnQgbmVlZHMgdXBkYXRpbmcgZm9yIGNoaXBwZXIgMS4wIGRlcGxveXNcbiAgLy8gRm9yIFJDIGRlcGxveXMsIG9ubHkgc2VuZCB0byB0aGUgZGV2IHNlcnZlci4gIEZvciBwcm9kdWN0aW9uIGRlcGxveXMsIHRoZSBsb2NhbCBidWlsZCB3aWxsIHNlbmQgdG8gdGhlIGRldiBzZXJ2ZXIgc28gdGhlIGJ1aWxkLXNlcnZlclxuICAvLyBvbmx5IHNlbmRzIHRvIHRoZSBwcm9kdWN0aW9uIHNlcnZlciAocGhldC1zZXJ2ZXIyKS5cbiAgY29uc3Qgc2VydmVycyA9ICggb3B0aW9uID09PSAncmMnICkgPyBbIGNvbnN0YW50cy5ERVZfU0VSVkVSIF0gOiBbIGNvbnN0YW50cy5QUk9EVUNUSU9OX1NFUlZFUiBdO1xuICBjb25zdCBicmFuZHMgPSB2ZXJzaW9uLmluZGV4T2YoICdwaGV0aW8nICkgPCAwID8gWyBjb25zdGFudHMuUEhFVF9CUkFORCBdIDogWyBjb25zdGFudHMuUEhFVF9JT19CUkFORCBdO1xuXG4gIHF1ZXVlRGVwbG95KCAnMS4wJywgcmVwb3MsIHNpbU5hbWUsIHZlcnNpb24sIGxvY2FsZXMsIGJyYW5kcywgc2VydmVycywgZW1haWwsIHRyYW5zbGF0b3JJZCwgYnJhbmNoLCBhdXRob3JpemF0aW9uS2V5LCByZXEsIHJlcyApO1xufTtcblxuY29uc3QgZ2V0UXVldWVEZXBsb3kgPSAoIHJlcSwgcmVzICkgPT4ge1xuICBsb2dSZXF1ZXN0KCByZXEsICdxdWVyeScsIHdpbnN0b24gKTtcbiAgcXVldWVEZXBsb3lBcGlWZXJzaW9uMSggcmVxLCByZXMsICdxdWVyeScgKTtcbn07XG5cbmNvbnN0IHBvc3RRdWV1ZURlcGxveSA9ICggcmVxLCByZXMgKSA9PiB7XG4gIGxvZ1JlcXVlc3QoIHJlcSwgJ2JvZHknLCB3aW5zdG9uICk7XG5cbiAgY29uc3QgYXBpID0gZGVjb2RlVVJJQ29tcG9uZW50KCByZXEuYm9keVsgY29uc3RhbnRzLkFQSV9LRVkgXSApO1xuXG4gIGlmICggYXBpICYmIGFwaS5zdGFydHNXaXRoKCAnMi4nICkgKSB7XG4gICAgY29uc3QgcmVwb3MgPSBKU09OLnBhcnNlKCByZXEuYm9keVsgY29uc3RhbnRzLkRFUEVOREVOQ0lFU19LRVkgXSApO1xuICAgIGNvbnN0IHNpbU5hbWUgPSByZXEuYm9keVsgY29uc3RhbnRzLlNJTV9OQU1FX0tFWSBdO1xuICAgIGNvbnN0IHZlcnNpb24gPSByZXEuYm9keVsgY29uc3RhbnRzLlZFUlNJT05fS0VZIF07XG4gICAgY29uc3QgbG9jYWxlcyA9IHJlcS5ib2R5WyBjb25zdGFudHMuTE9DQUxFU19LRVkgXSB8fCBudWxsO1xuICAgIGNvbnN0IHNlcnZlcnMgPSByZXEuYm9keVsgY29uc3RhbnRzLlNFUlZFUlNfS0VZIF07XG4gICAgY29uc3QgYnJhbmRzID0gcmVxLmJvZHlbIGNvbnN0YW50cy5CUkFORFNfS0VZIF07XG4gICAgY29uc3QgYXV0aG9yaXphdGlvbktleSA9IHJlcS5ib2R5WyBjb25zdGFudHMuQVVUSE9SSVpBVElPTl9LRVkgXTtcbiAgICBjb25zdCB0cmFuc2xhdG9ySWQgPSByZXEuYm9keVsgY29uc3RhbnRzLlRSQU5TTEFUT1JfSURfS0VZIF0gfHwgbnVsbDtcbiAgICBjb25zdCBlbWFpbCA9IHJlcS5ib2R5WyBjb25zdGFudHMuRU1BSUxfS0VZIF0gfHwgbnVsbDtcbiAgICBjb25zdCBicmFuY2ggPSByZXEuYm9keVsgY29uc3RhbnRzLkJSQU5DSF9LRVkgXSB8fCBudWxsO1xuXG4gICAgcXVldWVEZXBsb3koIGFwaSwgcmVwb3MsIHNpbU5hbWUsIHZlcnNpb24sIGxvY2FsZXMsIGJyYW5kcywgc2VydmVycywgZW1haWwsIHRyYW5zbGF0b3JJZCwgYnJhbmNoLCBhdXRob3JpemF0aW9uS2V5LCByZXEsIHJlcyApO1xuICB9XG4gIGVsc2Uge1xuICAgIHF1ZXVlRGVwbG95QXBpVmVyc2lvbjEoIHJlcSwgcmVzLCAnYm9keScgKTtcbiAgfVxufTtcblxuLyoqXG4gKiBBZGRzIHRoZSByZXF1ZXN0IHRvIHRoZSBwcm9jZXNzaW5nIHF1ZXVlIGFuZCBoYW5kbGVzIGVtYWlsIG5vdGlmaWNhdGlvbnMgYWJvdXQgc3VjY2VzcyBvciBmYWlsdXJlc1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBhcGlcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXBvc1xuICogQHBhcmFtIHtTdHJpbmd9IHNpbU5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJzaW9uXG4gKiBAcGFyYW0ge0FycmF5LjxTdHJpbmc+fSBsb2NhbGVzXG4gKiBAcGFyYW0ge0FycmF5LjxTdHJpbmc+fSBicmFuZHNcbiAqIEBwYXJhbSB7QXJyYXkuPFN0cmluZz59IHNlcnZlcnNcbiAqIEBwYXJhbSB7U3RyaW5nfSBlbWFpbFxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZFxuICogQHBhcmFtIHtTdHJpbmd9IGJyYW5jaFxuICogQHBhcmFtIHtTdHJpbmd9IGF1dGhvcml6YXRpb25LZXlcbiAqIEBwYXJhbSB7ZXhwcmVzcy5SZXF1ZXN0fSByZXFcbiAqIEBwYXJhbSB7ZXhwcmVzcy5SZXNwb25zZX0gcmVzXG4gKi9cbmNvbnN0IHF1ZXVlRGVwbG95ID0gKCBhcGksIHJlcG9zLCBzaW1OYW1lLCB2ZXJzaW9uLCBsb2NhbGVzLCBicmFuZHMsIHNlcnZlcnMsIGVtYWlsLCB1c2VySWQsIGJyYW5jaCwgYXV0aG9yaXphdGlvbktleSwgcmVxLCByZXMgKSA9PiB7XG5cbiAgaWYgKCByZXBvcyAmJiBzaW1OYW1lICYmIHZlcnNpb24gJiYgYXV0aG9yaXphdGlvbktleSApIHtcbiAgICBjb25zdCBwcm9kdWN0aW9uQnJhbmRzID0gWyBjb25zdGFudHMuUEhFVF9CUkFORCwgY29uc3RhbnRzLlBIRVRfSU9fQlJBTkQgXTtcblxuICAgIGlmICggYXV0aG9yaXphdGlvbktleSAhPT0gY29uc3RhbnRzLkJVSUxEX1NFUlZFUl9DT05GSUcuYnVpbGRTZXJ2ZXJBdXRob3JpemF0aW9uQ29kZSApIHtcbiAgICAgIGNvbnN0IGVyciA9ICd3cm9uZyBhdXRob3JpemF0aW9uIGNvZGUnO1xuICAgICAgd2luc3Rvbi5sb2coICdlcnJvcicsIGVyciApO1xuICAgICAgcmVzLnN0YXR1cyggNDAxICk7XG4gICAgICByZXMuc2VuZCggZXJyICk7XG4gICAgfVxuICAgIGVsc2UgaWYgKCBzZXJ2ZXJzLmluZGV4T2YoIGNvbnN0YW50cy5QUk9EVUNUSU9OX1NFUlZFUiApID49IDAgJiYgYnJhbmRzLnNvbWUoIGJyYW5kID0+ICFwcm9kdWN0aW9uQnJhbmRzLmluY2x1ZGVzKCBicmFuZCApICkgKSB7XG4gICAgICBjb25zdCBlcnIgPSAnQ2Fubm90IGNvbXBsZXRlIHByb2R1Y3Rpb24gZGVwbG95cyBmb3IgYnJhbmRzIG91dHNpZGUgb2YgcGhldCBhbmQgcGhldC1pbyc7XG4gICAgICB3aW5zdG9uLmxvZyggJ2Vycm9yJywgZXJyICk7XG4gICAgICByZXMuc3RhdHVzKCA0MDAgKTtcbiAgICAgIHJlcy5zZW5kKCBlcnIgKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB3aW5zdG9uLmxvZyggJ2luZm8nLCBgcXVldWluZyBidWlsZCBmb3IgJHtzaW1OYW1lfSAke3ZlcnNpb259YCApO1xuICAgICAgY29uc3QgdGFzayA9IHtcbiAgICAgICAgYXBpOiBhcGksXG4gICAgICAgIHJlcG9zOiByZXBvcyxcbiAgICAgICAgc2ltTmFtZTogc2ltTmFtZSxcbiAgICAgICAgdmVyc2lvbjogdmVyc2lvbixcbiAgICAgICAgbG9jYWxlczogbG9jYWxlcyxcbiAgICAgICAgc2VydmVyczogc2VydmVycyxcbiAgICAgICAgYnJhbmRzOiBicmFuZHMsXG4gICAgICAgIGVtYWlsOiBlbWFpbCxcbiAgICAgICAgdXNlcklkOiB1c2VySWQsXG4gICAgICAgIGJyYW5jaDogYnJhbmNoXG4gICAgICB9O1xuICAgICAgcGVyc2lzdGVudFF1ZXVlLmFkZFRhc2soIHRhc2sgKTtcbiAgICAgIHRhc2tRdWV1ZS5wdXNoKCB0YXNrLCBidWlsZENhbGxiYWNrKCB0YXNrICkgKTtcblxuICAgICAgcmVzLnN0YXR1cyggYXBpID09PSAnMS4wJyA/IDIwMCA6IDIwMiApO1xuICAgICAgcmVzLnNlbmQoICdidWlsZCBwcm9jZXNzIGluaXRpYXRlZCwgY2hlY2sgbG9ncyBmb3IgZGV0YWlscycgKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uc3QgZXJyb3JTdHJpbmcgPSAnbWlzc2luZyBvbmUgb3IgbW9yZSByZXF1aXJlZCBxdWVyeSBwYXJhbWV0ZXJzOiBkZXBlbmRlbmNpZXMsIHNpbU5hbWUsIHZlcnNpb24sIGF1dGhvcml6YXRpb25Db2RlJztcbiAgICB3aW5zdG9uLmxvZyggJ2Vycm9yJywgZXJyb3JTdHJpbmcgKTtcbiAgICByZXMuc3RhdHVzKCA0MDAgKTtcbiAgICByZXMuc2VuZCggZXJyb3JTdHJpbmcgKTtcbiAgfVxufTtcblxuY29uc3QgYnVpbGRDYWxsYmFjayA9IHRhc2sgPT4ge1xuICByZXR1cm4gZXJyID0+IHtcbiAgICBjb25zdCBzaW1JbmZvU3RyaW5nID0gYFNpbSA9ICR7dGFzay5zaW1OYW1lXG4gICAgfSBWZXJzaW9uID0gJHt0YXNrLnZlcnNpb25cbiAgICB9IEJyYW5kcyA9ICR7dGFzay5icmFuZHNcbiAgICB9IExvY2FsZXMgPSAke3Rhc2subG9jYWxlc31gO1xuXG4gICAgaWYgKCBlcnIgKSB7XG4gICAgICBsZXQgc2hhcyA9IHRhc2sucmVwb3M7XG5cbiAgICAgIC8vIHRyeSB0byBmb3JtYXQgdGhlIEpTT04gbmljZWx5IGZvciB0aGUgZW1haWwsIGJ1dCBkb24ndCB3b3JyeSBpZiBpdCBpcyBpbnZhbGlkIEpTT05cbiAgICAgIHRyeSB7XG4gICAgICAgIHNoYXMgPSBKU09OLnN0cmluZ2lmeSggSlNPTi5wYXJzZSggc2hhcyApLCBudWxsLCAyICk7XG4gICAgICB9XG4gICAgICBjYXRjaCggZSApIHtcbiAgICAgICAgLy8gaW52YWxpZCBKU09OXG4gICAgICB9XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBgQnVpbGQgZmFpbHVyZTogJHtlcnJ9LiAke3NpbUluZm9TdHJpbmd9IFNoYXMgPSAke0pTT04uc3RyaW5naWZ5KCBzaGFzICl9YDtcbiAgICAgIHdpbnN0b24ubG9nKCAnZXJyb3InLCBlcnJvck1lc3NhZ2UgKTtcbiAgICAgIHNlbmRFbWFpbCggJ0JVSUxEIEVSUk9SJywgZXJyb3JNZXNzYWdlLCB0YXNrLmVtYWlsICk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgd2luc3Rvbi5sb2coICdpbmZvJywgYGJ1aWxkIGZvciAke3Rhc2suc2ltTmFtZX0gZmluaXNoZWQgc3VjY2Vzc2Z1bGx5YCApO1xuICAgICAgcGVyc2lzdGVudFF1ZXVlLmZpbmlzaFRhc2soKTtcbiAgICAgIHNlbmRFbWFpbCggJ0J1aWxkIFN1Y2NlZWRlZCcsIHNpbUluZm9TdHJpbmcsIHRhc2suZW1haWwsIHRydWUgKTtcbiAgICB9XG4gIH07XG59O1xuXG5jb25zdCBwb3N0UXVldWVJbWFnZURlcGxveSA9ICggcmVxLCByZXMgKSA9PiB7XG4gIGxvZ1JlcXVlc3QoIHJlcSwgJ2JvZHknLCB3aW5zdG9uICk7XG5cbiAgY29uc3QgYXV0aG9yaXphdGlvbktleSA9IHJlcS5ib2R5WyBjb25zdGFudHMuQVVUSE9SSVpBVElPTl9LRVkgXTtcbiAgaWYgKCBhdXRob3JpemF0aW9uS2V5ICE9PSBjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy5idWlsZFNlcnZlckF1dGhvcml6YXRpb25Db2RlICkge1xuICAgIGNvbnN0IGVyciA9ICd3cm9uZyBhdXRob3JpemF0aW9uIGNvZGUnO1xuICAgIHdpbnN0b24ubG9nKCAnZXJyb3InLCBlcnIgKTtcbiAgICByZXMuc3RhdHVzKCA0MDEgKTtcbiAgICByZXMuc2VuZCggZXJyICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgYnJhbmNoID0gcmVxLmJvZHlbIGNvbnN0YW50cy5CUkFOQ0hfS0VZIF0gfHwgJ21haW4nO1xuICBjb25zdCBicmFuZHMgPSByZXEuYm9keVsgY29uc3RhbnRzLkJSQU5EU19LRVkgXSB8fCAncGhldCc7XG4gIGNvbnN0IGVtYWlsID0gcmVxLmJvZHlbIGNvbnN0YW50cy5FTUFJTF9LRVkgXSB8fCBudWxsO1xuICBjb25zdCBzaW11bGF0aW9uID0gcmVxLmJvZHlbIGNvbnN0YW50cy5TSU1fTkFNRV9LRVkgXSB8fCBudWxsO1xuICBjb25zdCB2ZXJzaW9uID0gcmVxLmJvZHlbIGNvbnN0YW50cy5WRVJTSU9OX0tFWSBdIHx8IG51bGw7XG4gIGNvbnN0IGVtYWlsQm9keVRleHQgPSAnTm90IGltcGxlbWVudGVkJztcblxuICB0YXNrUXVldWUucHVzaChcbiAgICB7XG4gICAgICBkZXBsb3lJbWFnZXM6IHRydWUsXG4gICAgICBicmFuY2g6IGJyYW5jaCxcbiAgICAgIGJyYW5kczogYnJhbmRzLFxuICAgICAgc2ltdWxhdGlvbjogc2ltdWxhdGlvbixcbiAgICAgIHZlcnNpb246IHZlcnNpb25cbiAgICB9LFxuICAgIGVyciA9PiB7XG4gICAgICBpZiAoIGVyciApIHtcbiAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gYEltYWdlIGRlcGxveSBmYWlsdXJlOiAke2Vycn1gO1xuICAgICAgICB3aW5zdG9uLmxvZyggJ2Vycm9yJywgZXJyb3JNZXNzYWdlICk7XG4gICAgICAgIHNlbmRFbWFpbCggJ0lNQUdFIERFUExPWSBFUlJPUicsIGVycm9yTWVzc2FnZSwgZW1haWwgKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB3aW5zdG9uLmxvZyggJ2luZm8nLCAnSW1hZ2UgZGVwbG95IGZpbmlzaGVkIHN1Y2Nlc3NmdWxseScgKTtcbiAgICAgICAgc2VuZEVtYWlsKCAnSW1hZ2UgZGVwbG95IHN1Y2NlZWRlZCcsIGVtYWlsQm9keVRleHQsIGVtYWlsLCB0cnVlICk7XG4gICAgICB9XG4gICAgfSApO1xuXG4gIHJlcy5zdGF0dXMoIDIwMiApO1xuICByZXMuc2VuZCggJ2J1aWxkIHByb2Nlc3MgaW5pdGlhdGVkLCBjaGVjayBsb2dzIGZvciBkZXRhaWxzJyApO1xufTtcblxuLy8gQ3JlYXRlIHRoZSBFeHByZXNzSlMgYXBwXG5jb25zdCBhcHAgPSBleHByZXNzKCk7XG5cbi8vIHRvIHN1cHBvcnQgSlNPTi1lbmNvZGVkIGJvZGllc1xuYXBwLnVzZSggYm9keVBhcnNlci5qc29uKCkgKTtcblxuLy8gYWRkIHRoZSByb3V0ZSB0byBidWlsZCBhbmQgZGVwbG95XG5hcHAuZ2V0KCAnL2RlcGxveS1odG1sLXNpbXVsYXRpb24nLCBnZXRRdWV1ZURlcGxveSApO1xuYXBwLnBvc3QoICcvZGVwbG95LWh0bWwtc2ltdWxhdGlvbicsIHBvc3RRdWV1ZURlcGxveSApO1xuYXBwLnBvc3QoICcvZGVwbG95LWltYWdlcycsIHBvc3RRdWV1ZUltYWdlRGVwbG95ICk7XG5cbmFwcC5zZXQoICd2aWV3cycsICcuL3ZpZXdzJyApO1xuYXBwLnNldCggJ3ZpZXcgZW5naW5lJywgJ3B1ZycgKTtcbmFwcC5nZXQoICcvZGVwbG95LXN0YXR1cycsIGdldFN0YXR1cyApO1xuXG4vLyBzdGFydCB0aGUgc2VydmVyXG5hcHAubGlzdGVuKCBjb25zdGFudHMuTElTVEVOX1BPUlQsICgpID0+IHtcbiAgd2luc3Rvbi5sb2coICdpbmZvJywgYExpc3RlbmluZyBvbiBwb3J0ICR7Y29uc3RhbnRzLkxJU1RFTl9QT1JUfWAgKTtcbiAgd2luc3Rvbi5sb2coICdpbmZvJywgYFZlcmJvc2UgbW9kZTogJHt2ZXJib3NlfWAgKTtcblxuICAvLyBsb2cgdGhlIFNIQSBvZiBwZXJlbm5pYWwgLSB0aGlzIG1heSBtYWtlIGl0IGVhc2llciB0byBkdXBsaWNhdGUgYW5kIHRyYWNrIGRvd24gcHJvYmxlbXNcbiAgdHJ5IHtcbiAgICBjb25zdCBzaGEgPSBjaGlsZFByb2Nlc3MuZXhlY1N5bmMoICdnaXQgcmV2LXBhcnNlIEhFQUQnICk7XG4gICAgd2luc3Rvbi5pbmZvKCBgY3VycmVudCBTSEE6ICR7c2hhLnRvU3RyaW5nKCl9YCApO1xuICB9XG4gIGNhdGNoKCBlcnIgKSB7XG4gICAgd2luc3Rvbi53YXJuKCBgdW5hYmxlIHRvIGdldCBTSEEgZnJvbSBnaXQsIGVycjogJHtlcnJ9YCApO1xuICB9XG5cbiAgLy8gUmVjcmVhdGUgcXVldWVcbiAgdHJ5IHtcbiAgICBjb25zdCBxdWV1ZSA9IHBlcnNpc3RlbnRRdWV1ZS5nZXRRdWV1ZSgpLnF1ZXVlO1xuICAgIGZvciAoIGNvbnN0IHRhc2sgb2YgcXVldWUgKSB7XG4gICAgICBjb25zb2xlLmxvZyggJ1Jlc3VtaW5nIHRhc2sgZnJvbSBwZXJzaXN0ZW50IHF1ZXVlOiAnLCB0YXNrICk7XG4gICAgICB0YXNrUXVldWUucHVzaCggdGFzaywgYnVpbGRDYWxsYmFjayggdGFzayApICk7XG4gICAgfVxuICB9XG4gIGNhdGNoKCBlICkge1xuICAgIGNvbnNvbGUuZXJyb3IoICdjb3VsZCBub3QgcmVzdW1lIHF1ZXVlJyApO1xuICB9XG59ICk7Il0sIm5hbWVzIjpbImNvbnN0YW50cyIsInJlcXVpcmUiLCJjaGlsZFByb2Nlc3MiLCJ3aW5zdG9uIiwibG9nUmVxdWVzdCIsInNlbmRFbWFpbCIsInRhc2tXb3JrZXIiLCJhc3luYyIsImJvZHlQYXJzZXIiLCJleHByZXNzIiwiXyIsInBhcnNlQXJncyIsInBlcnNpc3RlbnRRdWV1ZSIsImdldFN0YXR1cyIsInByb2Nlc3MiLCJ1bWFzayIsInBhcnNlZENvbW1hbmRMaW5lT3B0aW9ucyIsImFyZ3YiLCJzbGljZSIsImJvb2xlYW4iLCJkZWZhdWx0T3B0aW9ucyIsInZlcmJvc2UiLCJCVUlMRF9TRVJWRVJfQ09ORklHIiwiaGVscCIsImgiLCJrZXkiLCJoYXNPd25Qcm9wZXJ0eSIsImNvbnNvbGUiLCJlcnJvciIsImV4aXQiLCJsb2ciLCJvcHRpb25zIiwiYXNzaWduSW4iLCJ0YXNrUXVldWUiLCJxdWV1ZSIsInF1ZXVlRGVwbG95QXBpVmVyc2lvbjEiLCJyZXEiLCJyZXMiLCJyZXBvcyIsIkpTT04iLCJwYXJzZSIsImRlY29kZVVSSUNvbXBvbmVudCIsIlJFUE9TX0tFWSIsInNpbU5hbWUiLCJTSU1fTkFNRV9LRVkiLCJ2ZXJzaW9uIiwiVkVSU0lPTl9LRVkiLCJsb2NhbGVzIiwiTE9DQUxFU19LRVkiLCJvcHRpb24iLCJPUFRJT05fS0VZIiwiZW1haWwiLCJFTUFJTF9LRVkiLCJ0cmFuc2xhdG9ySWQiLCJVU0VSX0lEX0tFWSIsImF1dGhvcml6YXRpb25LZXkiLCJBVVRIT1JJWkFUSU9OX0tFWSIsImJyYW5jaCIsIkJSQU5DSF9LRVkiLCJzZXJ2ZXJzIiwiREVWX1NFUlZFUiIsIlBST0RVQ1RJT05fU0VSVkVSIiwiYnJhbmRzIiwiaW5kZXhPZiIsIlBIRVRfQlJBTkQiLCJQSEVUX0lPX0JSQU5EIiwicXVldWVEZXBsb3kiLCJnZXRRdWV1ZURlcGxveSIsInBvc3RRdWV1ZURlcGxveSIsImFwaSIsImJvZHkiLCJBUElfS0VZIiwic3RhcnRzV2l0aCIsIkRFUEVOREVOQ0lFU19LRVkiLCJTRVJWRVJTX0tFWSIsIkJSQU5EU19LRVkiLCJUUkFOU0xBVE9SX0lEX0tFWSIsInVzZXJJZCIsInByb2R1Y3Rpb25CcmFuZHMiLCJidWlsZFNlcnZlckF1dGhvcml6YXRpb25Db2RlIiwiZXJyIiwic3RhdHVzIiwic2VuZCIsInNvbWUiLCJicmFuZCIsImluY2x1ZGVzIiwidGFzayIsImFkZFRhc2siLCJwdXNoIiwiYnVpbGRDYWxsYmFjayIsImVycm9yU3RyaW5nIiwic2ltSW5mb1N0cmluZyIsInNoYXMiLCJzdHJpbmdpZnkiLCJlIiwiZXJyb3JNZXNzYWdlIiwiZmluaXNoVGFzayIsInBvc3RRdWV1ZUltYWdlRGVwbG95Iiwic2ltdWxhdGlvbiIsImVtYWlsQm9keVRleHQiLCJkZXBsb3lJbWFnZXMiLCJhcHAiLCJ1c2UiLCJqc29uIiwiZ2V0IiwicG9zdCIsInNldCIsImxpc3RlbiIsIkxJU1RFTl9QT1JUIiwic2hhIiwiZXhlY1N5bmMiLCJpbmZvIiwidG9TdHJpbmciLCJ3YXJuIiwiZ2V0UXVldWUiXSwibWFwcGluZ3MiOiJBQUFBLHNEQUFzRDtBQUV0RDs7Ozs7O0NBTUMsR0FHRCxNQUFNQSxZQUFZQyxRQUFTO0FBQzNCLE1BQU1DLGVBQWVELFFBQVM7QUFDOUIsTUFBTUUsVUFBVUYsUUFBUyxVQUFXLG1EQUFtRDtBQUN2RixNQUFNRyxhQUFhSCxRQUFTO0FBQzVCLE1BQU1JLFlBQVlKLFFBQVM7QUFDM0IsTUFBTUssYUFBYUwsUUFBUztBQUM1QixNQUFNTSxRQUFRTixRQUFTO0FBQ3ZCLE1BQU1PLGFBQWFQLFFBQVM7QUFDNUIsTUFBTVEsVUFBVVIsUUFBUztBQUN6QixNQUFNUyxJQUFJVCxRQUFTO0FBQ25CLE1BQU1VLFlBQVlWLFFBQVMsYUFBYyxtREFBbUQ7QUFDNUYsTUFBTVcsa0JBQWtCWCxRQUFTO0FBQ2pDLE1BQU1ZLFlBQVlaLFFBQVM7QUFFM0IsMEVBQTBFO0FBQzFFYSxRQUFRQyxLQUFLLENBQUU7QUFFZjs7O0NBR0MsR0FDRCxNQUFNQywyQkFBMkJMLFVBQVdHLFFBQVFHLElBQUksQ0FBQ0MsS0FBSyxDQUFFLElBQUs7SUFDbkVDLFNBQVM7QUFDWDtBQUVBLE1BQU1DLGlCQUFpQjtJQUNyQkMsU0FBU3JCLFVBQVVzQixtQkFBbUIsQ0FBQ0QsT0FBTztJQUU5Qyw4QkFBOEI7SUFDOUJFLE1BQU07SUFDTkMsR0FBRztBQUNMO0FBRUEsSUFBTSxNQUFNQyxPQUFPVCx5QkFBMkI7SUFDNUMsSUFBS1MsUUFBUSxPQUFPVCx5QkFBeUJVLGNBQWMsQ0FBRUQsUUFBUyxDQUFDTCxlQUFlTSxjQUFjLENBQUVELE1BQVE7UUFDNUdFLFFBQVFDLEtBQUssQ0FBRSxDQUFDLHFCQUFxQixFQUFFSCxLQUFLO1FBQzVDRSxRQUFRQyxL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