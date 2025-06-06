// components/ui/Legend.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { CategoryData } from "@/app/hooks/useExpenseCategories";

interface LegendProps {
  categories: CategoryData[];
  activeCategory: string | null;
  onSelectCategory: (categoryName: string | null) => void;
}

const { width } = Dimensions.get('window');
const MAX_NAME_LENGTH = 12; // Límite de caracteres para el nombre de la categoría

/**
 * Componente de leyenda interactiva para categorías de gastos
 * Permite filtrar el gráfico al seleccionar categorías
 */
const Legend: React.FC<LegendProps> = ({ 
  categories, 
  activeCategory, 
  onSelectCategory 
}) => {
  if (!categories.length) {
    return null;
  }

  const handleToggleCategory = (categoryName: string) => {
    if (activeCategory === categoryName) {
      // Si la categoría ya está activa, la deseleccionamos
      onSelectCategory(null);
    } else {
      // Activamos la categoría seleccionada
      onSelectCategory(categoryName);
    }
  };

  // Función para truncar texto manteniendo el porcentaje siempre visible
  const formatCategoryLabel = (category: CategoryData): React.ReactNode => {
    const { name, percentage } = category;
    const isActive = activeCategory === name;
    
    return (
      <>
        <View style={styles.categoryLabelContainer}>
          <Text
            style={[
              styles.categoryName,
              isActive && styles.activeText
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {name}
          </Text>
        </View>
        <Text
          style={[
            styles.percentText,
            isActive && styles.activeText
          ]}
        >
          {percentage}%
        </Text>
      </>
    );
  };

  // Distribuir las categorías en dos columnas
  const leftColumn: CategoryData[] = [];
  const rightColumn: CategoryData[] = [];
  
  categories.forEach((category, index) => {
    if (index % 2 === 0) {
      leftColumn.push(category);
    } else {
      rightColumn.push(category);
    }
  });

  // Renderizar una columna de categorías
  const renderColumn = (columnCategories: CategoryData[]) => {
    return columnCategories.map((category) => {
      const isActive = activeCategory === category.name;
      
      return (
        <TouchableOpacity
          key={category.name}
          style={[
            styles.categoryButton,
            { borderColor: category.color },
            isActive && { backgroundColor: category.color }
          ]}
          onPress={() => handleToggleCategory(category.name)}
          activeOpacity={0.7}
        >
          <View style={[styles.colorIndicator, { backgroundColor: category.color }]} />
          <View style={styles.textContainer}>
            {formatCategoryLabel(category)}
          </View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.columnsContainer}>
        <View style={styles.column}>
          {renderColumn(leftColumn)}
        </View>
        <View style={styles.column}>
          {renderColumn(rightColumn)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  columnsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    width: "48%",
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    marginBottom: 10,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryLabelContainer: {
    flex: 1,
    marginRight: 4,
  },
  categoryName: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: "#333",
  },
  activeText: {
    color: "#FFFFFF",
    fontFamily: "Outfit_500Medium",
  },
  percentText: {
    fontSize: 13,
    fontFamily: "Outfit_500Medium",
    color: "#333",
    minWidth: 36, // Asegurar espacio suficiente para el porcentaje
    textAlign: 'right',
  }
});

export default Legend;