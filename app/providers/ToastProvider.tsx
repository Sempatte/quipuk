// providers/ToastProvider.tsx
import React, { createContext, useContext } from 'react';
import Toast from 'react-native-toast-message';

const ToastContext = createContext({
  showToast: (type: 'success' | 'error' | 'info', text1: string, text2?: string) => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showToast = (type: 'success' | 'error' | 'info', text1: string, text2?: string) => {
    Toast.show({
      type,
      text1,
      text2,
    });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
