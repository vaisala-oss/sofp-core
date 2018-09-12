import {Feature, Filter} from 'lib/';

export interface FeatureCursor {
    hasNext() : boolean;
    next() : Feature;
    remainingFilter : Filter[];
};

