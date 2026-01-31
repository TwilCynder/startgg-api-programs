import { existsSync } from "fs";
import fs, { readFile } from "fs/promises"
import { PageResult } from "startgg-helper-node";
import { readJSONInput } from "./lib/readUtil";

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
    
    constructor(path, writeThreshold = DEFAULT_WRITE_THRESHOLD){
        this._filepath = path;
        this.#writeThreshold = writeThreshold;
    }

    async tick(){
        this.#count++;
        if (this.#count >= this.#writeThreshold){
            await this._write();
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

function isPaginatedProgressObject(obj){
    return (obj instanceof Object && !!obj.data && !!obj.lastPage);
}

class SinglePaginatedExecutionSaver extends SaveManager {
    #progress;

    constructor(path, writeThreshold){
        super(path, writeThreshold);
    }

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

    async query(client, params, connectionPathInQuery, limiter, config, silentErrors, maxTries){
        if (this.#progress.lastPage < 0){ //means "completed"
            return this.#progress.data;
        }

        config.startingPage = this.getNextPage();
        config.initialData = this.getCurrentData();
        config.callback = this.getCallback();

        await this.query.executePaginated(client, params, connectionPathInQuery, limiter, config, silentErrors, maxTries);
    }

    toJSON(){
        return JSON.stringify({
            data: this.data,
            lastPage: this.lastPage,
        })
    }
}

export function paginatedExecutionProgress(path, writeThreshold, force){
    const sm = new SinglePaginatedExecutionSaver(path, writeThreshold);
    return sm._load(force);
}

export class ExecutionProgressManager extends SaveManager {
    #data = {};
    #nameFunction;

    constructor(path, config = {}){
        super(path, config.writeThreshold)
        this.#nameFunction = config.nameFunction;
    }

    async load(){
        if (existsSync(this._filepath)){
            this.#data = await readJSONInput(this._filepath);
        }
    }

    async _write(){
        return fs.writeFile(this._filepath, JSON.stringify(this.#data))
    }

    #getActualKey(key){
        return this.#nameFunction ? this.#nameFunction(key) : toString(key);
    }

    getSavedResult(key){
        const key = this.#getActualKey(key);
        return this.#data[key];
    }

    getSavedPaginatedProgress(key, force){
        const key = this.#getActualKey(key);
        const object = this.#data[key];
        if (!isPaginatedProgressObject(object)){
            if (force){
                object = {};
                this.#data[key] = object;
            } else {
                throw new SavedProgressError("Saved data for key " + key + " was not a paginated execution progress"); 
            }
        }
        return new PaginatedProgressManager(this, object);
    }

    saveResult(key, value){
        const key = this.#getActualKey(key);
        data[key] = value;
        this.tick();
    }

    async queryWithFunction(key, queryFunction){
        let result = this.getSavedResult(key);
        if (!result){
            result = await queryFunction();
            this.saveResult(result);
        }
        return result;
    }

    query(key, client, params, limiter, silentErrors, maxTries, logsOverride){
        return this.queryWithFunction(key, ()=>this.query.execute(client, params, limiter, silentErrors, maxTries, logsOverride));
    }
}