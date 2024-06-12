import {client} from "./include/lib/client.js";

let data = await client.request(`
mutation reportSet($setId: ID!, $winnerId: ID, $gameData: [BracketSetGameDataInput]) {
    reportBracketSet(setId: $setId, winnerId: $winnerId, gameData: $gameData) {
      id
      state
    }
  }
`, {
    "setId": 65854495,
    "gameData": [
      {
        "winnerId": 14443844,
        "gameNum": 1
      }
      
    ]
  })