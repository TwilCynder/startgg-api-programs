import { bgreen, purple, yellow } from "./lib/consoleUtil.js"
import { timeText } from "./lib/util.js";

export function logFilters(startDate, endDate, games, minEntrants, exclude_expression, filters, offline, online, eventsBlacklist){
    if (startDate) console.log("- Start date :", purple(timeText(startDate)));
    if (endDate) console.log("- End date :", purple(timeText(endDate)));
    if (games) console.log("- Game filters :", bgreen(games));
    if (minEntrants) console.log("- Minimum entrants :", yellow(minEntrants));
    if (exclude_expression && exclude_expression.length) console.log("- Filter regex :", bgreen(exclude_expression.join(" ; ")));
    if (filters && filters.length) console.log("- Excluded words :", bgreen(filters.join(" ; ")));
    if (offline != online) console.log("-", bgreen(offline ? "Offline" : "Online") + " only");
    if (eventsBlacklist && eventsBlacklist.length) {
        console.log("- Events blacklist :");
        for (const slug of eventsBlacklist){
            console.log("\t-", slug);
        }
    }
}