import {Feature, Filter, Collection} from 'sofp-lib';
import {FilterProvider} from '../filter_provider';

import * as _ from 'lodash';
import * as express from 'express';

import * as turf from '@turf/turf';

const numberRegex = new RegExp(/^(\-|\+)?([0-9]+|[0-9]*\.[0-9]+|Infinity)$/);
function filterNumber(value : string) {
    return numberRegex.test(value) ? Number(value) : NaN;
}
/**
 * Rudimentary 2D bbox filter implementation that only works when bbox and feature are in the same CRS
 **/
class BBOXFilter implements Filter {
    filterClass : string = 'BBOXFilter';
    query       : any    = {};
    parameters = {
        coords: null,
        turfPolygon: null,
        bboxCrs: null
    };

    accept(feature : Feature) : boolean {
        var turfFeature = turf.feature(feature.geometry);
        return !turf.booleanDisjoint(turfFeature, this.parameters.turfPolygon);
    }

    constructor(param : string, crs : string) {
        this.query['bbox'] = param;
        if (crs !== null && crs !== undefined) {
            this.query['bbox-crs'] = crs;
        }

        this.parameters.coords = _.map(param.split(','), filterNumber);
        if (this.parameters.coords.length !== 4 && this.parameters.coords.length !== 6) {
            throw new Error('Illegal bounding box '+param)
        }
        _.each(this.parameters.coords, c => { if (!_.isNumber(c) || !_.isFinite(c)) {
            throw new Error('Illegal entry in bounding box '+param);
        }});

        this.parameters.bboxCrs = crs || 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';

        this.parameters.turfPolygon = turf.bboxPolygon(this.parameters.coords);
    }

}

export class BBOXFilterProvider implements FilterProvider {
    parseFilter(req : express.Request, collection : Collection) : Filter {
        if (_.isString(req.query['bbox'])) {
            return new BBOXFilter(req.query['bbox'], req.query['bbox-crs']);
        }
        return null;
    }
};


