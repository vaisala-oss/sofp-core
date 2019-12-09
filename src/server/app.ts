// Use source maps in the app, so that node reports typescript source code files & line numbers
require('source-map-support').install();

import {Server} from './server';
import {API} from './api';

import * as _ from 'lodash';

import * as express from 'express';
import * as http from 'http';

import * as BackendLoader from './backend_loader';

import * as commander from 'commander';
import * as morgan from 'morgan';
import RotatingFileStream from 'rotating-file-stream';
import * as path from 'path';
import * as fs from 'fs';

const program = commander
  .command('sofp-core')
  .usage('[options] <path-to-backend ...>')
  .option('-p, --port [number]', 'Port number to listen (default 3000)')
  .option('-c, --contextPath [path]', 'Context path for the server (default /sofp)')
  .option('-a, --accessLog [file]', 'Write access log to file (default: no log)')
  .parse(process.argv);

const serverPort = program.port || 3000;

var backends;
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

const server = new Server(backends);

const api = new API(server, { title: 'SOFP - OGC API Features', contextPath: program.contextPath || '/sofp' });

const app = express();

if (program.accessLog) {
    console.log('Writing access log to', program.accessLog, '(rotate daily)')
    var accessLogStream = RotatingFileStream(path.basename(program.accessLog), {
      interval: '1d', // rotate daily
      path: path.dirname(program.accessLog)
    });

    app.use(morgan('combined', { stream: accessLogStream }));
}

// Pretty-print
app.set('json spaces', 2);

api.connectExpress(app);


app.use((req, res) => {
    res.status(404).json({message: 'Not found'});
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({message: 'Internal error: '+err.message});
});

const httpServer = http.createServer(app);
httpServer.listen(serverPort);

console.log('Listening on port '+serverPort);
console.log('Active backends ('+server.backends.length+') and their collections:');
_.each(server.backends, (backend) => {
    console.log('  - '+backend.name);
    _.each(backend.collections, (collection) => {
        console.log('     |- '+collection.id);
    });
});
console.log('Try visiting http://localhost:'+serverPort+api.contextPath);
