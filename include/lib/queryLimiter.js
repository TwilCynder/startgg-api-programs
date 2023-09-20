//i am a god of JS

export class QueryLimiter {
    #rpm;
    #queue = [];
    #counter;

    constructor(rpm){
        this.#rpm = rpm || 50;
        this.#counter = this.#rpm;
    }

    #execute(client, schema, params){
        setTimeout(() => {
            this.#release();
        }, 60000);
        
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
            return this.#execute(client, schema, params);
        } else {
            return new Promise((resolve) =>  this.#queue.push({client, schema, params, resolve}));
        }
    }

    async #release(){
        let query = this.#queue.shift();
        if (query){
            query.resolve(await this.#executeQuery(query));
        } else {
            this.#counter++;
        }
    }
}
