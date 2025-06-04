import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';

// ✅ Importar tipos
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { usePinAuth } from '@/hooks/usePinAuth';
import { PinInput } from '@/components/ui/PinInput';
import { BiometricSetupModal } from '@/components/BiometricSetupModal';
import { PinSetup } from '@/components/ui/PinSetup';
import { RootStackParamList } from './interfaces/navigation';

// ✅ Definir tipos específicos para el componente
type AuthMethod = 'biometric' | 'pin' | 'password' | 'setup';

interface User {
  id: number;
  email: string;
  name?: string;
}

interface BiometricAuthResult {
  success: boolean;
  requiresManualLogin?: boolean;
  error?: string;
}

interface PinVerifyResult {
  success: boolean;
  error?: string;
  isLocked?: boolean;
  lockDuration?: number;
}

interface PinConfig {
  hasPin: boolean;
  attempts?: number;
  isLocked?: boolean;
}

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  
  // ✅ Estados tipados
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password'); // Cambio inicial
  const [showManualLogin, setShowManualLogin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>('');
  const [showBiometricSetup, setShowBiometricSetup] = useState<boolean>(false);
  const [showPinSetup, setShowPinSetup] = useState<boolean>(false);

  // ✅ Usuario tipado - por ahora null, reemplaza con tu lógica real
  const user: User | null = null;

  // ✅ Hooks tipados (comentados temporalmente para evitar errores)
  // const { 
  //   isAvailable: biometricAvailable, 
  //   isEnabled: biometricEnabled, 
  //   authenticate: authenticateBiometric 
  // } = useBiometricAuth();

  // const { 
  //   pinConfig, 
  //   verifyPin, 
  //   isLoading: pinLoading 
  // } = usePinAuth(user?.id);

  // ✅ Valores por defecto mientras no tienes los hooks
  const biometricAvailable: boolean = false;
  const biometricEnabled: boolean = false;
  const pinConfig: PinConfig = { hasPin: false };
  const pinLoading: boolean = false;

  // ✅ Función para manejar el éxito del login (tipada correctamente)
  const handleLoginSuccess = (): void => {
    console.log("✅ Login exitoso, navegando a (tabs)");
    router.replace("/(tabs)"); // ✅ Eliminar el tipado explícito
  };

  // ✅ Función para manejar el logout
  const handleLogout = (): void => {
    console.log("🚪 Logout realizado");
    // Aquí iría tu lógica de logout
  };

  useEffect((): void => {
    // Solo ejecutar si hay usuario
    if (user) {
      determineAuthMethod();
    } else {
      // Si no hay usuario, mostrar login con contraseña
      setAuthMethod('password');
    }
  }, [user, biometricEnabled, pinConfig]);

  const determineAuthMethod = (): void => {
    // Si usuario recién registrado, mostrar setup
    if (user && !pinConfig.hasPin && !biometricEnabled) {
      setAuthMethod('setup');
      return;
    }

    // Si tiene biometría habilitada, usarla primero
    if (biometricEnabled && biometricAvailable) {
      setAuthMethod('biometric');
      handleBiometricAuth();
      return;
    }

    // Si tiene PIN, usarlo
    if (pinConfig.hasPin) {
      setAuthMethod('pin');
      return;
    }

    // Fallback a contraseña
    setAuthMethod('password');
  };

  const handleBiometricAuth = async (): Promise<void> => {
    try {
      // ✅ Simular resultado mientras no tienes el hook real
      const result: BiometricAuthResult = { success: false, requiresManualLogin: true };
      
      // const result = await authenticateBiometric();
      
      if (result.success) {
        handleLoginSuccess();
      } else if (result.requiresManualLogin) {
        setShowManualLogin(true);
        setAuthMethod(pinConfig.hasPin ? 'pin' : 'password');
      } else {
        Alert.alert('Face ID', result.error || 'Autenticación fallida');
      }
    } catch (error: unknown) {
      console.error('Biometric auth error:', error);
      setAuthMethod(pinConfig.hasPin ? 'pin' : 'password');
    }
  };

  const handlePinAuth = async (pin: string): Promise<void> => {
    if (!user) return;

    try {
      // ✅ Simular resultado mientras no tienes el hook real
      const result: PinVerifyResult = { success: true };
      
      // const result = await verifyPin(pin);
      
      if (result.success) {
        handleLoginSuccess();
      } else {
        setPinError(result.error || 'PIN incorrecto');
        
        if (result.isLocked && result.lockDuration) {
          Alert.alert(
            'Cuenta bloqueada',
            `Tu cuenta está bloqueada por ${result.lockDuration} minutos debido a múltiples intentos fallidos.`,
            [
              { text: 'Usar contraseña', onPress: () => setAuthMethod('password') },
              { text: 'OK' }
            ]
          );
        }
      }
    } catch (error: unknown) {
      setPinError('Error al verificar PIN');
    }
  };

  const handleSetupComplete = (): void => {
    setShowPinSetup(false);
    
    // Después de configurar PIN, ofrecer biometría si está disponible
    if (biometricAvailable) {
      setShowBiometricSetup(true);
    } else {
      setAuthMethod(pinConfig.hasPin ? 'pin' : 'password');
    }
  };

  const handleBiometricSetupComplete = (enabled: boolean): void => {
    setShowBiometricSetup(false);
    setAuthMethod(enabled ? 'biometric' : (pinConfig.hasPin ? 'pin' : 'password'));
    
    if (enabled) {
      handleBiometricAuth();
    }
  };

  // ✅ Función de renderizado tipada
  const renderAuthMethod = (): JSX.Element => {
    switch (authMethod) {
      case 'setup':
        return (
          <View style={styles.setupContainer}>
            <Text style={styles.title}>Configurar autenticación</Text>
            <Text style={styles.subtitle}>Configura tu PIN para mayor seguridad</Text>
            <TouchableOpacity 
              style={styles.setupButton}
              onPress={() => console.log("Setup PIN")}
            >
              <Text style={styles.setupButtonText}>Configurar PIN</Text>
            </TouchableOpacity>
          </View>
        );

      case 'pin':
        return (
          <View style={styles.pinContainer}>
            <Text style={styles.title}>Ingresa tu PIN</Text>
            <Text style={styles.subtitle}>Usa tu PIN para acceder a Quipuk</Text>
            {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
            <TouchableOpacity
              style={styles.fallbackButton}
              onPress={() => setAuthMethod('password')}
            >
              <Text style={styles.fallbackText}>Usar contraseña</Text>
            </TouchableOpacity>
          </View>
        );

      case 'biometric':
        return (
          <View style={styles.biometricContainer}>
            <Text style={styles.biometricTitle}>Accede con Face ID</Text>
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
            >
              <Text style={styles.biometricIcon}>👤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fallbackButton}
              onPress={() => setAuthMethod(pinConfig.hasPin ? 'pin' : 'password')}
            >
              <Text style={styles.fallbackText}>
                {pinConfig.hasPin ? 'Usar PIN' : 'Usar contraseña'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'password':
        return (
          <View style={styles.passwordContainer}>
            <Text style={styles.passwordTitle}>Iniciar sesión</Text>
            <Text style={styles.passwordSubtitle}>
              Ingresa tu email y contraseña para acceder a Quipuk
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLoginSuccess}
            >
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
            {(biometricAvailable || pinConfig.hasPin) && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setAuthMethod(pinConfig.hasPin ? 'pin' : 'biometric')}
              >
                <Text style={styles.backButtonText}>
                  ← Volver a {pinConfig.hasPin ? 'PIN' : 'Face ID'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      default:
        return (
          <View style={styles.loadingContainer}>
            <Text>Cargando...</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Quipuk</Text>
          <Text style={styles.tagline}>Tus finanzas e impuestos en una app</Text>
        </View>

        {renderAuthMethod()}

        {user && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cambiar de cuenta</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ✅ Estilos tipados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  setupContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  setupButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  setupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pinContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  biometricContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  biometricTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
    color: '#333',
  },
  biometricButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  biometricIcon: {
    fontSize: 40,
    color: 'white',
  },
  fallbackButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  fallbackText: {
    color: '#007AFF',
    fontSize: 16,
  },
  passwordContainer: {
    marginVertical: 40,
  },
  passwordTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  passwordSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  logoutButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  logoutText: {
    color: '#666',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
} as const);