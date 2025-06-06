// app/(tabs)/EnhancedProfile.tsx
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from "react-native";
import { useQuery } from "@apollo/client";
import { Ionicons } from '@expo/vector-icons';

import { GET_USER_PROFILE } from "../graphql/users.graphql";
import { useProfilePicture } from "@/app/hooks/useProfilePicture";
import Avatar from "@/app/components/ui/Avatar";
import {  useDeviceUnlink } from "@/app/components/DeviceUnlinkModal";
import { StatusBarManager, StatusBarPresets } from "@/app/components/ui/StatusBarManager";
import styles from "../styles/profileScreen.styles";

interface UserProfile {
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl?: string | null;
}

export default function EnhancedProfile() {


  // Query del perfil
  const { loading, error, data } = useQuery<{ getUserProfile: UserProfile }>(
    GET_USER_PROFILE,
    {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    }
  );

  // Hook personalizado para foto de perfil
  const {
    state: profilePictureState,
    selectAndUploadImage,
    deleteProfilePicture
  } = useProfilePicture();



  // Hook de desvinculación
  const {
    quickUnlink
  } = useDeviceUnlink();

  // Manejar acciones del avatar
  const handleAvatarPress = useCallback(() => {
    if (profilePictureState.profilePictureUrl) {
      Alert.alert(
        'Foto de perfil',
        'Selecciona una acción',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cambiar foto',
            onPress: selectAndUploadImage
          },
          {
            text: 'Eliminar foto',
            onPress: deleteProfilePicture,
            style: 'destructive'
          },
        ]
      );
    } else {
      selectAndUploadImage();
    }
  }, [profilePictureState.profilePictureUrl, selectAndUploadImage, deleteProfilePicture]);


  

  // Determinar estados de loading
  const shouldShowAvatarLoading = useCallback(() => {
    return profilePictureState.isUploading || profilePictureState.isDeleting;
  }, [profilePictureState.isUploading, profilePictureState.isDeleting]);

  const shouldShowGeneralLoading = useCallback(() => {
    return profilePictureState.isInitialLoading && !data?.getUserProfile;
  }, [profilePictureState.isInitialLoading, data?.getUserProfile]);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#E86F51" />
          <Text style={styles.errorText}>Error al cargar el perfil</Text>
          <Text style={styles.errorSubtext}>{error.message}</Text>

        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBarManager {...StatusBarPresets.tabs} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <Avatar
            imageUrl={profilePictureState.cacheBustedUrl || undefined}
            name={data?.getUserProfile?.fullName}
            size="xlarge"
            editable={true}
            onPress={handleAvatarPress}
            onEdit={selectAndUploadImage}
            loading={shouldShowAvatarLoading()}
            progress={profilePictureState.uploadProgress}
          />

          {profilePictureState.isUploading && (
            <Text style={styles.uploadingText}>
              Subiendo imagen... {Math.round(profilePictureState.uploadProgress)}%
            </Text>
          )}
          {profilePictureState.isDeleting && (
            <Text style={styles.deletingText}>Eliminando imagen...</Text>
          )}
        </View>

        <View style={styles.contentContainer}>
          {shouldShowGeneralLoading() ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00DC5A" />
              <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
          ) : (
            data?.getUserProfile && (
              <>
                <Text style={styles.userName}>{data.getUserProfile.fullName}</Text>

                {/* Información de contacto */}
                <View style={styles.infoCard}>
                  <View style={styles.infoItem}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="call-outline" size={24} color="#00DC5A" />
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>Teléfono</Text>
                      <Text style={styles.infoValue}>{data.getUserProfile.phoneNumber || 'No especificado'}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoItem}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="mail-outline" size={24} color="#00DC5A" />
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>Correo</Text>
                      <Text style={styles.infoValue}>{data.getUserProfile.email}</Text>
                    </View>
                  </View>
                </View>


                {/* Opciones generales */}
                <View style={styles.optionsCard}>
                  <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons name="settings-outline" size={22} color="#333" />
                    </View>
                    <Text style={styles.optionText}>Configuraciones</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>

                  <View style={styles.optionDivider} />



                  <View style={styles.optionDivider} />

                  <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons name="help-circle-outline" size={22} color="#333" />
                    </View>
                    <Text style={styles.optionText}>Ayuda y Soporte</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                </View>

                {/* Botón de cierre de sesión */}
                {__DEV__ && (
                  <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={quickUnlink}
                  activeOpacity={0.8}
                >
                  <Text style={styles.logoutText}>Desvincular dispositivo [DEV]</Text>
                </TouchableOpacity>
                )} 
              </>
            )
          )}
        </View>
      </ScrollView>

    </View>
  );
}