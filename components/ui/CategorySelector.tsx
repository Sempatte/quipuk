// components/ui/CategorySelector.tsx - CORREGIDO
import { gastosIcons, ingresosIcons } from "@/app/contants/iconDictionary";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";

// Definir los tipos de propiedades
interface CategorySelectorProps {
  type: "gasto" | "ingreso" | "ahorro";
  onSelect: (category: string) => void;
  initialCategory?: string; // 🆕 Nueva prop para categoría inicial
  selectedCategory?: string; // 🆕 Nueva prop para categoría controlada
}

const categoryData = {
  gasto: {
    mainCategories: ["Frecuentes", "Deducibles", "Otros"],
    subCategories: [
      "Alquiler",
      "Hogar",
      "Telefono",
      "Super",
      "Comida",
      "Suscripciones",
      "Ropa",
      "Cuidado personal",
      "Bienestar",
      "Fiestas",
      "Transporte",
      "Gasolina",
      "Tarjeta",
      "Deudas",
      "Educación",
      "Mascotas"
    ],
    selectedColor: "#FF5252",
  },
  ingreso: {
    mainCategories: [],
    subCategories: [
      "Empleo",
      "Trabajo Independiente",
      "Director",
      "Alquiler",
      "Airbnb",
      "Bolsa",
      "Intereses",
      "Otros Ingresos"
    ],
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

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  type, 
  onSelect, 
  initialCategory,
  selectedCategory 
}) => {
  // Si es tipo ahorro, no mostrar el componente
  if (type === "ahorro") {
    return null;
  }

  // 🔧 CORRECCIÓN: Usar categoría controlada o inicial
  const [internalSelectedCategory, setInternalSelectedCategory] = useState(
    selectedCategory || initialCategory || ""
  );

  // 🔧 CORRECCIÓN: Sincronizar con prop externa
  useEffect(() => {
    if (selectedCategory !== undefined && selectedCategory !== internalSelectedCategory) {
      console.log('🏷️ [CategorySelector] Sincronizando categoría externa:', selectedCategory);
      setInternalSelectedCategory(selectedCategory);
    }
  }, [selectedCategory, internalSelectedCategory]);

  // 🔧 CORRECCIÓN: Aplicar categoría inicial al montar
  useEffect(() => {
    if (initialCategory && !internalSelectedCategory) {
      console.log('🏷️ [CategorySelector] Aplicando categoría inicial:', initialCategory);
      setInternalSelectedCategory(initialCategory);
      onSelect(initialCategory);
    }
  }, [initialCategory, internalSelectedCategory, onSelect]);

  const subCategories = categoryData[type].subCategories;
  const iconSet = type === "gasto" ? gastosIcons : ingresosIcons;
  const selectedColor = categoryData[type].selectedColor;

  const handleSelectCategory = (category: string) => {
    console.log('🏷️ [CategorySelector] Categoría seleccionada:', category);
    setInternalSelectedCategory(category);
    onSelect(category);
  };

  // 🔧 CORRECCIÓN: Usar estado interno actualizado
  const currentSelection = selectedCategory || internalSelectedCategory;

  // Agrupar subcategorías en "páginas" de 2 filas (3 columnas por fila)
  const COLUMNS = 3;
  const ROWS = 2;
  const PAGE_SIZE = COLUMNS * ROWS;
  const { width: windowWidth } = Dimensions.get('window');
  const PAGE_WIDTH = Math.round(windowWidth * 0.88); // 88% del ancho de pantalla
  const CATEGORY_SIZE = Math.floor((PAGE_WIDTH - 32) / COLUMNS); // 16px padding lateral
  const pages: string[][] = [];
  for (let i = 0; i < subCategories.length; i += PAGE_SIZE) {
    pages.push(subCategories.slice(i, i + PAGE_SIZE));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categoría</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
        snapToInterval={PAGE_WIDTH + 20}
        decelerationRate="fast"
        snapToAlignment="start"
        overScrollMode="never"
      >
        {pages.map((page, pageIndex) => (
          <View
            key={pageIndex}
            style={[
              styles.pageContainer,
              { width: PAGE_WIDTH, marginHorizontal: 10 },
              pageIndex === 0 && { marginLeft: 16 }, // margen extra al inicio
              pageIndex === pages.length - 1 && { marginRight: 16 } // margen extra al final
            ]}
          >
            {/* Renderizar 2 filas */}
            {[0, 1].map(rowIdx => {
              const rowCategories = page.slice(rowIdx * COLUMNS, (rowIdx + 1) * COLUMNS);
              const emptySlots = COLUMNS - rowCategories.length;
              return (
                <View key={rowIdx} style={styles.rowContainer}>
                  {rowCategories.map((category) => {
                    const isSelected = currentSelection === category;
                    return (
                      <View key={category} style={[styles.categoryWrapper, { width: CATEGORY_SIZE, height: CATEGORY_SIZE }]}> 
                        <TouchableOpacity
                          style={[
                            styles.subCategoryButton,
                            isSelected && { backgroundColor: selectedColor },
                            { width: CATEGORY_SIZE - 8, height: CATEGORY_SIZE - 8 },
                          ]}
                          onPress={() => handleSelectCategory(category)}
                          activeOpacity={0.85}
                        >
                          {iconSet[category] && (
                            <View style={[
                              styles.icon,
                              isSelected && styles.selectedIcon
                            ]}>
                              {React.cloneElement(iconSet[category], isSelected ? { color: '#FFF' } : {})}
                            </View>
                          )}
                        </TouchableOpacity>
                        <Text style={[
                          styles.subCategoryText,
                          isSelected && styles.selectedCategoryText,
                          { width: CATEGORY_SIZE - 8, textAlign: 'center' }
                        ]} numberOfLines={2}>
                          {truncateText(category, MAX_LENGTH_FOR_SUBCATEGORY)}
                        </Text>
                      </View>
                    );
                  })}
                  {/* Espaciadores invisibles para centrar la fila */}
                  {Array.from({ length: emptySlots }).map((_, idx) => (
                    <View key={`spacer-${rowIdx}-${idx}`} style={{ width: CATEGORY_SIZE, height: CATEGORY_SIZE, marginHorizontal: 4, marginVertical: 4 }} />
                  ))}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginHorizontal: 4,
    marginVertical: 4,
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
  selectedCategoryText: {
    color: "#000",
    fontFamily: "Outfit_500Medium",
  },
  icon: {
    width: "80%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIcon: {
    // Antes: filter: 'brightness(0) invert(1)',
    // Si el icono es SVG, se debe pasar color blanco desde el render
  },
  horizontalScroll: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pageContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
});

export default CategorySelector;