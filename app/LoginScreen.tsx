import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useMutation } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOGIN_MUTATION } from "./graphql/mutations.graphql";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./interfaces/navigation";



type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LoginScreen"
>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: async (data) => {
      const token = data?.login?.accessToken;
      if (token) {
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("userId", data.login.user.id.toString());
        Alert.alert("Éxito", "Inicio de sesión exitoso");
        navigation.navigate("(tabs)"); // Redirigir al Home después del login
      }
    },
    onError: (error) => {
      console.log("Error al iniciar sesión:", error);
      Alert.alert("Error", error.message);
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Todos los campos son obligatorios.");
      return;
    }
    login({ variables: { email, password } });
  };
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/Logo.png")}
          style={styles.logo}
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingrese su correo"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingrese su contraseña"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.optionsContainer}>
          <TouchableOpacity onPress={() => setRememberMe(!rememberMe)}>
            <View style={styles.checkbox}>
              {rememberMe && <View style={styles.checked} />}
            </View>
          </TouchableOpacity>
          <Text style={styles.optionText}>Recordarme</Text>
          <TouchableOpacity>
            <Text style={[styles.optionText, styles.forgotPassword]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.registerText}>
          ¿Aún no tienes una cuenta?{" "}
          <Text
            style={styles.registerLink}
            onPress={() => navigation.navigate("LoginScreen")}
          >
            Regístrate
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
  },
  logoContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    height: 250, // Ajusta según el diseño
    borderBottomLeftRadius: 80, // 📌 Esquina curva
    overflow: "hidden",
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: "contain",
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 20, // Espacio después del logo
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#FFF",
    marginBottom: 15,
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#00AEEF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checked: {
    width: 12,
    height: 12,
    backgroundColor: "#00AEEF",
    borderRadius: 3,
  },
  optionText: {
    fontSize: 14,
    color: "#666",
  },
  forgotPassword: {
    marginLeft: "auto",
    color: "#00AEEF",
  },
  loginButton: {
    backgroundColor: "#00AEEF",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  loginButtonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
  },
  registerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },
  registerLink: {
    color: "#00AEEF",
    fontWeight: "bold",
  },
});
