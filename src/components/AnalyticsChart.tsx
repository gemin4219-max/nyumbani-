import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export interface DataPoint {
  label: string;
  value: number;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  height?: number;
}

export const AnalyticsChart = ({ data, height = 160 }: AnalyticsChartProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chartArea}>
        {data.map((point, index) => {
          const barHeightPercentage = (point.value / maxValue) * 100;
          return <AnimatedBar key={index} percentage={barHeightPercentage} label={point.label} colors={colors} value={point.value} />;
        })}
      </View>
    </View>
  );
};

const AnimatedBar = ({ percentage, label, colors, value }: any) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedHeight, {
      toValue: percentage,
      friction: 6,
      tension: 40,
      useNativeDriver: false, // Height animation doesn't support native driver
    }).start();
  }, [percentage]);

  return (
    <View style={styles.barContainer}>
      <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
        <Animated.View 
          style={[
            styles.barFill, 
            { 
              backgroundColor: colors.primary,
              height: animatedHeight.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }) 
            }
          ]} 
        />
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  barBackground: {
    width: 28,
    flex: 1,
    borderRadius: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  }
});
