// constants/styles.ts
import { StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

/**
 * Estilos globales compartidos entre componentes
 * para mantener una apariencia uniforme en toda la aplicación
 */
export const globalStyles = StyleSheet.create({
  // Contenedor principal para secciones con fondo blanco
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 15,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  
  // Contenedor para títulos de sección
  titleContainer: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  
  // Estilo para títulos de sección
  sectionTitle: {
    fontSize: 25,
    fontFamily: "Outfit_600SemiBold",
    color: "#000",
    marginBottom: 15,
  },

  // Estilos para textos de error
  errorText: {
    textAlign: "center",
    color: Colors.chart.expense,
    padding: 15,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 16,
  },
  
  errorSubtext: {
    textAlign: "center",
    color: "#666",
    padding: 5,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
  },
  
  // Estados de carga
  loadingContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  
  loadingText: {
    fontSize: 14,
    color: "#666666",
    fontFamily: "Outfit_400Regular",
  },
  
  // Cabecera de la aplicación (Header con fondo negro)
  header: {
    backgroundColor: '#000000',
    paddingTop: 50,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
});