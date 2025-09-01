import { request, GraphQLClient } from 'graphql-request';

const endpoint = 'https://api.smash.gg/gql/alpha'

const headers = {
    authorization: 'Bearer d0206138a8ea04cf8e34f80ecc177663',
}

const graphQLClient = new GraphQLClient(endpoint, {
    headers: headers
})

const query = `
query EventStandings($eventId: ID!, $page: Int!, $perPage: Int!) {
    event(id: $eventId) {
      id
      name
      standings(query: {
        perPage: $perPage,
        page: $page
      }){
        nodes {
          placement
          entrant {
            id
            name
          }
        }
      }
    }
  }  
`

if (process.argv.length < 3 ){
  console.log("Need one argument");
  process.exit()
}

let eventId = parseInt(process.argv[2]);

//console.log("Sending request ...");
const data = await request(endpoint, query, 
    {
        "eventId": eventId,
        "page": 1,
        "perPage": 16
    },
    headers
)

console.log("Top 16 for event " + eventId);
for (let i = 0; i < data.event.standings.nodes.length; i++){
    let entry = data.event.standings.nodes[i];
    console.log(entry.entrant.name);
}