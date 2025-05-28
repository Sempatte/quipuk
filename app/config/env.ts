// app/config/env.ts
import Constants from 'expo-constants';

// TypeScript interfaces para mejor tipado
interface EnvConfig {
  API_URL: string;
  GRAPHQL_URL: string;
  ENV: string;
  isDevelopment: boolean; 
  isProduction: boolean;
  isStaging: boolean;
  GOOGLE_VISION_API_KEY: string | null;
  OCR_ENABLED: boolean;
}

interface ExpoExtraConfig {
  apiUrl?: string;
  graphqlUrl?: string;
  environment?: string;
  googleVisionApiKey?: string;
  ocrEnabled?: boolean;
}

// Función helper tipada para obtener variables con fallback
const getEnvVar = (key: string, fallback: string = ''): string => {
  // Primero intenta desde process.env con prefijo EXPO_PUBLIC_
  const publicVar = process.env[`EXPO_PUBLIC_${key}`];
  if (publicVar !== undefined && publicVar !== null) return publicVar;
  
  // Luego desde extra (app.config.js)
  const extra = Constants.expoConfig?.extra as ExpoExtraConfig | undefined;
  const extraKey = key.toLowerCase().replace('_', '');
  const extraVar = extra?.[extraKey as keyof ExpoExtraConfig];
  if (extraVar !== undefined && extraVar !== null) return String(extraVar);
  
  return fallback;
};

// Función helper para obtener variables boolean
const getBooleanEnvVar = (key: string, fallback: boolean = false): boolean => {
  const value = getEnvVar(key, String(fallback));
  return value === 'true' || value === '1';
};

// Función helper para obtener variables opcionales
const getOptionalEnvVar = (key: string): string | null => {
  const value = getEnvVar(key, '');
  return value === '' ? null : value;
};

const env: EnvConfig = {
  API_URL: getEnvVar('API_URL', 'http://192.168.1.33:3000'),
  GRAPHQL_URL: getEnvVar('GRAPHQL_URL', 'http://192.168.1.33:3000/graphql'),
  ENV: getEnvVar('ENV', 'development'),
  isDevelopment: getEnvVar('ENV', 'development') === 'development',
  isProduction: getEnvVar('ENV', 'development') === 'production',
  isStaging: getEnvVar('ENV', 'development') === 'staging',
  
  // Configuraciones OCR
  GOOGLE_VISION_API_KEY: getOptionalEnvVar('GOOGLE_VISION_API_KEY'),
  OCR_ENABLED: getBooleanEnvVar('OCR_ENABLED', false),
};

// Log en desarrollo para facilitar debugging
if (__DEV__) {
  console.log('🔧 Environment Config:', {
    ...env,
    // No mostrar API keys en logs por seguridad
    GOOGLE_VISION_API_KEY: env.GOOGLE_VISION_API_KEY ? '***CONFIGURED***' : 'NOT_SET'
  });
}

export default env;