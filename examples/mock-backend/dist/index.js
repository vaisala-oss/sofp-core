exports.MyBackend = {
    name: 'ExampleBackend',
    collections: [{
        name: 'foo',
        description: 'This is a collection called Foo containing multiple Foos that are bar',
        links: [{
            href:     'https://www.spatineo.com',
            rel:      'producer',
            type:     'text/html',
            hreflang: 'en',
            title:    'Spatineo Website'
        }],
        executeQuery: function(query) {
            return {
                hasNext : () => false,
                next : (feature) => null,
                remainingFilter: []
            };
        }
    }],
    links: [
    ]
};
