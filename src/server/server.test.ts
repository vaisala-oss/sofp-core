import {Backend, Collection, Query, FeatureStream, Feature} from 'sofp-lib';
import {Server} from './server';

class MockCollection implements Collection {
    
    id : string;
    links = [];
    properties = [];
    
    executeQuery(query : Query) : FeatureStream { throw new Error('fail'); };

    getFeatureById(id : string) : Promise<Feature> { throw new Error('fail'); };

    constructor(id : string) {
        this.id = id;
    }

}

class MockBackend extends Backend {
    constructor() {
        super('I am a mock');
        super.collections = [];
    }
}

test('Single-backend server returns single collection', () => {
    let server = new Server();

    let mockBackend : Backend = new MockBackend();
    const mockCollection = new MockCollection('Foo');
    mockBackend.collections.push(mockCollection);

    server.backends.push(mockBackend);

    let collections = server.getCollections();

    expect(collections.length).toEqual(1);
    expect(collections[0].id).toEqual('Foo');
});

test('Multi-backend server returns all collections', () => {
    let server = new Server();

    let mockBackend1 : Backend = new MockBackend();
    mockBackend1.collections.push(new MockCollection('Foo1'));
    mockBackend1.collections.push(new MockCollection('Foo2'));
    server.backends.push(mockBackend1);

    let mockBackend2 : Backend = new MockBackend();
    mockBackend2.collections.push(new MockCollection('Bar'));
    server.backends.push(mockBackend2);

    let collections = server.getCollections();

    expect(collections.length).toEqual(3);
    expect(collections[0].id).toEqual('Foo1');
    expect(collections[1].id).toEqual('Foo2');
    expect(collections[2].id).toEqual('Bar');
});

test('Find collection by id', () => {
    let server = new Server();

    let mockBackend1 : Backend = new MockBackend();
    let foo1 = new MockCollection('Foo1');
    let foo2 = new MockCollection('Foo2');
    mockBackend1.collections.push(foo1);
    mockBackend1.collections.push(foo2);
    server.backends.push(mockBackend1);

    let mockBackend2 : Backend = new MockBackend();
    let bar = new MockCollection('Bar');
    mockBackend2.collections.push(bar);
    server.backends.push(mockBackend2);

    expect(server.getCollection('Foo1')).toBe(foo1);
    expect(server.getCollection('Foo2')).toBe(foo2);
    expect(server.getCollection('Bar')).toBe(bar);

    expect(server.getCollection('NoSuchCollection')).toBeUndefined();
});
