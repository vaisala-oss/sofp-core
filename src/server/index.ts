import {Server} from './server';
import {API} from './api';
import {AuthorizerProvider, Backend} from 'sofp-lib';

import * as _ from 'lodash';

import * as http from 'http';

import morgan from 'morgan';
import RotatingFileStream from 'rotating-file-stream';
import * as path from 'path';
import * as fs from 'fs';

const express = require('express');

export interface ExpressServer {
  app : any;
  httpServer : http.Server;
}

export interface Parameters {
  title : string;
  description : string;

  expressServer? : ExpressServer;
  serverPort? : number;
  accessLogPath? : string; // null/undefined for none, "-" for stdout, anything else is a path to the file
  language? : string;

  contextPath : string;
  backends : Backend[];
  authorizerProvider : AuthorizerProvider;
}

export function createExpressServer(accessLogPath : string) : ExpressServer {
  let app = express();

  if (accessLogPath) {
      var accessLogStream;
      if (accessLogPath !== '-') {
        console.log('Writing access log to', accessLogPath, '(rotate daily)')
        accessLogStream = RotatingFileStream(path.basename(accessLogPath), {
          interval: '1d', // rotate daily
          path: path.dirname(accessLogPath)
        });
      }
      app.use(morgan('combined', { stream: accessLogStream }));
  }

  app.set('json spaces', 2);

  return {
    app: app,
    httpServer: null
  };
}

export function startExpressServer(expressServer : ExpressServer, serverPort : number) {
  expressServer.app.use((req, res) => {
      res.status(404).json({message: 'Not found'});
  });

  expressServer.app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).json({message: 'Internal error: '+err.message});
  });

  expressServer.httpServer = http.createServer(expressServer.app);
  expressServer.httpServer.listen(serverPort);

  console.log('Listening on port '+serverPort);
}

export function run(params : Parameters) {
  const server = new Server({
    backends: params.backends,
    language: params.language,
    authorizerProvider: params.authorizerProvider
  });

  const api = new API(server, {
    title: params.title || 'SOFP - OGC API Features',
    description: params.description || 'This server is an OGC API Features service',
    contextPath: params.contextPath || '/sofp'
  });

  // Whether we create and start the server in this run() function or not
  const startServer = !params.expressServer;

  const expressServer = startServer ? createExpressServer(params.accessLogPath) : params.expressServer;

  api.connectExpress(expressServer.app);

  if (startServer) {
    startExpressServer(expressServer, params.serverPort);
    console.log('Try visiting http://localhost:'+params.serverPort+api.contextPath);
  }

  console.log('Active backends ('+server.backends.length+') and their collections:');
  _.each(server.backends, (backend) => {
      console.log('  - '+backend.name);
      _.each(backend.collections, (collection) => {
          console.log('     |- '+collection.id);
      });
  });
}