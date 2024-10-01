import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addInputParams, addOutputParams } from "./include/lib/paramConfig.js";
import { getUsersSetsChars } from "./include/getUserSetsChars.js";
import { client } from "./include/lib/client.js";
import { readMultimodalInput } from "./include/lib/util.js";
import { processMain } from "./include/getMain.js";
import { PlayerUserFilter } from "./include/processCharacterStatsFiltered.js";

let {slugs, inputfile, stdinput, number, outputFormat, outputfile, logdata, printdata, silent, all} = new ArgumentsManager()
    .setAbstract("Data expected as input : result of downloadUserSetsChars -i")
    .addMultiParameter("slugs")
    .addOption(["-n", "--number"], {description: "Number of characters to include", type: "number"})
    .addSwitch(["-p", "--percentages"], {description: "Whether to include the percentage of games played on each character"})
    .addOption(["-S", "--sets-count"], {description: "How many sets should be used to compute this (always take most recent, by default takes all)", type: "number"})
    .apply(addInputParams)
    .apply(addOutputParams)
    .enableRecursiveResult()
    .enableHelpParameter()
    .parseProcessArguments();

let max = all["sets-count"];

let users = await readMultimodalInput(inputfile, stdinput, getUsersSetsChars(client, slugs, null, {max, includeWholeQuery: true}));

users.map(user => {
    console.log(user.data);
    console.log(processMain(user.data.user.sets, new PlayerUserFilter(user.data.user.id)));
})