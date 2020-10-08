import {API, deduceContextPath} from './api';
import {Collection} from 'sofp-lib';
import {Server} from './server';

import * as _ from 'lodash';

class MockServer extends Server {
    getCollections: () => ([])
};

/**
 * The content of that response SHALL be based upon the OpenAPI 3.0 schema root.yaml and include at least links to 
 * the following resources:
 * - /api (relation type 'service-desc')
 * - /api (relation type 'service-doc')
 * - /conformance (relation type 'conformance')
 * - /collections (relation type 'data')
 **/
test('Content specific tests for requirement 2: /req/core/root-success', () => {
    let api = new API(new MockServer(), { contextPath: '' });
    let response = api.getApiLandingPage({ baseUrl: 'http://foo.com:1024', basePath: '/' });
    
    // Links are mandatory
    expect(response.links).toBeInstanceOf(Array);

    let linksByRel = _.reduce(response.links, (memo, link) => { memo[link.rel+'#'+link.type] = link; return memo; }, {});

    expect(linksByRel['service-desc#application/vnd.oai.openapi+json;version=3.0']).toBeDefined();
    expect(linksByRel['service-desc#application/vnd.oai.openapi+json;version=3.0'].href).toBe('http://foo.com:1024/api');

    expect(linksByRel['service-desc#application/vnd.oai.openapi;version=3.0']).toBeDefined();
    expect(linksByRel['service-desc#application/vnd.oai.openapi;version=3.0'].href).toBe('http://foo.com:1024/api.yaml');

    expect(linksByRel['service-doc#text/html']).toBeDefined();
    expect(linksByRel['service-doc#text/html'].href).toBe('http://foo.com:1024/api.html');

    expect(linksByRel['conformance#application/json']).toBeDefined();
    expect(linksByRel['conformance#application/json'].href).toBe('http://foo.com:1024/conformance');

    expect(linksByRel['data#application/json']).toBeDefined();
    expect(linksByRel['data#application/json'].href).toBe('http://foo.com:1024/collections');
});

/**
 * The content of that response SHALL be based upon the OpenAPI 3.0 schema content.yaml.
 **/
test('Content specific tests for requirement 10: /req/core/fc-md-success', () => {
    let api = new API(new MockServer(), { contextPath: '' });
    let response = api.getFeatureCollectionsMetadata({ baseUrl: 'http://foo.com:1024', basePath: '/' });

    // Links and collections are mandatory
    expect(response.links).toBeInstanceOf(Array);
    expect(response.collections).toBeInstanceOf(Array);
});

/**
 * A 200-response SHALL include the following links in the links property of the response:
 * - a link to this response document (relation: self),
 * - a link to the response document in every other media type supported by the server (relation: alternate).
 * All links SHALL include the rel and type link parameters.
 **/
test('Content specific tests for requirement 11: /req/core/fc-md-links', () => {
let api = new API(new MockServer(), { contextPath: '' });
    let response = api.getFeatureCollectionsMetadata({ baseUrl: 'http://foo.com:1024', basePath: '/' });

    let self = _.find(response.links, l => l.rel === 'self');
    expect(self).toBeDefined();
    expect(self.href).toBe('http://foo.com:1024/collections')

    // All links SHALL include the rel and type link parameters.
    _.each(response.links, (link) => {
        expect(link.rel).toBeDefined();
        expect(link.type).toBeDefined();
    });
});

// TODO: add conformance requirements


test('Server collection response should only include API fields, not "private" fields', () => {

    const MockServer2 = jest.fn().mockImplementation(() => ({
        getCollections: () => [{
            id: 'foo',
            title: 'blaa',
            links: [],
            xxx: 'this field should be hidden'
        }]
    }));


    let api = new API(new MockServer2(), { contextPath: '' });
    let response = api.getFeatureCollectionsMetadata({ baseUrl: 'http://foo.com:1024', basePath: '/' });
    expect(response.collections).toBeInstanceOf(Array);
    expect(response.collections.length).toBe(1);

    let c = response.collections[0];
    expect(c.id).toBe('foo');
    expect(c.title).toBe('blaa');
    expect(c['xxx']).toBeUndefined();
});



test('Context path "" resolves to "/"', () => {
    let api = new API(new MockServer(), { contextPath: '' });

    expect(api.contextPath).toEqual('/');
});

test('Context path "/" resolves to "/"', () => {
    let api = new API(new MockServer(), { contextPath: '/' });

    expect(api.contextPath).toEqual('/');
});

test('Context path "foo" resolves to "/foo/"', () => {
    let api = new API(new MockServer(), { contextPath: 'foo' });

    expect(api.contextPath).toEqual('/foo/');
});

test('Context path "foo/" resolves to "/foo/"', () => {
    let api = new API(new MockServer(), { contextPath: 'foo/' });

    expect(api.contextPath).toEqual('/foo/');
});

test('Context path "/foo" resolves to "/foo/"', () => {
    let api = new API(new MockServer(), { contextPath: '/foo' });

    expect(api.contextPath).toEqual('/foo/');
});

test('Context path "/foo/" resolves to "/foo/"', () => {
    let api = new API(new MockServer(), { contextPath: '/foo/' });

    expect(api.contextPath).toEqual('/foo/');
});


test('Test that context path deducing works correctly', () => {
    var cases = [
        ["/sofp",  null, "/sofp"],
        ["/sofp/", null, "/sofp"],

        ["/sofp",  "/foo/sofp",  "/foo/sofp" ],
        ["/sofp",  "/foo/sofp/", "/foo/sofp" ],
        ["/sofp/", "/foo/sofp",  "/foo/sofp" ],
        ["/sofp/", "/foo/sofp/", "/foo/sofp" ],

        ["/sofp",  "/foo/sofp/collections/foo",  "/foo/sofp" ],
        ["/sofp",  "/foo/sofp/collections/foo/", "/foo/sofp" ],
        ["/sofp/", "/foo/sofp/collections/foo",  "/foo/sofp" ],
        ["/sofp/", "/foo/sofp/collections/foo", "/foo/sofp" ]
    ];
    var i, configuredPath, xForwardedPath, expectedResult;
    for (i = 0; i < cases.length; i++) {
        configuredPath = cases[i][0];
        xForwardedPath = cases[i][1];
        expectedResult = cases[i][2];

        expect(deduceContextPath(configuredPath, xForwardedPath)).toEqual(expectedResult);
    }
});
