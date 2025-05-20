// components/ui/FinancialChart.tsx
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Line, Text as SvgText, G } from "react-native-svg";
import { MonthData } from "@/hooks/useFinancialData";
import { Colors } from "@/constants/Colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface FinancialChartProps {
  data: MonthData[];
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ data }) => {
  // Valor de progreso de la animación
  const animationProgress = useSharedValue(0);
  
  // Iniciar la animación cuando cambian los datos
  useEffect(() => {
    // Reiniciar y animar
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [data, animationProgress]);

  // Definir dimensiones
  const chartWidth = 280;
  const chartHeight = 180;
  const paddingTop = 10;
  const paddingBottom = 30;
  const paddingLeft = 60;
  const paddingRight = 10;
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = chartWidth - paddingLeft - paddingRight;

  // Determinar el valor máximo para escalar las barras
  const maxValue = Math.max(
    ...data.map((item) =>
      Math.max(item.expenses || 0, item.income || 0, 3000)
    )
  );

  // Definir escalas de ejes Y
  const yAxisValues = [0, 1000, 2000, 3000];

  // Calcular anchura de barras y espaciados
  const numMonths = data.length;
  const barGroupWidth = graphWidth / numMonths;
  const barWidth = barGroupWidth * 0.3;
  const barGap = barWidth * 0.2;

  // Crear un estilo animado para todo el gráfico
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 1, // Solo para forzar la actualización
    };
  });

  return (
    <View style={styles.chartContainer}>
      <Animated.View style={animatedStyle}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Líneas horizontales y etiquetas del eje Y */}
          {yAxisValues.map((value, index) => {
            const y =
              paddingTop + graphHeight - (value / maxValue) * graphHeight;
            return (
              <React.Fragment key={`line-${index}`}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
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
                  {`S/ ${value}`}
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

            // Calcular las alturas de las barras
            // Multiplicamos por la variable animationProgress.value para animar
            const expenseHeight = (item.expenses
              ? (item.expenses / maxValue) * graphHeight
              : 0) * animationProgress.value;
              
            const incomeHeight = (item.income
              ? (item.income / maxValue) * graphHeight
              : 0) * animationProgress.value;

            // Determinar los colores de las barras según si el mes está activo
            const expenseColor = item.isActive ? Colors.chart.expense : Colors.chart.inactive;
            const incomeColor = item.isActive ? Colors.chart.income : Colors.chart.inactive;

            // Posición Y de cada barra
            const expenseY = paddingTop + graphHeight - expenseHeight;
            const incomeY = paddingTop + graphHeight - incomeHeight;

            return (
              <G key={`bars-${index}`}>
                {/* Barra de gastos - Normal (no animada) pero calculada con valores animados */}
                <Animated.View>
                  <Svg>
                    <G>
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
                    </G>
                  </Svg>
                </Animated.View>

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
      </Animated.View>
    </View>
  );
};

// Importamos Rect
import { Rect } from 'react-native-svg';

const styles = StyleSheet.create({
  chartContainer: {
    height: 180,
    alignItems: "center",
    marginTop: 10,
    alignSelf: "center",
    width: "100%",
    overflow: "hidden",
  },
});