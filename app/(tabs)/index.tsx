import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useQuery } from "@apollo/client";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Importaciones de componentes
import BellIcon from "@/assets/images/icons/mdi_bell.svg";
import SettingsIcon from "@/assets/images/icons/settings.svg";
import QuipukLogo from "@/assets/images/LogoV2.svg";
import Loader from "@/components/ui/Loader";
import RecentTransactions from "@/components/ui/RecentTransactions";
import UpcomingPayments from "@/components/ui/UpcomingPayments";
import QuipuTip from "@/components/ui/QuipuTip";

// Importaciones de GraphQL y tipos
import { GET_USER_PROFILE } from "../graphql/users.graphql";

export default function Index() {
  const { data, loading, error } = useQuery(GET_USER_PROFILE);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (error?.message === "Token expired or invalid") {
        AsyncStorage.removeItem("token");
        router.replace("/LoginScreen");
      }
    }, [error, router])
  );

  if (loading) {
    return <Loader visible={true} fullScreen text="Cargando datos del usuario..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <QuipukLogo width={50} height={50} />
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
        
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcome}>
            Hola,{" "}
            <Text style={styles.username}>
              {loading ? "..." : data?.getUserProfile.fullName || "Usuario"}
            </Text>
          </Text>
        </View>
      </View>

      {/* 🔥 Contenido scrollable */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        <RecentTransactions />
        <UpcomingPayments />
        <QuipuTip />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000", // 🔥 Fondo negro para evitar flasheo
  },
  header: {
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    // 🔥 Eliminamos paddingTop ya que SafeAreaView se encarga
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
  },
  logoContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 20,
  },
  welcome: {
    fontSize: 32,
    color: "#FFFFFF",
    fontFamily: "Outfit_400Regular",
  },
  username: {
    color: "#00DC5A",
    fontFamily: "Outfit_700Bold",
    fontSize: 32,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 30,
  },
});