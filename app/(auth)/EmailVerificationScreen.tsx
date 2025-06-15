// app/(auth)/EmailVerificationScreen.tsx - Corregido
import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QuipukLogo from '../../assets/images/Logo.svg';
import { emailVerificationService } from '../services/emailVerificationService';
import { useToast } from '../providers/ToastProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definir los parámetros de la ruta
type EmailVerificationRouteParams = {
  email: string;
  userId?: number;
  fromRegistration?: boolean;
};

type EmailVerificationScreenRouteProp = RouteProp<
  Record<string, EmailVerificationRouteParams>,
  string
>;

export default function EmailVerificationScreen() {
  const router = useRouter();
  const route = useRoute<EmailVerificationScreenRouteProp>();
  const { showToast } = useToast();

  const { email, userId, fromRegistration } = route.params || {};

  // Estados
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  // Referencias para los inputs usando el tipo correcto
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ✅ CORRECCIÓN: Solo cargar verification status si NO viene del registro
  useEffect(() => {
    const initializeScreen = async () => {
      console.log('📧 EmailVerificationScreen params:', { email, userId, fromRegistration });
      
      if (!fromRegistration) {
        // Solo cargar status si NO viene del registro (usuario ya existente)
        await loadVerificationStatus();
      } else {
        // Si viene del registro, usar valores por defecto
        console.log('📧 User from registration, using default values');
        setAttemptsRemaining(5);
      }
    };

    initializeScreen();
  }, [fromRegistration]);

  // Efecto para el countdown del reenvío
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const loadVerificationStatus = async () => {
    try {
      // Verificar que hay token antes de hacer la llamada
      const token = await AsyncStorage.getItem('token');
      console.log('📧 Has token:', token ? 'Yes' : 'No');
      
      if (!token) {
        console.log('📧 No token found, skipping verification status check');
        return;
      }

      const status = await emailVerificationService.getVerificationStatus();
      if (status) {
        setAttemptsRemaining(status.attemptsRemaining || 5);

        // Si ya está verificado, navegar automáticamente
        if (status.isVerified) {
          showToast('success', 'Email ya verificado', 'Tu email ya está verificado');
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.log('📧 Error loading verification status:', error);
      // No mostrar error al usuario, es opcional
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    // Permitir solo números
    const numericText = text.replace(/[^0-9]/g, '');

    if (numericText.length <= 1) {
      const newCode = [...code];
      newCode[index] = numericText;
      setCode(newCode);

      // Auto-focus al siguiente input
      if (numericText && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      showToast('error', 'Código incompleto', 'Por favor ingresa los 6 dígitos');
      return;
    }

    setLoading(true);

    try {
      console.log('📧 Verifying code:', verificationCode);
      const result = await emailVerificationService.verifyCode(verificationCode);

      if (result.success) {
        showToast('success', '¡Email verificado!', result.message);

        // Si viene del registro, hacer login automático
        if (fromRegistration && userId) {
          console.log('📧 From registration, doing auto login for userId:', userId);
          const loginResult = await emailVerificationService.loginAfterVerification(userId);

          if (loginResult.success) {
            console.log('📧 Auto login successful, navigating to app');
            router.replace('/(tabs)');
          } else {
            console.log('📧 Auto login failed, going to manual login');
            showToast('error', 'Error de login', 'Por favor inicia sesión manualmente');
            router.replace('/LoginScreen');
          }
        } else {
          // Si no viene del registro, volver al login
          console.log('📧 Not from registration, going to login');
          router.replace('/LoginScreen');
        }
      } else {
        showToast('error', 'Error de verificación', result.message);

        // Solo intentar actualizar intentos si hay token (no desde registro)
        if (!fromRegistration) {
          try {
            const status = await emailVerificationService.getVerificationStatus();
            if (status) {
              setAttemptsRemaining(status.attemptsRemaining || 0);
            }
          } catch (error) {
            console.log('📧 Could not update attempts remaining:', error);
          }
        } else {
          // Si viene del registro, decrementar manualmente
          setAttemptsRemaining(prev => Math.max(0, prev - 1));
        }

        // Limpiar código incorrecto
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('📧 Error verifying code:', error);
      showToast('error', 'Error', 'Hubo un problema verificando el código');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setResending(true);

    try {
      console.log('📧 Resending verification code');
      const result = await emailVerificationService.resendVerificationCode();

      if (result.success) {
        showToast('success', 'Código reenviado', result.message);
        setCountdown(60); // 60 segundos de espera

        // Limpiar código actual
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        showToast('error', 'Error', result.message);
      }
    } catch (error) {
      console.error('📧 Error resending code:', error);
      showToast('error', 'Error', 'No se pudo reenviar el código');
    } finally {
      setResending(false);
    }
  };

  const handleGoBack = () => {
    Alert.alert(
      'Volver atrás',
      'Si vuelves atrás, no podrás acceder a tu cuenta hasta que verifiques tu email. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, volver',
          style: 'destructive',
          onPress: () => router.replace('/LoginScreen')
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.logoContainer}>
            <TouchableOpacity
              onPress={handleGoBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <QuipukLogo width={140} height={60} style={styles.logo} />
            <Text style={styles.headerText}>
              <Text style={styles.headerHighlight}>Verifica</Text> tu email
            </Text>
          </View>

          {/* Content */}
          <View style={styles.formContainer}>
            <Text style={styles.instructionText}>
              Hemos enviado un código de 6 dígitos a:
            </Text>
            <Text style={styles.emailText}>{email}</Text>

            {fromRegistration && (
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>
                  ¡Bienvenido a Quipuk! 🎉
                </Text>
                <Text style={styles.welcomeSubtext}>
                  Solo falta verificar tu email para comenzar
                </Text>
              </View>
            )}

            {/* Code Input */}
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : styles.codeInputEmpty
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Attempts remaining */}
            {attemptsRemaining > 0 && (
              <Text style={styles.attemptsText}>
                {attemptsRemaining} {attemptsRemaining === 1 ? 'intento restante' : 'intentos restantes'}
              </Text>
            )}

            {attemptsRemaining === 0 && (
              <Text style={styles.blockedText}>
                Has agotado todos los intentos. Contacta con soporte.
              </Text>
            )}

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (loading || code.join('').length !== 6 || attemptsRemaining === 0) && styles.verifyButtonDisabled
              ]}
              onPress={handleVerifyCode}
              disabled={loading || code.join('').length !== 6 || attemptsRemaining === 0}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verificar Código</Text>
              )}
            </TouchableOpacity>

            {/* Resend Section */}
            {attemptsRemaining > 0 && (
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>¿No recibiste el código?</Text>

                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Reenviar en {countdown}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={resending}
                    style={styles.resendButton}
                  >
                    {resending ? (
                      <ActivityIndicator size="small" color="#00c450" />
                    ) : (
                      <Text style={styles.resendButtonText}>Reenviar código</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Help Text */}
            <Text style={styles.helpText}>
              El código expira en 15 minutos. Revisa tu carpeta de spam si no lo encuentras.
            </Text>
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
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logoContainer: {
    alignSelf: "stretch",
    height: 180,
    backgroundColor: "#000",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 50,
    overflow: "hidden",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 15,
  },
  logo: {
    width: 120,
    height: 50,
    resizeMode: "contain",
    alignSelf: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "400",
    color: "#FFF",
    textAlign: "center",
    marginTop: 5,
  },
  headerHighlight: {
    color: "#00c450",
    fontWeight: "bold",
  },
  formContainer: {
    width: "90%",
    marginTop: 30,
    alignItems: "center",
  },
  instructionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Outfit_400Regular",
  },
  emailText: {
    fontSize: 16,
    color: "#00c450",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Outfit_600SemiBold",
  },
  welcomeContainer: {
    backgroundColor: "#F0FFF4",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#00c450",
  },
  welcomeText: {
    fontSize: 18,
    color: "#00c450",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    fontFamily: "Outfit_600SemiBold",
  },
  welcomeSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontFamily: "Outfit_400Regular",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 20,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 10,
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    backgroundColor: "#FFF",
    fontFamily: "Outfit_600SemiBold",
  },
  codeInputEmpty: {
    borderColor: "#DDD",
  },
  codeInputFilled: {
    borderColor: "#00c450",
    backgroundColor: "#F0FFF4",
  },
  attemptsText: {
    fontSize: 14,
    color: "#FF6B6B",
    marginBottom: 20,
    fontFamily: "Outfit_400Regular",
  },
  blockedText: {
    fontSize: 14,
    color: "#FF3333",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Outfit_600SemiBold",
  },
  verifyButton: {
    backgroundColor: "#00c450",
    width: "80%",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  verifyButtonDisabled: {
    backgroundColor: "#CCC",
  },
  verifyButtonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
    fontFamily: "Outfit_600SemiBold",
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    fontFamily: "Outfit_400Regular",
  },
  countdownText: {
    fontSize: 14,
    color: "#999",
    fontFamily: "Outfit_400Regular",
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 16,
    color: "#00c450",
    fontWeight: "bold",
    fontFamily: "Outfit_600SemiBold",
  },
  helpText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
    fontFamily: "Outfit_400Regular",
  },
});