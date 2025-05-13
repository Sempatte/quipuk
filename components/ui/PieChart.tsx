import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import { CategoryData } from "@/hooks/useExpenseCategories";

interface PieChartProps {
  categories: CategoryData[];
  totalExpense: number;
  month: string;
}

/**
 * Componente PieChart para visualizar distribución de gastos por categoría
 */
const PieChart: React.FC<PieChartProps> = ({ categories, totalExpense, month }) => {
  if (!categories.length) {
    return (
      <View style={styles.emptyDataContainer}>
        <Text style={styles.emptyDataText}>No hay datos de gastos para mostrar</Text>
      </View>
    );
  }

  // Dimensiones del gráfico
  const size = 250;
  const radius = size / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const strokeWidth = 30;
  const innerRadius = radius - strokeWidth;

  // Calculamos las secciones del gráfico circular
  let cumulativeAngle = 0;
  const segments = categories.map((category, index) => {
    const angle = (category.percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    return (
      <Circle
        key={index}
        cx={centerX}
        cy={centerY}
        r={innerRadius}
        fill="transparent"
        stroke={category.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${(category.percentage / 100) * 2 * Math.PI * innerRadius} ${
          2 * Math.PI * innerRadius
        }`}
        strokeDashoffset={
          -((cumulativeAngle - angle) / 360) * 2 * Math.PI * innerRadius
        }
        transform={`rotate(-90, ${centerX}, ${centerY})`}
      />
    );
  });

  // Capitalizar primera letra
  const capitalize = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size}>
        {segments}

        {/* Contenido central */}
        <G>
          <SvgText
            x={centerX}
            y={centerY - 15}
            fill="#000"
            fontSize={16}
            fontFamily="Outfit_500Medium"
            textAnchor="middle"
          >
            Gasto Total
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 20}
            fill="#000"
            fontSize={32}
            fontWeight="bold"
            fontFamily="Outfit_700Bold"
            textAnchor="middle"
          >
            S/ {totalExpense.toLocaleString("es-PE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 50}
            fill="#000"
            fontSize={16}
            fontFamily="Outfit_400Regular"
            textAnchor="middle"
          >
            {capitalize(month)}
          </SvgText>
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
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