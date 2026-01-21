import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParamsMandatory } from "../include/lib/paramConfig.js";
import { tryReadJSONInput } from "../include/lib/util.js";

let {inputfile} = new ArgumentsManager()
    .setAbstract("Returns the number of elements in a JSON array")
    .addParameter("inputfile", {}, false)
    .parseProcessArguments()

let data = await tryReadJSONInput(inputfile);
if (!data) {
    console.error("No input");
    process.exit(1);
}

console.log(data.length);