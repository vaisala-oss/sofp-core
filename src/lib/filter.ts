import {Feature} from './feature';

export interface Filter {
    accept(feature : Feature) : boolean;
};
