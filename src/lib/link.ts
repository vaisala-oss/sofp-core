
export interface Link {
    // https://raw.githubusercontent.com/opengeospatial/WFS_FES/master/core/openapi/schemas/link.yaml
    getHref() : string;
    getRel() : string;
    getType() : string;
    getHreflang() : string;
    getTitle() : string;
};
