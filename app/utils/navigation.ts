// app/interfaces/navigation.ts - TIPOS SIMPLIFICADOS
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// 🔥 TIPOS SIMPLIFICADOS PARA EVITAR CONFLICTOS
export type RootStackParamList = {
  // Pantallas de autenticación
  LoginScreen: undefined;
  RegisterScreen: undefined;
  EmailVerificationScreen: {
    email: string;
    userId?: string;
    fromRegistration?: string;
  };
  
  // Tabs (solo para referencia)
  "(tabs)": undefined;
  index: undefined;
  movements: undefined;
  board: undefined;
  add: {
    forcePaymentStatus?: 'pending' | 'completed';
    statusReadOnly?: boolean;
    preselectedTab?: string;
  } | undefined;
  profile: undefined;
};

// 🔥 TIPO ESPECÍFICO PARA EXPO ROUTER (no exportado)
type ExpoRouterPaths = 
  | "/LoginScreen"
  | "/RegisterScreen" 
  | "/EmailVerificationScreen"
  | "/(tabs)"
  | "/(tabs)/movements"
  | "/(tabs)/board"
  | "/(tabs)/add"
  | "/(tabs)/profile"
  | "/(tabs)/index";

// Para compatibilidad con navegación tradicional
export type RootStackNavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;

// 🔥 ELIMINAR TIPOS CONFLICTIVOS
// No exportamos tipos específicos para evitar conflictos con Expo Router