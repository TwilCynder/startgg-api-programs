import fs from 'fs';

/*
//FILTER FRANCE
let tournaments = JSON.parse(fs.readFileSync('./out/tournamentsFiltered.json'));
let tournamensFR = tournaments.filter( t => t && t.country && t.country == "FR");
fs.writeFileSync('./out/tournamentsFilteredFR.json', JSON.stringify(tournamensFR));
*/

/*
//FILTER WEEK 
function convertTZ(date, tzString) {
    return new Date(date).toLocaleString("fr-FR", {timeZone: tzString, weekday: "long", hour: "numeric", minute: "numeric"});   
}

function convertTZWD(date, tzString) {
    return new Date(date).toLocaleString("fr-FR", {timeZone: tzString, weekday: "long"});   
}

function convertTZHour(date, tzString) {
    return new Date(date).toLocaleString("fr-FR", {timeZone: tzString, hour: "numeric"});   
}

let tournaments = JSON.parse(fs.readFileSync('./out/tournaments.json'));

let tournamentsFiltered = [];
for (let tournament of tournaments){
    let timezone = tournament.timezone;
    if (!timezone) continue;
    timezone = (timezone[0].toUpperCase() + timezone.slice(1));
    tournamentsFiltered.push({
        name: tournament.name,
        country: tournament.countryCode,
        start: tournament.startAt,
        events: tournament.events.filter((ev) => {
            if (!ev.slug) return;

            let wd = convertTZWD(ev.startAt * 1000, timezone);
            let hour = parseInt(convertTZHour(ev.startAt * 1000, timezone));

            if (wd.includes("mardi") || wd.includes("mercredi") || wd.includes("jeudi")) return true;
            if (wd.includes("lundi") && hour > 6) return true;
            if (wd.includes("vendredi") && hour < 6) return true;

            return false;
        })
    });

}

fs.writeFileSync('./out/tournamentsFiltered.json', JSON.stringify(tournamentsFiltered));
*/

//DISPLAY DATES

/*
let tournaments = JSON.parse(fs.readFileSync('./out/tournamentsDated.json'));
for (let tournament of tournaments){
    for (let event of tournament.events){
        if (event && event.slug && event.slug.includes("stock-o-clock"))
            console.log(event.slug, event.date);
    }
}
*/

/*
//DATE TOURNAMENTS
function convertTZ(date, tzString) {
    return new Date(date).toLocaleString("fr-FR", {timeZone: tzString, weekday: "long", hour: "numeric", minute: "numeric"});   
}

let tournaments = JSON.parse(fs.readFileSync('./out/tournaments.json'));

let tournamentsFiltered = [];
for (let tournament of tournaments){
    let timezone = tournament.timezone;
    if (!timezone) continue;
    timezone = (timezone[0].toUpperCase() + timezone.slice(1));
    tournamentsFiltered.push({
        name: tournament.name,
        country: tournament.countryCode,
        start: tournament.startAt,
        events: tournament.events.map((ev) => {
            if (!ev.slug) return;
            if (ev.slug.includes("stock-o-clock")){
                console.log(ev.slug, ev.startAt, timezone);
            }
            ev.date = convertTZ(ev.startAt * 1000, timezone);
            return ev;
        })
    });

}

fs.writeFileSync('./out/tournamentsDated.json', JSON.stringify(tournamentsFiltered));
*/

/*
//EVENTS
let tournaments = JSON.parse(fs.readFileSync('./out/tournamentsFilteredFR.json'));

let events = [];

for (let t of tournaments){
    events.push(...t.events);
}

console.log(events.length);

fs.writeFileSync('./out/eventsFilteredFR.json', JSON.stringify(events));
*/

/*
//SORT EVENTS
let events = JSON.parse(fs.readFileSync('./out/eventsFilteredFR.json'));

events.sort( (a, b) => {
    if (!a.numEntrants) return 1;
    if (!b.numEntrants) return -1;
    return b.numEntrants - a.numEntrants;
})

console.log(events[0].numEntrants, events[0].slug);
fs.writeFileSync('./out/eventsSortedFR.json', JSON.stringify(events));
console.log("Finished")
*/


//DISPLAY TOP EVENTS
let events = JSON.parse(fs.readFileSync('./out/eventsSorted.json'));
for (let i = 0; i < 200; i++){
    console.log(i, events[i].numEntrants, events[i].slug);
}
