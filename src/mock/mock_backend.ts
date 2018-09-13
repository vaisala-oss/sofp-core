import {Backend, Collection, Link, Query, FeatureCursor, Feature} from '../lib/';

let MockBackend = new Backend('MockBackend');

class FooCollection implements Collection {
    name : string = 'FOO';
    title : string = 'Collection of Foos';
    description : string = 'This is a collection called Foo containing multiple Foos that are bar';
    links : Link[] = [{
        href:     'https://www.spatineo.com',
        rel:      'producer',
        type:     'text/html',
        hreflang: 'en',
        title:    'Spatineo Website'
    }];
    extent : string = '???';

    executeQuery(query : Query) : FeatureCursor {
        return new(class FooFeatureCursor implements FeatureCursor {
            hasNext() : boolean { return false; }
            next() : Feature { return null; }
            remainingFilter = []
        })();
    }
};

MockBackend.collections.push(new FooCollection());

export {MockBackend};