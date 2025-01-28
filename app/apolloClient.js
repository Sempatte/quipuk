// apolloClient.js
import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
    uri: 'https://quipuk-hasura.hasura.app/v1/graphql', // Reemplaza <tu-proyecto> con el nombre de tu proyecto en Hasura
    cache: new InMemoryCache(),
    headers: {
        'x-hasura-admin-secret': 'F9fwot96nVabw27wa6zo2mIY3mKZ6dv2w2YvSEBJzZb1WSheawrEp1Voe5Mapb8L', // Asegúrate de manejar este secreto de manera segura
    },
});

export default client;
