// app/utils/imageUtils.ts - Utilidades para manejo de imágenes
export const addCacheBuster = (url: string | null | undefined): string | null => {
    if (!url || typeof url !== 'string') {
      return null;
    }
    
    // No agregar cache buster a URLs que ya tienen parámetros de tiempo
    if (url.includes('?t=') || url.includes('&t=')) {
      return url;
    }
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  };
  
  export const validateImageUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    // Verificar que sea una URL válida
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  export const getImageWithFallback = (
    primaryUrl: string | null | undefined,
    fallbackUrl?: string | null
  ): string | null => {
    if (validateImageUrl(primaryUrl)) {
      return addCacheBuster(primaryUrl);
    }
    
    if (validateImageUrl(fallbackUrl)) {
      return addCacheBuster(fallbackUrl);
    }
    
    return null;
  };
  
  // Hook para manejar cache busting automático
  import { useState, useEffect } from 'react';
  
  export const useImageWithCacheBuster = (originalUrl: string | null | undefined) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    
    useEffect(() => {
      if (originalUrl) {
        setImageUrl(addCacheBuster(originalUrl));
      } else {
        setImageUrl(null);
      }
    }, [originalUrl, retryCount]);
    
    const retry = () => {
      setRetryCount(prev => prev + 1);
    };
    
    return { imageUrl, retry };
  };