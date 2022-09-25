import { GraphQLClient } from 'graphql-request';

const endpoint = 'https://api.smash.gg/gql/alpha'

const headers = {
    authorization: 'Bearer d0206138a8ea04cf8e34f80ecc177663',
}

export const client = new GraphQLClient(endpoint, {
    headers: headers
})

