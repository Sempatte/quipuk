import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

interface CarouselItem {
  id: string;
  title?: string;
  description?: string;
  amount?: string;
  icon?: any;
  backgroundColor?: string;
  isAddButton?: boolean;
}

interface CarouselProps {
  title: string;
  items: CarouselItem[];
  onAddPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

const Carousel: React.FC<CarouselProps> = ({ title, items, onAddPress }) => {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);

  useEffect(() => {
    // 🔥 Cada vez que los items cambian, actualizamos el estado y re-renderizamos
    setCarouselItems([...items, { id: "add_button", isAddButton: true }]);
  }, [items]);

  return (
    <View style={styles.container}>
      <Text style={styles.carouselTitle}>{title}</Text>

      <FlatList
        data={carouselItems}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        extraData={carouselItems} // 🔥 Asegura que FlatList detecte los cambios
        initialNumToRender={carouselItems.length} 
        removeClippedSubviews={false} // 🔥 Evita que el FlatList oculte el carrusel al cambiar de categoría
        renderItem={({ item }) =>
          item.isAddButton ? (
            <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
              <View style={styles.addButtonContent}>
                <View style={styles.addIconContainer}>
                  <Icon name="add" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.addButtonText}>Agregar</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.card}>
              <View style={styles.iconAndTextContainer}>
                <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
                  {item.icon ? item.icon : null}
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                    {item.title || ""}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={1} ellipsizeMode="tail">
                    {item.description || ""}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardAmount}>{item.amount}</Text>
            </View>
          )
        }
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
    width: SCREEN_WIDTH * 0.45,
    height: 90,
    marginHorizontal: 5,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowRadius: 4,
    elevation: 5,
  },
  iconAndTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    overflow: "hidden",
  },
  cardTitle: {
    fontWeight: "bold",
    color: "#000",
    marginBottom: 2,
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    maxWidth: "90%",
  },
  cardDescription: {
    color: "#777",
    fontFamily: "Outfit_300Light",
    fontSize: 11,
    maxWidth: "90%",
  },
  cardAmount: {
    fontSize: 14.5,
    fontWeight: "bold",
    color: "#000",
  },
  addButton: {
    width: SCREEN_WIDTH * 0.45,
    height: 90,
    backgroundColor: "#222",
    borderRadius: 10,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  addIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#00DC5A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  addButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontFamily: "Outfit_400Regular",
    lineHeight: 22,
    alignSelf: "center",
  },
});

export default Carousel;
