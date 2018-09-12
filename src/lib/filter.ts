import {Feature} from 'lib/';

export interface Filter {
    accept(feature : Feature) : boolean;
};
