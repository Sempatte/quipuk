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
  // Nuevas configuraciones para OCR
  GOOGLE_VISION_API_KEY?: string;
  OCR_ENABLED: boolean;
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
  
  // Configuraciones OCR
  GOOGLE_VISION_API_KEY: extra.googleVisionApiKey || undefined,
  OCR_ENABLED: extra.ocrEnabled || false,
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