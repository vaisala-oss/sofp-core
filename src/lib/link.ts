
/**
 * Interface for objects representing WFS 3.0 links
 * @link https://raw.githubusercontent.com/opengeospatial/WFS_FES/master/core/openapi/schemas/link.yaml
 **/
export interface Link {
    href : string;
    rel? : string;
    type? : string;
    hreflang? : string
    title? : string;
};
