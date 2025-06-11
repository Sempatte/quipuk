// app/components/PinAuth.tsx - COMPONENTE COMPLETO DE AUTENTICACIÓN PIN
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { PinInput } from '@/app/components/ui/PinInput';
import { useAuth } from '@/app/hooks/useAuth';
import { useToast } from '@/app/providers/ToastProvider';

const { width, height } = Dimensions.get('window');

// ✅ INTERFACES
interface PinAuthProps {
  onSuccess: () => void;
  onCancel?: () => void;
  onForgotPin?: () => void;
  maxAttempts?: number;
  showUserInfo?: boolean;
  allowCancel?: boolean;
  allowForgotPin?: boolean;
}

interface PinAuthState {
  attempts: number;
  isLocked: boolean;
  lockUntil?: Date;
  error: string | null;
  isLoading: boolean;
}

// ✅ COMPONENTE DE LOADING FALLBACK
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#6366F1" />
    <Text style={styles.loadingText}>Verificando PIN...</Text>
  </View>
);



// ✅ COMPONENTE PIN INPUT CON SUSPENSE
const PinInputComponent = ({ 
  onComplete,
  hasError,
  errorMessage,
  disabled,
  showForgotPin,
  onForgotPin
}: {
  onComplete: (pin: string) => void;
  hasError: boolean;
  errorMessage?: string;
  disabled: boolean;
  showForgotPin: boolean;
  onForgotPin?: () => void;
}) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PinInput
        title="Ingresa tu PIN"
        subtitle="Verifica tu identidad para continuar"
        onComplete={onComplete}
        hasError={hasError}
        errorMessage={errorMessage}
        disabled={disabled}
        showForgotPin={showForgotPin}
        onForgotPin={onForgotPin}
      />
    </Suspense>
  );
};

