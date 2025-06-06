// components/ui/CategorySelector.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { gastosIcons, ingresosIcons } from '@/app/constants/categoryIcons';
import { useCategories, Category } from '@/hooks/useCategories';
import { TransactionType } from '@/app/interfaces/transaction.interface';

const { width: screenWidth } = Dimensions.get('window');

// 🎨 COLORES DINÁMICOS POR TIPO DE TRANSACCIÓN
const SELECTION_COLORS = {
  gasto: '#FF5252',    // Rojo para gastos
  ingreso: '#00DC5A',  // Verde para ingresos  
  ahorro: '#2196F3',   // Azul para ahorros
} as const;

interface CategorySelectorProps {
  type: "gasto" | "ingreso" | "ahorro";
  onSelect: (category: string) => void;
  selectedCategory?: string;
  initialCategory?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  type,
  onSelect,
  selectedCategory,
  initialCategory,
}) => {
  const [selected, setSelected] = useState<string>(
    selectedCategory || initialCategory || ''
  );

  const { getCategoriesByType, getCategoryColor } = useCategories();

  // 🔄 ACTUALIZAR SELECCIÓN CUANDO CAMBIE LA PROP
  useEffect(() => {
    if (selectedCategory !== undefined) {
      setSelected(selectedCategory);
    }
  }, [selectedCategory]);

  // 🎯 OBTENER COLOR DINÁMICO SEGÚN EL TIPO
  const selectionColor = SELECTION_COLORS[type];

  // 🎯 OBTENER CATEGORÍAS E ICONOS SEGÚN EL TIPO
  const categories = getCategoriesByType(type);
  const icons = type === 'gasto' ? gastosIcons : ingresosIcons;

  // 🎯 MANEJAR SELECCIÓN
  const handleSelect = (category: string) => {
    const newSelection = selected === category ? '' : category;
    setSelected(newSelection);
    onSelect(newSelection);
  };

  // 🎯 AGRUPAR CATEGORÍAS EN PÁGINAS DE 3x2 (6 items por página)
  const itemsPerPage = 6;
  const pages: Category[][] = [];
  
  for (let i = 0; i < categories.length; i += itemsPerPage) {
    pages.push(categories.slice(i, i + itemsPerPage));
  }

  // 🎯 CALCULAR DIMENSIONES CON SEPARACIÓN
  const containerPadding = 40; // padding horizontal total del contenedor
  const itemSpacing = 12; // separación entre items
  const pageWidth = screenWidth - containerPadding;
  const totalSpacingPerRow = itemSpacing * 2; // 2 espacios entre 3 items
  const itemWidth = (pageWidth - totalSpacingPerRow) / 3; // 3 columnas
  const itemHeight = 100; // altura fija para mantener diseño

  const renderCategoryItem = (category: Category, pageIndex: number, itemIndex: number) => {
    const icon = icons[category.name] || icons['Otros'] || icons['Otros Ingresos'];
    const isSelected = selected === category.name;
    const key = `${pageIndex}-${itemIndex}-${category.name}`;

    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.categoryItem,
          {
            width: itemWidth,
            height: itemHeight,
            marginHorizontal: itemSpacing / 2, // separación horizontal
          },
          isSelected && [
            styles.categoryItemSelected,
            { 
              backgroundColor: selectionColor,
              borderColor: selectionColor,
            }
          ],
        ]}
        onPress={() => handleSelect(category.name)}
        activeOpacity={0.7}
      >
        {/* Ícono */}
        <View style={styles.iconContainer}>
          {React.cloneElement(icon, {
            width: 40,
            height: 40,
          })}
        </View>

        {/* Texto */}
        <Text 
          style={[
            styles.categoryText,
            isSelected && styles.categoryTextSelected,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPage = (pageCategories: Category[], pageIndex: number) => {
    // 🎯 ORGANIZAR EN 2 FILAS DE 3 COLUMNAS
    const firstRow = pageCategories.slice(0, 3);
    const secondRow = pageCategories.slice(3, 6);

    return (
      <View 
        key={pageIndex}
        style={[styles.page, { width: pageWidth }]}
      >
        {/* Primera fila */}
        <View style={styles.row}>
          {firstRow.map((category, index) => 
            renderCategoryItem(category, pageIndex, index)
          )}
          {/* Rellenar espacios vacíos para mantener layout */}
          {firstRow.length < 3 && 
            Array.from({ length: 3 - firstRow.length }).map((_, index) => (
              <View 
                key={`empty-first-${index}`} 
                style={{ 
                  width: itemWidth, 
                  height: itemHeight,
                  marginHorizontal: itemSpacing / 2,
                }} 
              />
            ))
          }
        </View>

        {/* Separación entre filas */}
        <View style={{ height: itemSpacing }} />

        {/* Segunda fila */}
        <View style={styles.row}>
          {secondRow.map((category, index) => 
            renderCategoryItem(category, pageIndex, index + 3)
          )}
          {/* Rellenar espacios vacíos para mantener layout */}
          {secondRow.length < 3 && 
            Array.from({ length: 3 - secondRow.length }).map((_, index) => (
              <View 
                key={`empty-second-${index}`} 
                style={{ 
                  width: itemWidth, 
                  height: itemHeight,
                  marginHorizontal: itemSpacing / 2,
                }} 
              />
            ))
          }
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>Categoría</Text>

      {/* ScrollView horizontal con páginas */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        decelerationRate="fast"
      >
        {pages.map((pageCategories, pageIndex) => 
          renderPage(pageCategories, pageIndex)
        )}
      </ScrollView>

      {/* Indicadores de página */}
      {pages.length > 1 && (
        <View style={styles.pageIndicators}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={styles.pageIndicator}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  
  title: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#000',
    marginBottom: 16,
  },
  
  scrollView: {
    flexGrow: 0,
  },
  
  scrollContent: {
    alignItems: 'flex-start',
  },
  
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'center', // 🎯 CENTRADO PERFECTO
    alignItems: 'center',
    width: '100%',
  },
  
  categoryItem: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    padding: 8,
    // 🎯 SOMBRA SUTIL
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  categoryItemSelected: {
    // 🎯 ESTILOS BASE PARA SELECCIÓN (el color se aplica dinámicamente)
    // 🎯 SOMBRA MÁS PRONUNCIADA CUANDO ESTÁ SELECCIONADO
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  
  iconContainer: {
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  categoryText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#2C3E50',
    textAlign: 'center',
  },
  
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  
  pageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E8EB',
  },
});

export default CategorySelector;