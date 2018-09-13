import {Feature} from 'lib/';

export interface Filter {
    filterClass : string;
    accept(feature : Feature) : boolean;
};
