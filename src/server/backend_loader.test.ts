import {load} from './backend_loader';


test('Load example backend', () => {
    var backends = load('examples');

    expect(backends.length).toEqual(1);
    expect(backends[0].name).toBe('ExampleBackend');
    expect(backends[0].collections.length).toEqual(1);
    expect(backends[0].collections[0].id).toBe('foo');
});

