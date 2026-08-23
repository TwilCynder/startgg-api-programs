import { loadVideogameContent } from "../include/loadVideogameContent.js";
import { downloadScript } from "../include/downloadScriptFramework.js";


await downloadScript(
    am => am.addParameter("game"),
    async (client, limiter, {game, inputfile}) => loadVideogameContent(null, client, limiter, game)
);