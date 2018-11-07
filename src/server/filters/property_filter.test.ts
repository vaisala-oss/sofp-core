import {PropertyFilterProvider} from './property_filter';

const provider = new PropertyFilterProvider();

test('Test accept (1 parameter)', () => {
    let filter = provider.parseFilter({ query: { name: 'foo' }});
    let feature = { properties: { name: 'foo' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test not accept (1 parameter)', () => {
    let filter = provider.parseFilter({ query: { name: 'foo' }});
    let feature = { properties: { name: 'bar' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test accept (2 parameters)', () => {
    let filter = provider.parseFilter({ query: { name: 'foo', yikes: 'bar' }});
    let feature = { properties: { name: 'foo', yikes: 'bar' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test not accept (1 parameter matches, 1 does not)', () => {
    let filter = provider.parseFilter({ query: { name: 'foo', yikes: 'bar' }});
    let feature = { properties: { name: 'bar', yikes: 'xxx' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test serialisation', () => {
    let filter = provider.parseFilter({ query: { name: 'foo' }});
    
    expect(filter.asQuery).toBe('name=foo');
});

test('Test property names are lowercased', () => {
    let filter = provider.parseFilter({ query: { NAME: 'foo' }});
    let feature = { properties: { name: 'foo' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test property names are lowercased in serialised format', () => {
    let filter = provider.parseFilter({ query: { NAME: 'foo' }});
    expect(filter.asQuery).toBe('name=foo');
});


test('Test no property filter for reserved parameter', () => {
    let filter = provider.parseFilter({ query: { LIMIT: 'foo', foo: 'bar' }});
    expect(filter.asQuery).toBe('foo=bar');
});
