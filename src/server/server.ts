import {Backend, Collection, FeatureCursor, Filter, Query} from '../lib';
import * as _ from 'lodash';


export class Server {
    backends : Backend[] = [];

    getCollections() : Collection[] {
        let ret = [];
        _.each(this.backends, function(b) {
            ret = _.concat(ret, b.collections);
        });
        return ret;
    };

    getCollection(name : string) : Collection {
        let i : number, o : number;
        let b : Backend;
        let c : Collection;

        for (i = 0; i < this.backends.length; i++) {
            b = this.backends[i];
            for (o = 0; o < b.collections.length; o++) {
                c = b.collections[o];
                if (c.name === name) {
                    return c;
                }
            }
        }
    };

    executeQuery(query : Query) : FeatureCursor {
        let collection = this.getCollection(query.featureName);

        return collection.executeQuery(query);
    };
};

