import {Server} from './server';
import {FilterProvider} from './filter_provider';
import {Collection, FeatureStream, Filter, Item, Link, Query} from 'sofp-lib';

import * as _ from 'lodash';
import * as express from 'express';

import {filterProviders} from './filters/';

/**
 * The API class provides accessors to produce metadata for the WFS 3.0 API. The API class wraps a Server object 
 * and uses the data and configuration within that object to produce responses.
 **/

export interface APIResponse {
    links?: Link[],
    collections?: Collection[]
};

export interface RequestParameters {
    baseUrl : string;
    query? : Map<string, string>;
    body? : Buffer;
    collection? : Collection;
    itemQuery? : Query;
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
        let getBaseUrl = (req: express.req) : string => {
            let ret = req.protocol + '://' + req.headers.host + this.contextPath;
            while (ret.charAt(ret.length-1) === '/') {
                ret = ret.substr(0, ret.length-1);
            }
            return ret;
        }
        app.get(this.contextPath, (req, res) => {
            let response = this.getApiLandingPage({ baseUrl: getBaseUrl(req) });
            res.json(response);
        });

        app.get(this.contextPath + 'collections', (req, res) => {
            let response = this.getFeatureCollectionsMetadata({ baseUrl: getBaseUrl(req) });
            res.json(response);
        });

        app.get(this.contextPath + 'collections/:name', (req, res, next) => {
            let collection = this.server.getCollection(req.params.name);
            if (!collection) {
                return next();
            }
            
            let response = this.getFeatureCollectionsMetadata({ baseUrl: getBaseUrl(req) }, collection);
            res.json(response);
        });

        app.get(this.contextPath + 'collections/:name/items', (req, res, next) => {
            let collection = this.server.getCollection(req.params.name);
            if (!collection) {
                return next();
            }
            
            let filters = this.parseFilters(req);
            const query : Query = {
                limit:     req.query.limit ? Number(req.query.limit) : 10,
                nextToken: req.query.nextToken  ? req.query.nextToken : undefined,
                filters: filters
            };

            const stream : FeatureStream = collection.executeQuery(query);
            var params : RequestParameters = {
                baseUrl: getBaseUrl(req),
                collection: collection,
                itemQuery: query
            };
            this.produceOutput(params, stream, res);
        });

        app.get(this.contextPath + 'conformance', (req, res) => {
            let response = this.getConformancePage({ baseUrl: getBaseUrl(req) });
            res.json(response);
        });
    }

    parseFilters(req : express.Request) : Filter[] {
        return _.map(filterProviders, fp => fp.parseFilter(req)).filter(_.isObject);
    }

    /**
     * Return object following the WFS 3.0.0 draft 1 specification for api landing page
     *
     * @link https://cdn.rawgit.com/opengeospatial/WFS_FES/3.0.0-draft.1/docs/17-069.html#_api_landing_page
     **/
    getApiLandingPage(params : RequestParameters) : APIResponse {
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

    /**
     * Return object following the WFS 3.0.0 draft 1 specification for feature collections metadata
     * @link https://cdn.rawgit.com/opengeospatial/WFS_FES/3.0.0-draft.1/docs/17-069.html#_feature_collections_metadata
     */ 
    getFeatureCollectionsMetadata(params : RequestParameters, collection? : Collection) : APIResponse {
        var collections = collection ? [ collection ] : this.server.getCollections();
        collections = _.map(collections, c => _.pick(c, 'name', 'title', 'description', 'links', 'extent', 'crs'));
        collections = _.cloneDeep(collections);

        let ret : APIResponse = {
            links: [{
                href: params.baseUrl + '/collections',
                rel: 'self',
                type: 'application/json',
                title: 'Metadata about the feature collections'
            }],
            collections: collections
        };

        _.each(collections, (collection) => {
            collection.links.unshift({
                href: params.baseUrl + '/collections/'+collection.name+'/items',
                rel: 'item',
                type: 'application/json'
            });
        });

        return ret;
    }

    getConformancePage(params : RequestParameters) : object {
        // TODO: this is still a lie, but we're getting there..
        return {
            conformsTo: [
                'http://www.opengis.net/spec/wfs-1/3.0/req/core',
                'http://www.opengis.net/spec/wfs-1/3.0/req/oas30',
                'http://www.opengis.net/spec/wfs-1/3.0/req/geojson' ]
        };
    }

    produceOutput(params : RequestParameters, stream : FeatureStream, res : express.Response) {
        var n = 0;
        var lastItem : Item = undefined;
        function startResponse(res) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write('{\n');
            res.write('\t"type": "FeatureCollection",\n');
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

        stream.on('end', () => {
            if (n === 0) {
                startResponse(res);
            }
            res.write('],\n');
            res.write('\t"timestamp": "'+new Date().toISOString()+'",\n');
            res.write('\t"links": [');

            var queryString = _.map(params.itemQuery.filters, f => f.asQuery);
            queryString.push('limit=' + params.itemQuery.limit);
            var nextTokenIndex;
            if (params.itemQuery.nextToken) {
                queryString.push('nextToken='+encodeURIComponent(params.itemQuery.nextToken));
                nextTokenIndex = queryString.length-1;
            }

            var selfUri = params.baseUrl + '/collections/' + params.collection.name + '/items?' +
                queryString.join('&');

            res.write('{\n');
            res.write('\t\t"href": '+JSON.stringify(selfUri)+',\n');
            res.write('\t\t"rel": "self",\n');
            res.write('\t\t"type":"application/geo+json",\n');
            res.write('\t\t"title":"This document"\n');
            res.write('\t}');

            if (n === params.itemQuery.limit && lastItem.nextToken !== undefined && lastItem.nextToken !== null) {
                if (nextTokenIndex === undefined) {
                    nextTokenIndex = queryString.length;
                }
                queryString[nextTokenIndex] = 'nextToken='+encodeURIComponent(lastItem.nextToken);
                var nextUri = params.baseUrl + '/collections/' + params.collection.name + '/items?' +
                    queryString.join('&');

                res.write(',{\n');
                res.write('\t\t"href": '+JSON.stringify(nextUri)+',\n');
                res.write('\t\t"rel": "next",\n');
                res.write('\t\t"type":"application/geo+json",\n');
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

