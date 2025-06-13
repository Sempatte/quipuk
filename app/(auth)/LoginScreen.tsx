import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import * as Haptics from 'expo-haptics';


import QuipukLogo from "@/assets/images/Logo.svg";
import { useToast } from "../providers/ToastProvider";
import { LOGIN_MUTATION } from "../graphql/mutations.graphql";
import { GET_USER_PROFILE } from "../graphql/users.graphql";
import { PinSetup } from "../components/ui/PinSetup";
import { PinInput } from "../components/ui/PinInput";
import { useAuth } from "../hooks/useAuth";
import { BiometricSetupModal } from "../components/BiometricSetupModal";

const { width, height } = Dimensions.get("window");

// Mover interfaces fuera del componente
interface UserProfile {
  id: number;
  email: string;
  username: string;
  fullName: string;
  profilePictureUrl?: string;
}

type AuthStep = 
  | "loading"
  | "biometric"
  | "pin"
  | "setup"
  | "blocked"
  | "traditional"
  | "registration";

interface AuthState {
  step: AuthStep;
  userProfile: UserProfile | null;
  error: string | null;
  attempts: number;
}

// Componentes memorizados
const UserProfileHeader = React.memo(({ userProfile }: { userProfile: UserProfile | null }) => {
  if (!userProfile) return null;

  return (
    <View style={styles.userInfo}>
      <View style={styles.avatarContainer}>
        {userProfile.profilePictureUrl ? (
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
        {userProfile.fullName || userProfile.username}
      </Text>
      <Text style={styles.userEmail}>{userProfile.email}</Text>
    </View>
  );
});

UserProfileHeader.displayName = 'UserProfileHeader';

// Extraer el formulario tradicional como componente separado
const TraditionalLoginForm = React.memo(({
  email,
  password,
  showPassword,
  loginLoading,
  isLinkedDevice,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onRegister
}: {
  email: string;
  password: string;
  showPassword: boolean;
  loginLoading: boolean;
  isLinkedDevice: boolean;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onTogglePassword: () => void;
  onSubmit: () => void;
  onRegister: () => void;
}) => {
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
            onChangeText={onEmailChange}
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
            onChangeText={onPasswordChange}
            editable={!loginLoading}
            autoComplete="password"
            textContentType="password"
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={onTogglePassword}
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

      <TouchableOpacity
        style={[styles.loginButton, loginLoading && styles.loginButtonDisabled]}
        onPress={onSubmit}
        disabled={loginLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={loginLoading ? ["#CCC", "#AAA"] : ["#00c450", "#00a040"]}
          style={styles.loginGradient}
        >
          <Text style={styles.loginButtonText}>Ingresar</Text>
        </LinearGradient>
      </TouchableOpacity>

      {!isLinkedDevice && (
        <TouchableOpacity
          onPress={onRegister}
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
});

TraditionalLoginForm.displayName = 'TraditionalLoginForm';

export default function LoginScreen() {
  console.log('[LoginScreen] Component rendered'); // Solo un log al inicio
  
  const router = useRouter();
  const { showToast } = useToast();

  // Estados del formulario tradicional
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estado principal de autenticación
  const [authState, setAuthState] = useState<AuthState>({
    step: "loading",
    userProfile: null,
    error: null,
    attempts: 0,
  });

  // Estados para modales
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [localAuthCompleted, setLocalAuthCompleted] = useState(false);

  // Hook de autenticación
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

  // Callbacks memorizados
  const navigateToApp = useCallback(() => {
    console.log("[LoginScreen] Navigating to app");
    setLocalAuthCompleted(true);
    router.replace("/(tabs)");
  }, [router]);

  const forceTraditionalLogin = useCallback(async (reason?: string) => {
    console.log(`[LoginScreen] Forcing traditional login: ${reason}`);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userId");
    setAuthState(prev => ({
      ...prev,
      step: "traditional",
      userProfile: null,
      error: reason || "Se requiere inicio de sesión manual."
    }));
    if (loadAuthState) {
      await loadAuthState(); 
    }
  }, [loadAuthState]);

  const handleTokenExpired = useCallback(() => {
    console.log("[LoginScreen] Token expired");
    forceTraditionalLogin("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
  }, [forceTraditionalLogin]);

  const handleBiometricAuth = useCallback(async () => {
    console.log("[LoginScreen] Biometric auth attempt");
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const result = await authenticateWithBiometric();
      
      if (result.success) {
        navigateToApp();
      } else if (result.requiresManualLogin) {
        if (hasPin) {
          setAuthState(prev => ({ ...prev, step: "pin" }));
          showToast("info", "Face ID falló", "Usa tu PIN para acceder");
        } else {
          forceTraditionalLogin("Falló Face ID y no hay PIN configurado.");
        }
      } else {
        Alert.alert(
          "Face ID",
          result.error || "Autenticación fallida",
          [
            { text: "Reintentar", onPress: handleBiometricAuth },
            { 
              text: hasPin ? "Usar PIN" : "Usar contraseña", 
              onPress: () => {
                if (hasPin) {
                  setAuthState(prev => ({ ...prev, step: "pin" }));
                } else {
                  forceTraditionalLogin("Fallback desde biométrico");
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("[LoginScreen] Biometric auth error:", error);
      if (hasPin) {
        setAuthState(prev => ({ ...prev, step: "pin", error: "Error en autenticación biométrica." }));
      } else {
        forceTraditionalLogin("Error en autenticación biométrica");
      }
    }
  }, [authenticateWithBiometric, navigateToApp, hasPin, showToast, forceTraditionalLogin]);

  // Query para datos del usuario
  const { data: userProfileData, loading: profileLoading, refetch: refetchProfile } = useQuery(
    GET_USER_PROFILE,
    {
      skip: !linkedUserId,
      fetchPolicy: 'cache-first',
      errorPolicy: 'ignore',
      onCompleted: (data) => {
        if (data?.getUserProfile) {
          setAuthState(prev => ({
            ...prev,
            userProfile: {
              id: data.getUserProfile.id,
              email: data.getUserProfile.email,
              username: data.getUserProfile.username,
              fullName: data.getUserProfile.fullName,
              profilePictureUrl: data.getUserProfile.profilePictureUrl
            }
          }));
        }
      },
      onError: (error) => {
        console.warn("Error loading user profile:", error);
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

          setAuthState(prev => ({ ...prev, userProfile: profile }));
          await handleSuccessfulLogin(profile);
        } catch (error) {
          console.error("Error storing auth data:", error);
          showToast("error", "Error", "No se pudieron guardar los datos de sesión");
        }
      }
    },
    onError: (error) => {
      handleLoginError(error.message);
    },
  });

  // Determinar paso de autenticación
  const determineAuthStep = useCallback(async () => {
    if (localAuthCompleted) return;
    
    try {
      if (authLoading || profileLoading) {
        setAuthState(prev => ({ ...prev, step: "loading" }));
        return;
      }

      if (!isLinkedDevice || !linkedUserId) {
        setAuthState(prev => ({ 
          ...prev, 
          step: "traditional",
          userProfile: null 
        }));
        return;
      }

      let userProfile = authState.userProfile;
      if (!userProfile && userProfileData?.getUserProfile) {
        userProfile = {
          id: userProfileData.getUserProfile.id,
          email: userProfileData.getUserProfile.email,
          username: userProfileData.getUserProfile.username,
          fullName: userProfileData.getUserProfile.fullName,
          profilePictureUrl: userProfileData.getUserProfile.profilePictureUrl
        };
        setAuthState(prev => ({ ...prev, userProfile }));
      }

      if (pinConfig.isLocked) {
        setAuthState(prev => ({ ...prev, step: "blocked" }));
        return;
      }

      if (canUseBiometric) {
        setAuthState(prev => ({ ...prev, step: "biometric" }));
        setTimeout(() => handleBiometricAuth(), 1000);
        return;
      }

      if (hasPin) {
        setAuthState(prev => ({ ...prev, step: "pin" }));
        return;
      }

      setAuthState(prev => ({ ...prev, step: "setup" }));
      setShowPinSetup(true);

    } catch (error) {
      console.error("[LoginScreen] determineAuthStep error:", error);
      setAuthState(prev => ({ 
        ...prev, 
        step: "traditional",
        error: "Error de configuración"
      }));
    }
  }, [
    localAuthCompleted, 
    authLoading, 
    profileLoading, 
    isLinkedDevice, 
    linkedUserId, 
    authState.userProfile,
    userProfileData, 
    pinConfig.isLocked, 
    canUseBiometric, 
    hasPin, 
    handleBiometricAuth
  ]);

  useEffect(() => {
    if (!localAuthCompleted) {
      determineAuthStep();
    }
  }, [determineAuthStep, localAuthCompleted]);

  // Handlers optimizados con useCallback
  const handlePinAuth = useCallback(async (pin: string) => {
    try {
      const result = await verifyPin(pin);

      if (result.success && result.token) {
        await AsyncStorage.setItem('token', result.token);
        if (result.user) {
          await AsyncStorage.setItem('userProfile', JSON.stringify(result.user));
        }
        if (loadAuthState) {
          await loadAuthState();
        }
        setTimeout(() => {
          navigateToApp();
        }, 300);
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          error: result.error || "PIN incorrecto",
          attempts: prev.attempts + 1 
        }));

        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        if (result.isLocked) {
          setAuthState(prev => ({ ...prev, step: "blocked" }));
          Alert.alert(
            "Dispositivo bloqueado",
            `Tu dispositivo está bloqueado por ${result.lockDuration} minutos debido a múltiples intentos fallidos.`,
            [
              {
                text: "Usar contraseña",
                onPress: () => {
                  setAuthState(prev => ({ 
                    ...prev, 
                    step: "traditional",
                    userProfile: null 
                  }));
                },
              },
              { text: "OK" },
            ]
          );
        }
      }
    } catch (error) {
      console.error("PIN verification error:", error);
      setAuthState(prev => ({ 
        ...prev, 
        error: "Error al verificar PIN" 
      }));
    }
  }, [verifyPin, loadAuthState, navigateToApp]);

  const handleTraditionalLogin = useCallback(() => {
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
  }, [email, password, login, showToast]);

  const handleSuccessfulLogin = useCallback(async (profile: UserProfile) => {
    try {
      if (!isLinkedDevice) {
        const linkSuccess = await linkDevice(profile.id);
        
        if (!linkSuccess) {
          showToast("error", "Error", "No se pudo vincular el dispositivo");
          return;
        }

        setAuthState(prev => ({ ...prev, step: "setup" }));
        setShowPinSetup(true);
        return;
      }

      const canAccess = await canUserAccessDevice(profile.id);
      if (!canAccess) {
        showToast("error", "Acceso denegado", "Este dispositivo está vinculado a otra cuenta");
        await AsyncStorage.multiRemove(["token", "userId"]);
        setAuthState(prev => ({ ...prev, step: "traditional" }));
        return;
      }

      navigateToApp();
      
    } catch (error) {
      console.error("Error handling successful login:", error);
      showToast("error", "Error", "Hubo un problema procesando el login");
    }
  }, [isLinkedDevice, linkDevice, canUserAccessDevice, navigateToApp, showToast]);

  const handleLoginError = useCallback((errorMessage: string) => {
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
    } else {
      showToast("error", "Error de login", errorMessage);
    }
  }, [email, router, showToast]);

  const handlePinSetupComplete = useCallback(async (success: boolean) => {
    setShowPinSetup(false);

    if (success) {
      if (canUseBiometric) {
        setShowBiometricSetup(true);
      } else {
        navigateToApp();
      }
    } else {
      navigateToApp();
    }
  }, [canUseBiometric, navigateToApp]);

  const handleBiometricSetupComplete = useCallback((enabled: boolean) => {
    setShowBiometricSetup(false);

    if (enabled) {
      setAuthState(prev => ({ ...prev, step: "biometric" }));
      setTimeout(() => handleBiometricAuth(), 500);
    } else {
      navigateToApp();
    }
  }, [handleBiometricAuth, navigateToApp]);

  // Memoizar el contenido renderizado
  const renderContent = useMemo(() => {
    switch (authState.step) {
      case "loading":
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00c450" />
            <Text style={styles.loadingText}>
              {authLoading ? "Verificando dispositivo..." : "Cargando perfil..."}
            </Text>
          </View>
        );

      case "blocked":
        return (
          <View style={styles.centeredContainer}>
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
              onPress={() => forceTraditionalLogin()}
            >
              <Text style={styles.fallbackText}>Iniciar sesión con contraseña</Text>
            </TouchableOpacity>
          </View>
        );

      case "setup":
        return (
          <View style={styles.centeredContainer}>
            <Ionicons name="settings-outline" size={64} color="#00c450" />
            <Text style={styles.setupTitle}>Configuración Inicial</Text>
            <Text style={styles.setupMessage}>
              Configura un PIN para acceder rápidamente a tu cuenta en este dispositivo.
            </Text>
          </View>
        );

      case "pin":
        return (
          <View style={styles.authContainer}>
            <UserProfileHeader userProfile={authState.userProfile} />

            <PinInput
              title="Ingresa tu PIN"
              subtitle="Usa tu PIN para acceder a Quipuk"
              maxLength={6}
              onComplete={handlePinAuth}
              disabled={loginLoading}
              hasError={!!authState.error}
              errorMessage={authState.error || undefined}
              showForgotPin={true}
              onForgotPin={() => forceTraditionalLogin()}
            />

            <TouchableOpacity
              style={styles.changeAccountButton}
              onPress={() => forceTraditionalLogin()}
            >
              <Text style={styles.changeAccountText}>Cambiar de cuenta</Text>
            </TouchableOpacity>
          </View>
        );

      case "biometric":
        return (
          <View style={styles.authContainer}>
            <UserProfileHeader userProfile={authState.userProfile} />

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
                onPress={() => forceTraditionalLogin()}
              >
                <Text style={styles.fallbackText}>
                  {hasPin ? "Usar PIN" : "Usar contraseña"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.changeAccountButton}
              onPress={() => forceTraditionalLogin()}
            >
              <Text style={styles.changeAccountText}>Cambiar de cuenta</Text>
            </TouchableOpacity>
          </View>
        );

      case "traditional":
        return (
          <TraditionalLoginForm
            email={email}
            password={password}
            showPassword={showPassword}
            loginLoading={loginLoading}
            isLinkedDevice={isLinkedDevice}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onSubmit={handleTraditionalLogin}
            onRegister={() => router.push("/RegisterScreen")}
          />
        );

      default:
        return (
          <TraditionalLoginForm
            email={email}
            password={password}
            showPassword={showPassword}
            loginLoading={loginLoading}
            isLinkedDevice={isLinkedDevice}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onSubmit={handleTraditionalLogin}
            onRegister={() => router.push("/RegisterScreen")}
          />
        );
    }
  }, [
    authState,
    authLoading,
    pinConfig.lockedUntil,
    email,
    password,
    showPassword,
    loginLoading,
    isLinkedDevice,
    handlePinAuth,
    handleBiometricAuth,
    handleTraditionalLogin,
    forceTraditionalLogin,
    hasPin,
    router
  ]);

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
              {renderContent}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {authState.userProfile && (
        <>
          <PinSetup
            userId={authState.userProfile.id}
            onComplete={handlePinSetupComplete}
            onSkip={() => handlePinSetupComplete(false)}
            visible={showPinSetup}
          />

          <BiometricSetupModal
            visible={showBiometricSetup}
            user={authState.userProfile}
            onComplete={handleBiometricSetupComplete}
          />
        </>
      )}
    </SafeAreaView>
  );
}

// 🎨 ESTILOS OPTIMIZADOS
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

  // Loading State
  loadingContainer: {
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

  // Centered States (blocked, setup)
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
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

  // Auth Container (PIN, Biometric)
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

  // Biometric Section
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

  // Traditional Form
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

  // Form Inputs
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

  // Login Button
  loginButton: {
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 24,
    marginTop: 16,
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
  loginButtonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
    fontFamily: "Outfit_600SemiBold",
  },

  // Register Link
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
  disabledText: {
    opacity: 0.5,
  },
});