import React, { useEffect, useState } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { ApolloProvider } from "@apollo/client";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from "./apolloClient";
import { FontProvider } from "./providers/FontProvider";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts, Outfit_100Thin, Outfit_200ExtraLight, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_500Medium, Outfit_300Light } from "@expo-google-fonts/outfit";
import { ToastProvider } from "./providers/ToastProvider";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { OfflineMessage } from "@/components/OfflineMessage";
import { useAuth } from "@/hooks/useAuth";
import { PinInput } from "@/components/ui/PinInput";
import * as Haptics from 'expo-haptics';
import { Ionicons } from "@expo/vector-icons";
import { pinService } from "@/app/services/pinService";
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

type LocalAuthStep = 
  | 'idle'
  | 'checkingToken'
  | 'tokenChecked'
  | 'checkingLocalAuthRequirements'
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
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [currentLocalAuthStepVal, _setLocalAuthStepState] = useState<LocalAuthStep>('idle');
  const [pinValue, setPinValue] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [splashHidden, setSplashHidden] = useState(false);

  const setLocalAuthStep = (newStep: LocalAuthStep) => {
    console.log(`[AuthHandler DEBUG] setLocalAuthStep: Changing FROM ${currentLocalAuthStepVal} TO ${newStep}`);
    _setLocalAuthStepState(newStep);
  };

  // Effect 1: Initial Token Check
  useEffect(() => {
    console.log(`[AuthHandler Effect1 TokenCheck] START. Current step: ${currentLocalAuthStepVal}`);
    if (currentLocalAuthStepVal === 'idle') {
      setLocalAuthStep('checkingToken');
      AsyncStorage.getItem("token")
        .then(storedToken => {
          console.log(`[AuthHandler Effect1 TokenCheck] Token from AsyncStorage: ${storedToken ? 'Exists' : 'null'}`);
          setToken(storedToken);
          _setLocalAuthStepState(prevStep => {
            if (prevStep === 'checkingToken') return 'tokenChecked';
            console.log(`[AuthHandler Effect1 TokenCheck] AsyncStorage.then: prevStep (${prevStep}) was not 'checkingToken', preserving.`);
            return prevStep; 
          });
        })
        .catch(error => {
          console.error('[AuthHandler Effect1 TokenCheck] Error retrieving token:', error);
          setToken(null);
          _setLocalAuthStepState(prevStep => {
            if (prevStep === 'checkingToken') return 'tokenChecked';
            console.log(`[AuthHandler Effect1 TokenCheck] AsyncStorage.catch: prevStep (${prevStep}) was not 'checkingToken', preserving.`);
            return prevStep;
          });
        });
    }
    console.log(`[AuthHandler Effect1 TokenCheck] END. Current step: ${currentLocalAuthStepVal}`);
  }, [currentLocalAuthStepVal]);

  // Effect 2: Core Authentication Logic
  useEffect(() => {
    console.log(`[AuthHandler Effect2 AuthLogic] START. Step: ${currentLocalAuthStepVal}, Token: ${token ? 'E' : 'N'}, AuthLoading: ${authHookLoading}`);
    if (currentLocalAuthStepVal === 'tokenChecked' && !authHookLoading) {
      if (token && isLinkedDevice) {
        console.log('[AuthHandler Effect2 AuthLogic] Token & Linked Device. Determining local auth...');
        if (canUseBiometric) setLocalAuthStep('biometricPromptRequired');
        else if (hasPin) setLocalAuthStep('pinInputRequired');
        else setLocalAuthStep('localAuthSuccess'); // Needs setup
      } else if (isLinkedDevice && hasPin) {
        console.log('[AuthHandler Effect2 AuthLogic] No Token, but Linked & Has PIN. Requiring PIN.');
        setLocalAuthStep('pinInputRequired');
      } else if (token) { // Token exists, but device not linked
        console.log('[AuthHandler Effect2 AuthLogic] Token, but Not Linked. Failing auth.');
        setLocalAuthStep('localAuthFailed');
        AsyncStorage.multiRemove(["token", "userId"]); // Clean up inconsistent state
        setToken(null);
      } else { // No token, and not (linked & hasPIN)
        console.log(`[AuthHandler Effect2 AuthLogic] No Token (or not linked without PIN). Current step was '${currentLocalAuthStepVal}'. Forcing to localAuthFailed.`);
        // If currentLocalAuthStepVal was 'tokenChecked' and we are in this block (no token, etc.),
        // we must transition to 'localAuthFailed'. The previous 'if' condition was redundant.
        setLocalAuthStep('localAuthFailed');
      }
      if (!initialCheckDone) setInitialCheckDone(true);
    } else {
      console.log(`[AuthHandler Effect2 AuthLogic] Conditions not met. Step: ${currentLocalAuthStepVal}, AuthLoading: ${authHookLoading}`);
    }
    console.log(`[AuthHandler Effect2 AuthLogic] END. Current step: ${currentLocalAuthStepVal}`);
  }, [currentLocalAuthStepVal, token, authHookLoading, isLinkedDevice, canUseBiometric, hasPin, initialCheckDone, loadAuthState]);

  // Effect 3: SplashScreen
  useEffect(() => {
    if (initialCheckDone && !authHookLoading && !splashHidden) {
      console.log('[AuthHandler Effect3 SplashScreen] Hiding SplashScreen');
      SplashScreen.hideAsync().finally(() => setSplashHidden(true));
    }
  }, [initialCheckDone, authHookLoading, splashHidden]);

  // Effect 4: Navigation
  useEffect(() => {
    console.log(`[AuthHandler Effect4 Navigation] START. Step: ${currentLocalAuthStepVal}, Token: ${token ? 'E' : 'N'}, Segments: ${segments.join(',')}, InitDone: ${initialCheckDone}, SplashHidden: ${splashHidden}`);
    if (!initialCheckDone || !splashHidden) {
      console.log('[AuthHandler Effect4 Navigation] Init not done or splash not hidden. Skipping.');
      return;
    }
    const isInTabs = segments[0] === "(tabs)";
    const isAtLoginScreen = segments[0] === "(auth)" && segments[1] === "LoginScreen";

    if (currentLocalAuthStepVal === 'localAuthSuccess') {
      if (!isInTabs) {
        console.log('[AuthHandler Effect4 Navigation] localAuthSuccess: Not in tabs, navigating to /(tabs).');
        router.replace("/(tabs)");
      }
    } else if (currentLocalAuthStepVal === 'localAuthFailed' && !token) {
      if (!isAtLoginScreen) {
        console.log('[AuthHandler Effect4 Navigation] localAuthFailed & no token: Not at LoginScreen, navigating to /LoginScreen.');
        router.replace("/LoginScreen");
      }
    } else if (currentLocalAuthStepVal === 'tokenChecked' && !token) {
      if (!isAtLoginScreen) {
         console.log('[AuthHandler Effect4 Navigation] tokenChecked & no token: Not at LoginScreen, navigating to /LoginScreen.');
        router.replace("/LoginScreen");
      }
    }
    console.log(`[AuthHandler Effect4 Navigation] END. Current step: ${currentLocalAuthStepVal}`);
  }, [currentLocalAuthStepVal, token, initialCheckDone, splashHidden, segments, router]);

  const handleLogout = async () => {
    console.log(`[AuthHandler] handleLogout: START. Current step: ${currentLocalAuthStepVal}`);
    try {
      await AsyncStorage.multiRemove(["token", "userId"]);
      await pinService.clearPinData();
      setToken(null);
      setLocalAuthStep('localAuthFailed'); // This will trigger Effect2 and Effect4
      console.log('[AuthHandler] handleLogout: END. State set for redirect.');
    } catch (error) {
      console.error('[AuthHandler] handleLogout: Error:', error);
      Alert.alert("Error", "No se pudo cerrar sesión correctamente.");
    }
  };

  const handlePinSubmit = async (submittedPin: string) => {
    if (pinConfig && pinConfig.isLocked) {
      Alert.alert("Dispositivo Bloqueado", `Demasiados intentos. Intenta más tarde.`);
      setLocalAuthStep('localAuthFailed');
      return;
    }
    setLocalAuthStep('authenticatingPin');
    setAuthError(null);
    try {
      const result = await verifyPin(submittedPin);
      if (result.success) {
        setLocalAuthStep('localAuthSuccess');
        setAttempts(0);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setAuthError(result.error || "PIN incorrecto.");
        setAttempts(prev => prev + 1);
        if (loadAuthState) await loadAuthState();
        setLocalAuthStep('pinInputRequired'); 
        if (result.isLocked) {
            Alert.alert("Dispositivo Bloqueado", `Demasiados intentos. ${result.error || 'Serás redirigido.'}`);
            setLocalAuthStep('localAuthFailed');
            if(token) { // Only if token was somehow present
              await AsyncStorage.removeItem("token"); // remove token if specifically this flow causes lock with a token
              setToken(null);
            }
        }
      }
    } catch (e) {
      setAuthError("Error al verificar PIN.");
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
        setLocalAuthStep('localAuthSuccess');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setAuthError(result.error || "Autenticación biométrica fallida.");
        if (result.requiresManualLogin) {
          if (hasPin) setLocalAuthStep('pinInputRequired');
          else {
            setLocalAuthStep('localAuthFailed');
            if(token) { // Only if token was somehow present
                 await AsyncStorage.removeItem("token");
                 setToken(null);
            }
          }
        } else {
          setLocalAuthStep('biometricPromptRequired');
        }
      }
    } catch (e) {
      setAuthError("Error en autenticación biométrica.");
      setLocalAuthStep('biometricPromptRequired');
    }
  };

  // --- Conditional Rendering --- 
  console.log(`[AuthHandler Rendering] Step: ${currentLocalAuthStepVal}, Token: ${token ? 'E' : 'N'}, InitialCheck: ${initialCheckDone}, SplashHidden: ${splashHidden}, AuthLoading: ${authHookLoading}`);

  // Primary Loader: Covers initial app load, token checking, and auth hook loading.
  if (currentLocalAuthStepVal === 'idle' || currentLocalAuthStepVal === 'checkingToken' || !initialCheckDone || !splashHidden || authHookLoading) {
    // Exception: if we are past token checking and auth hook is done, but still in 'checkingLocalAuthRequirements',
    // it might be a brief state. However, to be safe and show a loader:
    if (currentLocalAuthStepVal === 'checkingLocalAuthRequirements' && initialCheckDone && !authHookLoading && !splashHidden) {
         console.log('[AuthHandler Rendering] In checkingLocalAuthRequirements, but showing loader as a fallback or for transition.');
    } else if (currentLocalAuthStepVal === 'idle' || currentLocalAuthStepVal === 'checkingToken' || !initialCheckDone || !splashHidden || authHookLoading) {
        console.log('[AuthHandler Rendering] Primary Loader Active.');
        return (
            <View style={styles.fullScreenLoader}>
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#00DC5A" />
                <Text style={{color: '#fff', marginTop: 10}}>Cargando App...</Text>
            </View>
        );
    }
  }

  if (currentLocalAuthStepVal === 'localAuthFailed' && !token) {
    console.log('[AuthHandler Rendering] localAuthFailed state - showing redirecting message / loader.');
    return (
        <View style={styles.fullScreenLoader}>
            <StatusBar style="light" />
            <ActivityIndicator size="large" color="#00DC5A" />
            <Text style={{color: '#fff', marginTop: 10}}>Sesión finalizada. Redirigiendo...</Text>
        </View>
      );
  }
  
  if (currentLocalAuthStepVal === 'pinInputRequired' || currentLocalAuthStepVal === 'authenticatingPin') {
    console.log(`[AuthHandler Rendering] PIN screen. Step: ${currentLocalAuthStepVal}`);
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar style="dark" />
        <Ionicons name="keypad-outline" size={60} color="#000" style={{ marginBottom: 20 }} />
        <Text style={styles.authTitle}>Ingresa tu PIN</Text>
        <Text style={styles.authSubtitle}>Usa tu PIN para acceder de forma segura.</Text>
        <PinInput
          title=""
          maxLength={6}
          onComplete={handlePinSubmit}
          disabled={currentLocalAuthStepVal === 'authenticatingPin'}
          hasError={!!authError || (pinConfig && pinConfig.isLocked)}
          errorMessage={authError || ((pinConfig && pinConfig.isLocked) ? "Cuenta bloqueada temporalmente" : undefined)}
        />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (currentLocalAuthStepVal === 'biometricPromptRequired' || currentLocalAuthStepVal === 'authenticatingBiometric') {
    console.log(`[AuthHandler Rendering] Biometric screen. Step: ${currentLocalAuthStepVal}`);
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar style="dark" />
        <Ionicons name="scan-circle-outline" size={80} color="#000" style={{ marginBottom: 20 }}/>
        <Text style={styles.authTitle}>Autenticación Requerida</Text>
        <Text style={styles.authSubtitle}>Usa Face ID / Touch ID para continuar.</Text>
        <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth} disabled={currentLocalAuthStepVal === 'authenticatingBiometric'}>
          {currentLocalAuthStepVal === 'authenticatingBiometric' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.biometricButtonText}>Usar Face ID / Touch ID</Text>
          )}
        </TouchableOpacity>
        {authError && <Text style={styles.errorText}>{authError}</Text>}
         <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
         {hasPin && currentLocalAuthStepVal !== 'authenticatingBiometric' && (
          <TouchableOpacity onPress={() => setLocalAuthStep('pinInputRequired')} style={styles.switchAuthButton}>
            <Text style={styles.switchAuthButtonText}>Usar PIN</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  if (currentLocalAuthStepVal === 'localAuthSuccess') {
    console.log('[AuthHandler Rendering] localAuthSuccess: Rendering Slot.');
    return <Slot />;
  }
  
  console.log(`[AuthHandler Rendering] Fallback: No explicit render for step: ${currentLocalAuthStepVal}. Showing loader.`);
  return (
      <View style={styles.fullScreenLoader}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#00DC5A" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Cargando (Estado desconocido)...</Text>
      </View>
  );
}

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
            <ActivityIndicator size="large" color="#00DC5A" />
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
    <SafeAreaProvider style={{backgroundColor: "#000"}}> 
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
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
  },
  authTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: "Outfit_700Bold",
  },
  authSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: "Outfit_400Regular",
  },
  biometricButton: {
    backgroundColor: '#00DC5A',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 20,
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: "Outfit_600SemiBold",
  },
  errorText: {
    color: 'red',
    marginTop: 15,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 30,
    padding: 10,
  },
  logoutButtonText: {
    color: '#000',
    fontSize: 14,
    fontFamily: "Outfit_500Medium",
  },
  switchAuthButton: {
    marginTop: 15,
    padding: 10,
  },
  switchAuthButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontFamily: "Outfit_500Medium",
  }
});