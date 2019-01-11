import {Feature, Filter, Collection} from 'sofp-lib';
import {FilterProvider} from '../filter_provider';

import * as express from 'express';
import * as _ from 'lodash';

class PropertyFilter implements Filter {
    filterClass : String = 'PropertyFilter';
    parameters = {
        properties: null
    };
    asQuery : String;

    accept = function(f : Feature) {
        if (!f.properties && _.size(this.parameters.properties) > 0) {
            return false;
        }
        // Note that the type-agnostic comparator (!=) is used here for a reason
        if (_.find(this.parameters.properties, (v, k) => f.properties[k] != v)) {
            return false;
        }
        return true;
    }

    constructor(properties) {
        this.asQuery = _.map(properties, (v, k) => encodeURIComponent(k)+'='+encodeURIComponent(v) ).join('&');
        this.parameters.properties = properties;
    }
};

const reservedParameterNames = [ 'nexttoken', 'prev', 'limit', 'bbox', 'bbox-crs', 'time' ];

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


