import { GraphQLClient } from 'graphql-request';


const endpoint = 'https://www.start.gg/api/-/gql'

const headers = {
    "client-version": "21",
    'Content-Type': 'application/json'
}

export function createClient(){
    return new GraphQLClient(endpoint, {
        headers: headers
    });
}