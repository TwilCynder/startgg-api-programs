import { existsSync } from "fs";
import fs, { readFile } from "fs/promises"
import { PageResult } from "startgg-helper-node";
import { readJSONInput } from "./lib/readUtil";

const DEFAULT_WRITE_THRESHOLD = 16;

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

class SinglePaginatedExecutionSaver extends SaveManager {
    #progress;

    constructor(path, writeThreshold){
        super(path, writeThreshold);
    }

    async _load(){
        if (existsSync(this._filepath)){
            const savedObject = await fs.readFile(path).then(buf => JSON.parse(buf.toString()));
            this.#progress = new PaginatedExecutionProgress(this, savedObject.data, savedObject.lastPage); 
        } else {
            this.#progress = new PaginatedExecutionProgress(this, [], 0);
        }
    }

    _write(){
        return fs.writeFile(this._filepath, this.#progress.toJSON())
    }

    _setProgressObject(progress){
        this.#progress = progress;
    }
}

class PaginatedExecutionProgress {
    #saveManager;
    data = [];
    lastPage = 0; //-1 = completed

    /** 
     * @param {SaveManager} saveManager 
     */
    constructor(saveManager, data, lastPage){
        this.#saveManager = saveManager
    }

    getCallback(){
        return (localResult, currentResult, i) => {
            this.lastPage = i;
            currentResult = currentResult.concat(localResult);
            this.data = currentResult;
            this.#saveManager.tick();

            return new PageResult(currentResult);
        }
    }

    markCompleted(){
        this.lastPage = -1;
    }

    toJSON(){
        return JSON.stringify({
            data: this.data,
            lastPage: this.lastPage,
        })
    }

}

export function paginatedExecutionProgress(path, writeThreshold){
    const sm = new SinglePaginatedExecutionSaver(path, writeThreshold);
    sm._load();
}

export class ExecutionProgressManager extends SaveManager {
    #data = {};
    #nameFunction;

    constructor(path, config = {}){
        super(path, config.writeThreshold)
        this.#nameFunction = config.nameFunction;
    }

    async load(){
        if (existsSync(this.#path)){
            this.#data = await readJSONInput(this.#path);
        }
    }

    async _write(){
        return fs.writeFile(this.#path, JSON.stringify(this.#data))
    }

    saveResult(key){

    }

}