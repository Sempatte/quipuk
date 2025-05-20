// app.config.js
import 'dotenv/config';

// Función auxiliar para obtener variables de entorno con fallback
const getEnvVar = (name, defaultValue) => {
  // Primero busca en EXPO_PUBLIC_* que es la forma recomendada para Expo
  const expoVar = process.env[`EXPO_PUBLIC_${name}`];
  if (expoVar !== undefined) return expoVar;
  
  // Luego busca directamente en process.env
  const regularVar = process.env[name];
  if (regularVar !== undefined) return regularVar;
  
  // Finalmente usa el valor por defecto
  return defaultValue;
};

export default ({config}) => {
  // Determinar entorno (desarrollo por defecto)
  const ENV = process.env.EXPO_ENV || 'development';
  
  // Cargar el archivo .env correcto
  require('dotenv').config({
    path: `.env.${ENV}`
  });
  
  //console.log(`📦 Building app for ${ENV.toUpperCase()} environment`);
  
  // Obtener y validar las variables requeridas
  const apiUrl = getEnvVar('API_URL', 'http://172.20.10.10:3000');
  const graphqlUrl = getEnvVar('GRAPHQL_URL', 'http://172.20.10.10:3000/graphql');
  console.log(`📦 Building app for ${ENV.toUpperCase()} environment`);
  console.log(`API URL: ${apiUrl}`);
  console.log(`GraphQL URL: ${graphqlUrl}`);
  // Validación básica de variables
  const missingVars = [];
  if (!apiUrl) missingVars.push('API_URL');
  if (!graphqlUrl) missingVars.push('GRAPHQL_URL');
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing required environment variables: ${missingVars.join(', ')}`);
    console.warn(`⚠️ Check your .env.${ENV} file or environment variables`);
  }
  
  // Configuración para la app
  return {
    ...config, // Preservar configuración existente
    // Estas propiedades sobreescriben app.json
    extra: {
      // Variables de entorno específicas
      apiUrl,
      graphqlUrl,
      // Metadatos de entorno
      environment: ENV,
      timestamp: new Date().toISOString(),
    },
    // Extensión que permite a Expo exponer variables al client-side
    // (Esto es una práctica recomendada para SDK 48+)
    plugins: [
      ...(config.plugins || []),
    ],
    // Configuración específica por entorno
    android: {
      ...(config.android || {}),
      // Aquí puedes modificar config.android según el entorno
    },
    ios: {
      ...(config.ios || {}),
      // Aquí puedes modificar config.ios según el entorno
    },
  };
};