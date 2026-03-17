import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addOutputParams, addOutputParamsJSON } from "../include/lib/paramConfig.js";
import { output, outputJSON, tryReadJSONArray } from "../include/lib/util.js";
import { deep_get } from "startgg-helper-node";

let {inputfile, outputFormat, outputfile, logdata, printdata, silent, fragmentOutput, operations} = new ArgumentsManager()
    .addParameter("inputfile")
    .apply(addOutputParams)
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

const transformOps = {
    path: {
        f: (data, [path]) => data.map(element => deep_get(element, path)),
        params: 1
    },
    flat: {
        f: (data) => data.flat(),
    },
    filterNull: {
        f: (data) => data.filter(elt => (elt != null) && (elt != undefined)),
    },
    sortBy: {
        f: (data, [path]) => {
            if (path.includes(".")) data.sort((a, b) => deep_get(a, path) - deep_get(b, path));
            else data.sort((a, b) => a[prop] - b[prop]);
            return data;
        },
        params: 1
    },
    sortByReverse: {
        f: (data, [path]) => {
            if (path.includes(".")) data.sort((a, b) => deep_get(b, path) - deep_get(a, path));
            else data.sort((a, b) => b[prop] - a[prop]);
            return data;
        },
        params: 1
    },
    firstN: {
        f: (data, [n]) => data.slice(0, n),
        params: 1
    },
    lastN: {
        f: (data, [n]) => data.slice(n),
        params: 1
    },
    first: {
        f: (data) => data[0]
    },
    last1: {
        f: (data) => data[data.length - 1]
    }
}

// ======== PROCESSING ========

for (let i = 0; i < operations.length; i++){
    const word = operations[i];
    const op = transformOps[word];

    if (!op){
        console.error("Unknown operation :", word);
        process.exit(1);
    }

    const nbParams = op.params ?? 0;

    if(operations.length < i + nbParams){
        console.error("Not enough arguments for operation", word);
        process.exit(1);
    }

    const params = operations.slice(i + 1, i + nbParams + 1);
    i += nbParams;

    data = op.f(data, params)
}

output(outputFormat, outputfile, printdata, data, data => {
    if (data instanceof Array){
        return data.map(elt => elt.toString()).join("\n");
    }
    return JSON.stringify(data, null, outputFormat == "prettyjson" ? 4 : null);
});