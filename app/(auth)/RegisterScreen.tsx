// app/(auth)/RegisterScreen.tsx - FIXED CustomInput Interface
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
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { emailVerificationService } from "@/app/services/emailVerificationService";
import { useToast } from "@/app/providers/ToastProvider";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { PhoneInput } from "@/components/ui/PhoneInput";
import QuipukLogo from "@/assets/images/Logo.svg";
import { defaultCountry, getCountryByCode } from "@/app/contants/countries";

const { width, height } = Dimensions.get("window");

// Componente para mostrar requisitos de contraseña
interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

const PasswordRequirement: React.FC<PasswordRequirementProps> = ({
  met,
  text,
}) => (
  <View style={styles.requirementItem}>
    <Ionicons
      name={met ? "checkmark-circle" : "ellipse-outline"}
      size={16}
      color={met ? "#00c450" : "#BDC3C7"}
    />
    <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
      {text}
    </Text>
  </View>
);

// Componente para mostrar progreso del formulario
interface FormProgressProps {
  formData: any;
  errors: any;
}

const FormProgressIndicator: React.FC<FormProgressProps> = ({
  formData,
  errors,
}) => {
  const fields = [
    "fullName",
    "email",
    "countryCode",
    "phoneNumber",
    "username",
    "password",
    "confirmPassword",
  ];
  const completedFields = fields.filter((field) => {
    if (field === "acceptedTerms") return formData[field];
    if (field === "countryCode")
      return formData[field] && formData[field].length > 0;
    return formData[field]?.length > 0 && !errors[field];
  });

  const progress = (completedFields.length / fields.length) * 100;
  const isComplete =
    completedFields.length === fields.length && formData.acceptedTerms;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>
          Progreso del formulario ({completedFields.length}/{fields.length})
        </Text>
        <Text
          style={[
            styles.progressPercentage,
            isComplete && styles.progressComplete,
          ]}
        >
          {Math.round(progress)}%
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${progress}%` },
            isComplete && styles.progressBarComplete,
          ]}
        />
      </View>
    </View>
  );
};

// 🔧 FIXED: Componente de Input reutilizable con props extendidas
interface CustomInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  iconName?: keyof typeof Ionicons.glyphMap;
  editable?: boolean;
  maxLength?: number;
  // 🆕 NUEVAS PROPS para contraseñas
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  // 🆕 NUEVAS PROPS para validación de coincidencia
  matchValue?: string; // Para confirmar contraseña
  showMatchIndicator?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  keyboardType = "default",
  secureTextEntry = false,
  autoCapitalize = "sentences",
  iconName,
  editable = true,
  maxLength,
  // 🆕 Props para contraseña
  showPasswordToggle = false,
  onTogglePassword,
  // 🆕 Props para validación
  matchValue,
  showMatchIndicator = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // 🎯 Calcular estado de coincidencia
  const isMatching = matchValue !== undefined && value === matchValue && value.length > 0;
  const isNotMatching = matchValue !== undefined && value !== matchValue && value.length > 0;

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{placeholder}</Text>
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
          !editable && styles.inputWrapperDisabled,
          // 🆕 Estilo para match de contraseñas
          isMatching && styles.inputWrapperSuccess,
        ]}
      >
        {iconName && (
          <Ionicons
            name={iconName}
            size={20}
            color={
              error
                ? "#E74C3C"
                : isMatching
                  ? "#00c450"
                  : isFocused
                    ? "#00c450"
                    : "#999"
            }
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            iconName && styles.inputWithIcon,
            showPasswordToggle && styles.inputWithToggle,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          editable={editable}
          maxLength={maxLength}
        />

        {/* 🆕 Toggle de contraseña */}
        {showPasswordToggle && onTogglePassword && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={onTogglePassword}
            disabled={!editable}
          >
            <Ionicons
              name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        )}

        {/* 🆕 Indicador de coincidencia para confirmar contraseña */}
        {showMatchIndicator && matchValue !== undefined && value.length > 0 && (
          <View style={styles.matchIndicator}>
            <Ionicons
              name={isMatching ? "checkmark-circle" : "close-circle"}
              size={20}
              color={isMatching ? "#00c450" : "#E74C3C"}
            />
          </View>
        )}
      </View>

      {/* 🆕 Mensaje de estado de coincidencia */}
      {showMatchIndicator && matchValue !== undefined && value.length > 0 && (
        <View
          style={[
            styles.matchStatus,
            isMatching ? styles.matchSuccess : styles.matchError,
          ]}
        >
          <Ionicons
            name={isMatching ? "checkmark-circle" : "close-circle"}
            size={14}
            color={isMatching ? "#00c450" : "#E74C3C"}
          />
          <Text
            style={[
              styles.matchText,
              isMatching ? styles.matchTextSuccess : styles.matchTextError,
            ]}
          >
            {isMatching
              ? "Las contraseñas coinciden"
              : "Las contraseñas no coinciden"}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

export default function RegisterScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    formData,
    errors,
    isValid,
    updateField,
    validateField,
    validateForm,
    resetForm,
  } = useRegisterForm();

  const handleRegister = async () => {
    // Validar formulario completo
    if (!validateForm()) {
      showToast(
        "error",
        "Formulario incompleto",
        "Por favor corrige los errores antes de continuar."
      );
      return;
    }

    setLoading(true);

    try {
      const result =
        await emailVerificationService.registerWithEmailVerification({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: `${getCountryByCode(formData.countryCode)?.dialCode || "+51"
            }${formData.phoneNumber}`,
          username: formData.username,
          password: formData.password,
        });

      if (result.success) {
        showToast("success", "¡Registro exitoso!", result.message);
        resetForm();

        // Navegar a la pantalla de verificación
        router.push({
          pathname: "/EmailVerificationScreen",
          params: {
            email: formData.email,
            userId: result.userId?.toString(),
            fromRegistration: "true",
          },
        });
      } else {
        showToast("error", "Error en registro", result.message);
      }
    } catch (error: any) {
      console.error("Error en el registro:", error);
      showToast(
        "error",
        "Error",
        error.message || "Hubo un problema en el registro."
      );
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
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header con gradiente */}
          <LinearGradient colors={["#000000", "#1a1a1a"]} style={styles.header}>
            <TouchableOpacity
              onPress={() => router.replace("/LoginScreen")}
              style={styles.backButton}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <QuipukLogo width={120} height={50} />
            </View>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                <Text style={styles.headerHighlight}>Crear</Text> cuenta
              </Text>
              <Text style={styles.headerSubtitle}>
                Únete a la comunidad financiera
              </Text>
            </View>
          </LinearGradient>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Indicador de progreso del formulario */}
            <FormProgressIndicator formData={formData} errors={errors} />

            <CustomInput
              placeholder="Nombres y Apellidos"
              value={formData.fullName}
              onChangeText={(text) => {
                // Solo permitir letras, espacios y acentos
                const cleanText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
                updateField("fullName", cleanText);
                // Validar en tiempo real después de 10 caracteres
                if (cleanText.length >= 10) {
                  setTimeout(() => validateField("fullName"), 300);
                }
              }}
              onBlur={() => validateField("fullName")}
              error={errors.fullName}
              iconName="person-outline"
              autoCapitalize="words"
              editable={!loading}
              maxLength={50}
            />

            <CustomInput
              placeholder="Correo electrónico"
              value={formData.email}
              onChangeText={(text) => {
                const cleanText = text.toLowerCase().trim();
                updateField("email", cleanText);
                // Validar en tiempo real después de que tenga formato de email básico
                if (cleanText.includes("@") && cleanText.includes(".")) {
                  setTimeout(() => validateField("email"), 500);
                }
              }}
              onBlur={() => validateField("email")}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              iconName="mail-outline"
              editable={!loading}
              maxLength={100}
            />

            {/* Phone Input con Country Picker */}
            <PhoneInput
              label="Número de celular"
              placeholder="Número de teléfono"
              value={formData.phoneNumber}
              onChangeText={(text) => {
                updateField("phoneNumber", text);
                // Validar en tiempo real después de 7 dígitos
                if (text.replace(/[^0-9]/g, "").length >= 7) {
                  setTimeout(() => validateField("phoneNumber"), 300);
                }
              }}
              onBlur={() => validateField("phoneNumber")}
              error={errors.phoneNumber}
              selectedCountry={
                getCountryByCode(formData.countryCode) || defaultCountry
              }
              onCountryChange={(country) =>
                updateField("countryCode", country.code)
              }
              editable={!loading}
              maxLength={15}
            />

            <CustomInput
              placeholder="Nombre de usuario"
              value={formData.username}
              onChangeText={(text) => {
                // Solo permitir letras, números y guión bajo, debe comenzar con letra
                let cleanText = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
                // Asegurar que comience con letra
                if (cleanText.length > 0 && /^\d/.test(cleanText)) {
                  cleanText = cleanText.substring(1);
                }
                updateField("username", cleanText);
                // Validar en tiempo real después de 6 caracteres
                if (cleanText.length >= 6) {
                  setTimeout(() => validateField("username"), 300);
                }
              }}
              onBlur={() => validateField("username")}
              error={errors.username}
              autoCapitalize="none"
              iconName="at-outline"
              editable={!loading}
              maxLength={20}
            />

            {/* 🔧 FIXED: Password con toggle usando CustomInput mejorado */}
            <CustomInput
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(text) => {
                updateField("password", text);
                // Validar en tiempo real después de 1 carácter
                if (text.length > 0) {
                  setTimeout(() => validateField("password"), 300);
                }
              }}
              onBlur={() => validateField("password")}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              iconName="lock-closed-outline"
              editable={!loading}
              maxLength={100}
              showPasswordToggle={true}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            {/* Indicadores de requisitos de contraseña */}
            {formData.password.length > 0 && (
              <View style={styles.passwordRequirements}>
                <PasswordRequirement
                  met={formData.password.length >= 8}
                  text="Mínimo 8 caracteres"
                />
                <PasswordRequirement
                  met={/[a-z]/.test(formData.password)}
                  text="Una letra minúscula"
                />
                <PasswordRequirement
                  met={/[A-Z]/.test(formData.password)}
                  text="Una letra mayúscula"
                />
                <PasswordRequirement
                  met={/\d/.test(formData.password)}
                  text="Un número"
                />
              </View>
            )}

            {/* 🔧 FIXED: Confirm Password con toggle y validación usando CustomInput mejorado */}
            <CustomInput
              placeholder="Confirmar contraseña"
              value={formData.confirmPassword}
              onChangeText={(text) => {
                updateField("confirmPassword", text);
                // Validar en tiempo real después de 1 carácter
                if (text.length > 0) {
                  setTimeout(() => validateField("confirmPassword"), 300);
                }
              }}
              onBlur={() => validateField("confirmPassword")}
              error={errors.confirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              iconName="lock-closed-outline"
              editable={!loading}
              maxLength={100}
              showPasswordToggle={true}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              matchValue={formData.password}
              showMatchIndicator={true}
            />

            {/* Checkbox mejorado */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() =>
                !loading &&
                updateField("acceptedTerms", !formData.acceptedTerms)
              }
              disabled={loading}
            >
              <View
                style={[
                  styles.checkbox,
                  formData.acceptedTerms && styles.checkboxChecked,
                  errors.acceptedTerms && styles.checkboxError,
                ]}
              >
                {formData.acceptedTerms && (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                )}
              </View>
              <Text
                style={[styles.checkboxText, loading && styles.disabledText]}
              >
                Acepto los{" "}
                <Text style={styles.termsLink}>Términos y Condiciones</Text>
              </Text>
            </TouchableOpacity>

            {errors.acceptedTerms && (
              <View
                style={[
                  styles.errorContainer,
                  { marginTop: -15, marginBottom: 15 },
                ]}
              >
                <Ionicons name="alert-circle" size={16} color="#E74C3C" />
                <Text style={styles.errorText}>{errors.acceptedTerms}</Text>
              </View>
            )}

            {/* Información adicional */}
            <View style={styles.infoContainer}>
              <Ionicons name="mail-outline" size={20} color="#00c450" />
              <Text style={styles.infoText}>
                Después del registro, enviaremos un código de verificación a tu
                email para confirmar tu cuenta.
              </Text>
            </View>

            {/* Botón de registro mejorado */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                (!isValid || loading) && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={!isValid || loading}
            >
              <LinearGradient
                colors={
                  !isValid || loading
                    ? ["#CCC", "#AAA"]
                    : ["#00c450", "#00a040"]
                }
                style={styles.registerButtonGradient}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={styles.registerButtonText}>
                      Registrando...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Link para login */}
            <TouchableOpacity
              onPress={() => router.replace("/LoginScreen")}
              disabled={loading}
              style={styles.loginLinkContainer}
            >
              <Text
                style={[styles.loginLinkText, loading && styles.disabledText]}
              >
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
    backgroundColor: "#F8F9FA",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  headerTextContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFF",
    textAlign: "center",
    fontFamily: "Outfit_600SemiBold",
  },
  headerHighlight: {
    color: "#00c450",
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 5,
    fontFamily: "Outfit_400Regular",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  // Estilos para indicador de progreso
  progressContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E8EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#2C3E50",
    fontFamily: "Outfit_500Medium",
  },
  progressPercentage: {
    fontSize: 14,
    color: "#7F8C8D",
    fontFamily: "Outfit_600SemiBold",
  },
  progressComplete: {
    color: "#00c450",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#E5E8EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#00c450",
    borderRadius: 3,
    minWidth: 2,
  },
  progressBarComplete: {
    backgroundColor: "#00c450",
  },

  // 🔧 FIXED: Estilos mejorados para CustomInput
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
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
    paddingHorizontal: 15,
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: "#00c450",
    shadowColor: "#00c450",
    shadowOpacity: 0.1,
  },
  inputWrapperError: {
    borderColor: "#E74C3C",
    backgroundColor: "#FEF5F5",
  },
  inputWrapperDisabled: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E5E8EB",
  },
  inputWrapperSuccess: {
    borderColor: "#00c450",
    backgroundColor: "#F0FFF4",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2C3E50",
    paddingVertical: 12,
    fontFamily: "Outfit_400Regular",
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputWithToggle: {
    paddingRight: 0,
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
  matchIndicator: {
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    color: "#E74C3C",
    marginLeft: 5,
    fontFamily: "Outfit_400Regular",
  },

  // Estilos para requisitos de contraseña
  passwordRequirements: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#E5E8EB",
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: "#7F8C8D",
    marginLeft: 8,
    fontFamily: "Outfit_400Regular",
  },
  requirementTextMet: {
    color: "#00c450",
    fontFamily: "Outfit_500Medium",
  },

  // 🆕 Estilos para estado de coincidencia de contraseñas
  matchStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  matchSuccess: {
    backgroundColor: "#E8F5E8",
  },
  matchError: {
    backgroundColor: "#FEF5F5",
  },
  matchText: {
    fontSize: 12,
    marginLeft: 6,
    fontFamily: "Outfit_400Regular",
  },
  matchTextSuccess: {
    color: "#00c450",
  },
  matchTextError: {
    color: "#E74C3C",
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#BDC3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#FFF",
  },
  checkboxChecked: {
    backgroundColor: "#00c450",
    borderColor: "#00c450",
  },
  checkboxError: {
    borderColor: "#E74C3C",
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: "#2C3E50",
    lineHeight: 20,
    fontFamily: "Outfit_400Regular",
  },
  termsLink: {
    color: "#00c450",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: "#E8F5E8",
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: "#00c450",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#2D5016",
    lineHeight: 20,
    marginLeft: 10,
    fontFamily: "Outfit_400Regular",
  },
  registerButton: {
    marginBottom: 20,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#00c450",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  registerButtonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 8,
    fontFamily: "Outfit_700Bold",
  },
  loginLinkContainer: {
    alignItems: "center",
    paddingVertical: 15,
  },
  loginLinkText: {
    fontSize: 14,
    color: "#7F8C8D",
    fontFamily: "Outfit_400Regular",
  },
  loginLink: {
    color: "#00c450",
    fontWeight: "600",
    fontFamily: "Outfit_600SemiBold",
  },
  disabledText: {
    opacity: 0.6,
  },
});