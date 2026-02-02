import { existsSync } from "fs";
import fs, { readFile } from "fs/promises"
import { PageResult, Query, TimedQuerySemaphore } from "startgg-helper-node";
import { readJSONInput } from "./lib/readUtil.js";

const DEFAULT_WRITE_THRESHOLD = 16;

export class SavedProgressError extends Error {
    constructor (message){
        super(message);
    }
}

class SaveManager {
    #count = 0;
    _filepath;
    #writeThreshold;
    
    /**
     * @param {string} path 
     * @param {number} writeThreshold 
     */
    constructor(path, writeThreshold = DEFAULT_WRITE_THRESHOLD){
        this._filepath = path;
        this.#writeThreshold = writeThreshold;
    }

    async tick(){
        this.#count++;
        if (this.#count >= this.#writeThreshold){
            await this._write();
            this.#count = 0;
        }
    }

    async _write(){
        //Abstract function lol
    }
} 


function initPaginatedProgressObject(){
    return {
        data: [],
        lastPage: 0
    }
}

/** @typedef {ReturnType<initPaginatedProgressObject>} PaginatedProgressObject */

function isPaginatedProgressObject(obj){
    return (obj instanceof Object && !!obj.data && !!obj.lastPage);
}

class SinglePaginatedExecutionSaver extends SaveManager {
    /**@type {PaginatedProgressObject}*/
    #progress;

    /**
     * @param {string} path
     * @param {number} writeThreshold 
     */
    constructor(path, writeThreshold){
        super(path, writeThreshold);
    }

    /**
     * @param {boolean} force 
     * @returns 
     */
    async _load(force){
        if (existsSync(this._filepath)){
            const savedObject = await fs.readFile(this._filepath).then(buf => JSON.parse(buf.toString()));
            if (!isPaginatedProgressObject(savedObject)){
                if (force){
                    this.#progress = initPaginatedProgressObject();
                } else {
                    throw new SavedProgressError("Existing content of progress file isn't a paginated progress object")
                }
            }
            this.#progress = savedObject;
        } else {
            this.#progress = initPaginatedProgressObject();
        }

        return this._getProgressObject();
    }

