import React from "react";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { MonthData } from "@/hooks/useFinancialData";
import { Colors } from "@/constants/Colors";

interface FinancialChartProps {
  data: MonthData[];
}

// Dimensiones para el gráfico
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 80;

export const FinancialChart: React.FC<FinancialChartProps> = ({ data }) => {
  // Definir dimensiones
  const chartWidth = CHART_WIDTH;
  const chartHeight = 180;
  const paddingTop = 10;
  const paddingBottom = 30;
  const paddingLeft = 60;
  const paddingRight = 10;
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = chartWidth - paddingLeft - paddingRight;

  // Calcular anchura de barras y espaciados
  const numMonths = data.length;
  const barGroupWidth = graphWidth / numMonths;
  const barWidth = barGroupWidth * 0.3;
  const barGap = barWidth * 0.2;

  // Determinar el valor máximo para escalar las barras
  const maxValue = Math.max(
    ...data.map((item) =>
      Math.max(item.expenses || 0, item.income || 0, 3000)
    )
  );

  // Definir escalas de ejes Y
  const yAxisValues = [0, 1000, 2000, 3000];

  return (
    <View style={styles.chartContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

          {/* Barras del gráfico */}
          {data.map((item, index) => {
            const barX =
              paddingLeft +
              index * barGroupWidth +
              barGroupWidth / 2 -
              barWidth -
              barGap / 2;

            // Calcular las alturas de las barras
            const expenseHeight = item.expenses
              ? (item.expenses / maxValue) * graphHeight
              : 0;
            const incomeHeight = item.income
              ? (item.income / maxValue) * graphHeight
              : 0;

            // Determinar los colores de las barras según si el mes está activo
            const expenseColor = item.isActive ? Colors.chart.expense : Colors.chart.inactive;
            const incomeColor = item.isActive ? Colors.chart.income : Colors.chart.inactive;

            return (
              <React.Fragment key={`bars-${index}`}>
                {/* Barra de gastos */}
                <Rect
                  x={barX}
                  y={paddingTop + graphHeight - expenseHeight}
                  width={barWidth}
                  height={expenseHeight || 1} // Al menos 1 de altura para que sea visible
                  fill={expenseColor}
                  rx={2}
                />

                {/* Barra de ingresos */}
                <Rect
                  x={barX + barWidth + barGap}
                  y={paddingTop + graphHeight - incomeHeight}
                  width={barWidth}
                  height={incomeHeight || 1} // Al menos 1 de altura para que sea visible
                  fill={incomeColor}
                  rx={2}
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
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
};

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