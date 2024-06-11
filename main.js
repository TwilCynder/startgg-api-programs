import {client} from "./client.js"
import { standingTiers, tierNames } from './standingTiers.js';
import { removeTags } from './smashggData.js';

const querySchema = `
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

console.log("Sending request ...");
const data = await client.request(querySchema, 
    {
        "eventId": eventId,
        "page": 1,
        "perPage": 64
    }
)

let tiers = standingTiers(data.event.standings.nodes);

for (let i = 0; i < tiers.length; i++){
  let tier = tiers[i];
  let str = tierNames[i] + " : ";
  for (let j = 0; j < tier.length; j++){
    str += removeTags(tier[j].entrant.name) + "  "
  }
  console.log(str)
}