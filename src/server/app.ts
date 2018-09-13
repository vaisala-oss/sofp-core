// Use source maps in the app, so that node reports typescript source code files & line numbers
require('source-map-support').install();

import {Server} from './server';
import {API} from './api';

import * as _ from 'lodash';

import * as express from 'express';
import * as http from 'http';

const serverPort = 3000;

let server = new Server();

// TODO: these need to be dynamically loaded in a manner that allows easy packaging and deployment of core + backend(s)
import {MockBackend} from '../mock/mock_backend';
server.backends.push(MockBackend);

let api = new API(server, { title: 'SOFP WFS 3.0 server', contextPath: '/sofp' });

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
