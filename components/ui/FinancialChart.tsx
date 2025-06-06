// components/ui/FinancialChart.tsx
import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, { Line, Text as SvgText, Rect, G } from "react-native-svg";
import { MonthData } from "@/hooks/useFinancialData";
import { Colors } from "@/app/constants/colors";

// Obtener las dimensiones de la pantalla
const { width: screenWidth } = Dimensions.get("window");

interface FinancialChartProps {
  data: MonthData[];
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ data }) => {
  // Referencia para medir el ancho del contenedor
  const containerRef = useRef<View>(null);
  // Estado para el ancho medido
  const [containerWidth, setContainerWidth] = useState(screenWidth - 60); // Valor inicial estimado
  
  // Estado para mantener las propiedades animadas
  const [barHeights, setBarHeights] = useState<{
    expenses: number[];
    income: number[];
  }>({
    expenses: Array(data.length).fill(0),
    income: Array(data.length).fill(0),
  });

  // Definir dimensiones
  const chartHeight = 200; // Aumentado para dar más espacio al eje Y
  const paddingTop = 25; // Aumentado para dar espacio a la etiqueta superior
  const paddingBottom = 30;
  const paddingLeft = 60;
  const paddingRight = 20; // Aumentado ligeramente el padding derecho
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = containerWidth - paddingLeft - paddingRight;

  // Determinar el valor máximo para escalar las barras
  // Además, si solo hay gastos o solo hay ingresos, asegurar que el otro tipo tenga al menos
  // un valor mínimo para que aparezca en la gráfica
  const calculateMaxValue = () => {
    // Si no hay datos, usar un valor por defecto
    if (data.length === 0) return 3000;
    
    // Hallar el máximo de gastos e ingresos
    const maxExpense = Math.max(...data.map(item => item.expenses || 0));
    const maxIncome = Math.max(...data.map(item => item.income || 0));
    
    // Usar el máximo entre ambos, con un mínimo de 3000 para evitar gráficas muy pequeñas
    return Math.max(maxExpense, maxIncome, 3000);
  };
  
  const maxValue = calculateMaxValue();

  // Formatear valores grandes (miles, millones)
  const formatYAxisValue = (value: number) => {
    if (value >= 1000000) {
      return `S/ ${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
    } else if (value >= 1000) {
      return `S/ ${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
    }
    return `S/ ${value}`;
  };

  // Calcular valores dinámicos para el eje Y basados en el valor máximo
  const calculateYAxisValues = () => {
    // Redondear el valor máximo hacia arriba para tener un número "limpio"
    let yMax = Math.max(maxValue, 1000); // Asegurar un mínimo de 1000
    
    // Redondear hacia arriba al siguiente múltiplo de 1000 para valores menores a 10000
    // o al siguiente múltiplo de 5000 para valores más grandes
    if (yMax < 10000) {
      yMax = Math.ceil(yMax / 1000) * 1000;
    } else {
      yMax = Math.ceil(yMax / 5000) * 5000;
    }
    
    // Calcular el paso entre valores del eje Y
    // 4 divisiones para mostrar 5 valores (0, paso, 2*paso, 3*paso, 4*paso=yMax)
    const step = yMax / 4;
    
    // Generar los valores para el eje Y
    return [0, step, 2 * step, 3 * step, yMax];
  };
  
  const yAxisValues = calculateYAxisValues();

  // Valor de animación
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  // Efecto para iniciar la animación cuando cambian los datos
  useEffect(() => {
    // Valores objetivo para cada barra
    const targetExpenses = data.map((item) => 
      item.expenses ? (item.expenses / maxValue) * graphHeight : 0
    );
    
    const targetIncome = data.map((item) => 
      item.income ? (item.income / maxValue) * graphHeight : 0
    );

    // Restablecer y comenzar animación
    animatedValue.setValue(0);
    
    // Configurar animación
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();

    // Actualizar las alturas de las barras durante la animación
    const updateBarHeights = animatedValue.addListener(({ value }) => {
      setBarHeights({
        expenses: targetExpenses.map((height) => height * value),
        income: targetIncome.map((height) => height * value),
      });
    });

    // Limpieza
    return () => {
      animatedValue.removeListener(updateBarHeights);
    };
  }, [data, maxValue, graphHeight]);

  // Calcular anchura de barras y espaciados
  const numMonths = Math.max(data.length, 1);
  const barGroupWidth = graphWidth / numMonths;
  const barWidth = barGroupWidth * 0.3;
  const barGap = barWidth * 0.2;

  return (
    <View 
      style={styles.chartContainer}
      ref={containerRef}
      onLayout={(event) => {
        // Capturar el ancho real del contenedor
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
      }}
    >
      <Svg width={containerWidth} height={chartHeight}>
        {/* Líneas horizontales y etiquetas del eje Y */}
        {yAxisValues.map((value, index) => {
          const y =
            paddingTop + graphHeight - (value / yAxisValues[yAxisValues.length - 1]) * graphHeight;
          return (
            <React.Fragment key={`line-${index}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={containerWidth - paddingRight}
                y2={y}
                stroke="#E0E0E0"
                strokeDasharray="3,3"
              />
              <SvgText
                x={paddingLeft - 10}
                y={y + 5}
                fontSize={10}
                fill="#666666"
                textAnchor="end"
                fontFamily="Outfit_400Regular"
              >
                {formatYAxisValue(value)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Barras del gráfico con animación */}
        {data.map((item, index) => {
          const barX =
            paddingLeft +
            index * barGroupWidth +
            barGroupWidth / 2 -
            barWidth -
            barGap / 2;

          // Usar alturas animadas desde el estado
          const expenseHeight = barHeights.expenses[index] || 0;
          const incomeHeight = barHeights.income[index] || 0;

          // Determinar los colores de las barras según si el mes está activo
          const expenseColor = item.isActive ? Colors.chart.expense : Colors.chart.inactive;
          const incomeColor = item.isActive ? Colors.chart.income : Colors.chart.inactive;

          // Posición Y de cada barra
          const expenseY = paddingTop + graphHeight - expenseHeight;
          const incomeY = paddingTop + graphHeight - incomeHeight;

          return (
            <G key={`bars-${index}`}>
              {/* Barra de gastos */}
              <Rect
                x={barX}
                y={expenseY}
                width={barWidth}
                height={Math.max(1, expenseHeight)}
                rx={2}
                fill={expenseColor}
              />

              {/* Barra de ingresos */}
              <Rect
                x={barX + barWidth + barGap}
                y={incomeY}
                width={barWidth}
                height={Math.max(1, incomeHeight)}
                rx={2}
                fill={incomeColor}
              />

              {/* Etiqueta del mes */}
              <SvgText
                x={barX + barWidth + barGap / 2}
                y={paddingTop + graphHeight + 20}
                fontSize={10}
                fill="#666666"
                textAnchor="middle"
                fontFamily="Outfit_400Regular"
              >
                {item.name}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    height: 200,
    width: "100%", // Usar ancho completo
    paddingHorizontal: 0, // Quitar padding horizontal del contenedor
    alignItems: "center",
    marginTop: 10,
    alignSelf: "stretch", // Asegurar que se estire
    overflow: "hidden",
  },
});