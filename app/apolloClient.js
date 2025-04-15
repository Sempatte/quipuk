import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Crear el enlace HTTP
const httpLink = createHttpLink({
  uri: "http://192.168.1.47:3000/graphql",
});
  
// Interceptor para agregar el token en las cabeceras
const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem("token");
  return {
    headers: {
      ...headers,
      "Content-Type": "application/json",
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Crear el cliente Apollo
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
