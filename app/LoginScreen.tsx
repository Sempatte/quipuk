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
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { usePinAuth } from '../hooks/usePinAuth';
import { PinInput } from '../components/ui/PinInput';
import { BiometricSetupModal } from '../components/BiometricSetupModal';
import { PinSetup } from '../components/ui/PinSetup';

interface LoginScreenProps {
  user?: { id: number; email: string };
  onLoginSuccess: () => void;
  onLogout: () => void;
}

// 🔥 CAMBIO CRÍTICO: Export default en lugar de export const
export default function LoginScreen({
  user,
  onLoginSuccess,
  onLogout,
}: LoginScreenProps = {
  onLoginSuccess: () => {},
  onLogout: () => {}
}) {
  const [authMethod, setAuthMethod] = useState<'biometric' | 'pin' | 'password' | 'setup'>('biometric');
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [pinError, setPinError] = useState<string>('');
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

  const { 
    isAvailable: biometricAvailable, 
    isEnabled: biometricEnabled, 
    authenticate: authenticateBiometric 
  } = useBiometricAuth();

  const { 
    pinConfig, 
    verifyPin, 
    isLoading: pinLoading 
  } = usePinAuth(user?.id);

  useEffect(() => {
    if (user) {
      determineAuthMethod();
    }
  }, [user, biometricEnabled, pinConfig]);

  const determineAuthMethod = () => {
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

  const handleBiometricAuth = async () => {
    try {
      const result = await authenticateBiometric();
      
      if (result.success) {
        onLoginSuccess();
      } else if (result.requiresManualLogin) {
        setShowManualLogin(true);
        setAuthMethod(pinConfig.hasPin ? 'pin' : 'password');
      } else {
        Alert.alert('Face ID', result.error || 'Autenticación fallida');
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      setAuthMethod(pinConfig.hasPin ? 'pin' : 'password');
    }
  };

  const handlePinAuth = async (pin: string) => {
    if (!user) return;

    try {
      const result = await verifyPin(pin);
      
      if (result.success) {
        onLoginSuccess();
      } else {
        setPinError(result.error || 'PIN incorrecto');
        
        if (result.isLocked) {
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
    } catch (error) {
      setPinError('Error al verificar PIN');
    }
  };

  const handleSetupComplete = () => {
    setShowPinSetup(false);
    
    // Después de configurar PIN, ofrecer biometría si está disponible
    if (biometricAvailable) {
      setShowBiometricSetup(true);
    } else {
      setAuthMethod(pinConfig.hasPin ? 'pin' : 'password');
    }
  };

  const handleBiometricSetupComplete = (enabled: boolean) => {
    setShowBiometricSetup(false);
    setAuthMethod(enabled ? 'biometric' : (pinConfig.hasPin ? 'pin' : 'password'));
    
    if (enabled) {
      handleBiometricAuth();
    }
  };

  const renderAuthMethod = () => {
    switch (authMethod) {
      case 'setup':
        return (
          <PinSetup
            userId={user!.id}
            onComplete={handleSetupComplete}
            onSkip={() => setAuthMethod('password')}
          />
        );

      case 'pin':
        return (
          <PinInput
            title="Ingresa tu PIN"
            subtitle="Usa tu PIN para acceder a Quipuk"
            maxLength={6}
            onComplete={handlePinAuth}
            disabled={pinLoading || pinConfig.isLocked}
            hasError={!!pinError}
            errorMessage={pinError}
            showForgotPin={true}
            onForgotPin={() => setAuthMethod('password')}
          />
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
              Ingresa tu email y contraseña
            </Text>
            {/* Aquí irían los campos de email y contraseña */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setAuthMethod(pinConfig.hasPin ? 'pin' : 'biometric')}
            >
              <Text style={styles.backButtonText}>
                ← Volver a {pinConfig.hasPin ? 'PIN' : 'Face ID'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
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
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Cambiar de cuenta</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>

      {/* Modales */}
      {user && (
        <BiometricSetupModal
          visible={showBiometricSetup}
          user={user}
          onComplete={handleBiometricSetupComplete}
        />
      )}
    </SafeAreaView>
  );
}

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
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
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
});