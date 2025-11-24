/** 
 * @typedef {{slug: string;results: any;CPSpread: number[];}} TournamentData 
 * 
 */

/**
 * For a given list of tournaments with CP spread info and final standings, returns the sum of Cashprizes earned by each participant over all tournaments
 * @param {TournamentData[]} tournaments 
 */
export function sumCashprizes(tournaments){
    /** @type {{[slug: string]: {name: string, money: number}}} */
    let users = {}

    const addMoney = (participant, cp) => {
        if (!participant.slug) {
            console.warn("User without slug :", participant.name, `was getting (${cp})`);
            return;
        }

        console.log(participant.name, "got", cp);
        let slug = participant.slug;
        if (users[slug]){
            users[slug].money += cp;
        } else {
            users[slug] = {
                name: participant.name,
                money: cp
            }
        }
    }

    for (const tournament of tournaments){
        console.log("==== Event :", tournament.slug, "with CP spread", tournament.CPSpread);
        if (!tournament.results) {
            console.warn("No results");
            continue;
        }
        for (const result of tournament.results){
            let cp = tournament.CPSpread[result.placement - 1];
            if (cp <= 0) continue;

            if (result.participants.length > 1){
                console.log("Team split a CP of", cp);
                for (let participant of result.participants){
                    process.stdout.write("- ")
                    addMoney(participant, cp / result.participants.length);
                }
            } else {
                let participant = result.participants[0]
                addMoney(participant, cp);
            }
        }
    }

    return users;
}