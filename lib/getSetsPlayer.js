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

const perPage = 60;

async function getSetsPage(client, id, page){
    console.log("Getting page : ", page, "from ID", id);
    return await client.request(setsSchema, {
        p1Id: id,
        perPage: perPage,
        page: page
    })
}

export async function getSetsFromPlayer(client, id){
    let sets = []
    let page = 0
    let nodes;
    do {
        page++
        let data = await getSetsPage(client, id, page);
        nodes = data.player.sets.nodes
        sets = sets.concat(nodes)
    } while (nodes.length >= perPage)

    return sets
}