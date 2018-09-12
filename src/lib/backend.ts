import {Collection} from './collection';
import {Link} from './link';

export interface Backend {
    getCollections() : Collection[];
    getLinks() : Link[];
};
