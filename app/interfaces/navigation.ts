import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// 📌 Define los nombres de las rutas EXACTAMENTE como en _layout.tsx
// En navigation.ts, modifica la definición de RootStackParamList:

export type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  "(tabs)": undefined;
  movements: undefined;
  index: undefined;
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
