import { API, RequestParameters } from './api';
import { Collection, Property, QueryParameter } from 'sofp-lib';

import * as widdershins from 'widdershins';
import * as shins from 'shins';

import * as yaml from 'js-yaml';

import * as _ from 'lodash';

const pkgInfo = require('../../package.json');

export class OpenAPI {
    api : API;
    requestParameters : RequestParameters;

    constructor(api : API, requestParameters : RequestParameters) {
        this.api = api;
        this.requestParameters = requestParameters;
    }

    getObject() {
        const ret = {
            openapi: '3.0.1',
            info: {
                version: pkgInfo.version,
                title: 'SOFP OGC API Features server',
                license: {
                    name: 'MIT',
                }
            },
            servers: [{
                url: this.requestParameters.baseUrl,
                description: 'This server'
            }],
            paths: { },
            components: {
                parameters: {
                    limit: {
                        name: 'limit',
                        in: 'query',
                        description:
                            'The optional limit parameter limits the number of items that are '+
                            'presented in the response document.\n'+

                            'Only items are counted that are on the first level of the collection in '+
                            'the response document. Nested objects contained within the explicitly '+
                            'requested items shall not be counted.',
                        required: false,
                        schema: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 10000,
                            default: 10
                        },
                        style: 'form',
                        explode: false
                    },
                    bbox: {
                        name: 'bbox',
                        in: 'query',
                        description:
                            'Only features that have a geometry that intersects the bounding box are selected. '+
                            'The bounding box is provided as four numbers:\n'+
                            //'The bounding box is provided as four or six numbers, depending on whether the '+
                            //'coordinate reference system includes a vertical axis (elevation or depth):\n'+

                            '* Lower left corner, coordinate axis 1\n'+
                            '* Lower left corner, coordinate axis 2\n'+
                            '* Lower left corner, coordinate axis 3 (optional)\n'+
                            '* Upper right corner, coordinate axis 1\n'+
                            '* Upper right corner, coordinate axis 2\n'+
                            '* Upper right corner, coordinate axis 3 (optional)\n'+

                            'The coordinate reference system of the values is WGS84 longitude/latitude '+
                            '(http://www.opengis.net/def/crs/OGC/1.3/CRS84) unless a different coordinate '+
                            'reference system is specified in the parameter `bbox-crs`.\n'+

                            'For WGS84 longitude/latitude the values are in most cases the sequence of '+
                            'minimum longitude, minimum latitude, maximum longitude and maximum latitude. '+
                            'However, in cases where the box spans the antimeridian the first value '+
                            '(west-most box edge) is larger than the third value (east-most box edge).\n'+

                            'If a feature has multiple spatial geometry properties, it is the decision of the '+
                            'server whether only a single spatial geometry property is used to determine '+
                            'the extent or all relevant geometries.',
                        required: false,
                        schema: {
                            type: 'array',
                            minItems: 4,
                            maxItems: 6,
                            items: {
                              type: 'number'
                            }
                        },
                        style: 'form',
                        explode: false
                    },
                    // 'bbox-crs': { }, // TODO:
                    time: {
                        name: 'time',
                        in: 'query',
                        description:
                            'Either a date-time or a period string that adheres to RFC 3339. Examples:\n'+

                            '* A date-time: "2018-02-12T23:20:50Z"\n'+
                            '* A period: "2018-02-12T00:00:00Z/2018-03-18T12:31:12Z" or "2018-02-12T00:00:00Z/P1M6DT12H31M12S"\n'+

                            'Only features that have a temporal property that intersects the value of '+
                            '`time` are selected.\n'+

                            'If a feature has multiple temporal properties, it is the decision of the '+
                            'server whether only a single temporal property is used to determine '+
                            'the extent or all relevant temporal properties.',
                        required: false,
                        schema: { type: 'string' },
                        style: 'form',
                        explode: false
                    },
                    featureId: {
                        name: 'featureId',
                        in: 'path',
                        description: 'Local identifier of a specific feature',
                        required: true,
                        schema: { type: 'string' }
                    }
                },
                schemas: {
                    exception: {
                        type: 'object',
                        required: ['code'],
                        properties: { code: { type: 'string' }, description: { type: 'string' } }
                    },
                    root: {
                        type: 'object',
                        required: ['links'],
                        properties: {
                            links: {
                                type: 'array',
                                items: {
                                    '$ref': '#/components/schemas/link'
                                }
                            }
                        }
                    },
                    'req-classes': {
                        type: 'object',
                        required: ['conformsTo'],
                        properties: {
                            conformsTo: {
                                type: 'array',
                                items: { type: 'string' },
                                example: [
                                    'http://www.opengis.net/spec/wfs-1/3.0/req/core',
                                    'http://www.opengis.net/spec/wfs-1/3.0/req/oas30',
                                    'http://www.opengis.net/spec/wfs-1/3.0/req/html',
                                    'http://www.opengis.net/spec/wfs-1/3.0/req/geojson'
                                ]
                            }
                        }
                    },
                    link: {
                        type: 'object',
                        required: ['href'],
                        properties: {
                            href: { type: 'string' },
                            rel: { type: 'string', example: 'prev' },
                            type: { type: 'string', example: 'application/geo+json' },
                            hreflang: { type: 'string', example: 'en' }
                        }
                    },
                    content: {
                        type: 'object',
                        required: [ 'links', 'collections' ],
                        properties: {
                            links: {
                                type: 'array',
                                items: {
                                    '$ref': '#/components/schemas/link'
                                }
                            },
                            collections: {
                                type: 'array',
                                items: {
                                    '$ref': '#/components/schemas/collectionInfo'
                                }
                            }
                        }
                    },
                    collectionInfo: {
                        type: 'object',
                        required: [ 'name', 'links' ],
                        properties: {
                            name: {
                                description: 'identifier of the collection used, for example, in URIs',
                                type: 'string',
                                example: 'buildings'
                            },
                            title: {
                                description: 'human readable title of the collection',
                                type: 'string',
                                example: 'Buildings'
                            },
                            description: {
                                description: 'a description of the features in the collection',
                                type: 'string',
                                example: 'Buildings in the city of Bonn.'
                            },
                            links: {
                                type: 'array',
                                items: {
                                    '$ref': '#/components/schemas/link'
                                }
                            },
                            extent: {
                                '$ref': '#/components/schemas/extent'
                            },
                            crs: {
                                description:
                                    'The coordinate reference systems in which geometries '+
                                    'may be retrieved. Coordinate reference systems are identified '+
                                    'by a URI. The first coordinate reference system is the '+
                                    'coordinate reference system that is used by default. This '+
                                    'is always "http://www.opengis.net/def/crs/OGC/1.3/CRS84", i.e. '+
                                    'WGS84 longitude/latitude.',
                                type: 'array',
                                items: { type: 'string' },
                                default: [ 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' ]
                            }
                        }
                    },
                    extent: {
                        type: 'object',
                        properties: {
                            crs: {
                                description:
                                    'Coordinate reference system of the coordinates in the spatial extent (property `spatial`). '+
                                    'In the Core, only WGS84 longitude/latitude is supported. Extensions may support additional '+
                                    'coordinate reference systems.',
                                type: 'string',
                                enum: [ 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' ],
                                default: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84'
                            },
                            spatial: {
                                description:
                                    'West, north, east, south edges of the spatial extent. The minimum and '+
                                    'maximum values apply to the coordinate reference system WGS84 longitude/latitude '+
                                    'that is supported in the Core. If, for example, a projected coordinate reference '+
                                    'system is used, the minimum and maximum values need to be adjusted.',
                                type: 'array',
                                minItems: 4,
                                maxItems: 4,
                                items: { type: 'number' },
                                example: [ -180, -90, 180, 90 ]
                            },
                            trs: {
                                description:
                                    'Temporal reference system of the coordinates in the temporal extent (property `temporal`). '+
                                    'In the Core, only the Gregorian calendar is supported. Extensions may support additional '+
                                    'temporal reference systems.',
                                type: 'string',
                                enum: [ 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' ],
                                default: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian'
                            },
                            temporal: {
                                description: 'Begin and end times of the temporal extent.',
                                type: 'array',
                                minItems: 2,
                                maxItems: 2,
                                items: {
                                    type: 'string',
                                    format: 'dateTime'
                                },
                                example: [ '2011-11-11T12:22:11Z', '2012-11-24T12:32:43Z' ]
                            }
                        }
                    },
                    geometryGeoJSON: {
                        type: 'object',
                        required: [ 'type' ],
                        properties: {
                            type: {
                                type: 'string',
                                enum: [ 'Point', 'MultiPoint' , 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection' ]
                            }
                        }
                    }
                }
            },
            tags: [{
                name: 'Capabilities',
                description: 'Essential characteristics of this API including information about the data'
            }, {
                name: 'Features',
                description: 'Access to data (features).'
            }]
        };

        function formulateResponse(description, jsonSchema) {
            return {
                description: description,
                content: {
                    'application/json': {
                        schema: { '$ref': jsonSchema }
                    }
                }
            };
        }

        ret.paths['/'] = {
            get: {
                summary: 'OGC API Features Landing page',
                operationId: 'getLandingPage',
                tags: [ 'Capabilities' ],
                responses: {
                    '200': formulateResponse('links to the API capabilities', '#/components/schemas/root'),
                    default: formulateResponse('an error occurred', '#/components/schemas/exception')
                }
            }
        };

        ret.paths['/conformance'] = {
            get: {
                summary: 'information about standards that this API conforms to',
                description: 'list all requirements classes specified in a standard (e.g., WFS 3.0 Part 1: Core) that the server conforms to',
                operationId: 'getRequirementsClasses',
                tags: [ 'Capabilities' ],
                responses: {
                    '200': formulateResponse('the URIs of all requirements classes supported by the server', '#/components/schemas/req-classes'),
                    default: formulateResponse('an error occurred', '#/components/schemas/exception')
                }
            }
        };

        ret.paths['/collections'] = {
            get: {
                summary: 'describe the feature collections in the dataset',
                operationId: 'describeCollections',
                tags: [ 'Capabilities' ],
                responses: {
                    '200': formulateResponse('metadata about the feature collections shared by this API', '#/components/schemas/content'),
                    default: formulateResponse('an error occurred', '#/components/schemas/exception')
                }
            }
        };


        const collections : Collection[] = this.api.server.getCollections();
        _.each(collections, (collection : Collection) => {
            const featureCollectionSchemaName = collection.schemaName ? (collection.schemaName+'Collection') : (collection.id+'FeatureCollectionGeoJSON');
            const featureSchemaName = collection.schemaName || (collection.id+'FeatureGeoJSON');

            const operationId_describeCollection = ('describeCollection_'+collection.id).replace(/\//g,'_');
            const operationId_getFeatures = ('getFeatures_'+collection.id).replace(/\//g,'_');
            const operationId_getFeature = ('getFeature_'+collection.id).replace(/\//g,'_');

            ret.paths['/collections/'+collection.id] = {
                get: {
                    summary: 'describe the buildings feature collection',
                    description: collection.description,
                    operationId: operationId_describeCollection,
                    tags: [ 'Capabilities' ],
                    responses: {
                        '200': formulateResponse('metadata about the '+collection.id+' collection shared by this API', '#/components/schemas/collectionInfo'),
                        default: formulateResponse('an error occurred', '#/components/schemas/exception')
                    }
                }
            };

            var parameters : any[] = [{
                '$ref': '#/components/parameters/limit'
            },{
                '$ref': '#/components/parameters/bbox'
            },{
                '$ref': '#/components/parameters/time'
            }];

            var allLowerCaseParameters = ['limit', 'bbox', 'time'];

            _.each(collection.properties, (p : Property) => {
                if (allLowerCaseParameters.indexOf(p.name.toLowerCase()) !== -1) {
                    return;
                }
                allLowerCaseParameters.push(p.name.toLowerCase());
                var prop : any = {
                    name: p.name,
                    in: 'query',
                    schema: { type: p.type },
                    required: false
                };

                prop.description = 'Filters returned features based on feature properties.'
                prop.description += p.description ? (' '+p.description) : '';

                if (_.size(p.exampleValues) > 0) {
                    prop.schema.example = p.exampleValues[0];
                }
                parameters.push(prop);
            });

            _.each(collection.additionalQueryParameters, (p : QueryParameter) => {
                if (allLowerCaseParameters.indexOf(p.name.toLowerCase()) !== -1) {
                    return;
                }
                allLowerCaseParameters.push(p.name.toLowerCase());
                var prop : any = {
                    name: p.name,
                    in: 'query',
                    schema: { type: p.type },
                    required: false
                };

                prop.description = p.description ? (p.description+' ') : '';
                prop.description += 'There is no direct connection between the name of this parameter and properties of returned features.'

                if (_.size(p.exampleValues) > 0) {
                    prop.schema.example = p.exampleValues[0];
                }
                
                parameters.push(prop);
            });

            ret.paths['/collections/'+collection.id+'/items'] = {
                get: {
                    summary: 'retrieve features of '+collection.id+' feature collection',
                    description: collection.description,
                    operationId: operationId_getFeatures,
                    tags: [ 'Features' ],
                    
                    parameters: parameters,
                    responses: {
                        '200': formulateResponse('Information about the feature collection plus the first features matching the selection parameters.', 
                            '#/components/schemas/' + featureCollectionSchemaName),
                        default: formulateResponse('an error occurred', '#/components/schemas/exception')
                    }
                }
            };

            ret.paths['/collections/'+collection.id+'/items/{featureId}'] = {
                get: {
                    summary: 'retrieve single feature from feature collection '+collection.id,
                    operationId: operationId_getFeature,
                    tags: [ 'Features' ],
                    parameters: [{
                        '$ref': '#/components/parameters/featureId'
                    }],
                    responses: {
                        '200': formulateResponse('A feature', '#/components/schemas/' + featureSchemaName),
                        default: formulateResponse('an error occurred', '#/components/schemas/exception')
                    }
                }
            };

            ret.components.schemas[featureCollectionSchemaName] = {
                type: 'object',
                required: [ 'type', 'features' ],
                properties: {
                    type: { type: 'string', enum: [ 'FeatureCollection' ] },
                    features: { type: 'array', items: { '$ref': '#/components/schemas/' + featureSchemaName }},
                    links: { type: 'array', items: { '$ref': '#/components/schemas/link' }},
                    timeStamp: { type: 'string', format: 'dateTime' },
                    numberMatched: { type: 'integer', minimum: 0 },
                    numberReturned: { type: 'integer', minimum: 0 }
                }
            };

            ret.components.schemas[featureSchemaName] = {
                type: 'object',
                required: [ 'type', 'geometry', 'properties' ],
                properties: {
                    type: {
                        type: 'string',
                        enum: [ 'Feature' ]
                    },
                    geometry: {
                        '$ref': '#/components/schemas/geometryGeoJSON'
                    },
                    properties: {
                        type: 'object',
                        properties: _.reduce(collection.properties, (memo, p) => { memo[p.name] = { type: p.type, description: p.description }; return memo; }, {}),
                    },
                    id: {
                        oneOf: [{ type: 'string' }, { type: 'integer' }]
                    }
                }
            };
        });

        return ret;
    }

    async serialize(format) {
        let obj = this.getObject();

        if (format === 'yaml') {
            return yaml.dump(obj);
        } else if (format === 'json') {
            return obj;
        } else if (format === 'html') {

            const widderShinsOptions = {
                codeSamples: true,
                httpsnippet: false,
                templateCallback: function(templateName,stage,data) { return data },
                theme: 'darkula',
                search: true,
                samle: true,
                includes: [],
                shallowSchemas: false,
                tocSummary: false,
                headings: 2,
                yaml: false
            };

            const shinsOptions = {
                cli: false,
                minify: false,
                customCss: false,
                inline: true,
                unsafe: false,
                'no-links': false,
                logo: __dirname + '/../../assets/logo.png'
            };

            const shins = require('shins');

            return new Promise((resolve, reject) => {
                widdershins.convert(obj,widderShinsOptions,function(err,markdown){
                    if (err) { return reject(err); }

                    shins.render(markdown, shinsOptions, function(err, html) {
                        if (err) { return reject(err); }
                        resolve(html);
                    });
                });
            });

        } else {
            new Error('cannot serialize format '+format);
        }
    }
};
