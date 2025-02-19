import { gastosIcons, ingresosIcons, addIcon } from "@/app/contants/iconDictionary";
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const categoryData = {
  gasto: {
    mainCategories: ["Frecuentes", "Deducibles", "Otros"],
    subCategories: ["Comida", "Transporte", "Hogar", "Alquiler", "Salud", "Teléfono", "Super"],
    addColor: "#EF674A", // Naranja para gastos
  },
  ingreso: {
    mainCategories: [],
    subCategories: ["Empleo", "Trabajo Independiente", "Director", "Alquiler", "Airbnb", "Bolsa", "Intereses", "Otros Ingresos"],
    addColor: "#65CE13", // Verde para ingresos
  },
};

// 📌 Función para truncar texto si es demasiado largo
const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.substring(0, maxLength).trim() + "." : text;
};

const MAX_LENGTH_FOR_SUBCATEGORY = 16;

const CategorySelector = ({ type }: { type: "gasto" | "ingreso" }) => {
  const [selectedCategory, setSelectedCategory] = useState(type === "gasto" ? "Frecuentes" : "Agregar");

  const mainCategories = categoryData[type].mainCategories;
  const subCategories = categoryData[type].subCategories;
  const iconSet = type === "gasto" ? gastosIcons : ingresosIcons;
  const addBackgroundColor = categoryData[type].addColor; // Color de fondo de "Agregar"

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categoría</Text>

      {/* Subcategorías */}
      <View style={styles.subCategoryContainer}>
        {/* 📌 AGREGAR SIEMPRE ESTÁ PRIMERO Y ES IGUAL EN AMBOS */}
        <View style={styles.categoryWrapper}>
          <TouchableOpacity
            style={[styles.subCategoryButton, { backgroundColor: addBackgroundColor }]}
          >
            <View style={styles.icon}>{addIcon}</View>
          </TouchableOpacity>
          <Text style={styles.subCategoryText}>Agregar</Text>
        </View>

        {subCategories.map((category) => (
          <View key={category} style={styles.categoryWrapper}>
            <TouchableOpacity
              style={[
                styles.subCategoryButton,
                selectedCategory === category && styles.selectedSubCategory,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              {iconSet[category] && <View style={styles.icon}>{iconSet[category]}</View>}
            </TouchableOpacity>
            <Text style={styles.subCategoryText}>{truncateText(category, MAX_LENGTH_FOR_SUBCATEGORY)}</Text>
          </View>
        ))}
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
    width: "25%", // 📌 Ahora siempre serán 4 por fila
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
  selectedSubCategory: {
    borderColor: "#EF674A",
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
});

export default CategorySelector;
