import {ItemCursor} from './item_cursor';
import {Link} from './link';
import {Query} from './query';

export interface Collection {
    // https://raw.githubusercontent.com/opengeospatial/WFS_FES/master/core/openapi/schemas/collectionInfo.yaml
    getName() : string;
    getTitle() : string;
    getDescription() : string;
    getLinks() : Link[];
    getExtent() : string;
    // CRS will be decided by the server

    executeQuery(query : Query) : ItemCursor;
};