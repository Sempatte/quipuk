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

  // Agrupar las categorías por filas
  const rows: CategoryData[][] = [];
  let currentRow: CategoryData[] = [];

  categories.forEach((category, index) => {
    currentRow.push(category);
    // Crear una nueva fila cada 2 elementos o al final de la lista
    if (currentRow.length === 2 || index === categories.length - 1) {
      rows.push([...currentRow]);
      currentRow = [];
    }
  });

  return (
    <View style={styles.legendContainer}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.legendRow}>
          {row.map((category) => (
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
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  legendContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    marginVertical: 5,
    minWidth: "45%",
  },
  colorIndicator: {
    width: 15,
    height: 15,
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