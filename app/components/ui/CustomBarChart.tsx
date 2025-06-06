import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

interface ChartData {
  name: string;
  expenses: number;
  income: number;
}

interface CustomBarChartProps {
  data: ChartData[];
  maxValue: number;
}

const { width: screenWidth } = Dimensions.get('window');

const CustomBarChart: React.FC<CustomBarChartProps> = ({ data, maxValue }) => {
  const chartWidth = screenWidth - 80; // Dejamos margen para los ejes
  const chartHeight = 180;
  const barWidth = (chartWidth / data.length) * 0.8; // Ancho de cada grupo de barras
  const barGap = (chartWidth / data.length) * 0.2; // Espacio entre grupos de barras
  const barPadding = 2; // Espacio entre barras del mismo grupo
  const singleBarWidth = (barWidth - barPadding) / 2; // Ancho de cada barra individual
  
  const generateYAxisLabels = (max: number, steps: number = 4) => {
    const labels = [];
    for (let i = 0; i < steps; i++) {
      const value = (max / (steps - 1)) * i;
      labels.push(`S/ ${value.toLocaleString('es-PE')}`);
    }
    return labels;
  };
  
  const yAxisLabels = generateYAxisLabels(maxValue);
  


  return (
    <View style={styles.container}>
      {/* Eje Y (valores) */}
      <View style={styles.yAxis}>
        {yAxisLabels.map((label, index) => (
          <Text
            key={`y-label-${index}`}
            style={[
              styles.yAxisLabel,
              { bottom: (chartHeight / (yAxisLabels.length - 1)) * index }
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
      
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Líneas horizontales de cuadrícula */}
          {yAxisLabels.map((_, index) => (
            <Line
              key={`grid-${index}`}
              x1={0}
              y1={(chartHeight / (yAxisLabels.length - 1)) * index}
              x2={chartWidth}
              y2={(chartHeight / (yAxisLabels.length - 1)) * index}
              stroke="#E0E0E0"
              strokeDasharray="3,3"
            />
          ))}
          
          {/* Barras para gastos e ingresos */}
          {data.map((item, index) => {
            const barGroupX = index * (barWidth + barGap) + barGap / 2;
            
            // Calcular altura de las barras
            const expenseHeight = Math.min((item.expenses / maxValue) * chartHeight, chartHeight);
            const incomeHeight = Math.min((item.income / maxValue) * chartHeight, chartHeight);
            
            // Ultimo mes con colores destacados, los demás en gris
            const isLastMonth = index === data.length - 1;
            const expenseColor = isLastMonth ? '#FF5252' : '#E0E0E0';
            const incomeColor = isLastMonth ? '#00DC5A' : '#E0E0E0';
            
            return (
              <React.Fragment key={`bar-group-${index}`}>
                {/* Barra de gastos */}
                <Rect
                  x={barGroupX}
                  y={chartHeight - expenseHeight}
                  width={singleBarWidth}
                  height={expenseHeight}
                  rx={2}
                  fill={expenseColor}
                />
                
                {/* Barra de ingresos */}
                <Rect
                  x={barGroupX + singleBarWidth + barPadding}
                  y={chartHeight - incomeHeight}
                  width={singleBarWidth}
                  height={incomeHeight}
                  rx={2}
                  fill={incomeColor}
                />
                
                {/* Etiqueta del eje X */}
                <SvgText
                  x={barGroupX + barWidth / 2}
                  y={chartHeight + 15}
                  fontSize={10}
                  textAnchor="middle"
                  fill="#666666"
                >
                  {item.name}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 220,
    marginTop: 8,
  },
  yAxis: {
    width: 60,
    height: 180,
    position: 'relative',
    paddingRight: 5,
  },
  yAxisLabel: {
    position: 'absolute',
    right: 5,
    fontSize: 10,
    color: '#666666',
    fontFamily: 'Outfit_400Regular',
  },
  chartContainer: {
    flex: 1,
    height: 180,
  },
});

export default CustomBarChart;