import {Server} from './server';
import {FilterProvider} from './filter_provider';
import {Collection, FeatureStream, Filter, Item, Link, Query} from 'sofp-lib';

import { OpenAPI } from './openapi';

import * as _ from 'lodash';
import * as express from 'express';

import { json2html } from './json2html';

import { geojson2html } from './geojson2html';

import {filterProviders} from './filters/';

/**
 * The API class provides accessors to produce metadata for the OGC API Features service. The API class wraps a Server object 
 * and uses the data and configuration within that object to produce responses.
 **/

export interface APIResponse {
    title?: string;
    description?: string;
    links?: Link[],
    collections?: Collection[]
};

export interface RequestParameters {
    baseUrl : string; // 'https://foo.com:1234/my-server/sofp'
    basePath : string;  // '/my-server/sofp'
    query? : Map<string, string>;
    body? : Buffer;
    collection? : Collection;
    itemQuery? : Query;
    responseFormat? : "JSON" | "HTML"; // Default to JSON
};

export interface APIParameters {
    title?: string;
    description?: string;
    contextPath?: string;
}

export interface CacheEntry {
    ts : number; // timestamp of entry
    ttl : number; //  ttl of entry
    value : any;
}

export function deduceContextPath(configuredContextPath, xForwardedPath) {
    function removeEndSlash(str) {
        while (str.charAt(str.length-1) === '/') {
            str = str.substring(0, str.length-1);
        }
        return str;
    }

    var ret = removeEndSlash(configuredContextPath);

    if (xForwardedPath) {
        var idx = xForwardedPath.lastIndexOf(ret);
        if (idx === -1) {
            throw Error("unable to deduce context path (configured '"+configuredContextPath+"', X-Forwarded-Path: '"+xForwardedPath+"')");
        }
        ret = removeEndSlash(xForwardedPath.substring(0, idx+ret.length));
    }

    return ret;
}

export class API {
    server : Server;

    title : string;
    description : string;
    contextPath : string;

    responseCache : any;

    constructor(server : Server, params : APIParameters) {
        this.server = server;
        this.title = params.title;
	this.description = params.description;
        this.contextPath = params.contextPath || '';

        this.responseCache = {};

        if (this.contextPath.charAt(0) !== '/') {
            this.contextPath = '/' + this.contextPath;
        }
        if (this.contextPath.charAt(this.contextPath.length-1) !== '/') {
            this.contextPath = this.contextPath + '/';
        }
    }

    identifyResponseFormat(req : express.req) {
        // select output format, query parameter 'f' value is primary, accept text/html secondayr, json is default
        let acceptsHtml = (req.headers['accept'] || '').toLowerCase().split(',').indexOf('text/html') !== -1;
        let requestedFormat = req.query['f'];
        if (_.isArray(requestedFormat)) {
            requestedFormat = requestedFormat[requestedFormat.length-1];
        }
        requestedFormat = (requestedFormat || '').toLowerCase();

        let format;

        if (requestedFormat === 'html') {
            format = 'HTML';
        } else if (acceptsHtml && requestedFormat === '') {
            format = 'HTML';
        } else {
            format = 'JSON';
        }
        return format;
    }

