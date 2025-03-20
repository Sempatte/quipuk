import React from "react";
import { View, Text, StyleSheet, StatusBar, SafeAreaView, KeyboardAvoidingView } from "react-native";
import { useQuery } from "@apollo/client";
import BellIcon from "@/assets/images/icons/mdi_bell.svg";
import SettingsIcon from "@/assets/images/icons/settings.svg";
import { GET_USER_PROFILE } from "../graphql/users.graphql";
import QuipukLogo from "@/assets/images/Logo.svg"; // Asumiendo que tienes o crearás este SVG

export default function HomeScreen() {
  const { data, loading } = useQuery(GET_USER_PROFILE);
  
  return (
    <KeyboardAvoidingView style={styles.container}>
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <QuipukLogo width={140} height={60} />
        </View>
        
        <View style={styles.iconContainer}>
          <View style={styles.iconButton}>
            <BellIcon width={24} height={24} fill="#00c450" />
          </View>
          <View style={styles.iconButton}>
            <SettingsIcon width={24} height={24} fill="#00c450" />
          </View>
        </View>
      </View>

      <View style={styles.welcomeContainer}>
        <Text style={styles.welcome}>
          Hola, <Text style={styles.username}>{loading ? "..." : data?.getUserProfile.fullName || "ELMER"}</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    maxHeight: "30%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  logoContainer: {
    flex: 1,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  iconButton: {
    width: 50,
    height: 50,
    backgroundColor: "#00DC5A",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    marginTop: 20
  },
  welcome: {
    fontSize: 32,
    color: "#FFFFFF",
    fontFamily: "Outfit_400Regular",
  },
  username: {
    color: "#00c450",
    fontFamily: "Outfit_700Bold",
    fontSize: 32,
  },
});