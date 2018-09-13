import {Server} from './server';
import {API} from './api';

import * as express from 'express';
import * as http from 'http';

const serverPort = 3000;

let server = new Server();
// TODO: add backends

let api = new API(server, { title: 'SOFP WFS 3.0 server', contextPath: '/sofp' });

const app = express();
// Pretty-print
app.set('json spaces', 2);

api.connectExpress(app);

app.use((req, res) => {
    res.status(404).json({message: 'Not found'});
});

app.use((err, req, res, next) => {
    res.status(500).json({message: 'Internal error: ${err.message}'});
});

const httpServer = http.createServer(app);
httpServer.listen(serverPort);

console.log('Listening on port '+serverPort);
console.log('Try visiting http://localhost:'+serverPort+api.contextPath);
