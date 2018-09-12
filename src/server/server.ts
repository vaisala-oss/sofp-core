import {Backend, Collection, Filter, Query} from '../lib';
import * as _ from 'lodash';


export class Server {
    backends : Backend[] = [];

    getCollections() : Collection[] {
        let ret = [];
        _.each(this.backends, function(b) {
            ret = _.concat(ret, b.collections);
        });
        return ret;
    }
};

