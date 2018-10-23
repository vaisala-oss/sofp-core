import {PropertyFilterProvider} from './property_filter';

const provider = new PropertyFilterProvider();

test('Test accept (1 parameter)', () => {
    let filter = provider.parseFilter({ query: { ParameterName: 'foo' }});
    let feature = { properties: { ParameterName: 'foo' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test not accept (1 parameter)', () => {
    let filter = provider.parseFilter({ query: { ParameterName: 'foo' }});
    let feature = { properties: { ParameterName: 'bar' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test accept (2 parameters)', () => {
    let filter = provider.parseFilter({ query: { ParameterName: 'foo', Yikes: 'bar' }});
    let feature = { properties: { ParameterName: 'foo', Yikes: 'bar' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test not accept (1 parameter matches, 1 does not)', () => {
    let filter = provider.parseFilter({ query: { ParameterName: 'foo', Yikes: 'bar' }});
    let feature = { properties: { ParameterName: 'bar', Yikes: 'xxx' } };
    expect(filter.accept(feature)).toBeFalsy();
});


test('Test serialisation', () => {
    let filter = provider.parseFilter({ query: { ParameterName: 'foo' }});
    
    expect(filter.asQuery).toBe('ParameterName=foo');
});
