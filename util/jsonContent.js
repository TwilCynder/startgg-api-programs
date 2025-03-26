import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { readJSONInput } from "../include/lib/readUtil.js";
import { yellow } from "../include/lib/consoleUtil.js";

let {file, infoOnly} = new ArgumentsManager()
    .addParameter("file", {}, false)
    .addSwitch(["-i", "--info-only"], {description: "Only display info about the content, not the content itself", dest: "infoOnly"})

    .parseProcessArguments()

let data = await readJSONInput(file);

if (data instanceof Array){
    console.log(`Array with ${yellow(data.length)} elements`);
} else if (data instanceof Object){
    console.log(`Object with ${yellow(Object.keys().length)} properties`);
}

if (!infoOnly){
    console.log(data);
}