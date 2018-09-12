import {Feature} from 'lib/';

export interface FeatureCursor {
    hasNext() : boolean;
    next() : Feature;
};

