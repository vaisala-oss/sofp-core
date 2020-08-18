import {Feature, Filter, Collection} from 'sofp-lib';
import {FilterProvider} from '../filter_provider';
import {reservedParameterNames} from '../constants';

import * as express from 'express';
import * as _ from 'lodash';

class AdditionalParameterFilter implements Filter {
    filterClass : string = 'AdditionalParameterFilter';
    parameters = {
        parameters: null
    };
    query : any;

    accept = function(f : Feature) {
        throw Error('AdditionalParameterFilters must be processed in the backend implementation');
    }

    constructor(parameters) {
        this.query = _.cloneDeep(parameters);
        this.parameters.parameters = parameters;
    }
};

export class AdditionalParameterFilterProvider implements FilterProvider {
    parseFilter(req : express.Request, collection : Collection) : Filter {
        var parameters = {};
        const lowerCaseParameterNames = _.map(collection.additionalQueryParameters, (p) => p.name.toLowerCase() );
        _.each(req.query, (v, k) => {
            k = k.toLowerCase();
            if (reservedParameterNames.indexOf(k) === -1 && lowerCaseParameterNames.indexOf(k) !== -1) {
                parameters[k] = v;
            }
        });

        if (_.size(parameters) > 0) {
            return new AdditionalParameterFilter(parameters);
        }
        return null;
    }
};


