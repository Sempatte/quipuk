import React from 'react';
import { View, Text, Switch, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@apollo/client';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { GET_USER_PROFILE } from '@/app/graphql/users.graphql';
import { useBiometricAuthManager } from '@/app/hooks/useBiometricAuth';
import { User } from '@/app/interfaces/auth.interface';
import styles from '@/app/styles/settingsScreen.styles';
import { StatusBarManager, StatusBarPresets } from '@/app/components/ui/StatusBarManager';

export default function SettingsScreen() {
  const router = useRouter();
  const { data: userData, loading: userLoading, error: userError } = useQuery<{ getUserProfile: User }>(GET_USER_PROFILE);
  
  const user = userData?.getUserProfile ?? null;
  const { 
    isLoading: biometricLoading, 
    isAvailable, 
    isEnabled, 
    toggleBiometrics 
  } = useBiometricAuthManager(user);

  const handleToggle = () => {
    if (!biometricLoading) {
      toggleBiometrics();
    }
  };

  const isLoading = userLoading || biometricLoading;

  return (
    <View style={styles.container}>
      <StatusBarManager {...StatusBarPresets.main} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguridad</Text>
      </View>
      
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00DC5A" />
          </View>
        ) : userError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={50} color="#E86F51" />
            <Text style={styles.errorText}>Error al cargar la configuración.</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acceso Biométrico</Text>
            <View style={styles.item}>
              <View>
                <Text style={styles.itemText}>Habilitar Face ID</Text>
                <Text style={styles.itemNote}>
                  {isAvailable 
                    ? 'Usa tu rostro para un acceso rápido y seguro.' 
                    : 'Face ID no disponible en este dispositivo.'}
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleToggle}
                disabled={!isAvailable || biometricLoading}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isEnabled ? "#00DC5A" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
} 