import {getPlayerInfo} from "./getPlayerInfo.js"

export class Player {
    constructor(slug){
        this.slug = slug;
    }

    async loadPlayer(client){
        let player = await getPlayerInfo(client, this.slug);
        if (player == null){
            throw "Couldn't load player " + this.slug;
        }
        this.player = player
        this.id = player.id
        this.name = player.gamerTag;
        return this
    }

    static createPlayer(client, slug){
        return (new Player(slug).loadPlayer(client));
    }

    static async createPlayers(client, slugs){
        let players = []
        await Promise.all(slugs.map( (slug) => this.createPlayer(client, slug)))
            .then(values => players = values);
        return players;
    }

    static async loadPlayers(client, players){
        await Promise.all(players.map( (p) => p.loadPlayer(client)))
    }
}