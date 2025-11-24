import { ArgumentsManager } from "@twilcynder/arguments-parser";
import { addOutputParams, doWeLog } from "./include/lib/paramConfig.js";
import { readJSONInput, readText, stat } from "./include/lib/readUtil.js";
import { output, parseCSV } from "./include/lib/util.js";
import { muteStdout, unmuteStdout } from "./include/lib/fileUtil.js";
import { getEventResults } from "./include/getEventResults.js";
import { client } from "./include/lib/client.js";
import { StartGGDelayQueryLimiter, extractSlug } from "startgg-helper-node";
import { deep_get, isNumber } from "startgg-helper-node/util"
import {yellow} from "./include/lib/consoleUtil.js"
import fs from "fs/promises";
import { sumCashprizes } from "./include/cashprizeSum.js";

const defaultCSVSchema = {
    url: 0,
    CPstart: 1,
    CPend: 16,
}

let { filename, outputFormat, outputfile, logdata, printdata, silent, data_cache, cashprize_columns, slug_column} = new ArgumentsManager()
    .setParameters({guessLowDashes: true})
    .apply(addOutputParams)
    .setAbstract("For a given list of tournaments with CP spread info and final standings, outputs the sum of Cashprizes earned by each participant over all tournaments. Takes the tournament list as a CSV table, each line contains the slug/URL of a tournament and its CP spread, with the CP for 1st in a column, then CP for 2nd in next column, etc. Column numbers for each info can be set through CLI arguments and in the code.")
    .addParameter("filename", {description: "CSV table filename"})
    .addOption(["-S", "--slug-column"], {description : "Index of the column with the tournament's slug/URL"})
    .addOption(["-C", "--cashprize-columns"], {length: 2, description: "Index of the first and last (inclusive) columns where individual place cashprizes will be found"})
    .addOption(["-d", "--data-cache"], {description: "File used to store curated tournament data pulled from start.gg, to avoid having to re-download/read it if tournaments don't change"})
    .enableHelpParameter()

    .parseProcessArguments();

let [logdata_, silent_] = doWeLog(logdata, printdata, outputfile, silent);
silent_ = false;
if (silent_) muteStdout();

cashprize_columns = cashprize_columns ?? [null, null];
const CSVSchema = Object.assign(defaultCSVSchema, {
    url: slug_column,
    CPstart: cashprize_columns[0],
    CPend: cashprize_columns[1]
});
const maxCPStanding = CSVSchema.CPend - CSVSchema.CPstart + 1;

const [tournamentData, standingsCache] = await Promise.all([
    readText(filename).then(text => parseCSV(text, {separator: "\t"})).catch(err => {console.error("Could not read input file :", err) ; process.exit(1)}),
    (data_cache && await stat(data_cache)) ? readJSONInput(data_cache) : {}
]);

const extractResultInfo = (data) => {
    if (!data || !data.standings) return null;
    return data.standings.nodes.map(standing => {
        const participants = deep_get(standing, "entrant.participants");
        return {
            placement: standing.placement,
            participants: participants.map(participant => ({slug: deep_get(participant, "user.discriminator"), name: deep_get(participant, "player.gamerTag")}))
        }
    })
}


const getFromCache = (slug) => {
    console.log("Loaded", slug, "from cache");
    return standingsCache[slug];
}

let limiter = new StartGGDelayQueryLimiter();
const loadResults = async (slug) => (standingsCache && standingsCache[slug]) ? getFromCache(slug) : extractResultInfo(await getEventResults(client, slug, maxCPStanding, limiter));

const tournaments = (await Promise.all(tournamentData.map(async tournament => {
    let slug = extractSlug(tournament[CSVSchema.url])
    let CPSpread = tournament.slice(CSVSchema.CPstart, CSVSchema.CPend + 1).map(txt => parseFloat(txt));
    let results = await loadResults(slug);

    return {slug, results, CPSpread};
}))).filter(tournament => {
    if (tournament.CPSpread.length < 1) return false;
    let firstPlace = tournament.CPSpread[0];
    return isNumber(firstPlace) && firstPlace > 0;
});

limiter.stop();

const users = sumCashprizes(tournaments);

const sortedUsers = Object.entries(users).map(([slug, user]) => (Object.assign(user, {slug}))).sort((a, b) => b.money - a.money);
console.log(sortedUsers)

if (data_cache){
    fs.writeFile(data_cache, JSON.stringify(Object.fromEntries(tournaments.map(tournament => [tournament.slug, tournament.results])), null, 4))
}

if (silent_) unmuteStdout();

if (logdata_) {
    for (let player of sortedUsers){
        console.log(player.name, yellow(player.money.toFixed(2)) + "€");
    }
}

output(outputFormat, outputfile, printdata, sortedUsers, data => {
    let txt = "";
    for (let player of sortedUsers) {
        txt += player.slug + '\t' + player.name + '\t' + player.money + '\n';
    }
return txt;
})
