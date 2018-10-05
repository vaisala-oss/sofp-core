import {Feature, Filter} from 'sofp-lib';
import {FilterProvider} from '../filter_provider';

import * as _ from 'lodash';
import * as express from 'express';

import * as turf from '@turf/turf';

const numberRegex = new RegExp(/^(\-|\+)?([0-9]+|[0-9]*\.[0-9]+|Infinity)$/);
function filterNumber(value : string) {
  if (numberRegex.test(value))
    return Number(value);
  return NaN;
}

class BBOXFilter implements Filter {
    filterClass : string = 'BBOXFilter';
    asQuery     : string = null;
    parameters = {
        coords: null,
        turfPolygon: null
    };

    accept(feature : Feature) : boolean {
        var turfFeature = turf.feature(feature.geometry);
        return !turf.booleanDisjoint(turfFeature, this.parameters.turfPolygon);
    }

    constructor(param : string) {
        this.parameters.coords = _.map(param.split(','), filterNumber);
        if (this.parameters.coords.length !== 4 && this.parameters.coords.length !== 6) {
            throw new Error('Illegal bounding box '+param)
        }
        _.each(this.parameters.coords, c => { if (!_.isNumber(c) || !_.isFinite(c)) {
            throw new Error('Illegal entry in bounding box '+param);
        }});

        this.parameters.turfPolygon = turf.bboxPolygon(this.parameters.coords);

        this.asQuery = 'bbox='+encodeURIComponent(param);
    }

}

export class BBOXFilterProvider implements FilterProvider {
    parseFilter(req : express.Request) : Filter {
        if (_.isString(req.query.bbox)) {
            return new BBOXFilter(req.query.bbox);
        }
        return null;
    }
};


