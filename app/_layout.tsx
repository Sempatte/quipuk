import React, { useEffect, useState, useRef } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Platform } from "react-native";
import { ApolloProvider } from "@apollo/client";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from "./apolloClient";
import { FontProvider } from "./providers/FontProvider";
import { useColorScheme } from "@/app/hooks/useColorScheme";
import { useFonts, Outfit_100Thin, Outfit_200ExtraLight, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_500Medium, Outfit_300Light } from "@expo-google-fonts/outfit";
import { ToastProvider } from "./providers/ToastProvider";
import { useBackendHealth } from "@/app/hooks/useBackendHealth";
import { OfflineMessage } from "@/app/components/OfflineMessage";
import { useAuth } from "@/app/hooks/useAuth";
import { PinInput } from "@/app/components/ui/PinInput";
import * as Haptics from 'expo-haptics';
import { Ionicons } from "@expo/vector-icons";
import { pinService } from "@/app/services/pinService";
import { StatusBar } from 'expo-status-bar';
import { useCustomToast } from "@/app/hooks/useCustomToast";
import { LoadingDots } from "./components/ui/LoadingDots";

SplashScreen.preventAutoHideAsync();

type LocalAuthStep =
  | 'idle'
  | 'checkingToken'
  | 'tokenChecked'
  | 'pinInputRequired'
  | 'biometricPromptRequired'
  | 'authenticatingPin'
  | 'authenticatingBiometric'
  | 'localAuthSuccess'
  | 'localAuthFailed';

