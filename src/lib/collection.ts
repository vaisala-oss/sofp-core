import {FeatureCursor, Link, Query} from 'lib/';

/**
 * Interface for objects representing WFS 3.0 collections
 * @link https://raw.githubusercontent.com/opengeospatial/WFS_FES/master/core/openapi/schemas/collectionInfo.yaml
 **/
export interface Collection {
    name : string;
    title? : string;
    description? : string;

    /**
     * Any non-protocol links for the collection. For example links to additional information etc. The
     * API will produce the links required for access any data in this collection.
     **/
    links : Link[];

    extent? : string;
    crs? : string;

    executeQuery(query : Query) : FeatureCursor;
};