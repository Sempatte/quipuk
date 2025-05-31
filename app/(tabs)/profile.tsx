// app/(tabs)/profile.tsx - CORRECCIÓN CRÍTICA: USAR CACHE BUSTED URL
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import { useQuery } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import client from "@/app/apolloClient";

import { RootStackNavigationProp } from "../interfaces/navigation";
import { GET_USER_PROFILE } from "../graphql/users.graphql";
import { useProfilePicture } from "@/hooks/useProfilePicture";
import Avatar from "@/components/ui/Avatar";

const { width } = Dimensions.get('window');

interface UserProfile {
  fullName: string;
  phone: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl?: string | null;
}

export default function Profile() {
  const navigation = useNavigation<RootStackNavigationProp<"(tabs)">>();
  const router = useRouter();

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
    deleteProfilePicture,
    forceRefresh,
    retryImageLoad // 🆕 Para reintentar
  } = useProfilePicture();

  // 🆕 FUNCIÓN DE DEBUG MEJORADA
  const debugProfilePicture = useCallback(() => {
    const debugInfo = {
      // Datos del query
      loading,
      error: error?.message,
      profileFromQuery: data?.getUserProfile?.profilePictureUrl,
      
      // Estado del hook
      profileFromHook: profilePictureState.profilePictureUrl,
      cacheBustedUrl: profilePictureState.cacheBustedUrl, // 🔥 NUEVO CAMPO
      isUploading: profilePictureState.isUploading,
      isDeleting: profilePictureState.isDeleting,
      hasInitiallyLoaded: profilePictureState.hasInitiallyLoaded,
      isInitialLoading: profilePictureState.isInitialLoading,
      lastUpdated: new Date(profilePictureState.lastUpdated).toLocaleTimeString(),
      
      // Comparación
      urlsMatch: data?.getUserProfile?.profilePictureUrl === profilePictureState.profilePictureUrl,
      hasCacheBustedUrl: !!profilePictureState.cacheBustedUrl,
    };

    console.log('🔍 [Profile Debug] Estado completo:', debugInfo);
    
    Alert.alert(
      'Debug Info',
      JSON.stringify(debugInfo, null, 2),
      [
        { text: 'Cerrar' },
        { text: 'Force Refresh', onPress: forceRefresh },
        { text: 'Retry Image', onPress: retryImageLoad }, // 🆕 Opción para reintentar
      ]
    );
  }, [loading, error, data, profilePictureState, forceRefresh, retryImageLoad]);

  // Función de logout
  const handleLogout = useCallback(async () => {
    try {
      Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro que deseas cerrar sesión?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cerrar Sesión",
            onPress: async () => {
              try {
                console.log("🔄 [Profile] Iniciando proceso de logout...");
                
                await AsyncStorage.multiRemove(["token", "userId"]);
                await client.resetStore();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                router.replace("/LoginScreen");
                console.log("✅ [Profile] Logout completado");
                
              } catch (error) {
                console.error("❌ [Profile] Error durante logout:", error);
                Alert.alert("Error", "Hubo un problema al cerrar sesión. Intenta nuevamente.");
              }
            },
            style: "destructive"
          }
        ]
      );
    } catch (error) {
      console.error("❌ [Profile] Error en logout:", error);
      Alert.alert("Error", "No se pudo cerrar sesión.");
    }
  }, [router]);

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
          // 🆕 OPCIONES DE DEBUG
          { 
            text: 'Debug Info', 
            onPress: debugProfilePicture,
            style: 'default'
          },
          { 
            text: 'Retry Load', 
            onPress: retryImageLoad,
            style: 'default'
          },
        ]
      );
    } else {
      selectAndUploadImage();
    }
  }, [profilePictureState.profilePictureUrl, selectAndUploadImage, deleteProfilePicture, debugProfilePicture, retryImageLoad]);

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
          
          <TouchableOpacity style={styles.debugButton} onPress={debugProfilePicture}>
            <Text style={styles.debugButtonText}>Debug Info</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        
        {/* 🆕 BOTÓN DE DEBUG EN HEADER (SOLO EN DEV) */}
        {__DEV__ && (
          <TouchableOpacity style={styles.debugButtonHeader} onPress={debugProfilePicture}>
            <Ionicons name="bug" size={20} color="#00DC5A" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <Avatar
            imageUrl={profilePictureState.cacheBustedUrl} // 🔥 CAMBIO CRÍTICO: Usar cacheBustedUrl
            name={data?.getUserProfile?.fullName}
            size="xlarge"
            editable={true}
            onPress={handleAvatarPress}
            onEdit={selectAndUploadImage}
            loading={shouldShowAvatarLoading()}
            progress={profilePictureState.uploadProgress}
          />
          
          {/* 🆕 INFORMACIÓN DE DEBUG VISUAL */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Original URL: {profilePictureState.profilePictureUrl ? '✅' : '❌'}
              </Text>
              <Text style={styles.debugText}>
                Cache Busted: {profilePictureState.cacheBustedUrl ? '✅' : '❌'}
              </Text>
              <Text style={styles.debugText}>
                Loading: {shouldShowAvatarLoading() ? '⏳' : '✅'}
              </Text>
              <Text style={styles.debugText}>
                Updated: {new Date(profilePictureState.lastUpdated).toLocaleTimeString()}
              </Text>
            </View>
          )}
          
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
                
                {/* Tarjeta de información de contacto */}
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
                
                {/* Tarjeta de opciones */}
                <View style={styles.optionsCard}>
                  <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons name="settings-outline" size={22} color="#333" />
                    </View>
                    <Text style={styles.optionText}>Configuraciones</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                  
                  <View style={styles.optionDivider} />
                  
                  <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons name="shield-outline" size={22} color="#333" />
                    </View>
                    <Text style={styles.optionText}>Privacidad y Seguridad</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                  
                  <View style={styles.optionDivider} />
                  
                  <TouchableOpacity style={styles.optionItem} activeOpacity={0.7}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons name="help-circle-outline" size={22} color="#333" />
                    </View>
                    <Text style={styles.optionText}>Ayuda y Soporte</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
                
                {/* 🆕 SECCIÓN DE DEBUG EXPANDIDA (solo en dev) */}
                {__DEV__ && (
                  <View style={styles.debugCard}>
                    <Text style={styles.debugCardTitle}>🐛 Debug Information</Text>
                    <TouchableOpacity style={styles.debugOption} onPress={debugProfilePicture}>
                      <Text style={styles.debugOptionText}>📊 Ver Debug Completo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.debugOption} onPress={retryImageLoad}>
                      <Text style={styles.debugOptionText}>🔄 Reintentar Carga de Imagen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.debugOption} onPress={forceRefresh}>
                      <Text style={styles.debugOptionText}>⚡ Force Refresh</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Botón de cierre de sesión */}
                <TouchableOpacity 
                  style={styles.logoutButton} 
                  onPress={handleLogout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>
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
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: "Outfit_600SemiBold",
  },
  // 🆕 ESTILOS PARA DEBUG MEJORADOS
  debugButtonHeader: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 220, 90, 0.2)',
    padding: 8,
    borderRadius: 20,
  },
  debugButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  debugButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
  },
  debugInfo: {
    marginTop: 10,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 11,
    color: "#666",
    fontFamily: "Outfit_400Regular",
    marginVertical: 1,
  },
  debugCard: {
    backgroundColor: "#FFF3CD",
    borderRadius: 16,
    padding: 15,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
  },
  debugCardTitle: {
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
    color: "#856404",
    marginBottom: 10,
  },
  debugOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    borderRadius: 8,
    marginVertical: 3,
  },
  debugOptionText: {
    fontSize: 14,
    color: "#856404",
    fontFamily: "Outfit_500Medium",
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
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  logoutText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
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