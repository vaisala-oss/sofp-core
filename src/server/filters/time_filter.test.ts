import {TimeFilterProvider} from './time_filter';

const provider = new TimeFilterProvider();

test('Test parse just date', () => {
    let filter = provider.parseFilter({ query: { time: '2018-02-12T23:20:50Z' }});
    
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
    let filter = provider.parseFilter({ query: { time: '2018-03-12T00:00:00Z/2018-03-18T04:01:12Z' }});
    
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
    let filter = provider.parseFilter({ query: { time: '2018-02-12T00:00:00Z/P0M6DT12H31M12S' }});
    
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


test('Test duration with month', () => {
    let filter = provider.parseFilter({ query: { time: '2018-02-12T00:00:00Z/P7M6DT12H31M12S' }});
    
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