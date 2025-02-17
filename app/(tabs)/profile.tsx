import { ActivityIndicator, Text, View } from "react-native";
import { GetUsersData } from "../interfaces/user.intefarce";
import { useQuery } from "@apollo/client";
import { GET_USERS } from "../graphql/users.graphql";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function Profile() {
  const { loading, error, data } = useQuery<GetUsersData>(GET_USERS);
  console.log(data);
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
    >
      <ThemedView>
        <ThemedText type="title">Profile</ThemedText>
        {loading && <ActivityIndicator size="large" color="#000000" />}
        {!loading && (
          <View>
            {data?.users.map((user) => (
              <View key={user.id} style={{ marginBottom: 10 }}>
                <Text >Nombre: {user.full_name}</Text>
                <Text>Correo: {user.email}</Text>
              </View>
            ))}
          </View>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}
