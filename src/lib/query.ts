import {Filter} from 'lib/';

export interface Query {
    featureName : string;
    filters : Filter[];
};
