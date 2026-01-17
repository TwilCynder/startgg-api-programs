import { createClient } from "startgg-helper-node";
import { relurl } from "./dirname.js";
import { readJSONInput } from "./readUtil.js";

export async function createClientAuto(){
    try {
        const secrets = await readJSONInput(relurl(import.meta.url, "../../secrets.json"));
        
        if (secrets && secrets.token){
            return createClient(secrets.token);
        } else {
            console.log("secrets file found, but no token property. Using token-less client.")
        }
    } catch (err) {
        if (err.code != "ENOENT"){
            console.warn("Error while reading secrets file ; using token-less client. Error :");
            console.warn(err);
        } else {
            console.log("No secrets file found, using token-less client");
        }
    }
    return createClient();
}
