import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useQuery } from "@apollo/client";
import BellIcon from "@/assets/images/icons/mdi_bell.svg";
import SettingsIcon from "@/assets/images/icons/settings.svg";
import { GET_USER_PROFILE } from "../graphql/users.graphql";
import QuipukLogo from "@/assets/images/LogoV2.svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../interfaces/navigation";
import Loader from "@/components/ui/Loader";
import RecentTransactions from "@/components/ui/RecentTransactions"; // Importamos el nuevo componente
import UpcomingPayments from "@/components/ui/UpcomingPayments";
import QuipuTip from "@/components/ui/QuipuTip";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LoginScreen",
  "movements"
>;

export default function Index() {
  const { data, loading, error } = useQuery(GET_USER_PROFILE);
  const navigation = useNavigation<LoginScreenNavigationProp>();

  useFocusEffect(
    useCallback(() => {
      if (error?.message === "Token expired or invalid") {
        AsyncStorage.removeItem("token");
        navigation.navigate("LoginScreen");
      }
    }, [error, navigation])
  );

  if (loading) {
    return <Loader visible={true} fullScreen text="Cargando datos del usuario..." />;
  }

  return (
    <ScrollView style={styles.scrollView}>
      <KeyboardAvoidingView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <QuipukLogo width={70} height={70} />
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
      </KeyboardAvoidingView>

      {/* Contenido fuera del KeyboardAvoidingView negro */}
      <View style={styles.contentContainer}>
        {/* Componente de Últimos Movimientos */}
        <RecentTransactions />
        <UpcomingPayments />
        <QuipuTip/>
        {/* Aquí puedes añadir más componentes */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    backgroundColor: "#000",
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 30,
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
});