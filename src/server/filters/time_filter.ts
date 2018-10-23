import {Feature, Filter} from 'sofp-lib';
import {FilterProvider} from '../filter_provider';

import * as moment from 'moment';

import * as express from 'express';
import * as _ from 'lodash';

class TimeFilter implements Filter {
    filterClass : String = 'TimeFilter';
    parameters = {
        timeString: null,
        momentStart: null,
        momentEnd: null,
        duration: null
    };
    options : object;
    asQuery : String;

    accept = function(f : Feature) {
        var propertiesAsMoments = _.reduce(f.properties, (k, memo) => {
            var tmp = moment.utc(f.properties[k]);
            if (tmp.isValid()) {
                memo[k] = tmp;
            }
            return memo;
        }, {});

        if (_.size(propertiesAsMoments) === 0) {
            return this.options.acceptFeaturesWithNoTimeField;
        }

        if (_.size(propertiesAsMoments) > 1) {
            throw new Error('Multiple time fields in feature, unable to filter!');
        }

        console.log(propertiesAsMoments);

        return false;
    }

    constructor(timeString, options) {
        this.options = options;
        this.asQuery = 'time='+encodeURIComponent(timeString);
        this.parameters.timeString = timeString;

        if (timeString.indexOf('/') === -1) {
            this.parameters.momentStart = this.parameters.momentEnd = moment.utc(timeString);
            this.parameters.duration = moment.duration(0);
        } else {
            var parts = timeString.split('/');
            this.parameters.momentStart = moment.utc(parts[0]);

            if (parts[1][0] === 'P') {
                this.parameters.duration = moment.duration(parts[1]);
                this.parameters.momentEnd = moment.utc(moment(this.parameters.momentStart)).add(this.parameters.duration);
            } else {
                this.parameters.momentEnd = moment.utc(parts[1]);
                this.parameters.duration = moment.duration(this.parameters.momentEnd.diff(this.parameters.momentStart));
            }
        }

        if (!this.parameters.momentStart.isValid() ||
            !this.parameters.momentEnd.isValid() ||
            !this.parameters.duration.isValid()) {
            throw new Error('Illegal timeString "'+timeString+'"');
        }

    }
};

const reservedParameterNames = [ 'next', 'prev', 'limit', 'bbox', 'bbox-crs', 'time' ];

export class TimeFilterProvider implements FilterProvider {
    options = {
        acceptFeaturesWithNoTimeField: null
    };

    constructor(acceptFeaturesWithNoTimeField : boolean = false) {
        this.options.acceptFeaturesWithNoTimeField = acceptFeaturesWithNoTimeField;
    }

    parseFilter(req : express.Request) : Filter {
        if (req.query.time) {
            return new TimeFilter(req.query.time, this.options);
        }
        return null;
    }
};


