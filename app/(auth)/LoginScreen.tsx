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
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useMutation } from "@apollo/client";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Imports del sistema de autenticación
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { usePinAuth } from "@/hooks/usePinAuth";
import { PinInput } from "@/components/ui/PinInput";
import { BiometricSetupModal } from "@/components/BiometricSetupModal";
import { PinSetup } from "@/components/ui/PinSetup";

import QuipukLogo from "@/assets/images/Logo.svg";
import { useToast } from "../providers/ToastProvider";
import { LOGIN_MUTATION } from "../graphql/mutations.graphql";
import { useBlackStatusBar } from "@/hooks/useStatusBar";

const { width, height } = Dimensions.get("window");

interface UserProfile {
  id: number;
  email: string;
  username: string;
  deviceId?: string;
}

type AuthMethod = "biometric" | "pin" | "password" | "setup";

export default function LoginScreen() {
  // 🖤 HOOK CENTRALIZADO PARA STATUSBAR
  useBlackStatusBar();

  const router = useRouter();
  const { showToast } = useToast();

  // Estados tradicionales del login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

        const profile: UserProfile = {
          id: user.id,
          email: user.email,
          username: user.username,
          deviceId: await generateDeviceId(),
        };

        setUserProfile(profile);
        setIsNewUser(false);
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

  // Funciones auxiliares
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

  const determineAuthMethod = async (profile: UserProfile) => {
    const hasPin = pinConfig.hasPin;
    const hasBiometric = biometricEnabled;

    if (!hasPin && !hasBiometric) {
      setAuthMethod("setup");
      setShowPinSetup(true);
      return;
    }

    if (hasBiometric && biometricAvailable) {
      setAuthMethod("biometric");
      setTimeout(() => handleBiometricAuth(), 500);
      return;
    }

    if (hasPin) {
      setAuthMethod("pin");
      return;
    }

    navigateToApp();
  };

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

  const handleBiometricAuth = async () => {
    try {
      const result = await authenticateBiometric();

      if (result.success) {
        navigateToApp();
      } else if (result.requiresManualLogin) {
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

  const handlePinSetupComplete = (success: boolean) => {
    setShowPinSetup(false);

    if (success) {
      if (biometricAvailable) {
        setShowBiometricSetup(true);
      } else {
        navigateToApp();
      }
    } else {
      navigateToApp();
    }
  };

  const handleBiometricSetupComplete = (enabled: boolean) => {
    setShowBiometricSetup(false);

    if (enabled) {
      setAuthMethod("biometric");
      handleBiometricAuth();
    } else {
      if (pinConfig.hasPin) {
        setAuthMethod("pin");
      } else {
        navigateToApp();
      }
    }
  };

  const navigateToApp = () => {
    router.replace("/(tabs)");
  };

  const backToTraditionalLogin = () => {
    setAuthMethod("password");
    setUserProfile(null);
    setPinError("");
  };

  // Renderizar método de autenticación actual
  const renderAuthMethod = () => {
    switch (authMethod) {
      case "setup":
        return null;

      case "pin":
        return (
          <View style={styles.authContainer}>
            <View style={styles.userInfo}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color="#FFF" />
              </View>
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
          <View style={styles.authContainer}>
            <View style={styles.userInfo}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color="#FFF" />
              </View>
              <Text style={styles.welcomeText}>¡Hola de nuevo!</Text>
              <Text style={styles.userEmail}>{userProfile?.email}</Text>
            </View>

            <View style={styles.biometricSection}>
              <Text style={styles.biometricTitle}>Accede con Face ID</Text>
              <Text style={styles.biometricSubtitle}>
                Toca el botón para autenticarte
              </Text>

              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricAuth}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#007AFF", "#0056CC"]}
                  style={styles.biometricGradient}
                >
                  <Ionicons name="scan" size={40} color="white" />
                </LinearGradient>
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
            </View>

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
            <Text style={styles.welcomeTitle}>
              Bienvenido a <Text style={styles.brandName}>Quipuk</Text>
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Inicia sesión para continuar
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color="#666" 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loginLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color="#666" 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Tu contraseña"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loginLoading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loginLoading}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                onPress={() => !loginLoading && setRememberMe(!rememberMe)}
                disabled={loginLoading}
                style={styles.checkboxContainer}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text style={styles.checkboxText}>Recordarme</Text>
              </TouchableOpacity>

              <TouchableOpacity disabled={loginLoading}>
                <Text style={[styles.forgotPassword, loginLoading && styles.disabledText]}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loginLoading && styles.loginButtonDisabled]}
              onPress={handleTraditionalLogin}
              disabled={loginLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loginLoading ? ["#CCC", "#AAA"] : ["#00c450", "#00a040"]}
                style={styles.loginGradient}
              >
                {loginLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={styles.loginButtonText}>Ingresando...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Ingresar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity
              onPress={() => router.push("/RegisterScreen")}
              disabled={loginLoading}
              style={styles.registerContainer}
            >
              <Text style={[styles.registerText, loginLoading && styles.disabledText]}>
                ¿Aún no tienes una cuenta?{" "}
                <Text style={styles.registerLink}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header with Logo */}
            <LinearGradient
              colors={["#000000", "#1a1a1a"]}
              style={styles.logoContainer}
            >
              <QuipukLogo width={120} height={60} />
            </LinearGradient>

            {/* Auth Content */}
            <View style={styles.contentContainer}>
              {renderAuthMethod()}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: height * 0.25,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },

  formContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Outfit_700Bold",
  },
  brandName: {
    color: "#00c450",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "Outfit_400Regular",
  },

  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    fontFamily: "Outfit_600SemiBold",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E8EB",
    paddingHorizontal: 16,
    minHeight: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Outfit_400Regular",
  },
  passwordInput: {
    paddingRight: 0,
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },

  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E5E8EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#FFF",
  },
  checkboxChecked: {
    backgroundColor: "#00c450",
    borderColor: "#00c450",
  },
  checkboxText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Outfit_400Regular",
  },
  forgotPassword: {
    fontSize: 14,
    color: "#00c450",
    fontFamily: "Outfit_500Medium",
  },

  loginButton: {
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#00c450",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  loginGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
    fontFamily: "Outfit_600SemiBold",
  },

  registerContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  registerText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Outfit_400Regular",
  },
  registerLink: {
    color: "#00c450",
    fontWeight: "600",
    fontFamily: "Outfit_600SemiBold",
  },

  authContainer: {
    flex: 1,
    alignItems: "center",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00c450",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    fontFamily: "Outfit_700Bold",
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Outfit_400Regular",
  },

  biometricSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  biometricTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    fontFamily: "Outfit_600SemiBold",
  },
  biometricSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
    fontFamily: "Outfit_400Regular",
  },
  biometricButton: {
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  biometricGradient: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  fallbackText: {
    color: "#007AFF",
    fontSize: 16,
    fontFamily: "Outfit_500Medium",
  },

  changeAccountButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  changeAccountText: {
    color: "#666",
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
  },
  disabledText: {
    opacity: 0.5,
  },
});