import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParamsMandatory, argumentsManager } from "../include/lib/paramConfig.js";
import { tryReadJSONArray } from "../include/lib/util.js";

let {inputfile} = argumentsManager("Returns the number of elements in a JSON array")
    .addParameter("inputfile", {}, false)
    .parseProcessArguments()

let data = await tryReadJSONArray(inputfile);
if (!data) {
    console.error("No input");
    process.exit(1);
}

console.log(data.length);