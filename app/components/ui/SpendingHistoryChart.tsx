// ---- SpendingHistoryChart.tsx ----

// components/ui/SpendingHistoryChart.tsx
import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { PeriodFilter } from "@/app/hooks/useSpendingHistory";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";

// Create animated path component
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface SpendingHistoryChartProps {
  data: number[];
  labels: string[];
  period: PeriodFilter;
}

const SpendingHistoryChart: React.FC<SpendingHistoryChartProps> = ({
  data,
  labels,
  period,
}) => {
  // Animation control
  const animation = useSharedValue(0);
  
  // Reset animation when data changes
  useEffect(() => {
    animation.value = 0;
    animation.value = withTiming(1, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [data, animation]);

  if (!data.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay datos de gastos disponibles</Text>
      </View>
    );
  }

  // Chart dimensions
  const chartWidth = 350;
  const chartHeight = 200;
  const paddingTop = 20;
  const paddingBottom = 40;
  const paddingLeft = 40;
  const paddingRight = 10;
  const chartAreaWidth = chartWidth - paddingLeft - paddingRight;
  const chartAreaHeight = chartHeight - paddingTop - paddingBottom;

  // Calculate max value for Y axis with some extra space at the top
  const maxValue = (data.length ? Math.max(...data.slice(0, 1000)) : 1) * 1.2; // Limit to first 1000 items for safety
  
  // Define Y axis values with 5 steps
  const ySteps = 5;
  const yStepSize = Math.ceil(maxValue / ySteps);
  const yValues = Array.from({ length: ySteps + 1 }, (_, i) => i * yStepSize);

  // Calculate point coordinates
  const points = data.map((value, index) => ({
    x: paddingLeft + (index * chartAreaWidth) / Math.max(data.length - 1, 1),
    y: paddingTop + chartAreaHeight - (value * chartAreaHeight) / maxValue,
    value,
  }));

  // Create animated props directly within the useAnimatedProps with enhanced curvature
  const animatedAreaProps = useAnimatedProps(() => {
    const progressedPoints = points.map(point => ({
      ...point,
      y: paddingTop + chartAreaHeight - (point.value * animation.value * chartAreaHeight) / maxValue,
    }));

    // Start at the bottom left
    let path = `M ${progressedPoints[0].x} ${paddingTop + chartAreaHeight} `;
    
    // Line to first point
    path += `L ${progressedPoints[0].x} ${progressedPoints[0].y} `;
    
    // Enhanced curvature using cubic bezier curves for smoother lines
    if (progressedPoints.length > 1) {
      for (let i = 0; i < progressedPoints.length - 1; i++) {
        const currentPoint = progressedPoints[i];
        const nextPoint = progressedPoints[i + 1];
        
        // Control points for the cubic bezier curve (more pronounced curve)
        const cp1x = currentPoint.x + (nextPoint.x - currentPoint.x) * 0.4; // 40% between points
        const cp1y = currentPoint.y;
        const cp2x = currentPoint.x + (nextPoint.x - currentPoint.x) * 0.6; // 60% between points
        const cp2y = nextPoint.y;
        
        // Add cubic bezier curve
        path += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nextPoint.x} ${nextPoint.y} `;
      }
    }
    
    // Close the path back to x-axis
    path += `L ${progressedPoints[progressedPoints.length - 1].x} ${paddingTop + chartAreaHeight} Z`;
    
    return {
      d: path,
      opacity: animation.value,
    };
  });

  // Animated props for the line with enhanced curvature
  const animatedLineProps = useAnimatedProps(() => {
    const progressedPoints = points.map(point => ({
      ...point,
      y: paddingTop + chartAreaHeight - (point.value * animation.value * chartAreaHeight) / maxValue,
    }));

    let path = "";
    
    if (progressedPoints.length > 0) {
      // Start at the first point
      path = `M ${progressedPoints[0].x} ${progressedPoints[0].y} `;
      
      // Enhanced curvature using cubic bezier curves
      if (progressedPoints.length > 1) {
        for (let i = 0; i < progressedPoints.length - 1; i++) {
          const currentPoint = progressedPoints[i];
          const nextPoint = progressedPoints[i + 1];
          
          // Control points for the cubic bezier curve (more pronounced curve)
          const cp1x = currentPoint.x + (nextPoint.x - currentPoint.x) * 0.4; // 40% between points
          const cp1y = currentPoint.y;
          const cp2x = currentPoint.x + (nextPoint.x - currentPoint.x) * 0.6; // 60% between points
          const cp2y = nextPoint.y;
          
          // Add cubic bezier curve
          path += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nextPoint.x} ${nextPoint.y} `;
        }
      }
    }
    
    return {
      d: path,
      strokeOpacity: animation.value,
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#96260D" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#96260D" stopOpacity="0.1" />
          </LinearGradient>
        </Defs>

        {/* Líneas de cuadrícula y etiquetas del eje Y */}
        {yValues.map((value, index) => {
          const y = paddingTop + chartAreaHeight - (value * chartAreaHeight) / maxValue;
          return (
            <React.Fragment key={`grid-${index}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#E0E0E0"
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 5}
                y={y + 4}
                fontSize={10}
                fontFamily="Outfit_400Regular"
                fill="#666666"
                textAnchor="end"
              >
                {`S/ ${value}`}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Área bajo la curva */}
        <AnimatedPath
          animatedProps={animatedAreaProps}
          fill="url(#areaGradient)"
        />

        {/* Línea principal */}
        <AnimatedPath
          animatedProps={animatedLineProps}
          stroke="#96260D"
          strokeWidth={2.5}
          fill="none"
        />

        {/* Etiquetas del eje X - mostrar cada enésima etiqueta para evitar amontonamiento */}
        {labels.map((label, index) => {
          // Determinar cuántas etiquetas omitir según la longitud de los datos
          const skipFactor = labels.length > 10 ? 2 : 1;
          
          if (index % skipFactor !== 0 && index !== labels.length - 1) {
            return null;
          }
          
          const x = paddingLeft + (index * chartAreaWidth) / Math.max(labels.length - 1, 1);
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={chartHeight - 10}
              fontSize={11}
              fontFamily="Outfit_400Regular"
              fill="#666666"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  emptyContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#888888",
    fontFamily: "Outfit_400Regular",
  },
});

export default SpendingHistoryChart;
