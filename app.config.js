// app.config.js
import 'dotenv/config';

/**
 * @typedef {Object} EnvVars
 * @property {string} apiUrl
 * @property {string} graphqlUrl
 * @property {string} environment
 * @property {string|null} googleVisionApiKey
 * @property {boolean} ocrEnabled
 */

/**
 * Función auxiliar para obtener variables de entorno con fallback
 * @param {string} name - Nombre de la variable
 * @param {string} [defaultValue=''] - Valor por defecto
 * @returns {string}
 */
const getEnvVar = (name, defaultValue = '') => {
  // Buscar con prefijo EXPO_PUBLIC_
  const expoVar = process.env[`EXPO_PUBLIC_${name}`];
  if (expoVar !== undefined && expoVar !== null) return expoVar;
  
  // Buscar directamente
  const regularVar = process.env[name];
  if (regularVar !== undefined && regularVar !== null) return regularVar;
  
  return defaultValue;
};

/**
 * Función para obtener variables boolean
 * @param {string} name - Nombre de la variable
 * @param {boolean} [defaultValue=false] - Valor por defecto
 * @returns {boolean}
 */
const getBooleanEnvVar = (name, defaultValue = false) => {
  const value = getEnvVar(name, String(defaultValue));
  return value === 'true' || value === '1';
};

/**
 * @param {Object} params
 * @param {Object} params.config - Configuración base de Expo
 * @returns {Object}
 */
export default ({ config }) => {
  // Determinar entorno
  const ENV = process.env.EXPO_ENV || process.env.ENV || 'development';
  
  // Cargar el archivo .env correcto
  require('dotenv').config({
    path: `.env.${ENV}`
  });
  
  // Obtener y validar las variables requeridas
  const apiUrl = getEnvVar('API_URL', 'http://172.20.10.10:3000');
  const graphqlUrl = getEnvVar('GRAPHQL_URL', 'http://172.20.10.10:3000/graphql');
  const googleVisionApiKey = getEnvVar('GOOGLE_VISION_API_KEY') || null;
  const ocrEnabled = getBooleanEnvVar('OCR_ENABLED', false);
  
  // Validación básica de variables requeridas
  const missingVars = [];
  if (!apiUrl) missingVars.push('API_URL');
  if (!graphqlUrl) missingVars.push('GRAPHQL_URL');
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing required environment variables: ${missingVars.join(', ')}`);
    console.warn(`⚠️ Check your .env.${ENV} file or environment variables`);
  }
  

  
  return {
    ...config, // Preservar configuración existente
    extra: {
      // Variables de entorno específicas
      apiUrl,
      graphqlUrl,
      googleVisionApiKey,
      ocrEnabled,
      // Metadatos de entorno
      environment: ENV,
      timestamp: new Date().toISOString(),
    },
    // Configuración específica por entorno
    android: {
      ...(config.android || {}),
    },
    ios: {
      ...(config.ios || {}),
      infoPlist: {
        NSFaceIDUsageDescription: "Esta aplicación utiliza Face ID para permitirte un acceso rápido y seguro a tu cuenta."
      }
    },
  };
};