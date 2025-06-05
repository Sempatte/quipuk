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
    console.log('🔑 Token enviado en header:', token);
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

// app/apolloClient.js
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network', // Mejor que 'network-only'
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      fetchPolicy: 'cache-first', // Mejor rendimiento
      errorPolicy: 'all',
    },
  },
  connectToDevTools: env.isDevelopment,
});

export default client;