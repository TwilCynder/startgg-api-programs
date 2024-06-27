import { GraphQLClient } from 'graphql-request';
import { deep_get } from './lib.js';
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

    /**
     * Executes a query containing a paginated collection, repeatedly, increasing the page index each time until nothing is returned, returning an aggregation of all the pages.
     * @param {GraphQLClient} client 
     * @param {{[varName: string]: value}} params 
     * @param {string} collectionPathInQuery JSON path to the paginated collection that must aggregated in the query (JSON path : property names separated by dots)
     * @param {TimedQuerySemaphore} limiter 
     * @param {number} delay Adds a delay between calls (does not interact with the limiter)
     * @param {string} pageParamName Name of the query parameter that must be updated with a page index for each query
     * @param {boolean} silentErrors 
     * @param {number} maxTries 
     * @returns 
     */
    async executePaginated(client, params, collectionPathInQuery, limiter = null, delay = null, perPage = undefined, pageParamName = "page", perPageParamName = "perPage", silentErrors = false, maxTries = null){
        let result = [];

        params = Object.assign({}, params);
        params[pageParamName] = 1;
        params[perPageParamName] = perPage;

        while (true){
            console.log("Querying page", params[pageParamName], `(${result.length} elements loaded)`);
            let data = await this.execute(client, params, limiter, silentErrors, maxTries);

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

        return result;
    }
}