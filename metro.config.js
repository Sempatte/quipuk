const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Configuración para SVG (tu configuración actual)
defaultConfig.resolver.assetExts = defaultConfig.resolver.assetExts.filter(ext => ext !== "svg");
defaultConfig.resolver.sourceExts.push("svg");

defaultConfig.transformer = {
  ...defaultConfig.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

// 🔍 AÑADIR LOGGING DETALLADO
defaultConfig.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
defaultConfig.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Log de resolución de archivos
const originalResolveAsset = defaultConfig.resolver.resolveAsset;
defaultConfig.resolver.resolveAsset = (dirPath, assetName, extension) => {
  
  try {
    const result = originalResolveAsset(dirPath, assetName, extension);
    
    return result;
  } catch (error) {
    console.error(`❌ [Metro] Asset NO encontrado: ${dirPath}/${assetName}.${extension}`);
    console.error(`❌ [Metro] Error:`, error.message);
    throw error;
  }
};

module.exports = defaultConfig;