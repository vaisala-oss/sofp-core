import { AuthorizerProvider, Authorizer, Collection, Feature } from 'sofp-lib';

import * as express from 'express';

export class MockAuthorizer extends Authorizer {
    filterClass : String = 'MockAuthorizer';
    unitOfMeasureName : String;

    constructor(unitOfMeasureName : String) {
        super();
        this.unitOfMeasureName = unitOfMeasureName;
    }

    accept(feature : Feature) : boolean {
        return feature.properties['unitOfMeasureName'] === this.unitOfMeasureName;
    }
}

export const authorizerProvider : AuthorizerProvider = {
    createAuthorizer(req : express.Request, collection : Collection) : Promise<Authorizer> {
        return new Promise((resolve, reject) => {
            var unitOfMeasureName : String = req.headers['authuom'];
            resolve(new MockAuthorizer(unitOfMeasureName));
        });
    }
}