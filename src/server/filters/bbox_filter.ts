import {Filter} from 'sofp-lib';
import {FilterProvider} from '../filter_provider';

import * as express from 'express';

export class BBOXFilterProvider implements FilterProvider {
    parseFilter(req : express.Request) : Filter {
        // TODO:
        return null;
    }
};


