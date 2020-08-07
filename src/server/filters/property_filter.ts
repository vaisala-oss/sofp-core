import {Feature, Filter, Collection} from 'sofp-lib';
import {FilterProvider} from '../filter_provider';
import {reservedParameterNames} from './';

import * as express from 'express';
import * as _ from 'lodash';

class PropertyFilter implements Filter {
    filterClass : string = 'PropertyFilter';
    parameters = {
        properties: null
    };
    query : any;

    accept = function(f : Feature) {
        if (!f.properties && _.size(this.parameters.properties) > 0) {
            return false;
        }
        // Note that the type-agnostic comparator (!=) is used here for a reason
        if (_.find(this.parameters.properties, (v, k) => {
            var featurePropertyKey = _.find(_.keys(f.properties), key => key.toLowerCase() === k);
            return !!featurePropertyKey && f.properties[featurePropertyKey] != v;
        })) {
            return false;
        }
        return true;
    }

    constructor(properties) {
        this.query = _.cloneDeep(properties);
        this.parameters.properties = properties;
    }
};



export class PropertyFilterProvider implements FilterProvider {
    parseFilter(req : express.Request, collection : Collection) : Filter {
        var properties = {};
        const lowerCasePropertyNames = _.map(collection.properties, (p) => p.name.toLowerCase() );
        _.each(req.query, (v, k) => {
            k = k.toLowerCase();
            if (reservedParameterNames.indexOf(k) === -1 && lowerCasePropertyNames.indexOf(k) !== -1) {
                properties[k] = v;
            }
        });

        if (_.size(properties) > 0) {
            return new PropertyFilter(properties);
        }
        return null;
    }
};


