// components/ui/Avatar.tsx - CORREGIDO CON MEJORES PRÁCTICAS
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageStyle,
  ViewStyle,
  TextStyle,
  ImageErrorEventData,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// 🎯 TIPOS Y INTERFACES MEJORADAS
interface AvatarSizeConfig {
  containerSize: number;
  fontSize: number;
  iconSize: number;
  editIconSize: number;
  borderWidth: number;
}

type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';
type ImageLoadState = 'loading' | 'loaded' | 'error' | 'idle';

interface AvatarProps {
  imageUrl?: string | null;
  name?: string | null;
  size?: AvatarSize;
  editable?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  loading?: boolean;
  progress?: number;
  showOnlineIndicator?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
  testID?: string;
}

// 🎯 CONFIGURACIÓN DE TAMAÑOS OPTIMIZADA
const AVATAR_SIZES: Record<AvatarSize, AvatarSizeConfig> = {
  small: {
    containerSize: 40,
    fontSize: 16,
    iconSize: 20,
    editIconSize: 14,
    borderWidth: 2,
  },
  medium: {
    containerSize: 60,
    fontSize: 20,
    iconSize: 30,
    editIconSize: 16,
    borderWidth: 2,
  },
  large: {
    containerSize: 80,
    fontSize: 24,
    iconSize: 40,
    editIconSize: 18,
    borderWidth: 3,
  },
  xlarge: {
    containerSize: 120,
    fontSize: 32,
    iconSize: 60,
    editIconSize: 20,
    borderWidth: 3,
  },
} as const;

// 🎯 COLORES PREDETERMINADOS
const DEFAULT_COLORS = {
  background: '#E0E0E0',
  text: '#FFFFFF',
  border: '#00DC5A',
  editButton: '#00DC5A',
  progressBackground: 'rgba(255, 255, 255, 0.3)',
} as const;

// 🎯 UTILIDADES PARA GENERAR INICIALES
const getInitials = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return '?';
  
  const cleanName = name.trim();
  if (!cleanName) return '?';
  
  const words = cleanName.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  
  // Tomar la primera letra del primer y último nombre
  const firstInitial = words[0].charAt(0).toUpperCase();
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
  
  return `${firstInitial}${lastInitial}`;
};

// 🎯 GENERAR COLOR DE FONDO BASADO EN EL NOMBRE
const generateBackgroundColor = (name: string | null | undefined): string => {
  if (!name) return DEFAULT_COLORS.background;
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// 🎯 HOOK PERSONALIZADO PARA MANEJO DE ESTADO DE IMAGEN
const useImageState = (imageUrl: string | null | undefined) => {
  const [imageState, setImageState] = useState<ImageLoadState>('idle');
  const [hasError, setHasError] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null); // ✅ CORREGIDO: Inicialización con null
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🔄 Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);
  
  // 🔄 Resetear estado cuando cambia la URL
  useEffect(() => {
    if (imageUrl) {
      setImageState('loading');
      setHasError(false);
    } else {
      setImageState('idle');
      setHasError(false);
    }
  }, [imageUrl]);
  
  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
    setHasError(false);
  }, []);
  
  const handleImageError = useCallback((error: NativeSyntheticEvent<ImageErrorEventData>) => {
    console.warn('🖼️ [Avatar] Error cargando imagen:', {
      url: imageUrl?.substring(0, 50) + '...',
      error: error.nativeEvent?.error
    });
    
    setImageState('error');
    setHasError(true);
    
    // 🔄 Reintentar después de 3 segundos
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    retryTimeoutRef.current = setTimeout(() => {
      if (imageUrl) {
        
        setImageState('loading');
        setHasError(false);
      }
    }, 3000);
  }, [imageUrl]);
  
  return {
    imageState,
    hasError,
    handleImageLoad,
    handleImageError,
  };
};

