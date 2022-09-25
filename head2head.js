import {client} from "./lib/common.js"
import { getPlayerInfo } from "./lib/getPlayerInfo.js";

const setsSchema = `
query PlayerSets($p1Id: ID!, $perPage: Int!, $page: Int!) {
    player (id: $p1Id) {
        sets(perPage: $perPage, page: $page, filters : {
        }) {
            nodes {
                slots {
                    entrant {
                        participants {
                            player {
                                id
                                gamerTag
                            }       
                        } 
                    }
                    standing {
                        placement
                    }
                }
                displayScore         
            }
        }
    }
}
`

const perPage = 50;

async function getPlayer(slug){
    return getPlayerInfo(client, slug)
}

async function getSetsPage(id, page){
    console.log("Getting page : ", page, "from ID", id);
    return await client.request(setsSchema, {
        p1Id: id,
        perPage: perPage,
        page: page
    })
}

async function getSetsFromPlayer(id){
    let sets = []
    let page = 0
    let nodes;
    do {
        page++
        let data = await getSetsPage(id, page);
        nodes = data.player.sets.nodes
        sets = sets.concat(nodes)
    } while (nodes.length >= perPage)

    return sets
}

class Player {
    constructor(slug){
        this.slug = slug;
    }

    async loadPlayer(){
        let player = await getPlayer(this.slug);
        this.player = player
        this.id = player.id
        this.name = player.gamerTag;
        return this.player
    }
}

class Head2Head extends Array {
    constructor(p1, p2){
        super()
        this[0] = {player : p1, score: 0};
        this[1] = {player : p2, score: 0};
    }

    addResult(player){
        this[player].score++;
    }

    toString(){
        return "" + this[0].player.name + " " + this[0].score + " - " + this[1].score + " " + this[1].player.name;
    }
}

function getHead2Head(p1Sets, p1, p2){
    let result = new Head2Head(p1, p2);

    p1Sets.forEach(set => {
        let setP1 = set.slots[0].entrant.participants;
        if (setP1.length > 1) {
            //console.log("[Ignoring non-1v1 set]");
            return;
        }
        setP1 = setP1[0].player;
    
        let p1PositionInSet = (p1.id == setP1.id) ? 0 : 1;
        let otherPlayer = set.slots[1 - p1PositionInSet].entrant.participants[0].player;
    
        if (otherPlayer.id == p2.id){
            //match found
            let p1result = set.slots[p1PositionInSet].standing.placement
            result.addResult(p1result == 1 ? 0 : 1)
            console.log("Winner : " + ((p1result == 1) ? p1.name : p2.name))
        }
    });

    return result
}

if (process.argv.length < 4 ){
    console.log("Need two arguments");
    process.exit()
}

let players = [new Player(process.argv[2]), new Player(process.argv[3])];

await Promise.all(players.map(async (p) => await p.loadPlayer()))

let h2h = getHead2Head(await getSetsFromPlayer(players[0].id), players[0], players[1])

console.log(h2h)