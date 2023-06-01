import { GraphQLClient } from 'graphql-request';

const endpoint = 'https://api.smash.gg/gql/alpha'

const headers = {
    authorization: 'Bearer aaf87de047c2449475ebf9ae83bb0e97',
}

export const client = new GraphQLClient(endpoint, {
    headers: headers
})