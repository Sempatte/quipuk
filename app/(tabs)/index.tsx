import React, { useCallback } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useQuery } from "@apollo/client";
import BellIcon from "../../assets/images/icons/mdi_bell.svg";
import SettingsIcon from "../../assets/images/icons/settings.svg";
import { GET_USER_PROFILE } from "../graphql/users.graphql";
import QuipukLogo from "../../assets/images/Logo.svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../interfaces/navigation.type";
import Loader from "@/app/components/ui/Loader";
import RecentTransactions from "@/app/components/ui/RecentTransactions"; // Importamos el nuevo componente
import UpcomingPayments from "@/app/components/ui/UpcomingPayments";
import QuipuTip from "@/app/components/ui/QuipuTip";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styles/indexScreen.styles";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LoginScreen",
  "movements"
>;

export default function Index() {
  const { data, loading, error } = useQuery(GET_USER_PROFILE, {
    fetchPolicy: 'cache-first',
  });
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
    <>
      <SafeAreaView style={{ backgroundColor: "#000" }} edges={["top"]}>
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
      </SafeAreaView>
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          {/* Componente de Últimos Movimientos */}
          <RecentTransactions />
          <UpcomingPayments />
          <QuipuTip/>
          {/* Aquí puedes añadir más componentes */}
        </View>
      </ScrollView>
    </>
  );
}