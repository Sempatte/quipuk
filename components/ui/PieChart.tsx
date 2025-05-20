// Corregido: usando withDelay en lugar de la propiedad delay
import React, { useMemo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import { CategoryData } from "@/hooks/useExpenseCategories";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay, // Importamos withDelay para manejar correctamente los retrasos
  Easing,
} from "react-native-reanimated";

// Componentes animados
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);
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

  // Configuración de animaciones
  const chartScale = useSharedValue(1);
  const textOpacity = useSharedValue(1);
  const segmentExpansion = useSharedValue(0);
  
  // Disparar animaciones cuando cambia la selección
  useEffect(() => {
    // Animar texto (fade out -> fade in)
    textOpacity.value = withSequence(
      withTiming(0, { duration: 200 }),
      // Usando withDelay en lugar de la propiedad delay
      withDelay(150, withTiming(1, { duration: 400 }))
    );
    
    // Animar escala del gráfico
    chartScale.value = withSequence(
      withTiming(0.97, { duration: 250 }),
      withTiming(1.03, { duration: 250 }),
      withTiming(1, { duration: 200 })
    );
    
    // Animar expansión de segmentos
    segmentExpansion.value = withTiming(activeCategory ? 1 : 0, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [activeCategory, chartScale, textOpacity, segmentExpansion]);

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
  
  // Renderizar segmentos del gráfico
  let cumulativeAngle = 0;
  const segments = categories.map((category, index) => {
    const isActive = !activeCategory || activeCategory === category.name;
    const angle = (category.percentage / totalPercentage) * 360;
    
    // Propiedades animadas para el segmento
    const segmentProps = useAnimatedProps(() => {
      // Calcular expansión basada en si está activo
      const expansionOffset = segmentExpansion.value * (isActive ? 6 : 0);
      
      return {
        r: innerRadius + expansionOffset,
        opacity: isActive ? 1 : 1 - (segmentExpansion.value * 0.7),
      };
    });
    
    // Propiedades animadas para el borde
    const borderProps = useAnimatedProps(() => {
      const expansionOffset = segmentExpansion.value * (isActive ? 6 : 0);
      
      return {
        r: innerRadius + 1 + expansionOffset,
        opacity: isActive ? 1 : 1 - (segmentExpansion.value * 0.7),
      };
    });
    
    // Crear segmento con animación
    const arc = (
      <React.Fragment key={index}>
        {/* Borde blanco */}
        <AnimatedCircle
          cx={centerX}
          cy={centerY}
          fill="transparent"
          stroke="#FFFFFF"
          strokeWidth={strokeWidth + 2}
          strokeDasharray={`${(category.percentage / 100) * 2 * Math.PI * (innerRadius + 1)} ${
            2 * Math.PI * (innerRadius + 1)
          }`}
          strokeDashoffset={
            -((cumulativeAngle) / 360) * 2 * Math.PI * (innerRadius + 1)
          }
          transform={`rotate(-90, ${centerX}, ${centerY})`}
          animatedProps={borderProps}
        />
        
        {/* Segmento de color */}
        <AnimatedCircle
          cx={centerX}
          cy={centerY}
          fill="transparent"
          stroke={category.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${(category.percentage / 100) * 2 * Math.PI * innerRadius} ${
            2 * Math.PI * innerRadius
          }`}
          strokeDashoffset={
            -((cumulativeAngle) / 360) * 2 * Math.PI * innerRadius
          }
          transform={`rotate(-90, ${centerX}, ${centerY})`}
          animatedProps={segmentProps}
        />
      </React.Fragment>
    );
    
    cumulativeAngle += angle;
    return arc;
  });

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
  let amountFontSize: number;
  if (amountText.length > 12) {
    amountFontSize = 18; 
  } else if (amountText.length > 10) {
    amountFontSize = 20;
  } else if (amountText.length > 8) {
    amountFontSize = 22;
  } else {
    amountFontSize = 28;
  }

  return (
    <View style={styles.chartContainer}>
      {/* Gráfico circular animado */}
      <Animated.View style={chartAnimatedStyle}>
        <Svg width={size} height={size}>
          {segments}
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