// app/providers/ToastProvider.tsx - VERSION FUNCIONAL SIN ERRORES
import React, { createContext, useContext } from 'react';
import Toast, { ToastConfig, BaseToast, ErrorToast } from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, Dimensions, View, Text } from 'react-native';

const ToastContext = createContext({
  showToast: (type: 'success' | 'error' | 'info', text1: string, text2?: string) => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();

  const showToast = (type: 'success' | 'error' | 'info', text1: string, text2?: string) => {
    Toast.show({
      type,
      text1,
      text2,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: insets.top + 10, // 🔥 CLAVE: Respeta el notch + margen
    });
  };

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