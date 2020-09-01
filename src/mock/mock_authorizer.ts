import { AuthorizerProvider, Authorizer, Collection, Feature } from 'sofp-lib';

import * as express from 'express';

export class MockAuthorizer extends Authorizer {
    filterClass : string = 'MockAuthorizer';
    unitOfMeasureName : string;

    constructor(unitOfMeasureName : string) {
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
            var unitOfMeasureName : string | string[] = req.headers['authuom'];
            if (Array.isArray(unitOfMeasureName)) {
                unitOfMeasureName = unitOfMeasureName[0];
            }
            resolve(new MockAuthorizer(unitOfMeasureName));
        });
    }
}