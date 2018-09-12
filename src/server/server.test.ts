import {Backend, Collection} from '../lib';
import {Server} from './server';

test('Single-backend server returns single collection', () => {
    let server = new Server();

    let mockBackend = new Backend();
    const MockCollection = jest.fn<Collection>(() => ({
      name: 'Foo'
    }));
    const mockCollection = new MockCollection();
    mockBackend.collections.push(mockCollection);

    server.backends.push(mockBackend);


    let collections = server.getCollections();

    expect(collections.length).toEqual(1);
    expect(collections[0].name).toEqual('Foo');
});


test('Multi-backend server returns all collections', () => {
    let server = new Server();

    const MockCollection = jest.fn<Collection>((name : string) => ({ name: name }));

    let mockBackend1 = new Backend();
    mockBackend1.collections.push(new MockCollection('Foo1'));
    mockBackend1.collections.push(new MockCollection('Foo2'));
    server.backends.push(mockBackend1);

    let mockBackend2 = new Backend();
    mockBackend2.collections.push(new MockCollection('Bar'));
    server.backends.push(mockBackend2);

    let collections = server.getCollections();

    expect(collections.length).toEqual(3);
    expect(collections[0].name).toEqual('Foo1');
    expect(collections[1].name).toEqual('Foo2');
    expect(collections[2].name).toEqual('Bar');
});
