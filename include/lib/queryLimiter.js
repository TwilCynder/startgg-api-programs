//i am a god of JS

class TimedQuerySemaphore {
    #queue = [];
    #timers = [];
    #counter;
    #delay;

    constructor(size, delay){
        this.#counter = size;
        this.#delay = delay;
    }

    #startTimeout(){
        let t = setTimeout(() => {
            this.#release();
        }, this.#delay); 
        this.#timers.push(t);
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
            this.#executeQuery(query)
                .then(res => query.resolve(res))
                .catch(err => query.reject(err));
        } else {
            this.#counter++;
        }
    }

    stop(){
        for (let timer of this.#timers){
            clearTimeout(timer);
        }
    }
}

export class ClockQueryLimiter extends TimedQuerySemaphore {
    constructor(rpm){
        super(1, 60000 / rpm);
    }
}

export class StartGGClockQueryLimiter extends ClockQueryLimiter {
    constructor(){
        super(70);
    }
}

export class DelayQueryLimiter extends TimedQuerySemaphore {
    constructor(rpm){
        super (rpm, 60000);
    }
}

export class StartGGDelayQueryLimiter extends DelayQueryLimiter {
    constructor(){
        super(60)
    }
}