import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useMutation } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LOGIN_MUTATION } from "./graphql/mutations.graphql";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./interfaces/navigation";
import { useToast } from "./providers/ToastProvider";
import QuipukLogo from "@/assets/images/Logo.svg";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LoginScreen"
>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: async (data) => {
      const token = data?.login?.accessToken;
      if (token) {
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("userId", data.login.user.id.toString());
        showToast("success", "¡Bienvenido!", "Has iniciado sesión correctamente");
        navigation.navigate("(tabs)");
      }
    },
    onError: (error) => {
      console.log("Error al iniciar sesión:", error);
      
      // ✅ NUEVO: Manejo específico de errores de verificación
      if (error.message.includes('EMAIL_NOT_VERIFIED')) {
        try {
          // Intentar extraer información adicional del error
          const errorData = JSON.parse(error.message);
          
          showToast(
            "info", 
            "Email no verificado", 
            "Necesitas verificar tu email antes de iniciar sesión"
          );
          
          // Navegar a la pantalla de verificación
          navigation.navigate("EmailVerificationScreen", {
            email: email,
            userId: errorData.userId,
            fromRegistration: false,
          });
        } catch (parseError) {
          // Si no se puede parsear el error, mostrar mensaje genérico
          showToast(
            "info",
            "Email no verificado",
            "Por favor verifica tu email antes de iniciar sesión"
          );
        }
      } else if (error.message.includes('Usuario no encontrado')) {
        showToast("error", "Usuario no encontrado", "Verifica tu email o regístrate");
      } else if (error.message.includes('Contraseña incorrecta')) {
        showToast("error", "Contraseña incorrecta", "Verifica tu contraseña");
      } else {
        showToast("error", "Error en inicio de sesión", error.message);
      }
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      showToast("error", "Error", "Todos los campos son obligatorios.");
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("error", "Error", "Por favor ingresa un email válido.");
      return;
    }

    login({ variables: { email, password } });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <View style={styles.logoContainer}>
            <QuipukLogo width={90} style={styles.logo} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Correo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese su correo"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese su contraseña"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />

            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                onPress={() => !loading && setRememberMe(!rememberMe)}
                disabled={loading}
              >
                <View style={styles.checkbox}>
                  {rememberMe && <View style={styles.checked} />}
                </View>
              </TouchableOpacity>
              <Text style={styles.optionText}>Recordarme</Text>
              <TouchableOpacity disabled={loading}>
                <Text style={[
                  styles.optionText, 
                  styles.forgotPassword,
                  loading && styles.disabledText
                ]}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFF" />
                  <Text style={styles.loadingText}>Ingresando...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Ingresar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.push("RegisterScreen")}
              disabled={loading}
              style={styles.registerContainer}
            >
              <Text style={[
                styles.registerText,
                loading && styles.disabledText
              ]}>
                ¿Aún no tienes una cuenta?{" "}
                <Text style={styles.registerLink}>Regístrate</Text>
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "flex-start",
    width: "100%",
    maxWidth: "100%",
  },
  inner: {
    position: "absolute",
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    top: 0,
  },
  logoContainer: {
    alignSelf: "stretch",
    height: 200,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 80,
    overflow: "hidden",
  },
  logo: {
    marginTop: 30,
    resizeMode: "contain",
  },
  formContainer: {
    alignSelf: "stretch",
    paddingHorizontal: 40,
    marginTop: 30,
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
    borderColor: "#00c450",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checked: {
    width: 12,
    height: 12,
    backgroundColor: "#00c450",
    borderRadius: 3,
  },
  optionText: {
    fontSize: 14,
    color: "#666",
  },
  forgotPassword: {
    marginLeft: "auto",
    color: "#00c450",
    paddingLeft: 15,
  },
  loginButton: {
    backgroundColor: "#00c450",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  loginButtonDisabled: {
    backgroundColor: "#CCC",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFF",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "bold",
  },
  loginButtonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
  },
  registerContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  registerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },
  registerLink: {
    color: "#00c450",
    fontWeight: "bold",
  },
  disabledText: {
    opacity: 0.5,
  }
});