// ✅ COMPONENTE PRINCIPAL PIN AUTH
export const PinAuth: React.FC<PinAuthProps> = ({
  onSuccess,
  onCancel,
  onForgotPin,
  maxAttempts = 5,
  showUserInfo = true,
  allowCancel = false,
  allowForgotPin = true,
}) => {
  // Estados
  const [authState, setAuthState] = useState<PinAuthState>({
    attempts: 0,
    isLocked: false,
    error: null,
    isLoading: false,
  });

  // Hooks
  const { verifyPin, pinConfig, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  // ✅ INICIALIZACIÓN
  useEffect(() => {
    const initializePinAuth = async () => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true }));

        // Verificar si el dispositivo está bloqueado
        if (pinConfig.isLocked) {
          setAuthState(prev => ({
            ...prev,
            isLocked: true,
            lockUntil: pinConfig.lockedUntil,
            error: 'Dispositivo bloqueado temporalmente',
            isLoading: false,
          }));
          return;
        }

        // Cargar intentos actuales
        setAuthState(prev => ({
          ...prev,
          attempts: pinConfig.attempts || 0,
          isLoading: false,
        }));

      } catch (error) {
        console.error('❌ Error inicializando PinAuth:', error);
        setAuthState(prev => ({
          ...prev,
          error: 'Error de inicialización',
          isLoading: false,
        }));
      }
    };

    initializePinAuth();
  }, [pinConfig]);

  // ✅ MANEJO DE VERIFICACIÓN PIN
  const handlePinComplete = useCallback(async (pin: string) => {
    if (authState.isLocked || authState.isLoading) return;

    try {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null 
      }));

      console.log('🔐 PinAuth: Verificando PIN...');
      
      const result = await verifyPin(pin);
      
      console.log('🔐 PinAuth: Resultado:', { 
        success: result.success, 
        error: result.error 
      });

      if (result.success) {
        // ✅ PIN correcto
        console.log('✅ PinAuth: PIN verificado correctamente');
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setAuthState(prev => ({
          ...prev,
          attempts: 0,
          error: null,
          isLoading: false,
        }));

        // Pequeño delay para mejor UX
        setTimeout(() => {
          onSuccess();
        }, 200);
        
      } else {
        // ❌ PIN incorrecto
        console.log('❌ PinAuth: PIN incorrecto');
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate([0, 100, 50, 100]);

        const newAttempts = authState.attempts + 1;
        const remainingAttempts = maxAttempts - newAttempts;

        setAuthState(prev => ({
          ...prev,
          attempts: newAttempts,
          error: result.error || `PIN incorrecto. Te quedan ${remainingAttempts} intentos`,
          isLoading: false,
        }));

        // Verificar si se debe bloquear
        if (result.isLocked || newAttempts >= maxAttempts) {
          setAuthState(prev => ({
            ...prev,
            isLocked: true,
            lockUntil: result.lockDuration ? 
              new Date(Date.now() + result.lockDuration * 60000) : 
              new Date(Date.now() + 30 * 60000), // 30 min por defecto
            error: 'Dispositivo bloqueado por demasiados intentos',
          }));

          showToast(
            'error', 
            'Dispositivo Bloqueado', 
            'Demasiados intentos fallidos. Intenta más tarde.'
          );
        }
      }

    } catch (error) {
      console.error('❌ PinAuth: Error inesperado:', error);
      
      setAuthState(prev => ({
        ...prev,
        error: 'Error inesperado al verificar PIN',
        isLoading: false,
      }));

      showToast('error', 'Error', 'Error inesperado al verificar PIN');
    }
  }, [authState, verifyPin, maxAttempts, onSuccess, showToast]);

  // ✅ MANEJO DE OLVIDÉ PIN
  const handleForgotPin = useCallback(() => {
    Alert.alert(
      'Olvidé mi PIN',
      '¿Deseas usar otro método de autenticación?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Usar Contraseña',
          onPress: () => {
            onForgotPin?.();
          },
        },
      ]
    );
  }, [onForgotPin]);

  // ✅ MANEJO DE CANCELAR
  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancelar Autenticación',
      '¿Estás seguro de que deseas cancelar?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: () => {
            onCancel?.();
          },
        },
      ]
    );
  }, [onCancel]);

  // ✅ RENDER LOADING INICIAL
  if (authState.isLoading && authState.attempts === 0) {
    return <LoadingFallback />;
  }

  // ✅ RENDER DISPOSITIVO BLOQUEADO
  if (authState.isLocked) {
    const lockTimeRemaining = authState.lockUntil ? 
      Math.max(0, Math.ceil((authState.lockUntil.getTime() - Date.now()) / 60000)) : 
      30;

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.background}
        >
          <View style={styles.centeredContent}>
            <View style={styles.lockedContainer}>
              <Ionicons name="lock-closed" size={64} color="#E74C3C" />
              <Text style={styles.lockedTitle}>Dispositivo Bloqueado</Text>
              <Text style={styles.lockedMessage}>
                Demasiados intentos fallidos.{'\n'}
                Intenta nuevamente en {lockTimeRemaining} minutos.
              </Text>
              
              {allowForgotPin && (
                <TouchableOpacity
                  style={styles.forgotPinButton}
                  onPress={handleForgotPin}
                >
                  <Text style={styles.forgotPinText}>
                    Usar otro método
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // ✅ RENDER PRINCIPAL
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >
        <Suspense fallback={<LoadingFallback />}>
          <View style={styles.content}>


            {/* Indicador de intentos */}
            <View style={styles.attemptsContainer}>
              <Text style={styles.attemptsText}>
                Intentos restantes: {maxAttempts - authState.attempts}
              </Text>
            </View>

            {/* Componente PIN Input */}
            <View style={styles.pinContainer}>
              <PinInputComponent
                onComplete={handlePinComplete}
                hasError={!!authState.error}
                errorMessage={authState.error || undefined}
                disabled={authState.isLoading || authLoading}
                showForgotPin={allowForgotPin}
                onForgotPin={handleForgotPin}
              />
            </View>

            {/* Botones de acción */}
            <View style={styles.actionsContainer}>
              {allowCancel && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={authState.isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Suspense>
      </LinearGradient>
    </View>
  );
};

// ✅ ESTILOS COMPLETOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    fontFamily: 'Outfit_400Regular',
  },

  // User Header
  userHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Outfit_700Bold',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Outfit_400Regular',
    opacity: 0.8,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Outfit_700Bold',
    marginTop: 4,
  },
  userEmail: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    opacity: 0.6,
    marginTop: 2,
  },

  // Attempts
  attemptsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  attemptsText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    opacity: 0.8,
  },

  // PIN Container
  pinContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // Actions
  actionsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    opacity: 0.8,
  },
  forgotPinButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  forgotPinText: {
    color: '#6366F1',
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
  },

  // Locked State
  lockedContainer: {
    alignItems: 'center',
    padding: 40,
  },
  lockedTitle: {
    color: '#E74C3C',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Outfit_700Bold',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  lockedMessage: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
});

// ✅ EXPORT DEFAULT
export default PinAuth;