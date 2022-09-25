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

if (process.argv.length < 4 ){
    console.log("Need two arguments");
    process.exit()
}

let p1Slug = process.argv[2];
let p2Slug = process.argv[3];

let players = new Player(p1Slug);

let p1 = 
let p2 = new Player(p2Slug);

await p1.loadPlayer()
await p2.loadPlayer()

console.log(p1.id)
let p1Sets = await getSetsFromPlayer(p1.id)

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
        console.log(set.displayScore)
        let p1result = set.slots[p1PositionInSet].standing.placement
        if (p1result == 1)
    }

});