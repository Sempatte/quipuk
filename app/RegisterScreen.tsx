// RegisterScreen.tsx - Actualizado con verificación de email
import React, { useState } from "react";
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
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./interfaces/navigation";
import { emailVerificationService } from "./services/emailVerificationService";
import { useToast } from "./providers/ToastProvider";
import QuipukLogo from "@/assets/images/Logo.svg";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "RegisterScreen"
>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { showToast } = useToast();

  // Estados para cada input
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !phoneNumber || !username || !password) {
      showToast("error", "Error", "Todos los campos son obligatorios.");
      return;
    }
    
    if (!acceptedTerms) {
      showToast("error", "Error", "Debes aceptar los Términos y Condiciones.");
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("error", "Error", "Por favor ingresa un email válido.");
      return;
    }

    // Validación de contraseña
    if (password.length < 6) {
      showToast("error", "Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Registrando usuario con datos:', { fullName, email, username, phoneNumber });

      const result = await emailVerificationService.registerWithEmailVerification({
        fullName,
        email,
        phoneNumber,
        username,
        password,
      });

      if (result.success) {
        showToast("success", "¡Registro exitoso!", result.message);
        
        // Navegar a la pantalla de verificación
        navigation.navigate("EmailVerificationScreen", {
          email: email,
          userId: result.userId,
          fromRegistration: true,
        });
      } else {
        showToast("error", "Error en registro", result.message);
      }
    } catch (error: any) {
      console.error("Error en el registro:", error);
      showToast("error", "Error", error.message || "Hubo un problema en el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          {/* Logo + Header */}
          <View style={styles.logoContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>{"←"}</Text>
            </TouchableOpacity>
            <QuipukLogo width={140} height={60} style={styles.logo} />
            <Text style={styles.headerText}>
              <Text style={styles.headerHighlight}>Crear</Text> una cuenta
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nombres y Apellidos"
              placeholderTextColor="#888"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Número de celular"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor="#888"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />

            {/* Checkbox Términos y Condiciones */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => !loading && setAcceptedTerms(!acceptedTerms)}
              disabled={loading}
            >
              <View style={styles.checkbox}>
                {acceptedTerms && <View style={styles.checked} />}
              </View>
              <Text style={styles.checkboxText}>
                Acepto los{" "}
                <Text style={styles.termsText}>Términos y Condiciones</Text>
              </Text>
            </TouchableOpacity>

            {/* Información adicional sobre verificación */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                📧  Después del registro, enviaremos un código de verificación a tu email para confirmar tu cuenta.
              </Text>
            </View>

            {/* Botón Registrarse */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                loading && styles.registerButtonDisabled
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.registerButtonText}>Registrarme</Text>
              )}
            </TouchableOpacity>

            {/* Link para volver al login */}
            <TouchableOpacity
              onPress={() => navigation.navigate("LoginScreen")}
              disabled={loading}
              style={styles.loginLinkContainer}
            >
              <Text style={styles.loginLinkText}>
                ¿Ya tienes cuenta?{" "}
                <Text style={styles.loginLink}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 20,
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
  backText: {
    fontSize: 18,
    color: "#FFF",
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
    marginTop: 20,
  },
  input: {
    height: 45,
    borderBottomWidth: 1,
    borderBottomColor: "#AAA",
    fontSize: 16,
    marginBottom: 15,
    paddingHorizontal: 10,
    color: "#333",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#AAA",
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
  checkboxText: {
    fontSize: 14,
    color: "#000",
    flex: 1,
  },
  termsText: {
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  infoContainer: {
    backgroundColor: "#E8F5E8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#00c450",
  },
  infoText: {
    fontSize: 14,
    color: "#2D5016",
    lineHeight: 20,
    fontFamily: "Outfit_400Regular",
  },
  registerButton: {
    backgroundColor: "#00c450",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  registerButtonDisabled: {
    backgroundColor: "#CCC",
  },
  registerButtonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
  },
  loginLinkContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  loginLinkText: {
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    color: "#00c450",
    fontWeight: "bold",
  },
});