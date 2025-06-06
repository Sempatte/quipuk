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
import { useProfilePicture } from "@/hooks/useProfilePicture";;
import Avatar from "@/components/ui/Avatar";
import {  useDeviceUnlink } from "@/components/DeviceUnlinkModal";
import { StatusBarManager, StatusBarPresets } from "@/components/ui/StatusBarManager";

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

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  header: {
    backgroundColor: "#000000",
    paddingTop: 60,
    paddingBottom: 10,
    alignItems: "center",
    position: 'relative',
  },
  headerTitle: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: "Outfit_600SemiBold",
  },
  deviceBadge: {
    position: 'absolute',
    top: 65,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 220, 90, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 220, 90, 0.3)',
  },
  deviceBadgeText: {
    fontSize: 12,
    color: '#00DC5A',
    fontFamily: 'Outfit_500Medium',
    marginLeft: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: 30,
    zIndex: 1,
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#00DC5A",
    fontFamily: "Outfit_500Medium",
    textAlign: "center",
  },
  deletingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#E86F51",
    fontFamily: "Outfit_500Medium",
    textAlign: "center",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    color: "#060606",
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
  userName: {
    fontSize: 24,
    color: "#060606",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "Outfit_700Bold",
  },

  // Tarjetas
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  securityCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#00DC5A",
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  securityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityItemText: {
    marginLeft: 12,
    flex: 1,
  },
  securityItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    fontFamily: 'Outfit_500Medium',
  },
  securityItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Outfit_400Regular',
  },
  removeButton: {
    backgroundColor: '#FEF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#E74C3C',
    fontFamily: 'Outfit_500Medium',
  },
  unlinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  unlinkButtonText: {
    fontSize: 12,
    color: '#E74C3C',
    marginLeft: 4,
    fontFamily: 'Outfit_500Medium',
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 220, 90, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 3,
    fontFamily: "Outfit_400Regular",
  },
  infoValue: {
    fontSize: 16,
    color: "#060606",
    fontFamily: "Outfit_500Medium",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 55,
  },

  optionsCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#060606",
    fontFamily: "Outfit_500Medium",
  },
  optionDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 65,
  },

  logoutButton: {
    backgroundColor: "#E86F51",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#E86F51",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  },
  logoutText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
    marginLeft: 8,
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  errorText: {
    fontSize: 20,
    color: "#060606",
    marginTop: 20,
    marginBottom: 10,
    fontFamily: "Outfit_600SemiBold",
  },
  errorSubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 30,
    fontFamily: "Outfit_400Regular",
  },
});