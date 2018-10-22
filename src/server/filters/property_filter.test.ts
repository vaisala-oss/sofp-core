import {PropertyFilterProvider} from './property_filter';

const provider = new PropertyFilterProvider();

test('Test accept', () => {
    let filter = provider.parseFilter({ query: { ParameterName: 'foo' }});
    let feature = { properties: { ParameterName: 'foo' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test not accept', () => {
    let filter = provider.parseFilter({ query: { ParameterName: 'foo' }});
    let feature = { properties: { ParameterName: 'bar' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test serialisation', () => {
    let filter = provider.parseFilter({ query: { ParameterName: 'foo' }});
    
    expect(filter.asQuery).toBe('ParameterName=foo');
});
