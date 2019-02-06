import {TimeFilterProvider} from './time_filter';

const provider = new TimeFilterProvider();

test('Test parse just date', () => {
    let filter = provider.parseFilter({ query: { time: '2018-02-12T23:20:50Z' }}, {});
    
    expect(filter.parameters.momentStart.year()).toBe(2018);
    expect(filter.parameters.momentStart.month()).toBe(1); // January = 0
    expect(filter.parameters.momentStart.date()).toBe(12);
    expect(filter.parameters.momentStart.hour()).toBe(23);
    expect(filter.parameters.momentStart.minute()).toBe(20);
    expect(filter.parameters.momentStart.second()).toBe(50);

    expect(filter.parameters.duration.hours()).toBe(0);
    expect(filter.parameters.duration.minutes()).toBe(0);
    expect(filter.parameters.duration.seconds()).toBe(0);
    
    expect(filter.parameters.momentEnd.diff(filter.parameters.momentStart)).toBe(0);
    expect(filter.parameters.duration.asMilliseconds()).toBe(0);
});


test('Test parse period between two dates', () => {
    let filter = provider.parseFilter({ query: { time: '2018-03-12T00:00:00Z/2018-03-18T04:01:12Z' }}, {});
    
    expect(filter.parameters.momentStart.year()).toBe(2018);
    expect(filter.parameters.momentStart.month()).toBe(2); // January = 0
    expect(filter.parameters.momentStart.date()).toBe(12);
    expect(filter.parameters.momentStart.hour()).toBe(0);
    expect(filter.parameters.momentStart.minute()).toBe(0);
    expect(filter.parameters.momentStart.second()).toBe(0);

    expect(filter.parameters.momentEnd.year()).toBe(2018);
    expect(filter.parameters.momentEnd.month()).toBe(2); // January = 0
    expect(filter.parameters.momentEnd.date()).toBe(18);
    expect(filter.parameters.momentEnd.hour()).toBe(4);
    expect(filter.parameters.momentEnd.minute()).toBe(1);
    expect(filter.parameters.momentEnd.second()).toBe(12);


    expect(filter.parameters.duration.days()).toBe(6);
    expect(filter.parameters.duration.hours()).toBe(4);
    expect(filter.parameters.duration.minutes()).toBe(1);
    expect(filter.parameters.duration.seconds()).toBe(12);
    
    expect(filter.parameters.momentEnd.diff(filter.parameters.momentStart)).toBe(filter.parameters.duration.asMilliseconds());
});




test('Test parse date + duration', () => {
    let filter = provider.parseFilter({ query: { time: '2018-02-12T00:00:00Z/P0M6DT12H31M12S' }}, {});
    
    expect(filter.parameters.momentStart.year()).toBe(2018);
    expect(filter.parameters.momentStart.month()).toBe(1); // January = 0
    expect(filter.parameters.momentStart.date()).toBe(12);
    expect(filter.parameters.momentStart.hour()).toBe(0);
    expect(filter.parameters.momentStart.minute()).toBe(0);
    expect(filter.parameters.momentStart.second()).toBe(0);

    expect(filter.parameters.momentEnd.year()).toBe(2018);
    expect(filter.parameters.momentEnd.month()).toBe(1); // January = 0
    expect(filter.parameters.momentEnd.date()).toBe(18);
    expect(filter.parameters.momentEnd.hour()).toBe(12);
    expect(filter.parameters.momentEnd.minute()).toBe(31);
    expect(filter.parameters.momentEnd.second()).toBe(12);


    expect(filter.parameters.duration.months()).toBe(0);
    expect(filter.parameters.duration.days()).toBe(6);
    expect(filter.parameters.duration.hours()).toBe(12);
    expect(filter.parameters.duration.minutes()).toBe(31);
    expect(filter.parameters.duration.seconds()).toBe(12);
    

    expect(filter.parameters.momentEnd.diff(filter.parameters.momentStart)).toBe(filter.parameters.duration.asMilliseconds());
});

