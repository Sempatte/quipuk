import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CategoryData } from "@/hooks/useExpenseCategories";

interface LegendProps {
  categories: CategoryData[];
}

/**
 * Componente de leyenda para mostrar las categorías del gráfico circular
 */
const Legend: React.FC<LegendProps> = ({ categories }) => {
  if (!categories.length) {
    return null;
  }

  // Dividir las categorías en dos columnas
  const leftColumnCategories: CategoryData[] = [];
  const rightColumnCategories: CategoryData[] = [];
  
  categories.forEach((category, index) => {
    if (index % 2 === 0) {
      leftColumnCategories.push(category);
    } else {
      rightColumnCategories.push(category);
    }
  });

  // Renderizar una categoría
  const renderCategory = (category: CategoryData) => (
    <View key={category.name} style={styles.legendItem}>
      <View
        style={[
          styles.colorIndicator,
          { backgroundColor: category.color },
        ]}
      />
      <Text style={styles.legendText}>
        {category.name} {category.percentage}%
      </Text>
    </View>
  );

  return (
    <View style={styles.legendContainer}>
      <View style={styles.column}>
        {leftColumnCategories.map(renderCategory)}
      </View>
      <View style={styles.column}>
        {rightColumnCategories.map(renderCategory)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  column: {
    width: "48%",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#000",
  },
});

export default Legend;