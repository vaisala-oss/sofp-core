import {Filter} from './filter';

export class Query {
    private filters : Filter[];

    getFilters() : Filter[] {
        return this.filters;
    };
};
