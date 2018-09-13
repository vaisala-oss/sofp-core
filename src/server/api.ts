import {Server} from './server';

import {Link} from '../lib';

import * as express from 'express';

/**
 * The API class provides accessors to produce metadata for the WFS 3.0 API. The API class wraps a Server object 
 * and uses the data and configuration within that object to produce responses.
 **/

export interface APIResponse {
    links: Link[]
};

export interface RequestParameters {
    baseUrl : string;
    query? : Map<string, string>;
    body? : Buffer;
};

export interface APIParameters {
    title?: string;
    contextPath?: string;
}

export class API {
    server : Server;

    title : string;
    contextPath : string;   

    constructor(server : Server, params : APIParameters) {
        this.server = server;
        this.title = params.title;
        this.contextPath = params.contextPath || '';

        if (this.contextPath.charAt(0) !== '/') {
            this.contextPath = '/' + this.contextPath;
        }
        if (this.contextPath.charAt(this.contextPath.length-1) !== '/') {
            this.contextPath = this.contextPath + '/';
        }
    }

    connectExpress(app: express) : void {
        app.get(this.contextPath, (req, res) => {
            let baseUrl = req.protocol + '://' + req.headers.host + this.contextPath;
            while (baseUrl.charAt(baseUrl.length-1) === '/') {
                baseUrl = baseUrl.substr(0, baseUrl.length-1);
            }
            
            let response = this.getLandingPage({ baseUrl: baseUrl });
            res.json(response);
        });
    }


    // https://cdn.rawgit.com/opengeospatial/WFS_FES/3.0.0-draft.1/docs/17-069.html#_api_landing_page
    getLandingPage(params : RequestParameters) : APIResponse {
        return {
            links: [{
                href: params.baseUrl + '/',
                rel: 'self',
                type: 'application/json',
                title: this.title
            },{
                href: params.baseUrl + '/api',
                rel: 'service',
                type: 'application/openapi+json;version=3.0',
                title: 'the API definition',
            },{
                href: params.baseUrl + '/conformance',
                rel: 'conformance',
                type: 'application/json',
                title: 'WFS 3.0 conformance classes implemented by this server'
            },{
                href: params.baseUrl + '/collections',
                rel: 'data',
                type: 'application/json',
                title: 'Metadata about the feature collections'
            }]
        };
    }

};

