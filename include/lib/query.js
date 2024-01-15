import { deep_get } from './lib.js';

export class Query {
    #schema;
    #maxTries;

    constructor (schema, maxTries = null){
        this.#schema = schema;
        this.#maxTries = maxTries;
    }

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

    async #execute_(client, params, tries, limiter = null, silentErrors = false, maxTries = null){
        maxTries = maxTries || this.#maxTries || 1

        console.log(this.#getLog("query", params) || "Querying ..." + " Try " + (tries + 1));
        try {
            let data = await ( limiter ? limiter.execute(client, this.#schema, params) : client.request(this.#schema, params));
            
            return data;
        } catch (e) {
            console.log("LENKBVKHBKB ERROR")
            
            if (tries >= maxTries) {
                console.error("Maximum number of tries reached. Throwing.", e);
                throw e;
            }
            console.error((this.#getLog("error", params) || "Request failed.") + ` Retrying (try ${tries + 1}). Error : `, e);
            return this.#execute_(client, params, tries + 1, limiter, silentErrors, maxTries);
        }
    }

    async execute(client, params, limiter = null, silentErrors = false, maxTries = null){
        return await this.#execute_(client, params, 0, limiter, silentErrors, maxTries);
    }

    async executePaginated(client, params, collectionPathInQuery, limiter = null, delay = null, pageParamName = "page", silentErrors = false, maxTries = null){
        let result = [];

        params = Object.assign({}, params);
        params[pageParamName] = 1;

        while (true){
            let data = await this.execute(client, params, limiter, silentErrors, maxTries);

            if (!data) throw this.#getLog("error", params) || "Request failed." + "(in paginated execution, at page " + params[pageParamName] + ")";

            let localResult = deep_get(data, collectionPathInQuery);

            if (!localResult) throw `The given path ${collectionPathInQuery} does not point to anything.`
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