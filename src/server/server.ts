import {Backend, AuthorizerProvider, Collection, Filter, Query} from 'sofp-lib';
import * as _ from 'lodash';

/**
 * The Server contains links to backends and functions to access data (run queries)
 **/
export class Server {
    backends : Backend[];
    authorizerProvider : AuthorizerProvider;

    constructor(params? : { backends? : Backend[], authorizerProvider? : AuthorizerProvider }) {
        params = params || {};
        this.backends = params.backends || [];
        this.authorizerProvider = params.authorizerProvider;
    }

    getCollections() : Collection[] {
        let ret = [];
        _.each(this.backends, function(b) {
            ret = _.concat(ret, b.collections);
        });
        return ret;
    };

    getCollection(id : string) : Collection {
        let i : number, o : number;
        let b : Backend;
        let c : Collection;

        for (i = 0; i < this.backends.length; i++) {
            b = this.backends[i];
            for (o = 0; o < b.collections.length; o++) {
                c = b.collections[o];
                if (c.id === id) {
                    return c;
                }
            }
        }
    };
};

