// hooks/useCustomToast.ts - Hook avanzado para toast
import { useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export interface ToastOptions {
  position?: 'top' | 'bottom';
  duration?: number;
  hapticFeedback?: boolean;
  autoHide?: boolean;
}

export const useCustomToast = () => {
  const insets = useSafeAreaInsets();

  const showToast = useCallback((
    type: 'success' | 'error' | 'info',
    text1: string,
    text2?: string,
    options: ToastOptions = {}
  ) => {
    const {
      position = 'top',
      duration = 4000,
      hapticFeedback = true,
      autoHide = true,
    } = options;

    // 🎯 Haptic feedback según el tipo de toast
    if (hapticFeedback && Platform.OS === 'ios') {
      switch (type) {
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'info':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
      }
    }

    // 📱 Calcular offset según la posición y notch
    const topOffset = position === 'top' ? insets.top + 10 : undefined;
    const bottomOffset = position === 'bottom' ? insets.bottom + 10 : undefined;

    Toast.show({
      type,
      text1,
      text2,
      position,
      visibilityTime: duration,
      autoHide,
      topOffset,
      bottomOffset,
      // 🎨 Animaciones suaves
      onShow: () => {
      },
      onHide: () => {
      },
    });
  }, [insets]);

  // 🚀 Métodos de conveniencia
  const showSuccess = useCallback((text1: string, text2?: string, options?: ToastOptions) => {
    showToast('success', text1, text2, options);
  }, [showToast]);

  const showError = useCallback((text1: string, text2?: string, options?: ToastOptions) => {
    showToast('error', text1, text2, options);
  }, [showToast]);

  const showInfo = useCallback((text1: string, text2?: string, options?: ToastOptions) => {
    showToast('info', text1, text2, options);
  }, [showToast]);

  const hideToast = useCallback(() => {
    Toast.hide();
  }, []);

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    hideToast,
  };
};