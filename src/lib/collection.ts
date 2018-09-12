import {FeatureCursor, Link, Query} from 'lib/';

export interface Collection {
    // https://raw.githubusercontent.com/opengeospatial/WFS_FES/master/core/openapi/schemas/collectionInfo.yaml
    name : string;
    title : string;
    description : string;
    links : Link[];
    extent : string;
    // CRS will be decided by the server

    executeQuery(query : Query) : FeatureCursor;
};