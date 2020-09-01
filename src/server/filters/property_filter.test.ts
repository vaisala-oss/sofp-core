import { PropertyFilterProvider } from './property_filter';

import * as express from 'express';

const provider = new PropertyFilterProvider();

test('Test do not create filter for unknown property', () => {
    // The collection has only the property "bar"
    let req : unknown = { query: { name: 'foo' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'bar'}]});
    expect(filter).toBeNull();
});

test('Create filter for one known property: accept feature', () => {
    // The collection has only the property "bar"
    let req : unknown = { query: { bar: 'zabb' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'bar'}]});
    let feature = { properties: { bar: 'zabb' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Create filter for one known property (declared name has upper case characters): accept feature', () => {
    // The collection has only the property "bar"
    let req : unknown = { query: { bar: 'zabb' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'BAR'}]});
    let feature = { properties: { bar: 'zabb' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Create filter for one known and one unknown property: accept feature', () => {
    // The collection has only the property "bar"
    let req : unknown = { query: { name: 'foo', bar: 'zabb' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'bar'}]});
    let feature = { properties: { bar: 'zabb' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Create filter for one known and one unknown property: reject feature', () => {
    // The collection has only the property "bar"
    let req : unknown = { query: { name: 'foo', bar: 'zabb' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'bar'}]});
    let feature = { properties: { bar: 'bleef' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test accept (1 parameter)', () => {
    let req : unknown = { query: { name: 'foo' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'name'}]});
    let feature = { properties: { name: 'foo' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test not accept (1 parameter)', () => {
    let req : unknown = { query: { name: 'foo' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'name'}]});
    let feature = { properties: { name: 'bar' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test accept (2 parameters)', () => {
    let req : unknown = { query: { name: 'foo', yikes: 'bar' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'name'}, {name: 'yikes'}]});
    let feature = { properties: { name: 'foo', yikes: 'bar' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test not accept (1 parameter matches, 1 does not)', () => {
    let req : unknown = { query: { name: 'foo', yikes: 'bar' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'name'}, {name: 'yikes'}]});
    let feature = { properties: { name: 'bar', yikes: 'xxx' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test serialisation', () => {
    let req : unknown = { query: { name: 'foo' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'name'}]});
    
    expect(filter.query['name']).toBe('foo');
});

test('Test property names are lowercased', () => {
    let req : unknown = { query: { NAME: 'foo' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'name'}]});
    let feature = { properties: { name: 'foo' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test property names are lowercased in serialised format', () => {
    let req : unknown = { query: { NAME: 'foo' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'name'}]});
    expect(filter.query['name']).toBe('foo');
});


test('Test no property filter for reserved parameter', () => {
    let req : unknown = { query: { LIMIT: 'foo', foo: 'bar' }};
    let filter = provider.parseFilter(<express.Request>req, { properties: [{name: 'foo'}]});
    expect(filter.query['foo']).toBe('bar');
});

