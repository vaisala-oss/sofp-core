import {Feature, Filter, Collection} from 'sofp-lib';
import {FilterProvider} from '../filter_provider';

import * as express from 'express';
import * as _ from 'lodash';

class AdditionalParameterFilter implements Filter {
    filterClass : string = 'AdditionalParameterFilter';
    parameters = {
        parameters: null
    };
    asQuery : string;

    accept = function(f : Feature) {
        throw Error('AdditionalParameterFilters must be processed in the backend implementation');
    }

    constructor(parameters) {
        this.asQuery = _.map(parameters, (v, k) => encodeURIComponent(k)+'='+encodeURIComponent(v) ).join('&');
        this.parameters.parameters = parameters;
    }
};

const reservedParameterNames = [ 'nexttoken', 'prev', 'limit', 'bbox', 'bbox-crs', 'time' ];

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


