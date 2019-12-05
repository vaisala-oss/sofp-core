import {Backend, Collection, Link, Query, FeatureStream, Feature} from 'sofp-lib';

let MockBackend = new Backend('MockBackend');

class FooCollection implements Collection {
    id : string = 'foo';
    title : string = 'The Great Foo';
    description : string = 'This is a collection called Foo containing multiple Foos that are bar';
    links : Link[] = [{
        href:     'https://www.spatineo.com',
        rel:      'producer',
        type:     'text/html',
        hreflang: 'en',
        title:    'Spatineo Website'
    }];

    executeQuery(query : Query) : FeatureStream {
        var ret = new FeatureStream();
        ret.remainingFilter = query.filters;
        ret.push(null);
        return ret;
    }
};

MockBackend.collections.push(new FooCollection());

export {MockBackend};