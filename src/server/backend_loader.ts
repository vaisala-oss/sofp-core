import {Backend} from '../lib';
import {MockBackend} from '../mock/mock_backend';

import * as _ from 'lodash';

// https://stackoverflow.com/a/24594123
const { lstatSync, readdirSync, readFileSync } = require('fs')
const { join } = require('path')

const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source => readdirSync(source).map(name => join(source, name)).filter(isDirectory)


export function load(path : string) : Backend[] {
    const cwd = process.cwd();
    var backendDirectories = getDirectories(cwd+'/'+path);

    const ret = [];
    _.each(backendDirectories, dir => {
        try {
            console.log('Loading backend '+dir);
            var moduleSpecContents = readFileSync(dir+'/package.json');
            var moduleSpec = JSON.parse(moduleSpecContents);
            var mod = require(dir);

            var backendExports = moduleSpec['sofp-backend'];
            if (!_.isArray(backendExports)) {
                backendExports = [ backendExports ];
            }

            _.each(backendExports, function(name) {
                ret.push(mod[name]);
            });

        } catch(err) {
            console.error('Could not load backend module at '+dir+', error:');
            console.error(err);
        }
    });

    return ret;
}