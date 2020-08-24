import { AuthorizerProvider, Authorizer, Collection, Feature } from 'sofp-lib';

import * as express from 'express';

export class MockAuthorizer extends Authorizer {
    foo : String;

    constructor(foo : String) {
        super();
        this.foo = foo;
    }

    accept(feature : Feature) : boolean {
        return feature.properties['unitOfMeasureName'] === this.foo;
    }
}

export const authorizerProvider : AuthorizerProvider = {
    createAuthorizer(req : express.Request, collection : Collection) : Promise<Authorizer> {
        return new Promise((resolve, reject) => {
            var foo : String = req.headers['foofoo'];
            console.log('foo, foofoo: '+foo);
            resolve(new MockAuthorizer(foo));
        });
    }
}