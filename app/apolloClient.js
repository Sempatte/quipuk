// app/apolloClient.js
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '@/app/config/env';

// Crear el enlace HTTP con la URL de GraphQL desde variables de entorno
const httpLink = createHttpLink({
  uri: env.GRAPHQL_URL,
});

// Interceptor para agregar el token en las cabeceras
const authLink = setContext(async (_, { headers }) => {
  try {
    const token = await AsyncStorage.getItem("token");
    return {
      headers: {
        ...headers,
        "Content-Type": "application/json",
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  } catch (error) {
    console.error('Error getting auth token:', error);
    return { headers };
  }
});

// Cliente Apollo con mejor manejo de errores de red
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: env.isDevelopment,
});

export default client;