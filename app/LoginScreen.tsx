// app/LoginScreen.tsx - VERSIÓN ACTUALIZADA CON PIN + BIOMETRÍA
import React, { useState, useEffect } from "react";
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
  Alert,
} from "react-native";
import { useMutation } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// Imports del sistema de autenticación
import { LOGIN_MUTATION } from "./graphql/mutations.graphql";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { usePinAuth } from "@/hooks/usePinAuth";
import { PinInput } from "@/components/ui/PinInput";
import { BiometricSetupModal } from "@/components/BiometricSetupModal";
import { PinSetup } from "@/components/ui/PinSetup";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./interfaces/navigation";
import { useToast } from "./providers/ToastProvider";
import QuipukLogo from "@/assets/images/Logo.svg";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "/LoginScreen"
>;

interface UserProfile {
  id: number;
  email: string;
  username: string;
  deviceId?: string;
}

type AuthMethod = "biometric" | "pin" | "password" | "setup";

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const router = useRouter();
  const { showToast } = useToast();

  // Estados tradicionales del login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Estados del sistema de autenticación avanzada
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinError, setPinError] = useState<string>("");
  const [isNewUser, setIsNewUser] = useState(false);

  // Hooks de autenticación
  const {
    isAvailable: biometricAvailable,
    isEnabled: biometricEnabled,
    authenticate: authenticateBiometric,
  } = useBiometricAuth();

  const {
    pinConfig,
    verifyPin,
    isLoading: pinLoading,
  } = usePinAuth(userProfile?.id);

  // Mutation del login tradicional
  const [login, { loading: loginLoading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: async (data) => {
      const token = data?.login?.accessToken;
      const user = data?.login?.user;

      if (token && user) {
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("userId", user.id.toString());

        // Configurar perfil del usuario
        const profile: UserProfile = {
          id: user.id,
          email: user.email,
          username: user.username,
          deviceId: await generateDeviceId(), // Función para generar ID único del dispositivo
        };

        setUserProfile(profile);
        setIsNewUser(false); // Usuario existente

        // Determinar método de autenticación según configuración
        await determineAuthMethod(profile);

        showToast(
          "success",
          "¡Bienvenido!",
          "Has iniciado sesión correctamente"
        );
      }
    },
    onError: (error) => {
      console.log("Error al iniciar sesión:", error);

      if (error.message.includes("EMAIL_NOT_VERIFIED")) {
        try {
          const errorData = JSON.parse(error.message);
          showToast(
            "info",
            "Email no verificado",
            "Necesitas verificar tu email antes de iniciar sesión"
          );

          router.push({
            pathname: "/EmailVerificationScreen",
            params: {
              email: email,
              userId: errorData.userId?.toString(),
              fromRegistration: "false",
            },
          });
        } catch (parseError) {
          showToast(
            "info",
            "Email no verificado",
            "Por favor verifica tu email antes de iniciar sesión"
          );
        }
      } else if (error.message.includes("Usuario no encontrado")) {
        showToast(
          "error",
          "Usuario no encontrado",
          "Verifica tu email o regístrate"
        );
      } else if (error.message.includes("Contraseña incorrecta")) {
        showToast("error", "Contraseña incorrecta", "Verifica tu contraseña");
      } else {
        showToast("error", "Error en inicio de sesión", error.message);
      }
    },
  });

  // Función para generar ID único del dispositivo
  const generateDeviceId = async (): Promise<string> => {
    let deviceId = await AsyncStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = `quipuk_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await AsyncStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  };

  // Determinar método de autenticación según configuración del usuario
  const determineAuthMethod = async (profile: UserProfile) => {
    // Verificar si es un dispositivo nuevo o usuario sin configuración
    const hasPin = pinConfig.hasPin;
    const hasBiometric = biometricEnabled;

    console.log("🔍 Determinando método de auth:", {
      hasPin,
      hasBiometric,
      biometricAvailable,
      isNewUser,
    });

    // Si no tiene PIN ni biometría configurados, mostrar setup
    if (!hasPin && !hasBiometric) {
      setAuthMethod("setup");
      setShowPinSetup(true);
      return;
    }

    // Prioridad: Biometría > PIN > Contraseña
    if (hasBiometric && biometricAvailable) {
      setAuthMethod("biometric");
      setTimeout(() => handleBiometricAuth(), 500); // Delay para UX
      return;
    }

    if (hasPin) {
      setAuthMethod("pin");
      return;
    }

    // Fallback: ir directamente a la app si solo tiene login tradicional
    navigateToApp();
  };

  // Manejar login tradicional con email/contraseña
  const handleTraditionalLogin = () => {
    if (!email || !password) {
      showToast("error", "Error", "Todos los campos son obligatorios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("error", "Error", "Por favor ingresa un email válido.");
      return;
    }

    login({ variables: { email, password } });
  };

  // Manejar autenticación con Face ID
  const handleBiometricAuth = async () => {
    try {
      const result = await authenticateBiometric();

      if (result.success) {
        navigateToApp();
      } else if (result.requiresManualLogin) {
        // Fallback a PIN o contraseña
        if (pinConfig.hasPin) {
          setAuthMethod("pin");
        } else {
          setAuthMethod("password");
          showToast("info", "Face ID falló", "Por favor ingresa tu contraseña");
        }
      } else {
        Alert.alert("Face ID", result.error || "Autenticación fallida");
      }
    } catch (error) {
      console.error("Biometric auth error:", error);
      setAuthMethod(pinConfig.hasPin ? "pin" : "password");
    }
  };

  // Manejar autenticación con PIN
  const handlePinAuth = async (pin: string) => {
    if (!userProfile) return;

    try {
      const result = await verifyPin(pin);

      if (result.success) {
        navigateToApp();
      } else {
        setPinError(result.error || "PIN incorrecto");

        if (result.isLocked) {
          Alert.alert(
            "Cuenta bloqueada",
            `Tu cuenta está bloqueada por ${result.lockDuration} minutos debido a múltiples intentos fallidos.`,
            [
              {
                text: "Usar contraseña",
                onPress: () => setAuthMethod("password"),
              },
              { text: "OK" },
            ]
          );
        }
      }
    } catch (error) {
      setPinError("Error al verificar PIN");
    }
  };

  // Manejar completar setup de PIN
  const handlePinSetupComplete = (success: boolean) => {
    setShowPinSetup(false);

    if (success) {
      // Después de configurar PIN, ofrecer biometría si está disponible
      if (biometricAvailable) {
        setShowBiometricSetup(true);
      } else {
        navigateToApp();
      }
    } else {
      // Si rechaza el setup, ir directamente a la app
      navigateToApp();
    }
  };

  // Manejar completar setup de biometría
  const handleBiometricSetupComplete = (enabled: boolean) => {
    setShowBiometricSetup(false);

    if (enabled) {
      // Si habilitó biometría, usarla inmediatamente
      setAuthMethod("biometric");
      handleBiometricAuth();
    } else {
      // Si rechaza biometría, usar PIN o ir a la app
      if (pinConfig.hasPin) {
        setAuthMethod("pin");
      } else {
        navigateToApp();
      }
    }
  };

  // Navegar a la app principal
  const navigateToApp = () => {
    router.replace("/(tabs)");
  };

  // Volver al login tradicional
  const backToTraditionalLogin = () => {
    setAuthMethod("password");
    setUserProfile(null);
    setPinError("");
  };

  // Renderizar método de autenticación actual
  const renderAuthMethod = () => {
    switch (authMethod) {
      case "setup":
        return null; // Los modales se manejan por separado

      case "pin":
        return (
          <View style={styles.pinContainer}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>¡Hola de nuevo!</Text>
              <Text style={styles.userEmail}>{userProfile?.email}</Text>
            </View>

            <PinInput
              title="Ingresa tu PIN"
              subtitle="Usa tu PIN para acceder a Quipuk"
              maxLength={6}
              onComplete={handlePinAuth}
              disabled={pinLoading || pinConfig.isLocked}
              hasError={!!pinError}
              errorMessage={pinError}
              showForgotPin={true}
              onForgotPin={() => setAuthMethod("password")}
            />

            <TouchableOpacity
              style={styles.changeAccountButton}
              onPress={backToTraditionalLogin}
            >
              <Text style={styles.changeAccountText}>Cambiar de cuenta</Text>
            </TouchableOpacity>
          </View>
        );

      case "biometric":
        return (
          <View style={styles.biometricContainer}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>¡Hola de nuevo!</Text>
              <Text style={styles.userEmail}>{userProfile?.email}</Text>
            </View>

            <Text style={styles.biometricTitle}>Accede con Face ID</Text>

            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
            >
              <Ionicons name="scan" size={40} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fallbackButton}
              onPress={() =>
                setAuthMethod(pinConfig.hasPin ? "pin" : "password")
              }
            >
              <Text style={styles.fallbackText}>
                {pinConfig.hasPin ? "Usar PIN" : "Usar contraseña"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changeAccountButton}
              onPress={backToTraditionalLogin}
            >
              <Text style={styles.changeAccountText}>Cambiar de cuenta</Text>
            </TouchableOpacity>
          </View>
        );

      case "password":
      default:
        return (
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
              editable={!loginLoading}
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese su contraseña"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loginLoading}
            />

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                onPress={() => !loginLoading && setRememberMe(!rememberMe)}
                disabled={loginLoading}
                style={styles.checkboxContainer}
              >
                <View style={styles.checkbox}>
                  {rememberMe && <View style={styles.checked} />}
                </View>
                <Text style={styles.optionText}>Recordarme</Text>
              </TouchableOpacity>

              <TouchableOpacity disabled={loginLoading}>
                <Text
                  style={[
                    styles.optionText,
                    styles.forgotPassword,
                    loginLoading && styles.disabledText,
                  ]}
                >
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loginLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleTraditionalLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFF" />
                  <Text style={styles.loadingText}>Ingresando...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Ingresar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/RegisterScreen")}
              disabled={loginLoading}
              style={styles.registerContainer}
            >
              <Text
                style={[
                  styles.registerText,
                  loginLoading && styles.disabledText,
                ]}
              >
                ¿Aún no tienes una cuenta?{" "}
                <Text style={styles.registerLink}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <QuipukLogo width={90} style={styles.logo} />
          </View>

          {/* Método de autenticación actual */}
          {renderAuthMethod()}
        </View>
      </TouchableWithoutFeedback>

      {/* Modales */}
      {userProfile && (
        <>
          <PinSetup
            userId={userProfile.id}
            onComplete={handlePinSetupComplete}
            onSkip={() => handlePinSetupComplete(false)}
            visible={showPinSetup}
          />

          <BiometricSetupModal
            visible={showBiometricSetup}
            user={userProfile}
            onComplete={handleBiometricSetupComplete}
          />
        </>
      )}
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
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
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

  // Estilos para formulario tradicional
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
    justifyContent: "space-between",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    color: "#00c450",
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
  },

  // Estilos para autenticación biométrica
  biometricContainer: {
    alignSelf: "stretch",
    paddingHorizontal: 40,
    marginTop: 30,
    alignItems: "center",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
  },
  biometricTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 30,
    color: "#333",
  },
  biometricButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  fallbackButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  fallbackText: {
    color: "#007AFF",
    fontSize: 16,
  },

  // Estilos para autenticación con PIN
  pinContainer: {
    alignSelf: "stretch",
    paddingHorizontal: 20,
    marginTop: 30,
  },

  // Estilos compartidos
  changeAccountButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  changeAccountText: {
    color: "#666",
    fontSize: 14,
  },
});
