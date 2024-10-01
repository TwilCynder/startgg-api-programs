import { GraphQLClient } from 'graphql-request';
import { deep_get, deep_set } from './jsUtil.js';
import { TimedQuerySemaphore } from './queryLimiter.js'

export class Query {
    #schema;
    #maxTries;

    /**
     * 
     * @param {string} schema 
     * @param {number?} maxTries 
     */
    constructor (schema, maxTries = null){
        this.#schema = schema;
        this.#maxTries = maxTries;
    }

    /**
     * 
     * @param {string} logName 
     * @param {{[varName: string]: value}} params 
     * @returns 
     */
    #getLog(logName, params){
        if (!this.log) return null;
        let log = this.log[logName];
        if (log){
            if (typeof log == "string"){
                return log;
            } else if (typeof log == "function"){
                return log(params);
            }
        }
        return null;
    }

    /**
     * 
     * @param {GraphQLClient} client 
     * @param {{[varName: string]: value}} params 
     * @param {number} tries How many tries in are we 
     * @param {TimedQuerySemaphore} limiter 
     * @param {boolean} silentErrors 
     * @param {number} maxTries Overrides this.#maxTries
     * @returns 
     */
    async #execute_(client, params, tries, limiter = null, silentErrors = false, maxTries = null){
        maxTries = maxTries || this.#maxTries || 1

        console.log((this.#getLog("query", params) || "Querying ...") + " Try " + (tries + 1));
        try {
            let data = await ( limiter ? limiter.execute(client, this.#schema, params) : client.request(this.#schema, params));
            
            return data;
        } catch (e) {
            
            if (tries >= maxTries) {
                console.error("Maximum number of tries reached. Throwing.", e);
                throw e;
            }
            console.error((this.#getLog("error", params) || "Request failed.") + ` Retrying (try ${tries + 1}). Error : `, e);
            return this.#execute_(client, params, tries + 1, limiter, silentErrors, maxTries);
        }
    }

    /**
     * Executes the query with given parameters and client
     * @param {GraphQLClient} client 
     * @param {{[varName: string]: value}} params 
     * @param {TimedQuerySemaphore} limiter 
     * @param {boolean} silentErrors 
     * @param {number} maxTries Overrides the default maximum tries count for this query
     * @returns 
     */
    async execute(client, params, limiter = null, silentErrors = false, maxTries = null){
        return await this.#execute_(client, params, 0, limiter, silentErrors, maxTries);
    }

    static IWQModes = {
        DONT: 0,
        INLINE: 1,
        DUPLICATE: 2,
        OUT: 3
    }

    /**
     * Executes a query containing a paginated collection, repeatedly, increasing the page index each time until nothing is returned, returning an aggregation of all the pages.
     * @param {GraphQLClient} client 
     * @param {{[varName: string]: value}} params 
     * @param {string} collectionPathInQuery JSON path to the paginated collection that must aggregated in the query (JSON path : property names separated by dots)
     * @param {TimedQuerySemaphore} limiter 
     * @param {{pageParamName?: string, perPageParamName?: string, perPage?: number, delay?: number, maxElements?: number, includeWholeQuery?: number}} config 
     * @param {boolean} silentErrors 
     * @param {number} maxTries 
     * @returns 
     */
    async executePaginated(client, params, collectionPathInQuery, limiter = null, config = {}, silentErrors = false, maxTries = null){
        let result = [];
        //delay = null, perPage = undefined, pageParamName = "page", perPageParamName = "perPage", silentErrors = false, maxTries = null
        const pageParamName = config.pageParamName ?? "page";
        const perPageParamName = config.perPageParamName ?? "perPage";
        const perPage = config.perPage ?? params[perPageParamName];
        const delay = config.delay;
        const maxElements = config.maxElements ?? undefined; //eliminating null

        params = Object.assign({}, params);
        params[pageParamName] = 1;
        params[perPageParamName] = perPage;

        let data;
        while (true){
            if (result.length >= maxElements) break;

            console.log("Querying page", params[pageParamName], `(${result.length} elements loaded)`);
            data = await this.execute(client, params, limiter, silentErrors, maxTries);

            if (!data) throw (this.#getLog("error", params) ?? "Request failed.") + "(in paginated execution, at page " + params[pageParamName] + ")";

            let localResult = deep_get(data, collectionPathInQuery);

            if (!localResult) {
                console.warn(`The given path ${collectionPathInQuery} does not point to anything.`);
                return null;
            }
            
            if (!localResult.push) throw "The given path does not point to an array."

            if (localResult.length < 1) break;

            result = result.concat(localResult);
            params[pageParamName]++;

            if (delay)
                await new Promise(r => setTimeout(r, delay));
        }

        if (maxElements) result = result.slice(0, maxElements);

        if (config.includeWholeQuery == Query.IWQModes.DUPLICATE || config.includeWholeQuery == Query.IWQModes.INLINE){
            deep_set(data, collectionPathInQuery, result);
        } else if (config.includeWholeQuery == Query.IWQModes.OUT){
            deep_set(data, collectionPathInQuery, null);
        }

        if (config.includeWholeQuery == Query.IWQModes.DUPLICATE || config.includeWholeQuery == Query.IWQModes.OUT){
            return [result, data]
        } else if (config.includeWholeQuery == Query.IWQModes.INLINE){
            return data;
        }

        return result;
    }
}