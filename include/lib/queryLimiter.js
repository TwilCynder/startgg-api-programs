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
        console.log("Executing", params);

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
            console.log("A ticket was available !", params);
            return this.#execute(client, schema, params);
        } else {
            console.log("No ticket vailable. Queueing.", params)
            if (params.tries > 0){
                console.error("Not the first try");
                return new Promise((res, rej) => {}); 
            }
            //return new Promise((resolve, reject) =>  this.#queue.push({client, schema, params, resolve, reject}));
            return new Promise((resolve, reject) =>  this.#queue.push({client, schema, params, resolve : (v) => {console.log("RESOLVE") ; resolve(v)}, reject : (e) => {console.log("REJECT") ; reject(e)}}));
        }
    }

    #release(){
        console.error("Release");
        let query = this.#queue.shift();
        if (query){
            console.error("A query was queued. Executing :", query);
            let p = this.#executeQuery(query);
            p.then(res => query.resolve(res));
            p.catch(err => query.reject(err));
        } else {
            this.#counter++;
        }
    }
}
