import {Feature, Filter, Collection} from 'sofp-lib';
import {FilterProvider} from '../filter_provider';

import * as moment from 'moment';

import * as express from 'express';
import * as _ from 'lodash';

class TimeFilter implements Filter {
    filterClass : string = 'TimeFilter';
    parameters = {
        timeString: null,
        momentStart: null,
        momentEnd: null,
        duration: null,
        timePropertyNames: null
    };
    options : object;
    query : any;

    accept = function(f : Feature) {
        var propertiesAsMoments = _.reduce(f.properties, (memo, v, k) => {
            // If time property names is defined, skip properties that are not in the list
            if (this.parameters.timePropertyNames && this.parameters.timePropertyNames.indexOf(k.toLowerCase()) === -1) {
                return memo;
            }
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

    constructor(timeString, options, timePropertyNames) {
        this.options = options;
        this.query = { 'datetime': timeString };
        this.parameters.timeString = timeString;
        if (_.isArray(timePropertyNames)) {
            this.parameters.timePropertyNames = _.map(timePropertyNames, str => str.toLowerCase());
        }

        if (timeString.indexOf('/') === -1) {
            this.parameters.momentStart = this.parameters.momentEnd = moment.utc(timeString, moment.ISO_8601);
            this.parameters.duration = moment.duration(0);
        } else {
            var parts = timeString.split('/');
            this.parameters.momentStart = moment.utc(parts[0], moment.ISO_8601);

            if (parts[1][0] === 'P') {
                var periodPart = parts[1];
                if (periodPart.indexOf('T') === -1) {
                    periodPart = 'P0M0DT'+periodPart.substring(1);
                }
                this.parameters.duration = moment.duration(periodPart);
                this.parameters.momentEnd = moment.utc(this.parameters.momentStart).add(this.parameters.duration);
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

    parseFilter(req : express.Request, collection : Collection) : Filter {
        if (req.query.datetime) {
            return new TimeFilter(req.query.datetime, this.options, collection.timePropertyNames);
        }
        return null;
    }
};


