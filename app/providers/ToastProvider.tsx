// app/providers/ToastProvider.tsx - VERSION ALTERNATIVA SIN HOOK PROBLEMÁTICO
import React, { createContext, useContext, useCallback } from 'react';
import Toast, { ToastConfig, BaseToast, ErrorToast } from 'react-native-toast-message';
import { Platform, Dimensions, StatusBar } from 'react-native';

interface ToastContextType {
  showToast: (type: 'success' | 'error' | 'info', text1: string, text2?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

// Obtener el offset de forma segura sin hooks
const getTopOffset = () => {
  if (Platform.OS === 'ios') {
    // iPhone X y posteriores tienen un notch de ~44px
    const isIphoneX = Dimensions.get('window').height >= 812;
    return (isIphoneX ? 44 : 20) + 10;
  }
  // Android usa el StatusBar height
  return (StatusBar.currentHeight || 0) + 10;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showToast = useCallback((type: 'success' | 'error' | 'info', text1: string, text2?: string) => {
    Toast.show({
      type,
      text1,
      text2,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: getTopOffset(), // Usar función en lugar de hook
    });
  }, []);

  // 🎨 Configuración personalizada SIMPLIFICADA para evitar errores
  const toastConfig: ToastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: '#00DC5A',
          borderLeftWidth: 5,
          width: Dimensions.get('window').width - 32,
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          paddingVertical: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#1a1a1a',
          fontFamily: Platform.select({
            ios: 'System',
            android: 'Roboto',
            default: 'System',
          }),
        }}
        text2Style={{
          fontSize: 14,
          color: '#666',
          fontFamily: Platform.select({
            ios: 'System',
            android: 'Roboto',
            default: 'System',
          }),
        }}
      />
    ),
    
    error: (props) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: '#FF5252',
          borderLeftWidth: 5,
          width: Dimensions.get('window').width - 32,
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          paddingVertical: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#1a1a1a',
          fontFamily: Platform.select({
            ios: 'System',
            android: 'Roboto',
            default: 'System',
          }),
        }}
        text2Style={{
          fontSize: 14,
          color: '#666',
          fontFamily: Platform.select({
            ios: 'System',
            android: 'Roboto',
            default: 'System',
          }),
        }}
      />
    ),

    info: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: '#2196F3',
          borderLeftWidth: 5,
          width: Dimensions.get('window').width - 32,
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          paddingVertical: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#1a1a1a',
          fontFamily: Platform.select({
            ios: 'System',
            android: 'Roboto',
            default: 'System',
          }),
        }}
        text2Style={{
          fontSize: 14,
          color: '#666',
          fontFamily: Platform.select({
            ios: 'System',
            android: 'Roboto',
            default: 'System',
          }),
        }}
      />
    ),
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast config={toastConfig} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);