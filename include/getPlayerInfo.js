const playerSchema = `
query User($slug: String!) {
    user(slug: $slug){
        player {
            id
            gamerTag,
          	prefix
        }
    }
}
`

export async function getPlayerInfo(client, slug){
    let data = await client.request(playerSchema, 
        {
            "slug": slug
        });
    
    if (!data.user) return null;

    return data.user.player
}