import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParamsMandatory, argumentsManager } from "../include/lib/paramConfig.js";
import { errorExit, tryReadJSONArray } from "../include/lib/util.js";
import { deep_get } from "startgg-helper-node";

let {inputfile, path} = argumentsManager("Returns the number of elements in a JSON array")
    .addParameter("inputfile", {}, false)
    .addOption(["-p", "--path"], {description: "Path to an array in the input object (by default, treat the object as an array)"})
    .parseProcessArguments()

let data = await tryReadJSONArray(inputfile);
if (!data) {
    errorExit(2, "No input");
}
if (path) data = deep_get(data, path);
if (!data || (!data instanceof Array)) {
    errorExit(3, "The provided path doesn't point to an array")
}

console.log(data.length);