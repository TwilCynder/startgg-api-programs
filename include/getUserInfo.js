const schema = `
query StandinsgQuery($slug: String!) {
	user(slug: $slug) {
  	id
    player {
      gamerTag
    }
  }
}
`

export async function getUserInfo(client, slug){
  let data = await client.request(schema, 
    {
        "slug": slug
    });

  if (!data.user) return null;

  return data.user;
}