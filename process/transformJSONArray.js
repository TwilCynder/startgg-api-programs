import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addOutputParamsJSON } from "../include/lib/paramConfig.js";
import { outputJSON, tryReadJSONArray } from "../include/lib/util.js";
import { deep_get } from "startgg-helper-node";

let {inputfile, outputfile, printdata, silent, prettyjson, fragmentOutput, operations} = new ArgumentsManager()
    .addParameter("inputfile")
    .apply(addOutputParamsJSON)
    .addMultiParameter("operations")
    .enableHelpParameter()
    .parseProcessArguments();

// ======== LOADING DATA

let data = await tryReadJSONArray(inputfile);

if (!(data instanceof Array)){
    console.error("Input data is not an array");
    process.exit(1);
}

// ======== OPERATIONS =======

const ops = {
    path: {
        f: (data, [path]) => data.map(element => deep_get(element, path)),
        params: 1
    },

    flat: {
        f: (data) => data.flat(),
        params: 0
    }
}

// ======== PROCESSING

for (let i = 0; i < operations.length; i++){
    const word = operations[i];
    const op = ops[word];

    if (!op){
        console.error("Unknown operation :", word);
        process.exit(1);
    }

    if(operations.length < i + op.params){
        console.error("Not enough arguments for operation", word);
        process.exit(1);
    }

    const params = operations.slice(i + 1, i + op.params + 1);
    i += op.params;

    data = op.f(data, params)
}

outputJSON(data, outputfile, printdata, prettyjson);