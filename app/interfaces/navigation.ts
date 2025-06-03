import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// 📌 Define los nombres de las rutas EXACTAMENTE como en _layout.tsx
// Actualizado para usar nombres de archivo de Expo Router

export type RootStackParamList = {
  LoginScreen: undefined; // Volver al nombre original del archivo
  RegisterScreen: undefined; // Volver al nombre original del archivo
  EmailVerificationScreen: { // Volver al nombre original del archivo
    email: string;
    userId?: number;
    fromRegistration?: boolean;
  };
  "(tabs)": undefined;
  movements: undefined;
  index: undefined;
  board: undefined;
  add: {
    forcePaymentStatus?: 'pending' | 'completed';
    statusReadOnly?: boolean;
    preselectedTab?: string;
  } | undefined;
};

// 📌 Tipo de navegación reutilizable
export type RootStackNavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;