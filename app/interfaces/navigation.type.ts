import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Tipos simplificados para Expo Router
export type RootStackParamList = {
  // Pantallas de autenticación (en la raíz)
  "LoginScreen": undefined;
  "RegisterScreen": undefined;
  "EmailVerificationScreen": {
    email: string;
    userId?: string;
    fromRegistration?: string;
  };
  
  // Grupo de tabs
  "(tabs)": undefined;
  "(tabs)/index": undefined;
  "(tabs)/movements": undefined;
  "(tabs)/board": undefined;
  "(tabs)/add": {
    forcePaymentStatus?: 'pending' | 'completed';
    statusReadOnly?: boolean;
    preselectedTab?: string;
  } | undefined;
  "(tabs)/profile": undefined;
  
  // Rutas individuales de tabs (para compatibilidad)
  "movements": { shouldRefresh?: boolean } | undefined;
  "index": undefined;
  "board": undefined;
  "add": {
    forcePaymentStatus?: 'pending' | 'completed';
    statusReadOnly?: boolean;
    preselectedTab?: string;
  } | undefined;
  "profile": undefined;
};

// Para router de Expo
export type ExpoRouterPath = 
  | "/LoginScreen"
  | "/RegisterScreen" 
  | "/EmailVerificationScreen"
  | "/(tabs)"
  | "/(tabs)/movements"
  | "/(tabs)/board"
  | "/(tabs)/add"
  | "/(tabs)/profile"
  | "/(tabs)/index";

export type RootStackNavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;