test('Test parse date + duration with no month/day part', () => {
    let filter = provider.parseFilter({ query: { time: '2018-02-12T00:00:00Z/P12H31M12S' }}, {});
    
    expect(filter.parameters.momentStart.year()).toBe(2018);
    expect(filter.parameters.momentStart.month()).toBe(1); // January = 0
    expect(filter.parameters.momentStart.date()).toBe(12);
    expect(filter.parameters.momentStart.hour()).toBe(0);
    expect(filter.parameters.momentStart.minute()).toBe(0);
    expect(filter.parameters.momentStart.second()).toBe(0);

    expect(filter.parameters.momentEnd.year()).toBe(2018);
    expect(filter.parameters.momentEnd.month()).toBe(1); // January = 0
    expect(filter.parameters.momentEnd.date()).toBe(12);
    expect(filter.parameters.momentEnd.hour()).toBe(12);
    expect(filter.parameters.momentEnd.minute()).toBe(31);
    expect(filter.parameters.momentEnd.second()).toBe(12);


    expect(filter.parameters.duration.months()).toBe(0);
    expect(filter.parameters.duration.days()).toBe(0);
    expect(filter.parameters.duration.hours()).toBe(12);
    expect(filter.parameters.duration.minutes()).toBe(31);
    expect(filter.parameters.duration.seconds()).toBe(12);
    

    expect(filter.parameters.momentEnd.diff(filter.parameters.momentStart)).toBe(filter.parameters.duration.asMilliseconds());
});


test('Test duration with month', () => {
    let filter = provider.parseFilter({ query: { time: '2018-02-12T00:00:00Z/P7M6DT12H31M12S' }}, {});
    
    expect(filter.parameters.momentStart.year()).toBe(2018);
    expect(filter.parameters.momentStart.month()).toBe(1); // January = 0
    expect(filter.parameters.momentStart.date()).toBe(12);
    expect(filter.parameters.momentStart.hour()).toBe(0);
    expect(filter.parameters.momentStart.minute()).toBe(0);
    expect(filter.parameters.momentStart.second()).toBe(0);

    expect(filter.parameters.momentEnd.year()).toBe(2018);
    expect(filter.parameters.momentEnd.month()).toBe(8); // January = 0
    expect(filter.parameters.momentEnd.date()).toBe(18);
    expect(filter.parameters.momentEnd.hour()).toBe(12);
    expect(filter.parameters.momentEnd.minute()).toBe(31);
    expect(filter.parameters.momentEnd.second()).toBe(12);

    expect(filter.parameters.duration.months()).toBe(7);
    expect(filter.parameters.duration.days()).toBe(6);
    expect(filter.parameters.duration.hours()).toBe(12);
    expect(filter.parameters.duration.minutes()).toBe(31);
    expect(filter.parameters.duration.seconds()).toBe(12);
});


test('Test filter (not accept 1s before exact start date)', () => {
    let filter = provider.parseFilter({ query: { time: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }}, {});

    let feature = { properties: { timeField: '2017-12-31T23:59:59Z' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test filter (accept exact start date)', () => {
    let filter = provider.parseFilter({ query: { time: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }}, {});

    let feature = { properties: { timeField: '2018-01-01T00:00:00Z' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test filter (accept date between start and end)', () => {
    let filter = provider.parseFilter({ query: { time: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }}, {});

    let feature = { properties: { timeField: '2018-01-01T06:10:42Z' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test filter (accept date exactly at end)', () => {
    let filter = provider.parseFilter({ query: { time: '2018-01-01T00:00:00Z/P0M1DT7H8M9S' }}, {});

    let feature = { properties: { timeField: '2018-01-02T07:08:09Z' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test filter (not accept 1s after exact end date)', () => {
    let filter = provider.parseFilter({ query: { time: '2018-01-01T00:00:00Z/P0M1DT7H8M9S' }}, {});

    let feature = { properties: { timeField: '2018-01-02T07:08:10Z' } };
    expect(filter.accept(feature)).toBeFalsy();
});


test('Test filter, no time features, provider configured to accept', () => {
    let provider2 = new TimeFilterProvider(true);
    let filter = provider2.parseFilter({ query: { time: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }}, {});

    let feature = { properties: { x: 'y' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test filter, no time features, provider configured to not accept', () => {
    let provider2 = new TimeFilterProvider(false);
    let filter = provider2.parseFilter({ query: { time: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }}, {});

    let feature = { properties: { x: 'y' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test filter with multiple timefields, all within filter bounds => accept' , () => {
    let filter = provider.parseFilter({ query: { time: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }}, {});

    let feature = { properties: { timeField1: '2018-01-01T06:10:42Z', timeField2: '2018-01-01T09:11:22Z' } };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test filter with multiple timefields, one outside filter bounds => reject' , () => {
    let filter = provider.parseFilter({ query: { time: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }}, {});

    let feature = { properties: { timeField1: '2018-01-01T06:10:42Z', timeField2: '2017-01-01T09:11:22Z' } };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test filter with multiple timefields, one outside filter bounds but only one is set as a timefield => accept' , () => {
    let filter = provider.parseFilter({ query: { time: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }}, { timePropertyNames: ['within'] });

    let feature = { properties: { within: '2018-01-01T06:10:42Z', outside: '2017-01-01T09:11:22Z' } };
    expect(filter.accept(feature)).toBeTruthy();
});
