import React from "react";
import { View, Text, StyleSheet, FlatList, Dimensions } from "react-native";

interface CarouselItem {
  id: string;
  title: string;
  description: string;
  amount: string;
  icon: any; // Puedes especificar un tipo de imagen si necesitas
  backgroundColor: string;
}

interface CarouselProps {
  title: string;
  items: CarouselItem[];
}

const SCREEN_WIDTH = Dimensions.get("window").width;

const Carousel: React.FC<CarouselProps> = ({ title, items }) => {
  return (
    <View style={styles.container}>
      {/* Título del carrusel */}
      <Text style={styles.carouselTitle}>{title}</Text>

      {/* Lista horizontal */}
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        initialNumToRender={3} // Renderiza solo 3 elementos inicialmente
        renderItem={({ item }) => (
          <View style={[styles.card]}>
            {/* Contenedor del ícono y el texto */}
            <View style={styles.iconAndTextContainer}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.backgroundColor },
                ]}
              >
                {item.icon ? item.icon : null}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                  {item.title}
                </Text>
                <Text style={styles.cardDescription} numberOfLines={1} ellipsizeMode="tail">
                  {item.description}
                </Text>
              </View>
            </View>
            {/* Cantidad */}
            <Text style={styles.cardAmount}>{item.amount}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    paddingHorizontal: 0,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
  },
  card: {
    width: SCREEN_WIDTH * 0.45, // Ajusta el ancho de la tarjeta para acomodar el diseño
    marginHorizontal: 5, // Espaciado entre tarjetas
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowRadius: 4,
    elevation: 5,
  },
  iconAndTextContainer: {
    flexDirection: "row", // Pone el ícono y el texto en la misma fila
    alignItems: "center",
    marginBottom: 5, // Espaciado entre la fila y la cantidad
    textRendering: "optimizeLegibility",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10, // Espaciado entre el ícono y el texto
  },
  textContainer: {
    flex: 1, // Permite que el texto use el espacio disponible sin desbordarse
    overflow: "hidden"
  },
  cardTitle: {
    fontWeight: "bold",
    color: "#000",
    marginBottom: 2,
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    maxWidth: "90%", // Evita que el texto se expanda demasiado
    
  },
  cardDescription: {
    color: "#777",
    fontFamily: "Outfit_300Light",
    fontSize: 11,
    maxWidth: "90%", // Ajusta el ancho del texto
  },
  cardAmount: {
    fontSize: 14.5,
    fontWeight: "bold",
    color: "#000",
  },
  listContent: {
    paddingHorizontal: 10,
  },
});

export default Carousel;
