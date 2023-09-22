//i am a god of JS

class QueryTimedSemaphore {
    #queue = [];
    #counter;
    #delay;

    constructor(size, delay){
        this.#counter = size;
        this.#delay = delay;
    }

    #startTimeout(){
        setTimeout(() => {
            this.#release();
        }, this.#delay);
    }

    #execute(client, schema, params){
        //console.log("Executing", params);

        this.#startTimeout();
        
        return client.request(schema, params);

        /*return new Promise((resolve) => setTimeout(() => {
            resolve(schema);
        }, 500))*/
    }

    #executeQuery(query){
        return this.#execute(query.client, query.schema, query.params);
    }

    execute(client, schema, params){
        if (this.#counter > 0){
            this.#counter--;
            //console.log("A ticket was available !", params);
            return this.#execute(client, schema, params);
        } else {
            //console.log("No ticket vailable. Queueing.", params)
            return new Promise((resolve, reject) =>  this.#queue.push({client, schema, params, resolve, reject}));
        }
    }

    #release(){
        //console.error("Release");
        let query = this.#queue.shift();
        if (query){
            //console.error("A query was queued. Executing :", query.params);
            let p = this.#executeQuery(query);
            p.then(res => query.resolve(res));
            p.catch(err => query.reject(err));
        } else {
            this.#counter++;
        }
    }
}

export class QueryLimiter extends QueryTimedSemaphore {
    constructor(rpm){
        super(1, 60000 / rpm);
    }
}