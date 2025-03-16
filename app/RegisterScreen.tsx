import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./interfaces/navigation";
import { REGISTER_MUTATION } from "./graphql/mutations.graphql";
import { useMutation } from "@apollo/client";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "RegisterScreen"
>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  // Estados para cada input
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [registerUser, { loading }] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      Alert.alert("Éxito", "Cuenta creada correctamente.");
      navigation.navigate("LoginScreen"); // Redirige al login después del registro
    },
    onError: (error) => {
      console.log("Error en registro:", error);
      Alert.alert("Error", error.message);
    },
  });

  const handleRegister = async () => {
    if (!fullName || !email || !phoneNumber || !username || !password) {
      Alert.alert("Error", "Todos los campos son obligatorios.");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert("Error", "Debes aceptar los Términos y Condiciones.");
      return;
    }

    try {
      console.log("Datos enviados:", {
        email,
        fullName,
        password,
        phoneNumber,
        username,
      });

      await registerUser({
        variables: {
          email,
          fullName,
          password,
          phoneNumber,
          username,
        },
      })      
        .then((response) => console.log("Registro exitoso:", response))
        .catch((error) =>
          console.error(
            "Error en GraphQL:",
            error.networkError || error.graphQLErrors
          )
        );
    } catch (error: any) {
      console.error("Error en el registro:", error);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.inner}>
          {/* Logo + Header */}
          <View style={styles.logoContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>{"←"}</Text>
            </TouchableOpacity>
            <Image
              source={require("../assets/images/Logo.png")}
              style={styles.logo}
            />
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
            />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#888"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Número de celular"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Checkbox Términos y Condiciones */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View style={styles.checkbox}>
                {acceptedTerms && <View style={styles.checked} />}
              </View>
              <Text style={styles.checkboxText}>
                Acepto los{" "}
                <Text style={styles.termsText}>Términos y Condiciones</Text>
              </Text>
            </TouchableOpacity>

            {/* Botón Registrarse */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? "Registrando..." : "Registrarme"}
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
  },
  termsText: {
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  registerButton: {
    backgroundColor: "#00c450",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerButtonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
  },
});
