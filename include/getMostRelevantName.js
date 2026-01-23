
/**
 * Returns the most relevant name for an entrant depending on the team size and what info is present, which is : 
 * - If it's a team, the entrant name if present, or else the names of team members concatenated with a /
 * - If it's not, the player's gamerTag if present, or else the entrant name  
 * 
 * Assumes that if a participants property is present, it's an array containing a player poperty
 * @param {{}} entrant 
 * @returns {string | undefined}
 */
export function getMostRelevantName(entrant){
    if (!entrant.participants) return entrant.name;
    if (entrant.participants.length > 1){
        return (entrant.name ?? entrant.participants.map(participant => participant.player.gamerTag).filter(name => !!name)) || undefined;
    } else {
        const participant = entrant.participants[0];
        if (!participant) return undefined;
        return participant.player.gamerTag;
    }
}