// components/ui/PieChart.tsx
import React, { useMemo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import { CategoryData } from "@/hooks/useExpenseCategories";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

// Componentes animados
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface PieChartProps {
  categories: CategoryData[];
  totalExpense: number;
  month: string;
  periodLabel: string;
  activeCategory: string | null;
}

/**
 * PieChart con animaciones profesionales para filtros
 */
const PieChart: React.FC<PieChartProps> = ({ 
  categories, 
  totalExpense, 
  month, 
  periodLabel,
  activeCategory
}) => {
  if (!categories.length) {
    return (
      <View style={styles.emptyDataContainer}>
        <Text style={styles.emptyDataText}>No hay datos de gastos para mostrar</Text>
      </View>
    );
  }

  // Configuración de animaciones centralizadas
  const chartScale = useSharedValue(1);
  const textOpacity = useSharedValue(1);
  const highlightedCategory = useSharedValue(activeCategory || "");
  
  // Disparar animaciones cuando cambia la selección
  useEffect(() => {
    // Actualizar la categoría destacada
    highlightedCategory.value = activeCategory || "";
    
    // Animar texto (fade out -> fade in)
    textOpacity.value = withSequence(
      withTiming(0, { duration: 200 }),
      withDelay(150, withTiming(1, { duration: 400 }))
    );
    
    // Animar escala del gráfico
    chartScale.value = withSequence(
      withTiming(0.97, { duration: 250 }),
      withTiming(1.03, { duration: 250 }),
      withTiming(1, { duration: 200 })
    );
  }, [activeCategory, chartScale, textOpacity, highlightedCategory]);

  // Estilo animado para el SVG principal
  const chartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chartScale.value }]
  }));
  
  // Estilo animado para el texto central
  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value
  }));
  
  // Calcular importe filtrado
  const filteredExpense = useMemo(() => {
    if (!activeCategory) return totalExpense;
    
    const activeItem = categories.find(cat => cat.name === activeCategory);
    return activeItem ? activeItem.amount : totalExpense;
  }, [activeCategory, categories, totalExpense]);

  // Título contextual basado en la selección
  const chartTitle = useMemo(() => {
    if (!activeCategory) return "Gasto Total";
    return `Gasto ${activeCategory}`;
  }, [activeCategory]);

  // Dimensiones del gráfico
  const size = 250;
  const radius = size / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const strokeWidth = 30;
  const innerRadius = radius - strokeWidth;

  // Verificar que los porcentajes sumen exactamente 100
  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);
  
  // Preparar datos de los segmentos
  const segmentsData = useMemo(() => {
    let accumulatedAngle = 0;
    return categories.map((category) => {
      const isActive = !activeCategory || activeCategory === category.name;
      const angle = (category.percentage / totalPercentage) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      
      return {
        name: category.name,
        isActive,
        color: category.color,
        percentage: category.percentage,
        startAngle,
        angle
      };
    });
  }, [categories, activeCategory, totalPercentage]);

  // Formatear importe
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  
  const formattedAmount = formatAmount(filteredExpense);
  const amountText = `S/${formattedAmount.replace(/\s/g, '')}`;
  
  // Determinar tamaño de fuente
  const amountFontSize = useMemo(() => {
    if (amountText.length > 12) return 18; 
    if (amountText.length > 10) return 20;
    if (amountText.length > 8) return 22;
    return 28;
  }, [amountText]);

  // Solución mejorada: Usamos un enfoque diferente para la animación
  // En lugar de modificar el radio de los círculos, usamos strokeWidth para el efecto destacado
  const renderSegments = () => {
    return segmentsData.map((segment, index) => {
      const { name, isActive, color, percentage, startAngle } = segment;
      
      // Ajustar el ancho del trazo en lugar del radio para evitar desalineación
      const extraStrokeWidth = isActive && activeCategory ? 3 : 0;
      
      return (
        <React.Fragment key={name}>
          {/* Borde blanco */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={innerRadius + 1}
            fill="transparent"
            stroke="#FFFFFF"
            strokeWidth={strokeWidth + 2 + extraStrokeWidth}
            strokeDasharray={`${(percentage / 100) * 2 * Math.PI * (innerRadius + 1)} ${
              2 * Math.PI * (innerRadius + 1)
            }`}
            strokeDashoffset={
              -((startAngle) / 360) * 2 * Math.PI * (innerRadius + 1)
            }
            transform={`rotate(-90, ${centerX}, ${centerY})`}
            opacity={isActive ? 1 : 0.3}
          />
          
          {/* Segmento de color */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth + extraStrokeWidth}
            strokeDasharray={`${(percentage / 100) * 2 * Math.PI * innerRadius} ${
              2 * Math.PI * innerRadius
            }`}
            strokeDashoffset={
              -((startAngle) / 360) * 2 * Math.PI * innerRadius
            }
            transform={`rotate(-90, ${centerX}, ${centerY})`}
            opacity={isActive ? 1 : 0.3}
          />
        </React.Fragment>
      );
    });
  };

  return (
    <View style={styles.chartContainer}>
      {/* Gráfico circular animado */}
      <Animated.View style={chartAnimatedStyle}>
        <Svg width={size} height={size}>
          {renderSegments()}
        </Svg>
      </Animated.View>
      
      {/* Texto central animado */}
      <Animated.View 
        style={[styles.textOverlay, textAnimatedStyle]}
        pointerEvents="none"
      >
        <Text style={styles.titleText}>{chartTitle}</Text>
        <Text style={[styles.amountText, { fontSize: amountFontSize }]}>
          {amountText}
        </Text>
        <Text style={styles.periodText}>{periodLabel}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
    height: 250,
  },
  textOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFFFFF",
  },
  titleText: {
    fontSize: 16,
    fontFamily: "Outfit_500Medium",
    color: "#000",
    marginBottom: 5,
  },
  amountText: {
    fontFamily: "Outfit_700Bold",
    color: "#000",
    marginVertical: 2,
  },
  periodText: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: "#000",
    marginTop: 5,
  },
  emptyDataContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyDataText: {
    color: "#666",
    fontFamily: "Outfit_400Regular",
    textAlign: "center",
  },
});

export default PieChart;