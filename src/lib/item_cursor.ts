import {Feature} from './feature';

export interface ItemCursor {
    hasNext() : boolean;
    next() : Feature;
};

