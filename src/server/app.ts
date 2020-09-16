// Use source maps in the app, so that node reports typescript source code files & line numbers
require('source-map-support').install();

import * as _ from 'lodash';
import * as BackendLoader from './backend_loader';

import {Backend, AuthorizerProvider} from 'sofp-lib';
import {Parameters, run} from './index';

var program = require('commander')
  .command('sofp-core')
  .usage('[options] <path-to-backend ...>')
  .option('-p, --port [number]', 'Port number to listen (default 3000)')
  .option('-c, --contextPath [path]', 'Context path for the server (default /sofp)')
  .option('-a, --accessLog [file]', 'Write access log to file or "-" for stdout (default: no log)')
  .option('-t, --title [service title]', 'Set title of the service')
  .option('-d, --desc [service description]', 'Set description of the service')
  .option('-x, --authorizer [authorizer module name]', 'Load authorizer')
  .parse(process.argv);

let authorizerProvider : AuthorizerProvider;

if (program.authorizer) {
    console.log('Loading authorizer module: '+program.authorizer)
    authorizerProvider = require(program.authorizer).authorizerProvider;
}

let backends : Backend[];
if (program.args.length > 0) {
    // Load backends from command line paths. Useful when developing a backend
    backends = [];
    _.each(program.args, b => {
        var dir = b;
        if (dir[0] !== '/') {
            dir = process.cwd() + '/' + dir;
        }
        _.each(BackendLoader.loadModule(dir), backend => backends.push(backend));
    });
} else {
    backends = BackendLoader.load('backends/');
    if (backends.length === 0) {
        console.log('No backends configured, using mock backend instead');
        backends.push(require('../mock/mock_backend').MockBackend);
    }
}

let params : Parameters = {
  title:         program.title || 'Example SOFP Server',
  description:   program.desc || 'This is an example SOFP server',
  serverPort:    program.port || 3000,
  contextPath:   program.contextPath || '/sofp',
  accessLogPath: program.accessLog,
  backends:      backends,
  authorizerProvider: authorizerProvider
}

run(params);
