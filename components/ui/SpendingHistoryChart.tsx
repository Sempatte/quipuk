import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Circle as SvgCircle,
} from "react-native-svg";
import { PeriodFilter } from "@/hooks/useSpendingHistory";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 60; // Allow for padding
const CHART_HEIGHT = 230; // Aumentado para dar más espacio vertical
const CHART_PADDING_TOP = 20;
const CHART_PADDING_BOTTOM = 30;
const CHART_PADDING_LEFT = 50; // Ajustado para las etiquetas del eje Y
const CHART_PADDING_RIGHT = 10;

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

  // Calculate chart dimensions
  const chartWidth = CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const chartHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

  // Calculate the maximum value for the y-axis scaling with proper steps
  const maxValue = Math.max(...data, 100); // Ensure we have at least 100 as max for scale
  
  // Calculate appropriate Y-axis step size based on the max value
  let yStepSize = 1700; // Default step size
  if (maxValue > 8000) {
    yStepSize = 1700;
  } else if (maxValue > 5000) {
    yStepSize = 1700;
  } else if (maxValue > 3000) {
    yStepSize = 850;
  } else if (maxValue > 1000) {
    yStepSize = 500;
  } else if (maxValue > 500) {
    yStepSize = 200;
  } else if (maxValue > 200) {
    yStepSize = 100;
  } else {
    yStepSize = 50;
  }
  
  // Generate Y axis ticks with appropriate steps
  const maxYValue = Math.ceil(maxValue / yStepSize) * yStepSize;
  const numYTicks = maxYValue / yStepSize + 1;
  const yTicks = Array.from({ length: numYTicks }, (_, i) => i * yStepSize);
  
  // Calculate x and y positions for the line chart
  const points = data.map((value, index) => ({
    x: CHART_PADDING_LEFT + (index * chartWidth) / Math.max(data.length - 1, 1),
    y: CHART_PADDING_TOP + chartHeight - (value * chartHeight) / maxYValue,
  }));

  // Create SVG path for the line
  const linePath = points
    .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
    .join(" ");

  // Create SVG path for the area under the line
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    CHART_PADDING_TOP + chartHeight
  } L ${points[0].x} ${CHART_PADDING_TOP + chartHeight} Z`;

  // Animated props for the path
  const animatedAreaProps = useAnimatedProps(() => {
    return {
      d: areaPath,
      opacity: animation.value,
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#E57254" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#E57254" stopOpacity="0.1" />
          </LinearGradient>
        </Defs>

        {/* Y-axis grid lines and labels */}
        {yTicks.map((tick, index) => {
          const y = CHART_PADDING_TOP + chartHeight - (tick * chartHeight) / maxYValue;
          return (
            <React.Fragment key={`grid-${index}`}>
              <Line
                x1={CHART_PADDING_LEFT}
                y1={y}
                x2={CHART_WIDTH - CHART_PADDING_RIGHT}
                y2={y}
                stroke="#E0E0E0"
                strokeWidth={1}
              />
              <SvgText
                x={CHART_PADDING_LEFT - 8}
                y={y + 4}
                fontSize={12}
                fontFamily="Outfit_400Regular"
                fill="#888888"
                textAnchor="end"
              >
                {`S/${tick.toLocaleString()}`}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Area under the line */}
        <AnimatedPath
          animatedProps={animatedAreaProps}
          fill="url(#areaGradient)"
        />

        {/* Line on top */}
        <Path 
          d={linePath} 
          stroke="#E57254" 
          strokeWidth={2.5} 
          fill="none" 
        />

        {/* X-axis labels */}
        {labels.map((label, index) => {
          // Only show every other label if we have many data points to avoid crowding
          if (labels.length > 10 && index % 2 !== 0 && index !== labels.length - 1) {
            return null;
          }
          
          const x = CHART_PADDING_LEFT + (index * chartWidth) / Math.max(labels.length - 1, 1);
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={CHART_HEIGHT - 10}
              fontSize={11}
              fontFamily="Outfit_400Regular"
              fill="#888888"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}

        {/* Data points */}
        {points.map((point, index) => (
          <SvgCircle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="#FFFFFF"
            stroke="#E57254"
            strokeWidth={2}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingRight: 5,
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