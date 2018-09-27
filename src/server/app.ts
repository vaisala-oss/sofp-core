// Use source maps in the app, so that node reports typescript source code files & line numbers
require('source-map-support').install();

import {Server} from './server';
import {API} from './api';

import * as _ from 'lodash';

import * as express from 'express';
import * as http from 'http';

import * as BackendLoader from './backend_loader';

const serverPort = 3000;

var backends;
if (process.argv.length > 2) {
    // Load backends from command line paths. Useful when developing a backend
    backends = [];
    for (var i = 2; i < process.argv.length; i++) {
        var dir = process.argv[i];
        if (dir[0] !== '/') {
            dir = process.cwd() + '/' + dir;
        }
        _.each(BackendLoader.loadModule(dir), backend => backends.push(backend));
    }
} else {
    backends = BackendLoader.load('backends/');
    if (backends.length === 0) {
        console.log('No backends configured, using mock backend instead');
        backends.push(require('../mock/mock_backend').MockBackend);
    }
}

const server = new Server(backends);

const api = new API(server, { title: 'SOFP WFS 3.0 server', contextPath: '/sofp' });

const app = express();
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
        console.log('     |- '+collection.name);
    });
});
console.log('Try visiting http://localhost:'+serverPort+api.contextPath);
