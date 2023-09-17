class Query {
    #schema;
    #maxTries;

    constructor (schema, maxTries = null){
        this.#schema = schema;
        this.#maxTries = maxTries;
    }

    #getLog(logName, params){
        if (!this.log);
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

    async #execute_(client, params, tries, silentErrors = false, maxTries = null){
        maxTries = maxTries || this.#maxTries || 0

        console.log(this.#getLog("query", params) || "Querying ..." + " Try " + tries + 1);
        try {
            let data = await client.request(this.#schema, params);
            return data;
        } catch (e) {
            if (tries > maxTries) throw e;
            console.log(this.#getLog("error", params) || "Request failed." + " Retrying.");
            return this.#execute_(client, params, tries + 1, silentErrors, maxTries);
        }
    }

    async execute(client, params, silentErrors = false, maxTries = null){
        return await this.#execute_(client, params, silentErrors, maxTries);
    }
}