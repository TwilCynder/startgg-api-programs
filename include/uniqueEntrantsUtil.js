/**
 * 
 * @param {{}[]} events 
 * @param {boolean} silentErrors 
 * @returns 
 */
export function processUniqueEntrantsLeague(events, silentErrors){
    let data = events.reduce((acc, event) => {
        if (!event || !event.entrants) return acc;
        for (let entrant of event.entrants){
            for (let participant of entrant.participants){
                if (participant.user){
                    if (!acc[participant.user.id]){
                        participant.user.player = participant.player;
                        acc[participant.user.id] = participant.user;
                    }
                } else if (!silentErrors){
                    console.warn("Entrant", entrant.id, `(${entrant.name})`, "at event", event.slug, "doesn't have a user account associated.");
                }
            }
        }
        return acc;
    }, {});

    return Object.values(data);
}