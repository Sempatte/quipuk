import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useQuery } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { RootStackNavigationProp } from "../interfaces/navigation";
import { GET_USER_PROFILE } from "../graphql/users.graphql";

// 📌 Definir interfaz para el usuario
interface UserProfile {
  fullName: string;
  phone: string;
  email: string;
}

export default function Profile() {
  const navigation = useNavigation<RootStackNavigationProp<"(tabs)">>();

  // 📌 Consulta GraphQL solo si userId está disponible
  const { loading, error, data } = useQuery<{ getUserProfile: UserProfile }>(
    GET_USER_PROFILE
  );

  // 📌 Función de logout con `useCallback` para evitar recreaciones innecesarias
  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(["token", "userId"]); // ✅ Eliminar múltiples valores a la vez
      Alert.alert("Cierre de sesión", "Has cerrado sesión correctamente.");
      navigation.navigate("LoginScreen");
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar sesión.");
      console.error("Error en logout:", error);
    }
  }, [navigation]);

  if (error) return <Text style={styles.errorText}>Error: {error.message}</Text>;

  return (
    <ParallaxScrollView headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}>
      <ThemedView>
        <ThemedText type="title">Perfil</ThemedText>

        {loading ? (
          <ActivityIndicator size="large" color="#000000" />
        ) : (
          data?.getUserProfile && (
            <View style={styles.profileContainer}>
              <ThemedText>Nombre: {data.getUserProfile.fullName}</ThemedText>
              <ThemedText>Teléfono: {data.getUserProfile.phone}</ThemedText>
              <ThemedText>Correo: {data.getUserProfile.email}</ThemedText>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  profileContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    width: "100%",
    fontSize: 10,
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: "#E86F51",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
});
