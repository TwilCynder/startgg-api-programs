import { getVideogameID } from "./getVideogameID.js";
import { extractSlug } from "./lib/tournamentUtil.js";

export async function loadGames(client, games, limiter){
    let gamesID = null;
    if (games){
        console.log("Fetching IDs for games", games);
        gamesID = await Promise.all(games.split(",").map(word => {
            word = word.trim();
            if (!word.includes("game/")) word = "game/" + word;
            let id = parseInt(word);
            if (!id){ //assuming it was a slug
                return getVideogameID(client, extractSlug(word), limiter);
            } else {
                return id;
            }
        }))
    }
    return gamesID;
}