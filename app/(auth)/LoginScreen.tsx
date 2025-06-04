// app/(auth)/LoginScreen.tsx - PRODUCTION READY
import React, { useState, useEffect, useCallback } from "react";
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { PinInput } from "@/components/ui/PinInput";
import { BiometricSetupModal } from "@/components/BiometricSetupModal";
import { PinSetup } from "@/components/ui/PinSetup";

import QuipukLogo from "@/assets/images/Logo.svg";
import { useToast } from "../providers/ToastProvider";
import { LOGIN_MUTATION } from "../graphql/mutations.graphql";
import { GET_USER_PROFILE } from "../graphql/users.graphql";
import { useAuth } from "@/hooks/useAuth";

const { width, height } = Dimensions.get("window");

interface UserProfile {
  id: number;
  email: string;
  username: string;
  fullName: string;
  profilePictureUrl?: string;
}

type AuthMethod = "biometric" | "pin" | "password" | "setup" | "blocked";

export default function ProductionLoginScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  // Estados del formulario tradicional
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estados del sistema de autenticación avanzada
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinError, setPinError] = useState<string>("");

  // Hook de autenticación mejorada
  const {
    isLoading: authLoading,
    isLinkedDevice,
    linkedUserId,
    canUseBiometric,
    hasPin,
    pinConfig,
    linkDevice,
    authenticateWithBiometric,
    verifyPin,
    canUserAccessDevice,
    loadAuthState
  } = useAuth();

  // Query para obtener datos del usuario (solo cuando tenemos token)
  const { data: userProfileData, loading: profileLoading, refetch: refetchProfile } = useQuery(
    GET_USER_PROFILE,
    {
      skip: !linkedUserId, // Solo ejecutar si hay usuario vinculado
      fetchPolicy: 'cache-first',
      errorPolicy: 'ignore', // Ignorar errores para evitar crashes
      onCompleted: (data) => {
        if (data?.getUserProfile) {
          setUserProfile({
            id: data.getUserProfile.id,
            email: data.getUserProfile.email,
            username: data.getUserProfile.username,
            fullName: data.getUserProfile.fullName,
            profilePictureUrl: data.getUserProfile.profilePictureUrl
          });
        }
      },
      onError: (error) => {
        console.warn("Error loading user profile:", error);
        // Si hay error de token, limpiar datos
        if (error.message.includes("token") || error.message.includes("unauthorized")) {
          handleTokenExpired();
        }
      }
    }
  );

  // Mutation del login tradicional
  const [login, { loading: loginLoading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: async (data) => {
      const token = data?.login?.accessToken;
      const user = data?.login?.user;

      if (token && user) {
        try {
          await AsyncStorage.setItem("token", token);
          await AsyncStorage.setItem("userId", user.id.toString());

          const profile: UserProfile = {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName || user.username,
            profilePictureUrl: user.profilePictureUrl
          };

          setUserProfile(profile);
          await handleSuccessfulLogin(profile);
        } catch (error) {
          console.error("Error storing auth data:", error);
          showToast("error", "Error", "No se pudieron guardar los datos de sesión");
        }
      }
    },
    onError: (error) => {
      console.log("Login error:", error);
      handleLoginError(error.message);
    },
  });

  // 🔧 FUNCIÓN PARA CARGAR DATOS DEL USUARIO DESDE STORAGE/API
  const loadUserFromStorage = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const [storedUserId, token] = await Promise.all([
        AsyncStorage.getItem("userId"),
        AsyncStorage.getItem("token")
      ]);

      if (!storedUserId || !token) {
        return null;
      }

      // Si tenemos datos en el query, usarlos
      if (userProfileData?.getUserProfile) {
        return {
          id: userProfileData.getUserProfile.id,
          email: userProfileData.getUserProfile.email,
          username: userProfileData.getUserProfile.username,
          fullName: userProfileData.getUserProfile.fullName,
          profilePictureUrl: userProfileData.getUserProfile.profilePictureUrl
        };
      }

      // Si no, intentar refetch
      try {
        const { data } = await refetchProfile();
        if (data?.getUserProfile) {
          return {
            id: data.getUserProfile.id,
            email: data.getUserProfile.email,
            username: data.getUserProfile.username,
            fullName: data.getUserProfile.fullName,
            profilePictureUrl: data.getUserProfile.profilePictureUrl
          };
        }
      } catch (refetchError) {
        console.warn("Error refetching profile:", refetchError);
      }

      // Fallback: crear perfil mínimo desde storage
      return {
        id: parseInt(storedUserId, 10),
        email: "usuario@ejemplo.com", // Se actualizará cuando cargue la API
        username: "Usuario",
        fullName: "Usuario"
      };

    } catch (error) {
      console.error("Error loading user from storage:", error);
      return null;
    }
  }, [userProfileData, refetchProfile]);

  // 🔧 FUNCIÓN PARA MANEJAR TOKEN EXPIRADO
  const handleTokenExpired = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(["token", "userId"]);
      setUserProfile(null);
      setAuthMethod("password");
      await loadAuthState(); // Recargar estado de auth
    } catch (error) {
      console.error("Error handling token expiration:", error);
    }
  }, [loadAuthState]);

  // Efecto para determinar método de autenticación al cargar
  useEffect(() => {
    if (authLoading || profileLoading) return;

    determineInitialAuthMethod();
  }, [authLoading, profileLoading, isLinkedDevice, linkedUserId, canUseBiometric, hasPin, pinConfig]);

  const determineInitialAuthMethod = async () => {
    try {
      if (!isLinkedDevice || !linkedUserId) {
        // Dispositivo no vinculado - mostrar login tradicional
        setAuthMethod("password");
        return;
      }

      if (pinConfig.isLocked) {
        // Dispositivo bloqueado
        setAuthMethod("blocked");
        return;
      }

      // 🔧 CARGAR DATOS REALES DEL USUARIO
      const loadedProfile = await loadUserFromStorage();
      if (loadedProfile) {
        setUserProfile(loadedProfile);

        // Dispositivo vinculado - usar método preferido
        if (canUseBiometric) {
          setAuthMethod("biometric");
          // Auto-intentar biometría después de un breve delay
          setTimeout(() => handleBiometricAuth(), 800);
        } else if (hasPin) {
          setAuthMethod("pin");
        } else {
          // Dispositivo vinculado pero sin métodos de auth configurados
          setAuthMethod("setup");
          setShowPinSetup(true);
        }
      } else {
        // No se pudieron cargar datos del usuario
        console.warn("Could not load user data, falling back to password login");
        setAuthMethod("password");
      }

    } catch (error) {
      console.error("Error determining auth method:", error);
      setAuthMethod("password");
    }
  };

  const handleSuccessfulLogin = async (profile: UserProfile) => {
    try {
      if (!isLinkedDevice) {
        // Primer login - vincular dispositivo
        const linkSuccess = await linkDevice(profile.id);
        
        if (!linkSuccess) {
          showToast("error", "Error", "No se pudo vincular el dispositivo");
          return;
        }

        // Después de vincular, configurar PIN
        setAuthMethod("setup");
        setShowPinSetup(true);
        return;
      }

      // Verificar que el usuario puede acceder a este dispositivo
      const canAccess = await canUserAccessDevice(profile.id);
      if (!canAccess) {
        showToast("error", "Acceso denegado", "Este dispositivo está vinculado a otra cuenta");
        await AsyncStorage.multiRemove(["token", "userId"]);
        setAuthMethod("password");
        return;
      }

      // Login exitoso - ir a la app
      navigateToApp();
      
    } catch (error) {
      console.error("Error handling successful login:", error);
      showToast("error", "Error", "Hubo un problema procesando el login");
    }
  };

  const handleLoginError = (errorMessage: string) => {
    // Limpiar campos en caso de error
    setPassword("");
    
    if (errorMessage.includes("EMAIL_NOT_VERIFIED")) {
      try {
        const errorData = JSON.parse(errorMessage);
        showToast("info", "Email no verificado", "Necesitas verificar tu email");
        
        router.push({
          pathname: "/EmailVerificationScreen",
          params: {
            email: email,
            userId: errorData.userId?.toString(),
            fromRegistration: "false",
          },
        });
      } catch (parseError) {
        showToast("info", "Email no verificado", "Verifica tu email antes de iniciar sesión");
      }
    } else if (errorMessage.includes("DEVICE_ALREADY_LINKED")) {
      showToast("error", "Dispositivo no autorizado", "Este dispositivo ya está vinculado a otra cuenta");
    } else if (errorMessage.includes("Usuario no encontrado") || errorMessage.includes("User not found")) {
      showToast("error", "Usuario no encontrado", "Verifica tu email o regístrate");
    } else if (errorMessage.includes("Contraseña incorrecta") || errorMessage.includes("Invalid password")) {
      showToast("error", "Contraseña incorrecta", "Verifica tu contraseña");
    } else if (errorMessage.includes("token") || errorMessage.includes("unauthorized")) {
      handleTokenExpired();
    } else {
      showToast("error", "Error de login", errorMessage);
    }
  };

  const handleTraditionalLogin = () => {
    if (!email || !password) {
      showToast("error", "Error", "Todos los campos son obligatorios");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("error", "Error", "Ingresa un email válido");
      return;
    }

    login({ variables: { email: email.toLowerCase().trim(), password } });
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await authenticateWithBiometric();

      if (result.success) {
        navigateToApp();
      } else if (result.requiresManualLogin) {
        if (hasPin) {
          setAuthMethod("pin");
          showToast("info", "Face ID falló", "Usa tu PIN para acceder");
        } else {
          setAuthMethod("password");
          setUserProfile(null);
          showToast("info", "Face ID falló", "Inicia sesión con tu contraseña");
        }
      } else {
        Alert.alert("Face ID", result.error || "Autenticación fallida");
      }
    } catch (error) {
      console.error("Biometric auth error:", error);
      if (hasPin) {
        setAuthMethod("pin");
      } else {
        setAuthMethod("password");
        setUserProfile(null);
      }
    }
  };

  const handlePinAuth = async (pin: string) => {
    try {
      setPinError(""); // Limpiar error previo
      const result = await verifyPin(pin);

      if (result.success) {
        navigateToApp();
      } else {
        setPinError(result.error || "PIN incorrecto");

        if (result.isLocked) {
          setAuthMethod("blocked");
          Alert.alert(
            "Dispositivo bloqueado",
            `Tu dispositivo está bloqueado por ${result.lockDuration} minutos debido a múltiples intentos fallidos.`,
            [
              {
                text: "Usar contraseña",
                onPress: () => {
                  setAuthMethod("password");
                  setUserProfile(null);
                },
              },
              { text: "OK" },
            ]
          );
        }
      }
    } catch (error) {
      console.error("PIN verification error:", error);
      setPinError("Error al verificar PIN");
    }
  };

  const handlePinSetupComplete = async (success: boolean) => {
    setShowPinSetup(false);

    if (success) {
      // PIN creado exitosamente
      if (canUseBiometric) {
        setShowBiometricSetup(true);
      } else {
        navigateToApp();
      }
    } else {
      // Usuario saltó la configuración del PIN
      navigateToApp();
    }
  };

  const handleBiometricSetupComplete = (enabled: boolean) => {
    setShowBiometricSetup(false);

    if (enabled) {
      setAuthMethod("biometric");
      setTimeout(() => handleBiometricAuth(), 500);
    } else {
      navigateToApp();
    }
  };

  const navigateToApp = () => {
    router.replace("/(tabs)");
  };

  const backToTraditionalLogin = () => {
    setAuthMethod("password");
    setUserProfile(null);
    setPinError("");
    setEmail("");
    setPassword("");
  };

  // 🔧 FUNCIÓN PARA OBTENER AVATAR DEL USUARIO
  const getUserAvatar = () => {
    if (userProfile?.profilePictureUrl) {
      return { uri: userProfile.profilePictureUrl };
    }
    return null;
  };

  const renderAuthMethod = () => {
    switch (authMethod) {
      case "blocked":
        return (
          <View style={styles.authContainer}>
            <View style={styles.blockedContainer}>
              <Ionicons name="lock-closed" size={64} color="#E74C3C" />
              <Text style={styles.blockedTitle}>Dispositivo Bloqueado</Text>
              <Text style={styles.blockedMessage}>
                Tu dispositivo está bloqueado por demasiados intentos fallidos.
                {pinConfig.lockedUntil && (
                  ` Intenta nuevamente después de las ${pinConfig.lockedUntil.toLocaleTimeString()}.`
                )}
              </Text>
              
              <TouchableOpacity
                style={styles.fallbackButton}
                onPress={backToTraditionalLogin}
              >
                <Text style={styles.fallbackText}>Iniciar sesión con contraseña</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "setup":
        return (
          <View style={styles.authContainer}>
            <View style={styles.setupContainer}>
              <Ionicons name="settings-outline" size={64} color="#00c450" />
              <Text style={styles.setupTitle}>Configuración Inicial</Text>
              <Text style={styles.setupMessage}>
                Configura un PIN para acceder rápidamente a tu cuenta en este dispositivo.
              </Text>
            </View>
          </View>
        );

      case "pin":
        return (
          <View style={styles.authContainer}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                {userProfile?.profilePictureUrl ? (
                  <Image 
                    source={{ uri: userProfile.profilePictureUrl }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={32} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={styles.welcomeText}>¡Hola de nuevo!</Text>
              <Text style={styles.userDisplayName}>
                {userProfile?.fullName || userProfile?.username || "Usuario"}
              </Text>
              <Text style={styles.userEmail}>{userProfile?.email}</Text>
            </View>

            <PinInput
              title="Ingresa tu PIN"
              subtitle="Usa tu PIN para acceder a Quipuk"
              maxLength={6}
              onComplete={handlePinAuth}
              disabled={authLoading}
              hasError={!!pinError}
              errorMessage={pinError}
              showForgotPin={true}
              onForgotPin={backToTraditionalLogin}
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
              <View style={styles.avatarContainer}>
                {userProfile?.profilePictureUrl ? (
                  <Image 
                    source={{ uri: userProfile.profilePictureUrl }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={32} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={styles.welcomeText}>¡Hola de nuevo!</Text>
              <Text style={styles.userDisplayName}>
                {userProfile?.fullName || userProfile?.username || "Usuario"}
              </Text>
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
                onPress={() => setAuthMethod(hasPin ? "pin" : "password")}
              >
                <Text style={styles.fallbackText}>
                  {hasPin ? "Usar PIN" : "Usar contraseña"}
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
              {isLinkedDevice ? "Inicia sesión para continuar" : "Inicia sesión o regístrate"}
            </Text>

            {isLinkedDevice && (
              <View style={styles.deviceLinkedNotice}>
                <Ionicons name="phone-portrait" size={20} color="#00c450" />
                <Text style={styles.deviceLinkedText}>
                  Este dispositivo está registrado
                </Text>
              </View>
            )}

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
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>
            </View>

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
                  autoComplete="password"
                  textContentType="password"
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

            <View style={styles.optionsContainer}>
              <TouchableOpacity disabled={loginLoading}>
                <Text style={[styles.forgotPassword, loginLoading && styles.disabledText]}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

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

            {!isLinkedDevice && (
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
            )}
          </View>
        );
    }
  };

  if (authLoading || profileLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar style="light" />
        <View style={styles.loadingScreen}>
          <QuipukLogo width={120} height={60} />
          <ActivityIndicator size="large" color="#00c450" style={{ marginTop: 30 }} />
          <Text style={styles.loadingText}>
            {authLoading ? "Verificando dispositivo..." : "Cargando perfil..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <LinearGradient
              colors={["#000000", "#1a1a1a"]}
              style={styles.logoContainer}
            >
              <QuipukLogo width={120} height={60} />
            </LinearGradient>

            <View style={styles.contentContainer}>
              {renderAuthMethod()}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

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
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontFamily: "Outfit_400Regular",
  },

  // Estados especiales
  blockedContainer: {
    alignItems: "center",
    padding: 20,
  },
  blockedTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#E74C3C",
    marginTop: 20,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "Outfit_700Bold",
  },
  blockedMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    fontFamily: "Outfit_400Regular",
  },
  setupContainer: {
    alignItems: "center",
    padding: 20,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 20,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "Outfit_700Bold",
  },
  setupMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "Outfit_400Regular",
  },

  // Formulario tradicional
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
    marginBottom: 24,
    fontFamily: "Outfit_400Regular",
  },
  deviceLinkedNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  deviceLinkedText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#2D5016",
    fontFamily: "Outfit_500Medium",
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
    alignItems: "flex-end",
    marginBottom: 24,
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

  // Estados de autenticación avanzada
  authContainer: {
    flex: 1,
    alignItems: "center",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00c450",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
    fontFamily: "Outfit_700Bold",
  },
  userDisplayName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    fontFamily: "Outfit_600SemiBold",
  },
  userEmail: {
    fontSize: 14,
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