import {Backend, Collection, Query} from 'sofp-lib';
import {Server} from './server';

const MockCollection = jest.fn<Collection>((name : string) => ({
    name: name
}));

const MockBackend = jest.fn<Backend>(() => ({
    collections: []
}));

test('Single-backend server returns single collection', () => {
    let server = new Server();

    let mockBackend = new MockBackend();
    const mockCollection = new MockCollection('Foo');
    mockBackend.collections.push(mockCollection);

    server.backends.push(mockBackend);

    let collections = server.getCollections();

    expect(collections).toEqual([
        {
            name: 'Foo'
        }
    ]);
});

test('Multi-backend server returns all collections', () => {
    let server = new Server();

    let mockBackend1 = new MockBackend();
    mockBackend1.collections.push(new MockCollection('Foo1'));
    mockBackend1.collections.push(new MockCollection('Foo2'));
    server.backends.push(mockBackend1);

    let mockBackend2 = new MockBackend();
    mockBackend2.collections.push(new MockCollection('Bar'));
    server.backends.push(mockBackend2);

    let collections = server.getCollections();

    expect(collections).toEqual([
        { name: 'Foo1' },
        { name: 'Foo2' },
        { name: 'Bar' }
    ]);
});

test('Find collection by name', () => {
    let server = new Server();

    let mockBackend1 = new MockBackend();
    let foo1 = new MockCollection('Foo1');
    let foo2 = new MockCollection('Foo2');
    mockBackend1.collections.push(foo1);
    mockBackend1.collections.push(foo2);
    server.backends.push(mockBackend1);

    let mockBackend2 = new MockBackend();
    let bar = new MockCollection('Bar');
    mockBackend2.collections.push(bar);
    server.backends.push(mockBackend2);

    expect(server.getCollection('Foo1')).toBe(foo1);
    expect(server.getCollection('Foo2')).toBe(foo2);
    expect(server.getCollection('Bar')).toBe(bar);

    expect(server.getCollection('NoSuchCollection')).toBeUndefined();
});

test('Execute query targets correct collection', () => {
    let server = new Server();

    let fakeCursor = {
        hasNext: () => false,
        next: () => null,
        remainingFilter: []
    };

    let mockBackend = new MockBackend();
    const MockCollectionWithQuery = jest.fn<Collection>((name : string) => ({
        name: name,
        executeQuery: (query : Query) => fakeCursor
    }));

    let collection = new MockCollectionWithQuery('Foo');

    mockBackend.collections.push(collection);
    server.backends.push(mockBackend);

    expect(server.executeQuery({ featureName: 'Foo', filters: [] })).toBeTruthy();
});

test('Execute query applies remaining filters - case accept', () => {
    let server = new Server();

    let fakeFeatures = [{
        properties: {
            name: 'foo'
        },
        geometry: null
    }];

    let firstFakeFeature = fakeFeatures[0];

    let fakeCursor = {
        hasNext: () => (fakeFeatures.length > 0),
        next: () => (fakeFeatures.splice(0,1)[0]),
        remainingFilter: [{
            accept: (f) => (f.properties.name === 'foo')
        }]
    };

    let mockBackend = new MockBackend();
    const MockCollectionWithQuery = jest.fn<Collection>((name : string) => ({
        name: name,
        executeQuery: (query : Query) => fakeCursor
    }));

    let collection = new MockCollectionWithQuery('Foo');

    mockBackend.collections.push(collection);
    server.backends.push(mockBackend);

    let featureCursor = server.executeQuery({ featureName: 'Foo', filters: [] });

    expect(featureCursor.hasNext()).toBe(true);
    expect(featureCursor.next()).toBe(firstFakeFeature);
    expect(featureCursor.hasNext()).toBe(false);
});

test('Execute query applies remaining filters - case not accept', () => {
    let server = new Server();

    let fakeFeatures = [{
        properties: {
            name: 'foo'
        },
        geometry: null
    }];

    let firstFakeFeature = fakeFeatures[0];

    let fakeCursor = {
        hasNext: () => (fakeFeatures.length > 0),
        next: () => (fakeFeatures.splice(0,1)[0]),
        remainingFilter: [{
            accept: (f) => (f.properties.name === 'bar') // firstFakeFeature name is 'foo', should not accept!
        }]
    };

    let mockBackend = new MockBackend();
    const MockCollectionWithQuery = jest.fn<Collection>((name : string) => ({
        name: name,
        executeQuery: (query : Query) => fakeCursor
    }));

    let collection = new MockCollectionWithQuery('Foo');

    mockBackend.collections.push(collection);
    server.backends.push(mockBackend);

    let featureCursor = server.executeQuery({ featureName: 'Foo', filters: [] });

    expect(featureCursor.hasNext()).toBe(false);
});
