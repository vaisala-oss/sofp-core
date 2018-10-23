import {BBOXFilterProvider} from './bbox_filter';
import {PropertyFilterProvider} from './property_filter';
import {TimeFilterProvider} from './time_filter';

export const filterProviders = [
    new BBOXFilterProvider(),
    new PropertyFilterProvider(),
    new TimeFilterProvider()
];