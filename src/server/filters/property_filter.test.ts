import {PropertyFilterProvider} from './property_filter';

const provider = new PropertyFilterProvider();

test('Test do not create filter for unknown property', () => {
    // The collection has only the property "bar"
    let filter = provider.parseFilter({ query: { name: 'foo' }}, { properties: [{name: 'bar'}]});
    expect(filter).toBeNull();
});

test('Create filter for one known property: accept feature', () => {
    // The collection has only the property "bar"
    let filter = provider.parseFilter({ query: { bar: 'zabb' }}, { properties: [{name: 'bar'}]});
    let feature = { properties: { bar: 'zabb' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Create filter for one known property (declared name has upper case characters): accept feature', () => {
    // The collection has only the property "bar"
    let filter = provider.parseFilter({ query: { bar: 'zabb' }}, { properties: [{name: 'BAR'}]});
    let feature = { properties: { bar: 'zabb' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Create filter for one known and one unknown property: accept feature', () => {
    // The collection has only the property "bar"
    let filter = provider.parseFilter({ query: { name: 'foo', bar: 'zabb' }}, { properties: [{name: 'bar'}]});
    let feature = { properties: { bar: 'zabb' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Create filter for one known and one unknown property: reject feature', () => {
    // The collection has only the property "bar"
    let filter = provider.parseFilter({ query: { name: 'foo', bar: 'zabb' }}, { properties: [{name: 'bar'}]});
    let feature = { properties: { bar: 'bleef' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test accept (1 parameter)', () => {
    let filter = provider.parseFilter({ query: { name: 'foo' }}, { properties: [{name: 'name'}]});
    let feature = { properties: { name: 'foo' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test not accept (1 parameter)', () => {
    let filter = provider.parseFilter({ query: { name: 'foo' }}, { properties: [{name: 'name'}]});
    let feature = { properties: { name: 'bar' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test accept (2 parameters)', () => {
    let filter = provider.parseFilter({ query: { name: 'foo', yikes: 'bar' }}, { properties: [{name: 'name'}, {name: 'yikes'}]});
    let feature = { properties: { name: 'foo', yikes: 'bar' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test not accept (1 parameter matches, 1 does not)', () => {
    let filter = provider.parseFilter({ query: { name: 'foo', yikes: 'bar' }}, { properties: [{name: 'name'}, {name: 'yikes'}]});
    let feature = { properties: { name: 'bar', yikes: 'xxx' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test serialisation', () => {
    let filter = provider.parseFilter({ query: { name: 'foo' }}, { properties: [{name: 'name'}]});
    
    expect(filter.query['name']).toBe('foo');
});

test('Test property names are lowercased', () => {
    let filter = provider.parseFilter({ query: { NAME: 'foo' }}, { properties: [{name: 'name'}]});
    let feature = { properties: { name: 'foo' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test property names are lowercased in serialised format', () => {
    let filter = provider.parseFilter({ query: { NAME: 'foo' }}, { properties: [{name: 'name'}]});
    expect(filter.query['name']).toBe('foo');
});


test('Test no property filter for reserved parameter', () => {
    let filter = provider.parseFilter({ query: { LIMIT: 'foo', foo: 'bar' }}, { properties: [{name: 'foo'}]});
    expect(filter.query['name']).toBe('bar');
});

