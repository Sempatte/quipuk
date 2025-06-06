// components/DeviceUnlinkModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { deviceManagementService } from '@/app/services/deviceManagementService';
import { biometricService } from '@/app/services/biometricService';
import { pinService } from '@/app/services/pinService';
import { useToast } from '@/app/providers/ToastProvider';

interface DeviceUnlinkModalProps {
  visible: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const DeviceUnlinkModal: React.FC<DeviceUnlinkModalProps> = ({
  visible,
  onClose,
  userEmail = "tu cuenta"
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleUnlinkDevice = async () => {
    Alert.alert(
      "⚠️ Desvincular Dispositivo",
      `Esta acción eliminará permanentemente:\n\n• Tu PIN configurado\n• Tu configuración de Face ID\n• Todos los datos de autenticación\n\n¿Estás seguro de que deseas continuar?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sí, desvincular",
          style: "destructive",
          onPress: performUnlink,
        },
      ]
    );
  };

  const performUnlink = async () => {
    setIsProcessing(true);
    
    try {
      const results = await Promise.allSettled([
        biometricService.clearBiometricData(),
        pinService.clearPinData(),
        deviceManagementService.unlinkDevice(),
        AsyncStorage.multiRemove(["token", "userId"])
      ]);

      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn('Algunas operaciones de limpieza fallaron:', failures);
        // Continuar de todos modos ya que el usuario solicitó la desvinculación
      }

      showToast(
        "success",
        "Dispositivo desvinculado",
        "Todos los datos han sido eliminados correctamente"
      );

      // Cerrar modal y navegar al login
      onClose();
      router.replace("/LoginScreen");
      
    } catch (error) {
      console.error("Error unlinking device:", error);
      showToast("error", "Error", "No se pudo desvincular el dispositivo");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Ionicons name="unlink" size={48} color="#E74C3C" />
            <Text style={styles.title}>Desvincular Dispositivo</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              Vas a desvincular este dispositivo de {userEmail}.
            </Text>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={24} color="#FF9800" />
              <Text style={styles.warningText}>
                Esta acción no se puede deshacer. Tendrás que volver a iniciar sesión 
                y configurar nuevamente tu PIN y Face ID.
              </Text>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Ionicons name="key" size={20} color="#666" />
                <Text style={styles.infoText}>Se eliminará tu PIN</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="scan" size={20} color="#666" />
                <Text style={styles.infoText}>Se deshabilitará Face ID</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="phone-portrait" size={20} color="#666" />
                <Text style={styles.infoText}>Se desvinculará el dispositivo</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="log-out" size={20} color="#666" />
                <Text style={styles.infoText}>Se cerrará tu sesión</Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.unlinkButton]}
              onPress={handleUnlinkDevice}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="unlink" size={20} color="#FFF" />
                  <Text style={styles.unlinkButtonText}>Desvincular</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#FEF5F5',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'Outfit_700Bold',
  },
  content: {
    padding: 24,
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontFamily: 'Outfit_400Regular',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
    marginLeft: 12,
    fontFamily: 'Outfit_400Regular',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    fontFamily: 'Outfit_400Regular',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#F8F9FA',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E5E8EB',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    fontFamily: 'Outfit_600SemiBold',
  },
  unlinkButton: {
    backgroundColor: '#E74C3C',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  unlinkButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Outfit_600SemiBold',
  },
});

// Hook para gestionar la desvinculación
export const useDeviceUnlink = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const showUnlinkModal = () => setIsModalVisible(true);
  const hideUnlinkModal = () => setIsModalVisible(false);

  const quickUnlink = async () => {
    console.log("Quick unlinking device...");
    
    try {
      const results = await Promise.allSettled([
        biometricService.clearBiometricData(),
        pinService.clearPinData(),
        deviceManagementService.unlinkDevice(),
        AsyncStorage.multiRemove(["token", "userId"])
      ]);

      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn('Algunas operaciones de limpieza fallaron durante el quickUnlink:', failures);
      }
      
      showToast(
        "success",
        "Dispositivo desvinculado [DEV]",
        "Se limpiaron los datos de autenticación."
      );
      
      router.replace("/LoginScreen");
      
    } catch (error) {
      console.error("Error during quick unlink:", error);
      showToast("error", "Error", "No se pudo desvincular el dispositivo rápidamente.");
    }
  };

  return {
    isModalVisible,
    showUnlinkModal,
    hideUnlinkModal,
    quickUnlink,
  };
};