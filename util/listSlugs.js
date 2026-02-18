import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { tryReadJSONArray } from "../include/lib/util.js";

let {inputfile} = new ArgumentsManager()
    .addParameter("inputfile", {}, false)
    .setAbstract("Takes an array of objects as input and display the slug property for each of them")
    .enableHelpParameter()
    .parseProcessArguments();

const data = await tryReadJSONArray(inputfile);

data.forEach(object => console.log(object.slug));