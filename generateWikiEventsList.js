import { client } from "./include/lib/client.js";
import { EventListParser } from "./include/lib/computeEventList.js";
import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { StartGGDelayQueryLimiter } from "startgg-helper";
import { getEventsResults} from "./include/getEventResults.js"
import { getDateString } from "./include/dateString.js";
import { outputText, readMultimodalArrayInput } from './include/lib/util.js'
import { addInputParams, addOutputParamsBasic, isSilent } from "./include/lib/paramConfig.js";
import { extractSlugs } from "startgg-helper";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";

let {slugs, outputfile, printdata, silent, inputfile, stdinput} = new ArgumentsManager()
    .apply(addOutputParamsBasic)
    .apply(addInputParams)
    .addCustomParser(new EventListParser, "slugs")
    .enableHelpParameter()

    .parseProcessArguments()

printdata = printdata || !outputfile;
let silent_ = isSilent(printdata, silent)
if (silent_) muteStdout();

let limiter = new StartGGDelayQueryLimiter();

let data = await readMultimodalArrayInput(inputfile, stdinput, getEventsResults(client, extractSlugs(slugs), 2, limiter));
limiter.stop();

data = data.filter((ev) => !!ev);
data = data.sort((a, b) => a.startAt - b.startAt);

let result = ""
for (let ev of data){
    if (!ev) continue;

    result += "|-\n";
    result += "|[https://start.gg/" + ev.slug + " " + ev.tournament.name;
    result += "]||";
    let date = new Date(ev.startAt * 1000);
    result += getDateString(date);
    result += "||";
    result += ev.numEntrants;
    let pName = ev.standings.nodes[0].entrant.name;
    pName = pName.substring(pName.lastIndexOf('|')+1).trim();
    result += `||{{Sm|${pName}}}`;
    pName = ev.standings.nodes[1].entrant.name;
    pName = pName.substring(pName.lastIndexOf('|')+1).trim();
    result += `||{{Sm|${pName}}}`;
    result += "\n";
}

if (silent_) unmuteStdout();
outputText(result, outputfile, printdata);

/*
|-
|[http://challonge.com/MSM0 Mega Smash Monday 0]||May 11th, 2015||38||{{Sm|K9sbruce}}||{{Sm|Zenyou}}
*/