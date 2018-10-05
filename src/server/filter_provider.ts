import {Filter} from 'sofp-lib';

import * as express from 'express';

export interface FilterProvider {
    parseFilter(req : express.Request) : Filter;
}