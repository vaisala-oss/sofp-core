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
        var propertiesAsMoments = _.reduce(f.properties, (memo, v, k) => {
            var tmp = moment.utc(f.properties[k], moment.ISO_8601);
            if (tmp.isValid()) {
                memo[k] = tmp;
            }
            return memo;
        }, {});

        var timeValues : moment.Moment[] = _.values(propertiesAsMoments);

        if (timeValues.length === 0) {
            return this.options.acceptFeaturesWithNoTimeField;
        }

        // WFS_FES 3.0.0-draft.1, requirement 23 states:
        // "If a feature has multiple temporal properties, it is the decision of the server whether only 
        //  a single temporal property is used to determine the extent or all relevant temporal properties."
        //  => We choose to reject the feature if any of the time values are out of the filter span
        for (var i = 0; i < timeValues.length; i++) {
            if (timeValues[i].isBefore(this.parameters.momentStart)) {
                return false;
            }

            if (timeValues[i].isAfter(this.parameters.momentEnd)) {
                return false;
            }
        }

        return true;
    }

    constructor(timeString, options) {
        this.options = options;
        this.asQuery = 'time='+encodeURIComponent(timeString);
        this.parameters.timeString = timeString;

        if (timeString.indexOf('/') === -1) {
            this.parameters.momentStart = this.parameters.momentEnd = moment.utc(timeString, moment.ISO_8601);
            this.parameters.duration = moment.duration(0);
        } else {
            var parts = timeString.split('/');
            this.parameters.momentStart = moment.utc(parts[0], moment.ISO_8601);

            if (parts[1][0] === 'P') {
                this.parameters.duration = moment.duration(parts[1]);
                this.parameters.momentEnd = moment.utc(moment(this.parameters.momentStart)).add(this.parameters.duration);
            } else {
                this.parameters.momentEnd = moment.utc(parts[1], moment.ISO_8601);
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


