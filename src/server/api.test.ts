import {API} from './api';

import {Server} from './server';

const MockServer = jest.fn<Server>(() => ({}));

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