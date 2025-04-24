import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { useQuery } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';

import { RootStackNavigationProp } from "../interfaces/navigation";
import { GET_USER_PROFILE } from "../graphql/users.graphql";

const { width } = Dimensions.get('window');

// 📌 Definir interfaz para el usuario
interface UserProfile {
  fullName: string;
  phone: string;
  email: string;
  phoneNumber: string;
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
      // Mostrar confirmación antes de cerrar sesión
      Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro que deseas cerrar sesión?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cerrar Sesión",
            onPress: async () => {
              await AsyncStorage.multiRemove(["token", "userId"]);
              navigation.navigate("LoginScreen");
            },
            style: "destructive"
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar sesión.");
      console.error("Error en logout:", error);
    }
  }, [navigation]);

  if (error)
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#E86F51" />
          <Text style={styles.errorText}>Error al cargar el perfil</Text>
          <Text style={styles.errorSubtext}>{error.message}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {data?.getUserProfile?.fullName?.charAt(0) || "S"}
          </Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00DC5A" />
            <Text style={styles.loadingText}>Cargando perfil...</Text>
          </View>
        ) : (
          data?.getUserProfile && (
            <>
              <Text style={styles.userName}>{data.getUserProfile.fullName}</Text>
              
              {/* Tarjeta de información de contacto */}
              <View style={styles.infoCard}>
                <View style={styles.infoItem}>
                  <Ionicons name="call-outline" size={24} color="#00DC5A" style={styles.infoIcon} />
                  <View>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>{data.getUserProfile.phoneNumber}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.infoItem}>
                  <Ionicons name="mail-outline" size={24} color="#00DC5A" style={styles.infoIcon} />
                  <View>
                    <Text style={styles.infoLabel}>Correo</Text>
                    <Text style={styles.infoValue}>{data.getUserProfile.email}</Text>
                  </View>
                </View>
              </View>
              
              {/* Tarjeta de opciones */}
              <View style={styles.optionsCard}>
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons name="settings-outline" size={24} color="#000" style={styles.optionIcon} />
                  <Text style={styles.optionText}>Configuraciones</Text>
                  <Ionicons name="chevron-forward" size={24} color="#000" />
                </TouchableOpacity>
                
                <View style={styles.optionDivider} />
                
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons name="shield-outline" size={24} color="#000" style={styles.optionIcon} />
                  <Text style={styles.optionText}>Privacidad y Seguridad</Text>
                  <Ionicons name="chevron-forward" size={24} color="#000" />
                </TouchableOpacity>
                
                <View style={styles.optionDivider} />
                
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons name="help-circle-outline" size={24} color="#000" style={styles.optionIcon} />
                  <Text style={styles.optionText}>Ayuda y Soporte</Text>
                  <Ionicons name="chevron-forward" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              {/* Botón de cierre de sesión */}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: width,
    backgroundColor: "#F8F8F8",
  },
  container: {
    flex: 1,
    width: width,
    backgroundColor: "#F8F8F8",
  },
  header: {
    width: width,
    backgroundColor: "#060606",
    paddingTop: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 20,
    fontFamily: "Outfit_600SemiBold",
  },
  avatarContainer: {
    width: width,
    alignItems: "center",
    marginTop: -40,
    zIndex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00DC5A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: "Outfit_600SemiBold",
  },
  contentContainer: {
    width: width,
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#060606",
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
  userName: {
    fontSize: 24,
    color: "#060606",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
    fontFamily: "Outfit_700Bold",
  },
  infoCard: {
    width: '100%',
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  infoIcon: {
    marginRight: 15,
    width: 24,
  },
  infoLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 3,
    fontFamily: "Outfit_400Regular",
  },
  infoValue: {
    fontSize: 16,
    color: "#060606",
    fontFamily: "Outfit_500Medium",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  optionsCard: {
    width: '100%',
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  optionIcon: {
    marginRight: 15,
    width: 24,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#060606",
    fontFamily: "Outfit_500Medium",
  },
  optionDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 55,
  },
  logoutButton: {
    width: '100%',
    backgroundColor: "#E86F51",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  logoutText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  errorText: {
    fontSize: 20,
    color: "#060606",
    marginTop: 20,
    marginBottom: 10,
    fontFamily: "Outfit_600SemiBold",
  },
  errorSubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 30,
    fontFamily: "Outfit_400Regular",
  },
});