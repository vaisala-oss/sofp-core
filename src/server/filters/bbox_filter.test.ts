import {BBOXFilterProvider} from './bbox_filter';

const provider = new BBOXFilterProvider();

test('Parse 2d bbox', () => {
    let filter = provider.parseFilter({ query: { bbox: '1,2,3,4' }}, {});
    expect(filter.parameters.coords.length).toBe(4);
    expect(filter.parameters.coords[0]).toBe(1);
    expect(filter.parameters.coords[1]).toBe(2);
    expect(filter.parameters.coords[2]).toBe(3);
    expect(filter.parameters.coords[3]).toBe(4);
});

/*
test('Parse 3d bbox', () => {
    let filter = provider.parseFilter({ query: { bbox: '1,2,3,4,5,6' }});
    expect(filter.parameters.coords.length).toBe(6);
    expect(filter.parameters.coords[0]).toBe(1);
    expect(filter.parameters.coords[1]).toBe(2);
    expect(filter.parameters.coords[2]).toBe(3);
    expect(filter.parameters.coords[3]).toBe(4);
    expect(filter.parameters.coords[4]).toBe(5);
    expect(filter.parameters.coords[5]).toBe(6);
});
*/

test('Illegal box (3 coords)', () => {
    try {
        let filter = provider.parseFilter({ query: { bbox: '1,2,3' }}, {});
        fail('Provider should have thrown an error');
    } catch(e) {
        // NOP
    }
});

test('Illegal 2d bbox (no characters)', () => {
    try {
        let filter = provider.parseFilter({ query: { bbox: '1,2,,4' }}, {});
        fail('Provider should have thrown an error');
    } catch(e) {
        // NOP
    }
});

test('Illegal 2d bbox (text)', () => {
    try {
        let filter = provider.parseFilter({ query: { bbox: '1,2,x,4' }}, {});
        fail('Provider should have thrown an error');
    } catch(e) {
        // NOP
    }
});

test('Illegal 2d bbox (text+numbers)', () => {
    try {
        let filter = provider.parseFilter({ query: { bbox: '1,2,x3,4' }}, {});
        fail('Provider should have thrown an error');
    } catch(e) {
        // NOP
    }
});

test('Illegal 2d bbox (numbers+text)', () => {
    try {
        let filter = provider.parseFilter({ query: { bbox: '1,2,3x,4' }}, {});
        fail('Provider should have thrown an error');
    } catch(e) {
        // NOP
    }
});


test('Polygon within bbox', () => {
    
    let filter = provider.parseFilter({ query: { bbox: '1,1,2,2' }}, {});

    let point = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Point',
            coordinates: [1.5, 1.5]
        }
    };

    expect(filter.accept(point)).toBeTruthy();
});


test('Polygon outside bbox', () => {
    
    let filter = provider.parseFilter({ query: { bbox: '1,1,2,2' }}, {});

    let point = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Point',
            coordinates: [3.5, 1.5]
        }
    };

    expect(filter.accept(point)).toBeFalsy();
});
