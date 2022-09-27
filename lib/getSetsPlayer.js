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

async function getSetsPage(client, id, page){
    console.log("Getting page : ", page, "from ID", id);
    try {
        return await client.request(setsSchema, {
            p1Id: id,
            perPage: perPage,
            page: page
        })
    } catch (e) {
        console.log("/!\\ Request failed, retrying")
        return getSetsPage(client, id, page);
    }
    
}

export async function getSetsFromPlayer(client, id, delay){
    let sets = []
    let page = 0
    let nodes;
    do {
        page++
        let data = await getSetsPage(client, id, page);

        if (delay)
            await new Promise(resolve => setTimeout(resolve, delay));

        nodes = data.player.sets.nodes
        sets = sets.concat(nodes)
    } while (nodes.length >= perPage)

    return sets
}