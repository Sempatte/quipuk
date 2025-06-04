// components/ui/StatusBarWrapper.tsx - Wrapper para StatusBar consistente
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useBlackStatusBar } from '@/hooks/useStatusBar';

interface StatusBarWrapperProps {
  style?: 'light' | 'dark' | 'auto';
  backgroundColor?: string;
  translucent?: boolean;
  hidden?: boolean;
}

/**
 * Wrapper del StatusBar que garantiza consistencia en toda la app
 * Por defecto siempre usa el statusbar negro con texto blanco
 */
export const StatusBarWrapper: React.FC<StatusBarWrapperProps> = ({
  style = 'light',
  backgroundColor = '#000000',
  translucent = false,
  hidden = false,
}) => {
  // Usar el hook para garantizar configuración nativa
  useBlackStatusBar();

  return (
    <StatusBar 
      style={style}
      backgroundColor={backgroundColor}
      translucent={translucent}
      hidden={hidden}
    />
  );
};

/**
 * StatusBar específico para pantallas con fondo negro
 */
export const BlackStatusBar: React.FC = () => {
  useBlackStatusBar();
  
  return (
    <StatusBar 
      style="light"
      backgroundColor="#000000"
      translucent={false}
      hidden={false}
    />
  );
};

/**
 * StatusBar para casos excepcionales con fondo blanco
 */
export const WhiteStatusBar: React.FC = () => {
  return (
    <StatusBar 
      style="dark"
      backgroundColor="#FFFFFF"
      translucent={false}
      hidden={false}
    />
  );
};