import { Collection } from 'sofp-lib';

import { Response } from 'express';

import { json2html } from './json2html';

import * as _ from 'lodash';

export class geojson2html {
    private statusCode : Number;
    private response : Response;
    private collection : Collection;

    private jsonString : String[];

    constructor(res : Response, collection : Collection) {
        this.response = res;
        this.collection = collection;
        this.jsonString = [];
    }

    writeHead(statusCode : Number, headers : any) {
        this.statusCode = statusCode;
        const modifiedHeaders = _.pickBy(headers, (v, k) => k.toLowerCase() !== 'content-type' );
        modifiedHeaders['Content-Type'] = 'text/html; charset=utf-8';

        this.response.writeHead(statusCode, modifiedHeaders);
    }

    write(data : string) {
        this.jsonString.push(data);
    }

    end() {
        if (this.statusCode >= 500 && this.statusCode <= 599) {
            this.response.write(this.jsonString.join(''));
            this.response.end();
            return;
        }
        const data = JSON.parse(this.jsonString.join(''));
        
        const options = {};
        if (data.collection) {
            options['title'] = 'Data' + (this.collection.id ? ' from collection "'+this.collection.id+'"' : '');
        } else if (data.id) {
            options['title'] = 'Feature ' + data.id;
        }

        const html = json2html(data, options);
        
        this.response.end(html);
    }
}