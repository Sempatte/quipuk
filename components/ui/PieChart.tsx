import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import { CategoryData } from "@/hooks/useExpenseCategories";

interface PieChartProps {
  categories: CategoryData[];
  totalExpense: number;
  month: string;
  periodLabel: string; // Nuevo parámetro para el rango de meses
}

/**
 * Componente PieChart para visualizar distribución de gastos por categoría
 */
const PieChart: React.FC<PieChartProps> = ({ categories, totalExpense, month, periodLabel }) => {
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

  // Verificar que los porcentajes sumen exactamente 100
  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);
  
  // Calculamos las secciones del gráfico circular
  let cumulativeAngle = 0;
  const segments = categories.map((category, index) => {
    // Usar el porcentaje exacto para calcular el ángulo
    const angle = (category.percentage / totalPercentage) * 360;
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

  // Formatear el importe según el formato de la imagen
  const formatAmount = (amount: number) => {
    return amount.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Obtener el texto formateado del monto
  const formattedAmount = formatAmount(totalExpense);
  
  // IMPORTANTE: Ajustar el texto para que sea exactamente como en la imagen
  // Eliminar los espacios que genera el toLocaleString entre miles
  const amountText = `S/${formattedAmount.replace(/\s/g, '')}`;
  
  // Determinar el tamaño de fuente de forma más precisa
  let amountFontSize;
  if (amountText.length > 12) {
    amountFontSize = 18; // Montos extremadamente grandes
  } else if (amountText.length > 10) {
    amountFontSize = 20; // Montos muy grandes
  } else if (amountText.length > 8) {
    amountFontSize = 22; // Montos grandes
  } else {
    amountFontSize = 28; // Montos normales o pequeños
  }

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size}>
        {segments}

        {/* Contenido central con mejor ajuste */}
        <G>
          <SvgText
            x={centerX}
            y={centerY - 32}
            fill="#000"
            fontSize={16}
            fontFamily="Outfit_500Medium"
            textAnchor="middle"
          >
            Gasto Total
          </SvgText>
          
          {/* Utilizamos el texto formateado sin espacios */}
          <SvgText
            x={centerX}
            y={centerY + 6}
            fill="#000"
            fontSize={amountFontSize}
            fontWeight="bold"
            fontFamily="Outfit_700Bold"
            textAnchor="middle"
          >
            {amountText}
          </SvgText>
          
          {/* Mostrar el rango de meses o el año */}
          <SvgText
            x={centerX}
            y={centerY + 35}
            fill="#000"
            fontSize={16}
            fontFamily="Outfit_400Regular"
            textAnchor="middle"
          >
            {periodLabel}
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