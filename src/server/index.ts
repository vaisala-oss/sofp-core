import {Server} from './server';
import {API} from './api';
import {AuthorizerProvider, Backend} from 'sofp-lib';

import * as _ from 'lodash';

import * as http from 'http';

import * as morgan from 'morgan';
import RotatingFileStream from 'rotating-file-stream';
import * as path from 'path';
import * as fs from 'fs';

const express = require('express');

export interface Parameters {
  title : string;
  description : string;

  serverPort : number;
  contextPath : string;
  accessLogPath : string;
  backends : Backend[];
  authorizerProvider : AuthorizerProvider;
}

export function run(params : Parameters) {
  const server = new Server({
    backends: params.backends,
    authorizerProvider: params.authorizerProvider
  });

  const api = new API(server, {
    title: params.title || 'SOFP - OGC API Features',
    description: params.description || 'This server is an OGC API Features service',
    contextPath: params.contextPath || '/sofp'
  });

  const app = express();

  if (params.accessLogPath) {
      console.log('Writing access log to', params.accessLogPath, '(rotate daily)')
      var accessLogStream = RotatingFileStream(path.basename(params.accessLogPath), {
        interval: '1d', // rotate daily
        path: path.dirname(params.accessLogPath)
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
  httpServer.listen(params.serverPort);

  console.log('Listening on port '+params.serverPort);
  console.log('Active backends ('+server.backends.length+') and their collections:');
  _.each(server.backends, (backend) => {
      console.log('  - '+backend.name);
      _.each(backend.collections, (collection) => {
          console.log('     |- '+collection.id);
      });
  });
  console.log('Try visiting http://localhost:'+params.serverPort+api.contextPath);
}