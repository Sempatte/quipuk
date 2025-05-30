// components/ui/Avatar.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageErrorEventData,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AvatarProps {
  imageUrl?: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  editable?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  loading?: boolean; // Loading externo (subida/eliminación)
  progress?: number;
  showEditIcon?: boolean;
}

const SIZES = {
  small: 40,
  medium: 60,
  large: 80,
  xlarge: 120,
} as const;

const EDIT_ICON_SIZES = {
  small: 16,
  medium: 20,
  large: 24,
  xlarge: 28,
} as const;

// 🔧 OPTIMIZACIÓN: Enum para estados de imagen más claro
enum ImageState {
  IDLE = 'idle',
  LOADING = 'loading', 
  LOADED = 'loaded',
  ERROR = 'error'
}

export default function Avatar({
  imageUrl,
  name,
  size = 'medium',
  editable = false,
  onPress,
  onEdit,
  loading = false,
  progress = 0,
  showEditIcon = true,
}: AvatarProps) {
  // 🔧 SOLUCIÓN: Un solo estado para manejar todas las fases de la imagen
  const [imageState, setImageState] = useState<ImageState>(ImageState.IDLE);
  const [lastSuccessfulUrl, setLastSuccessfulUrl] = useState<string | null>(null);
  
  // 🔧 OPTIMIZACIÓN: Referencias más específicas
  const currentImageUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const imageStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const avatarSize = SIZES[size];
  const editIconSize = EDIT_ICON_SIZES[size];

  // 🔧 OPTIMIZACIÓN: Cleanup mejorado
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (imageStateTimeoutRef.current) {
        clearTimeout(imageStateTimeoutRef.current);
      }
    };
  }, []);

  // 🔧 SOLUCIÓN CLAVE: Resetear estado solo cuando realmente cambia la URL
  useEffect(() => {
    const trimmedUrl = imageUrl?.trim() || null;
    
    // Solo resetear si la URL realmente cambió
    if (currentImageUrlRef.current !== trimmedUrl) {
      console.log(`🔄 [Avatar] URL changed: ${currentImageUrlRef.current} → ${trimmedUrl}`);
      
      currentImageUrlRef.current = trimmedUrl;
      
      // Limpiar timeout anterior
      if (imageStateTimeoutRef.current) {
        clearTimeout(imageStateTimeoutRef.current);
        imageStateTimeoutRef.current = null;
      }

      if (trimmedUrl) {
        // 🔧 CLAVE: Si es la misma URL que ya se cargó exitosamente, marcar como loaded inmediatamente
        if (trimmedUrl === lastSuccessfulUrl) {
          console.log('✅ [Avatar] Usando imagen ya cargada desde caché');
          setImageState(ImageState.LOADED);
        } else {
          // Nueva URL - empezar en IDLE (no loading)
          setImageState(ImageState.IDLE);
        }
      } else {
        // Sin URL - estado idle
        setImageState(ImageState.IDLE);
      }
    }
  }, [imageUrl, lastSuccessfulUrl]);

  // 🔧 SOLUCIÓN: Handlers ultra-optimizados con validación estricta
  const handleLoadStart = useCallback(() => {
    const currentUrl = currentImageUrlRef.current;
    if (!isMountedRef.current || !currentUrl || currentUrl !== imageUrl?.trim()) {
      return;
    }

    console.log('🖼️ [Avatar] Load start:', currentUrl);
    setImageState(ImageState.LOADING);
    
    // 🔧 SEGURIDAD: Timeout para evitar loading infinito
    imageStateTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && currentImageUrlRef.current === currentUrl) {
        console.log('⏰ [Avatar] Load timeout, assumiendo error');
        setImageState(ImageState.ERROR);
      }
    }, 10000); // 10 segundos máximo
  }, [imageUrl]);

  const handleLoadEnd = useCallback(() => {
    const currentUrl = currentImageUrlRef.current;
    if (!isMountedRef.current || !currentUrl || currentUrl !== imageUrl?.trim()) {
      return;
    }

    console.log('✅ [Avatar] Load success:', currentUrl);
    
    // Limpiar timeout
    if (imageStateTimeoutRef.current) {
      clearTimeout(imageStateTimeoutRef.current);
      imageStateTimeoutRef.current = null;
    }
    
    setImageState(ImageState.LOADED);
    setLastSuccessfulUrl(currentUrl);
  }, [imageUrl]);

  const handleLoadError = useCallback((error: NativeSyntheticEvent<ImageErrorEventData>) => {
    const currentUrl = currentImageUrlRef.current;
    if (!isMountedRef.current || !currentUrl || currentUrl !== imageUrl?.trim()) {
      return;
    }

    console.log('❌ [Avatar] Load error:', currentUrl, error.nativeEvent.error);
    
    // Limpiar timeout
    if (imageStateTimeoutRef.current) {
      clearTimeout(imageStateTimeoutRef.current);
      imageStateTimeoutRef.current = null;
    }
    
    setImageState(ImageState.ERROR);
    
    // Si era la misma URL que estaba cacheada, limpiar caché
    if (currentUrl === lastSuccessfulUrl) {
      setLastSuccessfulUrl(null);
    }
  }, [imageUrl, lastSuccessfulUrl]);

  // 🔧 OPTIMIZACIÓN: Memoizar getInitials
  const initials = React.useMemo(() => {
    if (!name) return '?';
    
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [name]);

  // 🔧 SOLUCIÓN PRINCIPAL: Lógica de renderizado completamente reescrita
  const renderContent = () => {
    // 1. PRIORIDAD MÁXIMA: Loading externo (subida/eliminación)
    if (loading) {
      return (
        <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
          <ActivityIndicator size="large" color="#00DC5A" />
          {progress > 0 && progress < 100 && (
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          )}
        </View>
      );
    }

    const hasValidUrl = Boolean(imageUrl?.trim());

    // 2. Sin URL válida o error: mostrar iniciales
    if (!hasValidUrl || imageState === ImageState.ERROR) {
      return (
        <View style={[styles.initialsContainer, { width: avatarSize, height: avatarSize }]}>
          <Text style={[styles.initialsText, { fontSize: avatarSize * 0.4 }]}>
            {initials}
          </Text>
        </View>
      );
    }

    // 3. Con URL válida: mostrar imagen
    return (
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: imageUrl!.trim() }}
          style={[styles.avatar, { width: avatarSize, height: avatarSize }]}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleLoadError}
          resizeMode="cover"
          fadeDuration={100} // Fade rápido pero suave
        />
        
        {/* 🔧 CLAVE: Solo mostrar overlay si está cargando explícitamente */}
        {imageState === ImageState.LOADING && (
          <View style={[styles.loadingOverlay, { width: avatarSize, height: avatarSize }]}>
            <ActivityIndicator size="small" color="#00DC5A" />
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.touchable}
      onPress={onPress}
      disabled={!onPress || loading}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={styles.wrapper}>
        {renderContent()}
        
        {/* Botón de edición */}
        {editable && showEditIcon && !loading && (
          <TouchableOpacity
            style={[
              styles.editButton,
              { 
                width: editIconSize + 8, 
                height: editIconSize + 8,
                borderRadius: (editIconSize + 8) / 2 
              }
            ]}
            onPress={onEdit}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={editIconSize} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    position: 'relative',
  },
  // 🔧 OPTIMIZACIÓN: Estilos base compartidos
  container: {
    backgroundColor: '#F0F0F0',
    borderRadius: 60, // Se sobrescribe dinámicamente
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
  },
  avatar: {
    borderRadius: 60, // Se sobrescribe dinámicamente
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 60, // Se sobrescribe dinámicamente
    backgroundColor: 'rgba(240, 240, 240, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    marginTop: 4,
    fontSize: 10,
    color: '#00DC5A',
    fontFamily: 'Outfit_500Medium',
    fontWeight: '500',
  },
  initialsContainer: {
    backgroundColor: '#E0E0E0',
    borderRadius: 60, // Se sobrescribe dinámicamente
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  initialsText: {
    color: '#666',
    fontFamily: 'Outfit_600SemiBold',
    fontWeight: '600',
    textAlign: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#00DC5A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});