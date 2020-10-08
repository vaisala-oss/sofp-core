import {TimeFilterProvider} from './time_filter';
import { Collection, FeatureStream, Query, PropertyType, Property, Feature, Filter } from 'sofp-lib';

import * as express from 'express';

function mockCollection(timePropertyNames : string[] | null) : Collection {
    return {
        id: 'mock',
        links: [],
        properties: [],
        timePropertyNames: timePropertyNames,
        executeQuery: function(query : Query) : FeatureStream { throw new Error('fail'); },
        getFeatureById: function(id : string) : Promise<Feature> {  throw new Error('fail'); }
    };
}

const provider = new TimeFilterProvider();

test('Test parse just date', () => {
    let req : unknown = { query: { datetime: '2018-02-12T23:20:50Z' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));
    
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
    let req : unknown = { query: { datetime: '2018-03-12T00:00:00Z/2018-03-18T04:01:12Z' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));
    
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
    let req : unknown = { query: { datetime: '2018-02-12T00:00:00Z/P0M6DT12H31M12S' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));
    
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
    let req : unknown = { query: { datetime: '2018-02-12T00:00:00Z/P12H31M12S' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));
    
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
    let req : unknown = { query: { datetime: '2018-02-12T00:00:00Z/P7M6DT12H31M12S' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));
    
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

test('One hour duration', () => {
    let req : unknown = { query: { datetime: '2019-04-11T00:00:00Z/PT1H' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));
    
    expect(filter.parameters.momentStart.year()).toBe(2019);
    expect(filter.parameters.momentStart.month()).toBe(3); // January = 0
    expect(filter.parameters.momentStart.date()).toBe(11);
    expect(filter.parameters.momentStart.hour()).toBe(0);
    expect(filter.parameters.momentStart.minute()).toBe(0);
    expect(filter.parameters.momentStart.second()).toBe(0);

    expect(filter.parameters.momentEnd.year()).toBe(2019);
    expect(filter.parameters.momentEnd.month()).toBe(3); // January = 0
    expect(filter.parameters.momentEnd.date()).toBe(11);
    expect(filter.parameters.momentEnd.hour()).toBe(1);
    expect(filter.parameters.momentEnd.minute()).toBe(0);
    expect(filter.parameters.momentEnd.second()).toBe(0);

    expect(filter.parameters.duration.months()).toBe(0);
    expect(filter.parameters.duration.days()).toBe(0);
    expect(filter.parameters.duration.hours()).toBe(1);
    expect(filter.parameters.duration.minutes()).toBe(0);
    expect(filter.parameters.duration.seconds()).toBe(0);
});



test('Test filter (not accept 1s before exact start date)', () => {
    let req : unknown = { query: { datetime: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));

    let feature : Feature = { properties: { timeField: '2017-12-31T23:59:59Z' }, geometry: null };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test filter (accept exact start date)', () => {
    let req : unknown = { query: { datetime: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));

    let feature : Feature = { properties: { timeField: '2018-01-01T00:00:00Z' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test filter (accept date between start and end)', () => {
    let req : unknown = { query: { datetime: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));

    let feature : Feature = { properties: { timeField: '2018-01-01T06:10:42Z' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test filter (accept date exactly at end)', () => {
    let req : unknown = { query: { datetime: '2018-01-01T00:00:00Z/P0M1DT7H8M9S' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));

    let feature : Feature = { properties: { timeField: '2018-01-02T07:08:09Z' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test filter (not accept 1s after exact end date)', () => {
    let req : unknown = { query: { datetime: '2018-01-01T00:00:00Z/P0M1DT7H8M9S' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));

    let feature : Feature = { properties: { timeField: '2018-01-02T07:08:10Z' }, geometry: null };
    expect(filter.accept(feature)).toBeFalsy();
});


test('Test filter, no time features, provider configured to accept', () => {
    let provider2 = new TimeFilterProvider(true);
    let req : unknown = { query: { datetime: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }};
    let filter = provider2.parseFilter(<express.Request>req, mockCollection(null));

    let feature : Feature = { properties: { x: 'y' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test filter, no time features, provider configured to not accept', () => {
    let provider2 = new TimeFilterProvider(false);
    let req : unknown = { query: { datetime: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }};
    let filter = provider2.parseFilter(<express.Request>req, mockCollection(null));

    let feature : Feature = { properties: { x: 'y' }, geometry: null };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test filter with multiple timefields, all within filter bounds => accept' , () => {
    let req : unknown = { query: { datetime: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));

    let feature = { properties: { timeField1: '2018-01-01T06:10:42Z', timeField2: '2018-01-01T09:11:22Z' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});

test('Test filter with multiple timefields, one outside filter bounds => reject' , () => {
    let req : unknown = { query: { datetime: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(null));

    let feature = { properties: { timeField1: '2018-01-01T06:10:42Z', timeField2: '2017-01-01T09:11:22Z' }, geometry: null };
    expect(filter.accept(feature)).toBeFalsy();
});

test('Test filter with multiple timefields, one outside filter bounds but only one is set as a timefield => accept' , () => {
    let req : unknown = { query: { datetime: '2018-01-01T00:00:00Z/P0M1DT0H0M0S' }};
    let filter = provider.parseFilter(<express.Request>req, mockCollection(['within']));

    let feature = { properties: { within: '2018-01-01T06:10:42Z', outside: '2017-01-01T09:11:22Z' }, geometry: null };
    expect(filter.accept(feature)).toBeTruthy();
});