    _write(){
        return fs.writeFile(this._filepath, this.#progress.toJSON())
    }

    _getProgressObject(){
        return new PaginatedProgressManager(this, this.#progress);
    }
}

class PaginatedProgressManager {
    #saveManager;
    #progress;

    /** 
     * @param {SaveManager} saveManager 
     * @param {PaginatedProgressObject} progressObject 
     */
    constructor(saveManager, progressObject){
        this.#saveManager = saveManager
        this.#progress = progressObject;
    }

    getCurrentData(){
        return this.#progress.data;
    }

    getNextPage(){
        return this.#progress.lastPage + 1; 
    }

    getCallback(){
        return (localResult, currentResult, i) => {
            this.#progress.lastPage = i;
            currentResult = currentResult.concat(localResult);
            this.#progress.data = currentResult;
            this.#saveManager.tick();

            return new PageResult(currentResult);
        }
    }

    markCompleted(){
        this.lastPage = -1;
    }

    /**
     * @param {Query} query 
     * @param {*} client 
     * @param {Parameters<Query["executePaginated"]>[1]} params 
     * @param {Parameters<Query["executePaginated"]>[2]} connectionPathInQuery 
     * @param {Parameters<Query["executePaginated"]>[3]} limiter 
     * @param {Parameters<Query["executePaginated"]>[4]} config 
     * @param {Parameters<Query["executePaginated"]>[5]} silentErrors 
     * @param {Parameters<Query["executePaginated"]>[6]} maxTries 
     * @returns 
     */
    async query(query, client, params, connectionPathInQuery, limiter, config, silentErrors, maxTries){
        if (this.#progress.lastPage < 0){ //means "completed"
            return this.#progress.data;
        }

        config.startingPage = this.getNextPage();
        config.initialData = this.getCurrentData();
        config.callback = this.getCallback();

        await query.executePaginated(client, params, connectionPathInQuery, limiter, config, silentErrors, maxTries);
    }

    toJSON(){
        return JSON.stringify({
            data: this.data,
            lastPage: this.lastPage,
        })
    }
}

/**
 * @param {string} path 
 * @param {number} writeThreshold 
 * @param {boolean} force 
 * @returns 
 */
export function paginatedProgressManager(path, writeThreshold, force){
    const sm = new SinglePaginatedExecutionSaver(path, writeThreshold);
    return sm._load(force);
}

export class QueriesProgressManager extends SaveManager {
    #data = {};

    /**
     * 
     * @param {string} path 
     * @param {{writeThreshold: number, nameFunction: (key: any)=>string}} config 
     */
    constructor(path, config = {}){
        super(path, config.writeThreshold)
    }

    async load(){
        if (existsSync(this._filepath)){
            this.#data = await readJSONInput(this._filepath);
        }
    }

    async _write(){
        console.log("---- Writing to file ----");
        return fs.writeFile(this._filepath, JSON.stringify(this.#data))
    }

    /**
     * @param {string} key 
     * @returns 
     */
    getSavedResult(key){
        return this.#data[key];
    }

    /**
     * @param {string} key 
     * @param {boolean} force 
     * @returns 
     */
    getSavedPaginatedProgress(key, force){
        const object = this.#data[key];
        if (!isPaginatedProgressObject(object)){
            if (force){
                object = initPaginatedProgressObject();
                this.#data[key] = object;
            } else {
                throw new SavedProgressError("Saved data for key " + key + " was not a paginated execution progress"); 
            }
        }
        return new PaginatedProgressManager(this, object);
    }

    /**
     * @param {string} key 
     * @param {any} value 
     */
    saveResult(key, value){
        console.log("Saving data for key", key, ":", value)
        this.#data[key] = value;
        this.tick();
    }

    /**
     * 
     * @param {string} key 
     * @param {() => ReturnType<Query["execute"]>} queryFunction 
     * @returns 
     */
    async queryWithFunction(key, queryFunction){
        let result = this.getSavedResult(key);
        if (!result){
            result = await queryFunction();
            console.log("Fetched result :", result)
            this.saveResult(key, result);
        } else {
            console.log("Found saved data for key", key, ":", result);
        }
        return result;
    }

    /**
     * 
     * @param {string} key 
     * @param {Query} query 
     * @param {Parameters<Query["execute"]>[0]} client 
     * @param {Parameters<Query["execute"]>[1]} params 
     * @param {Parameters<Query["execute"]>[2]} limiter 
     * @param {Parameters<Query["execute"]>[3]} silentErrors 
     * @param {Parameters<Query["execute"]>[4]} maxTries 
     * @param {Parameters<Query["execute"]>[5]} logsOverride 
     * @returns 
     */
    query(key, query, client, params, limiter, silentErrors, maxTries, logsOverride){
        return this.queryWithFunction(key, ()=>query.execute(client, params, limiter, silentErrors, maxTries, logsOverride));
    }
}

/**
 * 
 * @param {QueriesProgressManager | string?} arg 
 * @param {string} key 
 * @returns 
 */
export async function getPaginatedProgressManagerFrom(arg, key){
    if (arg instanceof QueriesProgressManager){
        return arg.getSavedPaginatedProgress(key, true);
    } else if (typeof arg == "string") {
        return await paginatedProgressManager(arg, undefined, true);
    } else {
        return null;
    }
}


/**
 * @param {Query} query 
 * @param {QueriesProgressManager} progressSaveManager 
 * @param {string} key 
 * @param {Parameters<Query["execute"]>[0]} client 
 * @param {Parameters<Query["execute"]>[1]} params 
 * @param {Parameters<Query["execute"]>[2]} limiter 
 * @param {Parameters<Query["execute"]>[3]} silentErrors 
 * @param {Parameters<Query["execute"]>[4]} maxTries 
 * @param {Parameters<Query["execute"]>[5]} logsOverride 
 * @returns 
 */
export async function executeWithSaveManager(query, progressSaveManager, key, client, params, limiter, silentErrors, maxTries, logsOverride){
    return progressSaveManager ? 
        progressSaveManager.query(key, query, client, params, limiter, silentErrors, maxTries, logsOverride) :
        query.execute(client, params, limiter, silentErrors, maxTries, logsOverride);
}

/**
 * 
 * @param {Query} query 
 * @param {PaginatedProgressManager} paginatedProgressManager 
 * @param {Parameters<Query["executePaginated"]>[0]} client 
 * @param {Parameters<Query["executePaginated"]>[1]} params 
 * @param {Parameters<Query["executePaginated"]>[2]} connectionPathInQuery 
 * @param {Parameters<Query["executePaginated"]>[3]} limiter 
 * @param {Parameters<Query["executePaginated"]>[4]} config 
 * @param {Parameters<Query["executePaginated"]>[5]} silentErrors 
 * @param {Parameters<Query["executePaginated"]>[6]} maxTries 
 */
export async function executePaginatedWithSaveManager(query, paginatedProgressManager, client, params, connectionPathInQuery, limiter, config, silentErrors, maxTries){
    return paginatedProgressManager ?
        paginatedProgressManager.query(query, client, params, connectionPathInQuery, limiter, config, silentErrors, maxTries) :
        query.executePaginated(client, params, connectionPathInQuery, limiter, config, silentErrors, maxTries);
}