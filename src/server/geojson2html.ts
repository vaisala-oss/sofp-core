import { Collection } from 'sofp-lib';

import { Response } from 'express';

import { json2html } from './json2html';

import * as _ from 'lodash';

export class geojson2html {
    private response : Response;
    private collection : Collection;

    private jsonString : String[];

    constructor(res : Response, collection : Collection) {
        this.response = res;
        this.collection = collection;
        this.jsonString = [];
    }

    writeHead(statusCode : Number, headers : any) {
        const modifiedHeaders = _.filter(headers, (k, v) => k.toLowerCase() !== 'content-type');
        modifiedHeaders['Content-Type'] = 'text/html';
        this.response.writeHead(statusCode, modifiedHeaders);
    }

    write(data : string) {
        this.jsonString.push(data);
    }

    end() {
        const data = JSON.parse(this.jsonString.join(''));
        
        const html = json2html(data, {
            title: 'Data' + (this.collection.name ? ' from collection "'+this.collection.name+'"' : '')
        });
        
        this.response.end(html);
    }
}