import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Modal } from 'react-native';

interface LoaderProps {
  visible: boolean;
  text?: string;
  fullScreen?: boolean;
  color?: string;
  backgroundColor?: string;
  size?: 'small' | 'large';
}

/**
 * Un componente Loader profesional y reutilizable para mostrar estados de carga.
 * 
 * @param visible Determina si el loader está visible.
 * @param text Texto opcional para mostrar debajo del loader.
 * @param fullScreen Si es true, el loader cubrirá toda la pantalla con un fondo semitransparente.
 * @param color Color primario del loader.
 * @param backgroundColor Color de fondo cuando fullScreen es true.
 * @param size Tamaño del indicador de actividad ('small' o 'large').
 */
export const Loader: React.FC<LoaderProps> = ({
  visible,
  text,
  fullScreen = false,
  color = '#00DC5A', // Color verde que coincide con tu diseño
  backgroundColor = 'rgba(0, 0, 0, 0.7)',
  size = 'large',
}) => {
  if (!visible) return null;

  // Contenido del loader
  const loaderContent = (
    <View style={styles.loaderContent}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={[styles.text, { color }]}>{text}</Text>}
    </View>
  );

  // Loader en pantalla completa con fondo semitransparente
  if (fullScreen) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={[styles.fullScreenContainer, { backgroundColor }]}>
          {loaderContent}
        </View>
      </Modal>
    );
  }

  // Loader inline
  return (
    <View style={styles.container}>
      {loaderContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loaderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    minWidth: 100,
    minHeight: 100,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    color: '#FFFFFF',
  },
});

export default Loader;