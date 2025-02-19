import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface SlideOption {
  label: string;
  value: "Gastos" | "Ingresos" | "Ahorros";
}

interface AgregarSlidesProps {
  colors: {
    Gastos: string;
    Ingresos: string;
    Ahorros: string;
  };
  onChange: (value: SlideOption["value"]) => void; // Nueva prop
}

const slideOptions: SlideOption[] = [
  { label: "Gastos", value: "Gastos" },
  { label: "Ingresos", value: "Ingresos" },
  { label: "Ahorros", value: "Ahorros" },
];

const { width } = Dimensions.get("window");
const SLIDE_WIDTH = (width - 40) / slideOptions.length; // Ancho de cada opción del slider

const AgregarSlides: React.FC<AgregarSlidesProps> = ({ colors, onChange }) => {
  const [selected, setSelected] = useState<SlideOption["value"]>("Gastos");

  // Animación de la posición del slider
  const translateX = useSharedValue(0);

  const handlePress = (index: number, value: SlideOption["value"]) => {
    setSelected(value);
    translateX.value = withTiming(index * SLIDE_WIDTH, { duration: 300 });
    onChange(value); // Llama a la función onChange para notificar el estado
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Indicador deslizante */}
      <Animated.View
        style={[
          styles.sliderIndicator,
          { backgroundColor: colors[selected] },
          animatedStyle,
        ]}
      />

      {/* Opciones */}
      {slideOptions.map((option, index) => (
        <TouchableWithoutFeedback
          key={option.value}
          onPress={() => handlePress(index, option.value)}
        >
          <View style={styles.option}>
            <Text
              style={[
                styles.text,
                selected === option.value
                  ? styles.activeText
                  : styles.inactiveText,
              ]}
            >
              {option.label}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between", // Asegura la distribución uniforme
    alignItems: "center", // Centra verticalmente
    backgroundColor: "#fff",
    borderRadius: 30,
    position: "relative",
    overflow: "hidden",
  },
  sliderIndicator: {
    position: "absolute",
    height: "100%",
    width: SLIDE_WIDTH, // Tamaño dinámico del indicador
    borderRadius: 30,
    zIndex: 0,
    borderColor: "#000",
    borderWidth: 1,
  },
  option: {
    flex: 1, // Asegura que cada opción tenga el mismo ancho
    justifyContent: "center", // Centra verticalmente el contenido
    alignItems: "center", // Centra horizontalmente el contenido
    height: 50,
  },
  text: {
    fontFamily: "Outfit_500Medium",
    fontSize: 18,
    zIndex: 2, // Asegura que el texto esté encima del indicador
  },
  activeText: {
    color: "#000",
  },
  inactiveText: {
    color: "#333333",
  },
});

export default AgregarSlides;
