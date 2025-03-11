// apolloClient.js
import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
    uri: 'http://192.168.1.114:3000/graphql',
    cache: new InMemoryCache(),

});

export default client;
