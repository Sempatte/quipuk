import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// 📌 Define los nombres de las rutas EXACTAMENTE como en _layout.tsx
export type RootStackParamList = {
  LoginScreen: undefined;  // 📌 Asegúrate de que el nombre es "Login" y no "LoginScreen"
  RegisterScreen: undefined;
  "(tabs)": undefined;
  movements: undefined;
  index: undefined;
};

// 📌 Tipo de navegación reutilizable
export type RootStackNavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;
