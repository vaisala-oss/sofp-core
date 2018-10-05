import {BBOXFilterProvider} from './bbox_filter';
import {PropertyFilterProvider} from './property_filter';

export const filterProviders = [
    new BBOXFilterProvider(),
    new PropertyFilterProvider()
];