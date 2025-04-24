import { gastosIcons, ingresosIcons } from "@/app/contants/iconDictionary";
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Definir los tipos de propiedades
interface CategorySelectorProps {
  type: "gasto" | "ingreso" | "ahorro";
  onSelect: (category: string) => void;
}

const categoryData = {
  gasto: {
    mainCategories: ["Frecuentes", "Deducibles", "Otros"],
    subCategories: ["Comida", "Transporte", "Hogar", "Alquiler", "Salud", "Teléfono", "Super"],
    selectedColor: "#FF5252",
  },
  ingreso: {
    mainCategories: [],
    subCategories: ["Empleo", "Trabajo Independiente", "Director", "Alquiler", "Airbnb", "Bolsa", "Intereses", "Otros Ingresos"],
    selectedColor: "#65CE13",
  },
  ahorro: {
    mainCategories: [],
    subCategories: ["Cuenta de Ahorro", "Fondo de Inversión", "Cuenta de Retiro", "Cuenta de Inversión", "Cuenta de Emergencia"],
    selectedColor: "#2196F3",
  }
};

// Función para truncar texto si es demasiado largo
const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.substring(0, maxLength).trim() + "." : text;
};

const MAX_LENGTH_FOR_SUBCATEGORY = 16;

const CategorySelector: React.FC<CategorySelectorProps> = ({ type, onSelect }) => {
  // Si es tipo ahorro, no mostrar el componente
  if (type === "ahorro") {
    return null;
  }

  const [selectedCategory, setSelectedCategory] = useState("");

  const subCategories = categoryData[type].subCategories;
  const iconSet = type === "gasto" ? gastosIcons : ingresosIcons;
  const selectedColor = categoryData[type].selectedColor;

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    onSelect(category);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categoría</Text>

      <View style={styles.subCategoryContainer}>
        {subCategories.map((category) => {
          const isSelected = selectedCategory === category;
          
          return (
            <View key={category} style={styles.categoryWrapper}>
              <TouchableOpacity
                style={[
                  styles.subCategoryButton,
                  isSelected && { backgroundColor: selectedColor }
                ]}
                onPress={() => handleSelectCategory(category)}
              >
                {iconSet[category] && (
                  <View style={[
                    styles.icon,
                    isSelected && styles.selectedIcon
                  ]}>
                    {iconSet[category]}
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.subCategoryText}>
                {truncateText(category, MAX_LENGTH_FOR_SUBCATEGORY)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 22,
    fontFamily: "Outfit_600SemiBold",
    marginBottom: 5,
    lineHeight: 25,
  },
  subCategoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 15,
  },
  categoryWrapper: {
    width: "25%",
    alignItems: "center",
    marginVertical: 5,
  },
  subCategoryButton: {
    width: 75,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  subCategoryText: {
    fontSize: 14,
    marginTop: 5,
    color: "#000",
    fontFamily: "Outfit_400Regular",
    textAlign: "center",
  },
  icon: {
    width: "80%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIcon: {
    // Aplicamos un filtro CSS que convierte todo a blanco, respetando transparencia
    filter: 'brightness(0) invert(1)',
  },
});

export default CategorySelector;