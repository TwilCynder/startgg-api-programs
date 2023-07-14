const setsSchema = `
query PlayerSets($p1Id: ID!, $perPage: Int!, $page: Int!, $after: Timestamp) {
    player (id: $p1Id) {
        sets(perPage: $perPage, page: $page, filters : {
          updatedAfter: $after
        }) {
            nodes {
                completedAt
                slots {
                    entrant {
                        participants {
                            player {
                                id
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

async function getSetsPage(client, id, page, after = null){
    console.log("Getting page : ", page, "from ID", id);
    try {
        return await client.request(setsSchema, {
            p1Id: id,
            perPage: perPage,
            page: page,
            after: after
        })
    } catch (e) {
        console.log("/!\\ Request failed, retrying. Message : ", e)
        return getSetsPage(client, id, page);
    }
    
}

export async function getSetsFromPlayer(client, id, delay, after, until){
    console.log(until)
    let sets = []
    let page = 0
    let nodes;
    do {
        page++
        let data = await getSetsPage(client, id, page, after);

        if (delay)
            await new Promise(r => setTimeout(r, delay));

        nodes = data.player.sets.nodes;
        sets = sets.concat(nodes.filter((set => until == undefined || set.completedAt < until)));
    } while (nodes.length >= perPage)

    return sets
}