    connectExpress(app: express) : void {
        let produceRequestParameters = (req: express.req) : RequestParameters => {
            let protocol = req.headers['x-forwarded-proto'] || req.protocol;
            let host = req.headers['x-forwarded-host'];
            if (host) {
                if (req.headers['x-forwarded-port']) {
                    host += ':'+req.headers['x-forwarded-port'];
                }
            } else {
                host = req.headers.host;
            }
            let contextPath = deduceContextPath(this.contextPath, req.headers['x-forwarded-path']);
            let ret : RequestParameters = {
                baseUrl: protocol + '://' + host + contextPath,
                basePath: contextPath,
                responseFormat: this.identifyResponseFormat(req)
            };
            return ret;
        }

        let sendResponse = (req : express.req, res, jsonResponse) => {
            const format = this.identifyResponseFormat(req);

            if (format === 'HTML') {
                res.header('Content-Type', 'text/html; charset=utf-8');
                res.end(json2html(jsonResponse));
                return;
            }

            if (format === 'JSON') {
                res.header('Access-Control-Allow-Origin', '*');
                res.json(jsonResponse);
                return;
            }
            new Error(`Programming error, format was set to '${format}' instead of 'JSON' or 'HTML'`);
        }

        app.get(this.contextPath, (req, res) => {
            let response = this.getApiLandingPage(produceRequestParameters(req));
            sendResponse(req, res, response);
        });

        app.get(this.contextPath + 'collections', (req, res) => {
            let response = this.getFeatureCollectionsMetadata(produceRequestParameters(req));
            sendResponse(req, res, response);
        });

        app.get(this.contextPath + 'conformance', (req, res) => {
            let response = this.getConformancePage(produceRequestParameters(req));
            sendResponse(req, res, response);
        });

        app.get(this.contextPath + 'collections/:id([a-z0-9-/]*?)/items/:itemId', (req, res, next) => {
            let collection = this.server.getCollection(req.params.id);
            if (!collection) {
                return next();
            }

            collection.getFeatureById(req.params.itemId).then(f => {
                if (!f) {
                    return next();
                }
                res.json(f);
            }).catch(next);
        });

        app.get(this.contextPath + 'collections/:id([a-z0-9-/]*?)/items', (req, res, next) => {
            let collection = this.server.getCollection(req.params.id);
            if (!collection) {
                return next();
            }
            
            let filters = this.parseFilters(req, collection);
            const query : Query = {
                limit:     req.query.limit ? Number(req.query.limit) : 10,
                nextToken: req.query.nextToken  ? req.query.nextToken : undefined,
                filters: filters
            };

            const stream : FeatureStream = collection.executeQuery(query);
            var params : RequestParameters = produceRequestParameters(req);
            params.collection = collection;
            params.itemQuery = query;
            this.produceOutput(params, stream, res);
        });

        app.get(this.contextPath + 'collections/:id([a-z0-9-/]*?)', (req, res, next) => {
            let collection = this.server.getCollection(req.params.id);
            if (!collection) {
                return next();
            }
            
            let response = this.getFeatureCollectionsMetadata(produceRequestParameters(req), collection);
            sendResponse(req, res, response);
        });


        app.get(this.contextPath + 'api.yaml', async (req, res, next) => {
            let openapi = new OpenAPI(this, produceRequestParameters(req));
            try {
                const response = await openapi.serialize('yaml');
                res.header('Content-Type', 'application/openapi+yaml;version=3.0');
                res.end(response);
            } catch(e) {
                next(e);
            }
        });

        app.get(this.contextPath + 'api.json', async (req, res, next) => {
            let openapi = new OpenAPI(this, produceRequestParameters(req));
            try {
                const response = await openapi.serialize('json');
                res.header('Content-Type', 'application/openapi+json;version=3.0');
                res.json(response);
            } catch(e) {
                next(e);
            }
        });

        app.get(this.contextPath + 'api.html', async (req, res, next) => {
            let openapi = new OpenAPI(this, produceRequestParameters(req));
            try {
                const response = await openapi.serialize('html');
                res.header('Content-Type', 'text/html; charset=utf-8');
                res.end(response);
            } catch(e) {
                next(e);
            }

        });
    }

    parseFilters(req : express.Request, collection : Collection) : Filter[] {
        return _.map(filterProviders, fp => fp.parseFilter(req, collection)).filter(_.isObject);
    }

    /**
     * Return object following the WFS 3.0.0 draft 1 specification for api landing page
     *
     * @link https://cdn.rawgit.com/opengeospatial/WFS_FES/3.0.0-draft.1/docs/17-069.html#_api_landing_page
     **/
    getApiLandingPage(params : RequestParameters) : APIResponse {
        return {
	    'title': this.title,
	    'description': this.description,
            links: [{
                href: params.baseUrl + '/',
                rel: 'self',
                type: 'application/json',
                title: this.title
            },{
                href: params.baseUrl + '/api.json',
                rel: 'service-desc',
                type: 'application/openapi+json;version=3.0',
                title: 'the API definition (JSON)',
            },{
                href: params.baseUrl + '/api.yaml',
                rel: 'service-desc',
                type: 'application/openapi+yaml;version=3.0',
                title: 'the API definition (YAML)',
            },{
                href: params.baseUrl + '/api.html',
                rel: 'service-doc',
                type: 'text/html',
                title: 'the API definition (HTML)',
            },{
                href: params.baseUrl + '/conformance',
                rel: 'conformance',
                type: 'application/json',
                title: 'OGC API Features conformance classes implemented by this server'
            },{
                href: params.baseUrl + '/collections',
                rel: 'data',
                type: 'application/json',
                title: 'Metadata about the feature collections'
            },{
                href: params.baseUrl + '/collections?f=html',
                rel: 'data',
                type: 'text/html',
                title: 'Metadata about the feature collections'
            }]
        };
    }

    /**
     * Return object following the WFS 3.0.0 draft 1 specification for feature collections metadata
     * @link https://cdn.rawgit.com/opengeospatial/WFS_FES/3.0.0-draft.1/docs/17-069.html#_feature_collections_metadata
     */ 
    getFeatureCollectionsMetadata(params : RequestParameters, collection? : Collection) : APIResponse {
        var collections = collection ? [ collection ] : this.server.getCollections();
        collections = _.map(collections, c => { return { 'id': c.id, 'title': c.title, 'description': c.description, 'links': c.links, 'extent': c.extent, 'crs': c.crs }});
        collections = _.cloneDeep(collections);

        let ret : APIResponse = {
            links: [{
                href: params.baseUrl + '/collections' + (collection ? ('/' + collection.id) : ''),
                rel: 'self',
                type: 'application/json',
                title: 'Metadata about the feature collections'
            },{
                href: params.baseUrl + '/collections' + (collection ? ('/' + collection.id) : '') + '?f=html',
                rel: 'self',
                type: 'text/html',
                title: 'Metadata about the feature collections'
            }],
            collections: collections
        };

        _.each(collections, (collection) => {
            collection.links.unshift({
                href: params.baseUrl + '/collections/'+collection.id+'/items',
                rel: 'item',
                type: 'application/geo+json',
                title: collection.title
            });
            collection.links.unshift({
                href: params.baseUrl + '/collections/'+collection.id+'/items?f=html',
                rel: 'item',
                type: 'text/html',
                title: collection.title
            });
        });

        return ret;
    }

