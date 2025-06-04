import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Define los nombres de las rutas con el formato correcto para Expo Router
export type RootStackParamList = {
  "/LoginScreen": undefined;
  "/RegisterScreen": undefined;
  "/EmailVerificationScreen": {
    email: string;
    userId?: number;
    fromRegistration?: boolean;
  };
  "/(tabs)": undefined;
  "/(tabs)/movements": undefined;
  "/(tabs)/index": undefined;
  "/(tabs)/board": undefined;
  "/(tabs)/add": {
    forcePaymentStatus?: 'pending' | 'completed';
    statusReadOnly?: boolean;
    preselectedTab?: string;
  } | undefined;
};

// Para usar con router.replace/push
export type RoutePathParam = keyof RootStackParamList;

// Para compatibilidad con código existente
export type RootStackNavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;