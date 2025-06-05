// components/ui/StatusBarManager.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';

export interface StatusBarProps {
  style?: 'light' | 'dark' | 'auto';
  backgroundColor?: string;
  translucent?: boolean;
  hidden?: boolean;
}

export const StatusBarManager: React.FC<StatusBarProps> = ({
  style = 'light',
  backgroundColor = '#000000',
  translucent = false,
  hidden = false,
}) => {
  return (
    <StatusBar
      style={style}
      backgroundColor={backgroundColor}
      translucent={translucent}
      hidden={hidden}
    />
  );
};

// Presets comunes para diferentes pantallas
export const StatusBarPresets = {
  auth: {
    style: 'light' as const,
    backgroundColor: '#000000',
    translucent: false,
    hidden: false,
  },
  main: {
    style: 'dark' as const,
    backgroundColor: '#FFFFFF',
    translucent: false,
    hidden: false,
  },
  tabs: {
    style: 'light' as const,
    backgroundColor: '#000000',
    translucent: false,
    hidden: false,
  },
} as const;

export default StatusBarManager;