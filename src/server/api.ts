import {Server} from './server';
import {FilterProvider} from './filter_provider';
import {Authorizer, Collection, FeatureStream, Filter, Item, Link, PropertyReference, Query} from 'sofp-lib';

import { OpenAPI } from './openapi';

import * as _ from 'lodash';
import * as express from 'express';
import produce from 'immer';

import { json2html } from './json2html';

import { geojson2html } from './geojson2html';

import {filterProviders} from './filters/';
import {reservedParameterNames} from './constants';

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

    identifyResponseFormat(req : express.Request) {
        // select output format, query parameter 'f' value is primary, accept text/html secondayr, json is default
        let acceptsHtml = (req.headers['accept'] || '').toLowerCase().split(',').indexOf('text/html') !== -1;
        let requestedFormat = req.query['f'];
        if (_.isArray(requestedFormat)) {
            requestedFormat = requestedFormat[Number(requestedFormat.length)-1];
        }
        requestedFormat = String(requestedFormat || '').toLowerCase();
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

    produceAuthorizer(req : express.Request, collection : Collection) : Promise<Authorizer> {
        if (this.server.authorizerProvider) {
            return this.server.authorizerProvider.createAuthorizer(req, collection);
        }

        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    connectExpress(app: express.Application) : void {
        let produceRequestParameters = (req: express.Request) : RequestParameters => {
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

        let sendResponse = (req : express.Request, res, jsonResponse) => {
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

        app.get(this.contextPath + 'collections/:id([a-z0-9-/]*?)/items/:itemId', (req, response, next) => {
            let params = produceRequestParameters(req);
            let res;

            if (params.responseFormat === 'HTML') {
                res = new geojson2html(response, params.collection);
            } else if (params.responseFormat === 'JSON' || params.responseFormat === undefined) {
                res = response;
            } else {
                throw Error('Unknown response format '+params.responseFormat);
            }

            let collection = this.server.getCollection(req.params.id);
            if (!collection) {
                return next();
            }

            Promise.all([
                collection.getFeatureById(req.params.itemId),
                this.produceAuthorizer(req, collection)
            ]).then(([f, authorizer]) => {
                if (!f) {
                    return next();
                }
                if (authorizer && !authorizer.accept(f.feature)) {
                    return next();
                }
                f = this.resolveFeature(f, params);
                var tmp = _.extend({}, f, {
                    links: [{
                        href: `${params.baseUrl}/collections/${collection.id}/items/${f.id}?f=json`,
                        rel: 'self',
                        type: 'application/geo+json',
                        title: 'Link to this feature in JSON format'
                    },{
                        href: `${params.baseUrl}/collections/${collection.id}/items/${f.id}?f=html`,
                        rel: 'alternate',
                        type: 'text/html',
                        title: 'Link to this feature in HTML format'
                    },{
                        href: `${params.baseUrl}/collections/${collection.id}`,
                        rel: 'collection',
                        type: 'application/json',
                        title: 'Metadata about the feature collections this feature belongs to'
                    }]
                });

                var json = JSON.stringify(tmp, null, '\t');
                json = json.replace(/^\t/gm, '\t\t');
                json = json.substring(0,json.length-1)+'\t}';

                res.write(json);
                res.end();
            }).catch(next); // NOTE: if user is unauthorized, it will appear as a 404
        });

        app.get(this.contextPath + 'collections/:id([a-z0-9-/]*?)/items', (req, res, next) => {
            let collection = this.server.getCollection(req.params.id);
            if (!collection) {
                return next();
            }
            
            this.produceAuthorizer(req, collection).then(authorizer => {
                let filters : Filter[];

                try {
                    filters = this.parseFilters(req, collection);
                } catch(e) {
                    return res.status(400).send('Illegal parameter(s), error message: '+e);
                }

                if (authorizer) {
                    filters.push(authorizer);
                }

                // Check that limit is indeed a number (part of requirement /req/core/query-param-invalid)
                if (req.query.limit !== undefined && !_.isNumber(req.query.limit)) {
                    if (!/^[0-9]+$/.exec(String(req.query.limit))) {
                        return res.status(400).send('limit should be a number');
                    }
                }

                // Check that property filters are in-line with schema (requirement /req/core/query-param-unknown)
                var unprocessedParameters = {};
                _.each(req.query, (v, k) => unprocessedParameters[k.toLowerCase()] = true);
                _.each(reservedParameterNames, r => delete unprocessedParameters[r]);
                _.each(filters, f => {
                    _.each(f.query, (v, k) => delete unprocessedParameters[k.toLowerCase()]);
                });

                if (_.size(unprocessedParameters) > 0) {
                    return res.status(400).send('Unknown parameter(s): '+JSON.stringify(unprocessedParameters));
                }

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
            }).catch(err => {
                return res.status(401).send('Authorization failed: '+err);
            });

        });

        app.get(this.contextPath + 'collections/:id([a-z0-9-/]*?)', (req, res, next) => {
            let collection = this.server.getCollection(req.params.id);
            if (!collection) {
                return next();
            }
            
            let response = this.getFeatureCollectionMetadata(produceRequestParameters(req), collection);
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

        app.get(this.contextPath + 'api', async (req, res, next) => {
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
                href: params.baseUrl + '/api',
                rel: 'service-desc',
                type: 'application/vnd.oai.openapi+json;version=3.0',
                title: 'the API definition (JSON)',
            },{
                href: params.baseUrl + '/api.yaml',
                rel: 'service-desc',
                type: 'application/vnd.oai.openapi;version=3.0',
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
     * Convert Collection object to the format used in collections and collection API responses
     **/
    collectionToResponse(c : Collection) : any {
        return {
            'id': c.id,
            'title': c.title,
            'description': c.description,
            'links': c.links,
            'extent': c.extent,
            'crs': c.crs
        };
    }

    /**
     * Return object following the OGC API Features specification for feature collections metadata
     * @link https://cdn.rawgit.com/opengeospatial/WFS_FES/3.0.0-draft.1/docs/17-069.html#_feature_collections_metadata
     */ 
    getFeatureCollectionsMetadata(params : RequestParameters) : APIResponse {
        //var collections = _.map(this.server.getCollections(), c => { return { 'id': c.id, 'title': c.title, 'description': c.description, 'links': c.links, 'extent': c.extent, 'crs': c.crs }});
        var collections = _.map(this.server.getCollections(), this.collectionToResponse);
        collections = _.cloneDeep(collections);

        let ret : APIResponse = {
            links: [{
                href: params.baseUrl + '/collections',
                rel: 'self',
                type: 'application/json',
                title: 'Metadata about the feature collections'
            },{
                href: params.baseUrl + '/collections?f=html',
                rel: 'alternate',
                type: 'text/html',
                title: 'Metadata about the feature collections'
            }],
            collections: collections
        };

        _.each(collections, (collection) => {
            collection.links.unshift({
                href: params.baseUrl + '/collections/'+collection.id+'/items?f=json',
                rel: 'items',
                type: 'application/geo+json',
                title: collection.title
            });
            collection.links.unshift({
                href: params.baseUrl + '/collections/'+collection.id+'/items?f=html',
                rel: 'items',
                type: 'text/html',
                title: collection.title
            });
        });

        return ret;
    }

    getFeatureCollectionMetadata(params : RequestParameters, collection : Collection) : APIResponse {
        let ret : APIResponse = {};

        _.extend(ret, this.collectionToResponse(collection), {
            links: [{
                href: params.baseUrl + `/collections/${collection.id}`,
                rel: 'self',
                type: 'application/json',
                title: 'Metadata about this feature collection'
            },{
                href: params.baseUrl + `/collections/${collection.id}?f=html`,
                rel: 'alternate',
                type: 'text/html',
                title: 'Metadata about this feature collection'
            },{
                href: params.baseUrl + `/collections/${collection.id}/items?f=json`,
                rel: 'items',
                type: 'application/geo+json',
                title: collection.title
            },{
                href: params.baseUrl + `/collections/${collection.id}/items?f=html`,
                rel: 'items',
                type: 'text/html',
                title: collection.title
            }]
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

    resolveFeature(feature, params : RequestParameters) {
        return produce(feature, (feature) => {
            _.each(feature.properties, (v, k) => {
                if (v instanceof PropertyReference) {
                    if (v.type !== 'Feature') {
                        console.error(`ERROR! Backend supplied PropertyReference of type ${v.type} that core does not understand`);
                        return;
                    }
                    if (!v.collection) {
                        console.error('ERROR! Backend supplied PropertyReference with no collection');
                        return;
                    }
                    if (!v.id) {
                        console.error('ERROR! Backend supplied PropertyReference with no id');
                        return;
                    }
                    var collectionId = v.collection.id || v.collection;
                    feature.properties[k] = `${params.baseUrl}/collections/${collectionId}/items/${v.id}`;
                }
            });
        });
    }

    produceOutput(params : RequestParameters, stream : FeatureStream, response : express.Response) {
        var n = 0;
        var receivedError : Error = null;

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
            if (n === 0) {
                startResponse(res);
            } else {
                res.write(',');
            }
            var feature = this.resolveFeature(d.feature, params);

            var json = JSON.stringify(feature, null, '\t');
            json = json.replace(/^\t/gm, '\t\t');
            json = json.substring(0,json.length-1)+'\t}';
            res.write(json);
            n++;
        });

        stream.on('error', (err : Error) => {
            console.error('Received error from backend', err);
            receivedError = err;
        });

        stream.on('end', () => {
            // the 'error' event happens immediately after 'end', so by
            // delaying the closeStream function call, we can handle the
            // error condition when actually closing the stream
            setTimeout(closeStream);
        });

        function closeStream() {
            if (receivedError) {
                if (n === 0) {
                    res.writeHead(503, {});
                    res.write('Internal error');
                } else {
                    res.write('\nInternal error');
                }
                res.end();
                return;
            }
            if (n === 0) {
                startResponse(res);
            }
            res.write('],\n');
            res.write('\t"timeStamp": "'+new Date().toISOString()+'",\n');
            res.write('\t"links": [');

            var queryString = _.map(params.itemQuery.filters, f => _.map(f.query, (v,k) => encodeURIComponent(k) + '=' + encodeURIComponent(v)));
            queryString = _.filter(_.flatten(queryString), s => s !== '');

            queryString.push('limit=' + params.itemQuery.limit);
            var nextTokenIndex;
            if (params.itemQuery.nextToken) {
                queryString.push('nextToken='+encodeURIComponent(params.itemQuery.nextToken));
                nextTokenIndex = queryString.length-1;
            }

            var selfUri = params.baseUrl + '/collections/' + params.collection.id + '/items?' +
                queryString.join('&');

            res.write('{\n');
            res.write('\t\t"href": '+JSON.stringify(selfUri+'&f=json')+',\n');
            if (params.responseFormat === 'HTML') {
                res.write('\t\t"rel": "alternate",\n');
            } else {
                res.write('\t\t"rel": "self",\n');
            }
            res.write('\t\t"type":"application/geo+json",\n');
            res.write('\t\t"title":"This document"\n');
            res.write('\t}');
            res.write(',{\n');
            res.write('\t\t"href": '+JSON.stringify(selfUri+'&f=html')+',\n');
            if (params.responseFormat === 'HTML') {
                res.write('\t\t"rel": "self",\n');
            } else {
                res.write('\t\t"rel": "alternate",\n');
            }
            res.write('\t\t"type":"text/html",\n');
            res.write('\t\t"title":"This document"\n');
            res.write('\t}');

            if (stream.lastPushedItem && stream.lastPushedItem.nextToken !== undefined && stream.lastPushedItem.nextToken !== null) {
                if (nextTokenIndex === undefined) {
                    nextTokenIndex = queryString.length;
                }
                queryString[nextTokenIndex] = 'nextToken='+encodeURIComponent(stream.lastPushedItem.nextToken);
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
        }
    }
};

