import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParams } from "../include/lib/paramConfig.js";
import { readArrayInputData } from "../include/lib/util.js";

let {inputfile, stdinput} = new ArgumentsManager()
    .setAbstract("Returns the number of elements in a JSON array")
    .apply(addInputParams)
    .parseProcessArguments()

let data = await readArrayInputData(inputfile, stdinput);

console.log(data.length);