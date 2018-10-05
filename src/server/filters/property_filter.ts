import {Filter} from 'sofp-lib';
import {FilterProvider} from '../filter_provider';

import * as express from 'express';
import * as _ from 'lodash';

export class PropertyFilterProvider implements FilterProvider {
    parseFilter(req : express.Request) : Filter {
        // TODO: this is just a mockup
        if (_.isString(req.query.ParameterName)) {
            return {
                filterClass: 'PropertyFilter',
                parameters: {
                    propertyName: 'ParameterName',
                    propertyValue: req.query.ParameterName
                },
                asQuery: 'ParameterName='+encodeURIComponent(req.query.ParameterName),
                accept: (f) => (f.properties && f.properties.ParameterName === req.query.ParameterName)
            };
        }
        return null;
    }
};


