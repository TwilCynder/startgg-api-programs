import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { tryReadJSONInput } from "../include/lib/util.js";
import fs from "fs/promises"


let {inputfile, outputfile, spaces} = new ArgumentsManager()
    .addParameter("inputfile", false)
    .addParameter("outputfile", true)
    .addOption(["-s", "--spaces"], {type: "number"})
    .enableHelpParameter()
    .parseProcessArguments();

if (!outputfile) outputfile = inputfile;

const data = await tryReadJSONInput(inputfile)
await fs.writeFile(outputfile, JSON.stringify(data, null, spaces ?? 4));