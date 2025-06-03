import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { User } from '@/app/types/auth.types';

interface BiometricSetupModalProps {
  visible: boolean;
  user: User;
  onComplete: (enabled: boolean) => void;
}

export const BiometricSetupModal: React.FC<BiometricSetupModalProps> = ({
  visible,
  user,
  onComplete,
}) => {
  const { setupBiometric, isLoading, isAvailable } = useBiometricAuth();

  const handleSetup = async () => {
    try {
      const success = await setupBiometric(user);
      onComplete(success);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo configurar Face ID');
    }
  };

  const handleSkip = () => {
    onComplete(false);
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>🔐 Configura Face ID</Text>
          <Text style={styles.subtitle}>
            Accede a tus finanzas de forma rápida y segura
          </Text>
          <Text style={styles.description}>
            • Inicio de sesión instantáneo{'\n'}
            • Máxima seguridad para tus datos{'\n'}
            • Solo tu rostro puede acceder
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSetup}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Configurando...' : 'Activar Face ID'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Ahora no</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});