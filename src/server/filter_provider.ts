import {Filter, Collection} from 'sofp-lib';

import * as express from 'express';

export interface FilterProvider {
    parseFilter(req : express.Request, collection : Collection) : Filter;
}