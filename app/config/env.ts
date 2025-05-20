// app/config/env.ts
import Constants from 'expo-constants';

// TypeScript Interface para mejor tipado
interface EnvConfig {
  API_URL: string;
  GRAPHQL_URL: string;
  ENV: string;
  isDevelopment: boolean; 
  isProduction: boolean;
  isStaging?: boolean;
}

// Obtener variables del entorno con mayor seguridad
const extra = Constants.expoConfig?.extra || {};

// Configuración con valores por defecto como fallback
const env: EnvConfig = {
  API_URL: extra.apiUrl || 'http://192.168.1.33:3000',
  GRAPHQL_URL: extra.graphqlUrl || 'http://192.168.1.33:3000/graphql',
  ENV: extra.environment || 'development',
  isDevelopment: (extra.environment || 'development') === 'development',
  isProduction: (extra.environment || 'development') === 'production',
  isStaging: (extra.environment || 'development') === 'staging',
};

// Log en desarrollo para facilitar debugging
if (__DEV__) {
  console.log('🔧 Environment Config:', JSON.stringify(env, null, 2));
}

export default env;