// 🎯 COMPONENTE AVATAR PRINCIPAL
export const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  name,
  size = 'medium',
  editable = false,
  onPress,
  onEdit,
  loading = false,
  progress = 0,
  showOnlineIndicator = false,
  borderColor,
  backgroundColor,
  textColor,
  disabled = false,
  testID = 'avatar',
}) => {
  const sizeConfig = AVATAR_SIZES[size];
  const { imageState, hasError, handleImageLoad, handleImageError } = useImageState(imageUrl);
  
  // 🎨 Valores computados para estilos
  const initials = useMemo(() => getInitials(name), [name]);
  const dynamicBackgroundColor = useMemo(() => 
    backgroundColor || generateBackgroundColor(name), 
    [backgroundColor, name]
  );
  
  // 🎯 DETERMINAR QUÉ MOSTRAR
  const shouldShowImage = useMemo(() => {
    return imageUrl &&
           typeof imageUrl === 'string' &&
           imageUrl.trim().length > 0 &&
           imageState === 'loaded' &&
           !hasError;
  }, [imageUrl, imageState, hasError]);

  // Si no hay imageUrl o hay error, nunca mostrar loading
  const shouldShowLoading = useMemo(() => {
    if (!imageUrl || hasError) return false;
    return loading || imageState === 'loading';
  }, [loading, imageState, imageUrl, hasError]);
  
  // 🎯 MANEJADORES DE EVENTOS CON HAPTIC FEEDBACK
  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [disabled, loading, onPress]);
  
  const handleEditPress = useCallback(() => {
    if (disabled || loading) return;
    
    if (onEdit) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onEdit();
    }
  }, [disabled, loading, onEdit]);
  
  // 🎨 ESTILOS DINÁMICOS
  const containerStyle: ViewStyle = useMemo(() => ({
    width: sizeConfig.containerSize,
    height: sizeConfig.containerSize,
    borderRadius: sizeConfig.containerSize / 2,
    borderWidth: sizeConfig.borderWidth,
    borderColor: borderColor || DEFAULT_COLORS.border,
    backgroundColor: shouldShowImage ? 'transparent' : dynamicBackgroundColor,
    opacity: disabled ? 0.6 : 1,
  }), [
    sizeConfig, 
    borderColor, 
    shouldShowImage, 
    dynamicBackgroundColor, 
    disabled
  ]);
  
  const imageStyle: ImageStyle = useMemo(() => ({
    width: sizeConfig.containerSize - (sizeConfig.borderWidth * 2),
    height: sizeConfig.containerSize - (sizeConfig.borderWidth * 2),
    borderRadius: (sizeConfig.containerSize - (sizeConfig.borderWidth * 2)) / 2,
  }), [sizeConfig]);
  
  const textStyle: TextStyle = useMemo(() => ({
    fontSize: sizeConfig.fontSize,
    fontWeight: 'bold' as const,
    color: textColor || DEFAULT_COLORS.text,
    fontFamily: 'Outfit_700Bold',
  }), [sizeConfig.fontSize, textColor]);
  
  // 🎯 RENDERIZAR CONTENIDO PRINCIPAL
  const renderContent = () => {
    // Caso 1: Hay una URL de imagen para intentar cargar
    if (imageUrl) {
      // Estado: La imagen se cargó correctamente
      if (imageState === 'loaded' && !hasError) {
        return (
          <Image
            source={{ uri: imageUrl }}
            style={imageStyle}
            onLoad={handleImageLoad} // Es bueno mantenerlos por si la URL cambia dinámicamente
            onError={handleImageError}
            resizeMode="cover"
            testID={`${testID}-image`}
          />
        );
      } 
      // Estado: La imagen está cargando (o forzado por prop 'loading')
      else if (imageState === 'loading' || loading) {
        return (
          <>
            {/* Componente Image oculto para disparar los eventos de carga/error */}
            <Image 
              source={{ uri: imageUrl }} 
              style={{ width: 0, height: 0, position: 'absolute' }} 
              onLoad={handleImageLoad} 
              onError={handleImageError} 
            />
            <View style={styles.loadingContainer}>
              <ActivityIndicator 
                size={size === 'small' ? 'small' : 'large'} 
                color={DEFAULT_COLORS.editButton} 
              />
              {progress > 0 && progress < 100 && (
                <Text style={[styles.progressText, { fontSize: sizeConfig.fontSize * 0.6 }]}> 
                  {Math.round(progress)}%
                </Text>
              )}
            </View>
          </>
        );
      } 
      // Estado: Error al cargar la imagen, o estado 'idle' inicial (fallback a iniciales/icono)
      else { 
        if (initials !== '?') {
          return <Text style={textStyle}>{initials}</Text>;
        }
        return <Ionicons name="person" size={sizeConfig.iconSize} color={textColor || DEFAULT_COLORS.text} />;
      }
    }
    // Caso 2: No hay URL de imagen, mostrar iniciales o icono por defecto
    else {
      if (initials !== '?') {
        return <Text style={textStyle}>{initials}</Text>;
      }
      return <Ionicons name="person" size={sizeConfig.iconSize} color={textColor || DEFAULT_COLORS.text} />;
    }
  };
  
  // 🎯 RENDERIZAR INDICADOR EN LÍNEA
  const renderOnlineIndicator = () => {
    if (!showOnlineIndicator) return null;
    
    const indicatorSize = sizeConfig.containerSize * 0.25;
    const indicatorPosition = sizeConfig.containerSize * 0.75;
    
    return (
      <View
        style={[
          styles.onlineIndicator,
          {
            width: indicatorSize,
            height: indicatorSize,
            borderRadius: indicatorSize / 2,
            right: 0,
            bottom: 0,
            borderWidth: sizeConfig.borderWidth,
          }
        ]}
      />
    );
  };
  
  // 🎯 RENDERIZAR BOTÓN DE EDICIÓN
  const renderEditButton = () => {
    if (!editable || disabled || loading) return null;
    
    const editButtonSize = sizeConfig.containerSize * 0.3;
    
    return (
      <TouchableOpacity
        style={[
          styles.editButton,
          {
            width: editButtonSize,
            height: editButtonSize,
            borderRadius: editButtonSize / 2,
            right: -editButtonSize * 0.2,
            bottom: -editButtonSize * 0.2,
            borderWidth: sizeConfig.borderWidth,
          }
        ]}
        onPress={handleEditPress}
        activeOpacity={0.8}
        testID={`${testID}-edit-button`}
      >
        <Ionicons 
          name="camera" 
          size={sizeConfig.editIconSize} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
    );
  };
  
  // 🎯 RENDERIZAR PROGRESO DE CARGA
  const renderProgressOverlay = () => {
    if (!loading || progress <= 0) return null;
    
    return (
      <View style={styles.progressOverlay}>
        <LinearGradient
          colors={['transparent', DEFAULT_COLORS.progressBackground]}
          style={styles.progressGradient}
        >
          <View style={styles.progressContent}>
            <ActivityIndicator 
              size="small" 
              color="#FFFFFF" 
            />
            <Text style={styles.progressText}>
              {Math.round(progress)}%
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  };
  
  // 🎯 COMPONENTE PRINCIPAL
  const AvatarComponent = (
    <View style={styles.container} testID={testID}>
      <View style={[styles.avatarContainer, containerStyle]}>
        {renderContent()}
        {renderProgressOverlay()}
      </View>
      {renderOnlineIndicator()}
      {renderEditButton()}
    </View>
  );
  
  // 🎯 ENVOLVER EN TOUCHABLE SI ES NECESARIO
  if (onPress && !disabled && !loading) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        testID={`${testID}-touchable`}
      >
        {AvatarComponent}
      </TouchableOpacity>
    );
  }
  
  return AvatarComponent;
};

// 🎯 ESTILOS OPTIMIZADOS
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#00DC5A',
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  editButton: {
    position: 'absolute',
    backgroundColor: DEFAULT_COLORS.editButton,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 1000, // Un valor alto para asegurar que sea circular
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
});

// 🎯 EXPORTAR TIPOS PARA REUTILIZACIÓN
export type { AvatarProps, AvatarSize };
export default Avatar;