    getConformancePage(params : RequestParameters) : object {
        return {
            conformsTo: [
                'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
                'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30',
                'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson',
                'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/html' ]
        };
    }

    produceOutput(params : RequestParameters, stream : FeatureStream, response : express.Response) {
        var n = 0;
        var lastItem : Item = undefined;

        let res : express.Response | geojson2html;

        if (params.responseFormat === 'HTML') {
            res = new geojson2html(response, params.collection);
        } else if (params.responseFormat === 'JSON' || params.responseFormat === undefined) {
            res = response;
        } else {
            throw Error('Unknown response format '+params.responseFormat);
        }

        function startResponse(res) {
            res.writeHead(200, {
                'Content-Type': 'application/geo+json',
                'Access-Control-Allow-Origin': '*' });
            res.write('{\n');
            res.write('\t"type": "FeatureCollection",\n');
            if (stream.crs) {
                res.write('\t"crs": {\n');
                res.write('\t\t"type": "name",\n');
                res.write('\t\t"properties": {\n');
                res.write('\t\t\t"name": '+JSON.stringify(stream.crs)+'\n');
                res.write('\t\t}\n');
                res.write('\t},\n');
            }
            res.write('\t"features": [');
        }

        stream.on('data', (d : Item) => {
            lastItem = d;
            if (n === 0) {
                startResponse(res);
            } else {
                res.write(',');
            }
            var json = JSON.stringify(d.feature, null, '\t');
            json = json.replace(/^\t/gm, '\t\t');
            json = json.substring(0,json.length-1)+'\t}';
            res.write(json);
            n++;
        });

        stream.on('error', err => {
            // TODO: how to handle the error case? We might have streamed content already out?
            console.error('Received error from backend', err);
        });

        stream.on('end', () => {
            if (n === 0) {
                startResponse(res);
            }
            res.write('],\n');
            res.write('\t"timeStamp": "'+new Date().toISOString()+'",\n');
            res.write('\t"links": [');

            var queryString = _.map(params.itemQuery.filters, f => f.asQuery);
            queryString.push('limit=' + params.itemQuery.limit);
            var nextTokenIndex;
            if (params.itemQuery.nextToken) {
                queryString.push('nextToken='+encodeURIComponent(params.itemQuery.nextToken));
                nextTokenIndex = queryString.length-1;
            }

            var selfUri = params.baseUrl + '/collections/' + params.collection.id + '/items?' +
                queryString.join('&');

            res.write('{\n');
            res.write('\t\t"href": '+JSON.stringify(selfUri)+',\n');
            res.write('\t\t"rel": "self",\n');
            res.write('\t\t"type":"application/geo+json",\n');
            res.write('\t\t"title":"This document"\n');
            res.write('\t}');
            res.write(',{\n');
            res.write('\t\t"href": '+JSON.stringify(selfUri+'&f=html')+',\n');
            res.write('\t\t"rel": "self",\n');
            res.write('\t\t"type":"text/html",\n');
            res.write('\t\t"title":"This document"\n');
            res.write('\t}');

            if (n === params.itemQuery.limit && lastItem.nextToken !== undefined && lastItem.nextToken !== null) {
                if (nextTokenIndex === undefined) {
                    nextTokenIndex = queryString.length;
                }
                queryString[nextTokenIndex] = 'nextToken='+encodeURIComponent(lastItem.nextToken);
                var nextUri = params.baseUrl + '/collections/' + params.collection.id + '/items?' +
                    queryString.join('&');

                res.write(',{\n');
                res.write('\t\t"href": '+JSON.stringify(nextUri)+',\n');
                res.write('\t\t"rel": "next",\n');
                res.write('\t\t"type":"application/geo+json",\n');
                res.write('\t\t"title":"Next results"\n');
                res.write('\t}');

                res.write(',{\n');
                res.write('\t\t"href": '+JSON.stringify(nextUri+'&f=html')+',\n');
                res.write('\t\t"rel": "next",\n');
                res.write('\t\t"type":"text/html",\n');
                res.write('\t\t"title":"Next results"\n');
                res.write('\t}');
            }

            res.write('],\n');
            res.write('\t"numberReturned": '+n+'\n');
            res.write('}\n');
            res.end();
        });
    }
};

