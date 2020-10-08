import { PropertyFilterProvider } from './property_filter';
import { Collection, FeatureStream, Query, PropertyType, Property, Feature, Filter } from 'sofp-lib';

import * as express from 'express';

const provider = new PropertyFilterProvider();

function mockCollection(properties : Property[]) : Collection {
    return {
        id: 'mock',
        links: [],
        properties: properties,
        executeQuery: function(query : Query) : FeatureStream { throw new Error('fail'); },
        getFeatureById: function(id : string) : Promise<Feature> {  throw new Error('fail'); }
    };
}

test('Test do not create filter for unknown property', () => {
    // The collection has only the property "bar"
    let req : unknown = { query: { name: 'foo' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'bar', type: PropertyType.string}]));
    expect(filter).toBeNull();
});

test('Create filter for one known property: accept feature', () => {
    // The collection has only the property "bar"
    let req : unknown = { query: { bar: 'zabb' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'bar', type: PropertyType.string}]));
    let feature : Feature = { properties: { bar: 'zabb' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Create filter for one known property (declared name has upper case characters): accept feature', () => {
    // The collection has only the property "bar"
    let req : unknown = { query: { bar: 'zabb' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'BAR', type: PropertyType.string}]));
    let feature : Feature = { properties: { bar: 'zabb' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Create filter for one known and one unknown property: accept feature', () => {
    // The collection has only the property "bar"
    let req : unknown = { query: { name: 'foo', bar: 'zabb' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'bar', type: PropertyType.string}]));
    let feature : Feature = { properties: { bar: 'zabb' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Create filter for one known and one unknown property: reject feature', () => {
    // The collection has only the property "bar"
    let req : unknown = { query: { name: 'foo', bar: 'zabb' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'bar', type: PropertyType.string}]));
    let feature : Feature = { properties: { bar: 'bleef' }, geometry: null };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test accept (1 parameter)', () => {
    let req : unknown = { query: { name: 'foo' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'name', type: PropertyType.string}]));
    let feature : Feature = { properties: { name: 'foo' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test not accept (1 parameter)', () => {
    let req : unknown = { query: { name: 'foo' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'name', type: PropertyType.string}]));
    let feature : Feature = { properties: { name: 'bar' }, geometry: null };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test accept (2 parameters)', () => {
    let req : unknown = { query: { name: 'foo', yikes: 'bar' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'name', type: PropertyType.string}, {name: 'yikes', type: PropertyType.string}]));
    let feature : Feature = { properties: { name: 'foo', yikes: 'bar' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test not accept (1 parameter matches, 1 does not)', () => {
    let req : unknown = { query: { name: 'foo', yikes: 'bar' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'name', type: PropertyType.string}, {name: 'yikes', type: PropertyType.string}]));
    let feature : Feature = { properties: { name: 'bar', yikes: 'xxx' }, geometry: null };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test serialisation', () => {
    let req : unknown = { query: { name: 'foo' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'name', type: PropertyType.string}]));
    
    expect(filter.query['name']).toBe('foo');
});

test('Test property names are lowercased', () => {
    let req : unknown = { query: { NAME: 'foo' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'name', type: PropertyType.string}]));
    let feature : Feature = { properties: { name: 'foo' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test property names are lowercased in serialised format', () => {
    let req : unknown = { query: { NAME: 'foo' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'name', type: PropertyType.string}]));
    expect(filter.query['name']).toBe('foo');
});


test('Test no property filter for reserved parameter', () => {
    let req : unknown = { query: { LIMIT: 'foo', foo: 'bar' }};
    let filter : Filter = provider.parseFilter(<express.Request>req, mockCollection([{name: 'foo', type: PropertyType.string}]));
    expect(filter.query['foo']).toBe('bar');
});