function AuthHandler() {
  const segments = useSegments();
  const router = useRouter();
  const {
    isLoading: authHookLoading,
    isLinkedDevice,
    canUseBiometric,
    hasPin,
    pinConfig,
    authenticateWithBiometric,
    verifyPin,
    loadAuthState
  } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const [tokenCheckComplete, setTokenCheckComplete] = useState(false);
  const [currentLocalAuthStepVal, setLocalAuthStep] = useState<LocalAuthStep>('idle');
  const [pinValue, setPinValue] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [splashHidden, setSplashHidden] = useState(false);

  // Ref para prevenir múltiples navigaciones
  const navigationInProgressRef = useRef(false);
  const hasNavigatedRef = useRef(false);

  const { showError } = useCustomToast();

  // Effect 1: Initial Token Check
  useEffect(() => {
    if (currentLocalAuthStepVal === 'idle') {
      console.log('[AuthHandler] Starting token check...');
      setLocalAuthStep('checkingToken');

      AsyncStorage.getItem("token")
        .then(storedToken => {
          console.log('[AuthHandler] Token check complete:', storedToken ? 'Token exists' : 'No token');
          setToken(storedToken);
          setTokenCheckComplete(true);
          setLocalAuthStep('tokenChecked');
        })
        .catch(error => {
          console.error('[AuthHandler] Token check error:', error);
          setToken(null);
          setTokenCheckComplete(true);
          setLocalAuthStep('tokenChecked');
        });
    }
  }, []); // Solo ejecutar una vez

  // Effect 2: Core Authentication Logic
  useEffect(() => {
    if (currentLocalAuthStepVal !== 'tokenChecked' || authHookLoading || !tokenCheckComplete) {
      return;
    }

    console.log('[AuthHandler] Determining auth flow...', {
      token: !!token,
      isLinkedDevice,
      hasPin,
      canUseBiometric
    });

    if (token && isLinkedDevice) {
      if (canUseBiometric) {
        setLocalAuthStep('biometricPromptRequired');
      } else if (hasPin) {
        setLocalAuthStep('pinInputRequired');
      } else {
        setLocalAuthStep('localAuthSuccess');
      }
    } else if (!token && isLinkedDevice && hasPin) {
      // Dispositivo vinculado con PIN pero sin token
      setLocalAuthStep('pinInputRequired');
    } else {
      // No hay autenticación válida
      setLocalAuthStep('localAuthFailed');
    }
  }, [currentLocalAuthStepVal, token, authHookLoading, isLinkedDevice, canUseBiometric, hasPin, tokenCheckComplete]);

  // Effect 3: Hide SplashScreen
  useEffect(() => {
    if (tokenCheckComplete && !authHookLoading && !splashHidden) {
      console.log('[AuthHandler] Hiding splash screen...');
      SplashScreen.hideAsync()
        .then(() => setSplashHidden(true))
        .catch(() => setSplashHidden(true));
    }
  }, [tokenCheckComplete, authHookLoading, splashHidden]);

  // Effect 4: Navigation
  useEffect(() => {
    if (!splashHidden || !tokenCheckComplete || navigationInProgressRef.current) {
      return;
    }

    const isInTabs = segments[0] === "(tabs)";
    const isInAuth = segments[0] === "(auth)";

    console.log('[AuthHandler] Navigation check:', {
      step: currentLocalAuthStepVal,
      segments,
      isInTabs,
      isInAuth,
      hasNavigated: hasNavigatedRef.current
    });

    // Prevenir navegación múltiple
    if (hasNavigatedRef.current) {
      return;
    }

    if (currentLocalAuthStepVal === 'localAuthSuccess' && !isInTabs) {
      console.log('[AuthHandler] Navigating to tabs...');
      navigationInProgressRef.current = true;
      hasNavigatedRef.current = true;
      router.replace("/(tabs)");
    } else if (currentLocalAuthStepVal === 'localAuthFailed' && !isInAuth) {
      console.log('[AuthHandler] Navigating to login...');
      navigationInProgressRef.current = true;
      hasNavigatedRef.current = true;
      router.replace("/LoginScreen");
    }
  }, [currentLocalAuthStepVal, splashHidden, tokenCheckComplete, segments, router]);

  // Effect 5: Auto-trigger biometric
  useEffect(() => {
    if (currentLocalAuthStepVal === 'biometricPromptRequired' && Platform.OS === 'ios') {
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentLocalAuthStepVal]);

  const handleLogout = async () => {
    console.log('[AuthHandler] Logging out...');
    try {
      await AsyncStorage.multiRemove(["token", "userId"]);
      await pinService.clearPinData();
      setToken(null);
      hasNavigatedRef.current = false; // Reset navigation flag
      setLocalAuthStep('localAuthFailed');
    } catch (error) {
      console.error('[AuthHandler] Logout error:', error);
      setLocalAuthStep('localAuthFailed');
    }
  };

  const handlePinSubmit = async (submittedPin: string) => {
    if (pinConfig?.isLocked) {
      showError("Dispositivo Bloqueado", "Demasiados intentos. Intenta más tarde.");
      handleLogout();
      return;
    }

    setLocalAuthStep('authenticatingPin');
    setAuthError(null);

    try {
      const result = await verifyPin(submittedPin);

      if (result.success) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        if (result.token) {
          await AsyncStorage.setItem('token', result.token);
          setToken(result.token);
        }

        hasNavigatedRef.current = false; // Reset para permitir navegación
        setLocalAuthStep('localAuthSuccess');
        setAttempts(0);
      } else {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        setAuthError(result.error || "PIN incorrecto");
        setAttempts(prev => prev + 1);
        // Mostrar toast de error
        if (result.error) {
          showError("PIN incorrecto", result.error);
        } else {
          showError("PIN incorrecto", "Intenta nuevamente");
        }

        if (result.isLocked) {
          Alert.alert(
            "Dispositivo Bloqueado",
            result.error || "Demasiados intentos fallidos",
            [{ text: "OK", onPress: handleLogout }]
          );
        } else {
          setLocalAuthStep('pinInputRequired');
        }
      }
    } catch (e) {
      console.error('[AuthHandler] PIN verification error:', e);
      setAuthError("Error al verificar PIN");
      showError("Error", "Error al verificar PIN");
      setLocalAuthStep('pinInputRequired');
    } finally {
      setPinValue("");
    }
  };

  const handleBiometricAuth = async () => {
    setLocalAuthStep('authenticatingBiometric');
    setAuthError(null);

    try {
      const result = await authenticateWithBiometric();

      if (result.success) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        hasNavigatedRef.current = false; // Reset para permitir navegación
        setLocalAuthStep('localAuthSuccess');
      } else {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        setAuthError(result.error || "Autenticación biométrica fallida");

        if (result.requiresManualLogin) {
          if (hasPin) {
            setLocalAuthStep('pinInputRequired');
          } else {
            handleLogout();
          }
        } else {
          setLocalAuthStep('biometricPromptRequired');
        }
      }
    } catch (e) {
      console.error('[AuthHandler] Biometric auth error:', e);
      setAuthError("Error en autenticación biométrica");

      if (hasPin) {
        setLocalAuthStep('pinInputRequired');
      } else {
        handleLogout();
      }
    }
  };

  // --- Rendering ---
  console.log('[AuthHandler] Rendering:', {
    step: currentLocalAuthStepVal,
    tokenCheckComplete,
    splashHidden
  });

  // Initial loading
  if (!tokenCheckComplete || !splashHidden || currentLocalAuthStepVal === 'idle' || currentLocalAuthStepVal === 'checkingToken') {
    return (
      <View style={styles.fullScreenLoader}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#00DC5A" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Auth failed - let navigation effect handle it
  if (currentLocalAuthStepVal === 'localAuthFailed') {
    return <Slot />; // Render current route, navigation will handle redirect
  }

  // PIN Input
  if (currentLocalAuthStepVal === 'pinInputRequired' || currentLocalAuthStepVal === 'authenticatingPin') {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar style="dark" />
        <View style={styles.authContent}>
          <Ionicons name="keypad-outline" size={60} color="#00DC5A" style={styles.authIcon} />
          <Text style={styles.authTitle}>Ingresa tu PIN</Text>
          <Text style={styles.authSubtitle}>Usa tu PIN para acceder de forma segura</Text>

          <PinInput
            title=""
            maxLength={6}
            onComplete={handlePinSubmit}
            disabled={currentLocalAuthStepVal === 'authenticatingPin'}
            hasError={!!authError}
            errorMessage={undefined}
          />

        </View>
      </SafeAreaView>
    );
  }

  // Biometric
  if (currentLocalAuthStepVal === 'biometricPromptRequired' || currentLocalAuthStepVal === 'authenticatingBiometric') {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar style="dark" />
        <View style={styles.authContent}>
          <Ionicons name="scan-circle-outline" size={80} color="#00DC5A" style={styles.authIcon} />
          <Text style={styles.authTitle}>Autenticación Requerida</Text>
          <Text style={styles.authSubtitle}>Usa Face ID para continuar</Text>

          <TouchableOpacity
            style={[styles.biometricButton, currentLocalAuthStepVal === 'authenticatingBiometric' && styles.buttonDisabled]}
            onPress={handleBiometricAuth}
            disabled={currentLocalAuthStepVal === 'authenticatingBiometric'}
          >
            {currentLocalAuthStepVal === 'authenticatingBiometric' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.biometricButtonText}>Usar Face ID</Text>
            )}
          </TouchableOpacity>

          {authError && <Text style={styles.errorText}>{authError}</Text>}



          {hasPin && currentLocalAuthStepVal !== 'authenticatingBiometric' && (
            <TouchableOpacity onPress={() => setLocalAuthStep('pinInputRequired')} style={styles.switchAuthButton}>
              <Text style={styles.switchAuthButtonText}>Usar PIN</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Success or default - render the app
  return <Slot />;
}

// MainLayout y RootLayout siguen igual...

function MainLayout() {
  const colorScheme = useColorScheme();
  const { isBackendActive, isLoading: backendLoading } = useBackendHealth({
    showErrorToast: false,
    retryInterval: 60000,
  });

  const [fontsLoaded] = useFonts({
    Outfit_100Thin,
    Outfit_200ExtraLight,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_500Medium,
    Outfit_300Light,
  });

  if (!fontsLoaded || backendLoading) {
    return (
      <View style={styles.fullScreenLoader}>
        <LoadingDots />
      </View>
    );
  }

  if (!isBackendActive) {
    return <OfflineMessage />;
  }

  const theme = {
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      primary: "#00DC5A",
      background: "#F5F5F5",
    },
  };

  return (
    <ThemeProvider value={theme}>
      <AuthHandler />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ backgroundColor: "#000" }}>
      <ApolloProvider client={client}>
        <FontProvider>
          <ToastProvider>
            <MainLayout />
          </ToastProvider>
        </FontProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fullScreenLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  authContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authIcon: {
    marginBottom: 20,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: "Outfit_700Bold",
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 1,
    textAlign: 'center',
    fontFamily: "Outfit_400Regular",
  },
  biometricButton: {
    backgroundColor: '#00DC5A',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: 250,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#00DC5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: "Outfit_600SemiBold",
  },
  errorText: {
    color: '#E74C3C',
    marginTop: 15,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 40,
    padding: 12,
  },
  logoutButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: "Outfit_500Medium",
    textDecorationLine: 'underline',
  },
  switchAuthButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 24,
  },
  switchAuthButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontFamily: "Outfit_500Medium",
  }
});