import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
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

export const AnalyticsChart = ({ data, height = 200 }: AnalyticsChartProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const [containerWidth, setContainerWidth] = useState(0);
  const revealAnim = useRef(new Animated.Value(0)).current; // 0 to 1

  useEffect(() => {
    if (containerWidth > 0) {
      Animated.timing(revealAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [containerWidth, revealAnim]);

  if (!data || data.length < 2) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  // Hardcoded layout logic for the SVG viewBox
  const viewBoxWidth = 300;
  const viewBoxHeight = 150;
  
  // Calculate points
  const points = data.map((d, i) => {
    // leave 20px padding left and right
    const x = 20 + (i * ((viewBoxWidth - 40) / (data.length - 1)));
    // leave 30px padding top, 20px bottom
    const y = viewBoxHeight - 20 - ((d.value / maxValue) * (viewBoxHeight - 50));
    return { x, y, value: d.value, label: d.label };
  });

  // Construct curved path
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = (p2.x - p1.x) / 2;
    path += ` C ${p1.x + dx},${p1.y} ${p2.x - dx},${p2.y} ${p2.x},${p2.y}`;
  }

  // Construct filled path for gradient
  const fillPath = `${path} L ${points[points.length - 1].x},${viewBoxHeight} L ${points[0].x},${viewBoxHeight} Z`;

  // Overlay mask translateX
  const maskTranslateX = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, containerWidth]
  });

  return (
    <View 
      style={[styles.container, { height }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <>
          <View style={{ flex: 1 }}>
            <Svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} width="100%" height="100%">
              <Defs>
                <LinearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.primary} stopOpacity="0.4" />
                  <Stop offset="1" stopColor={colors.primary} stopOpacity="0.0" />
                </LinearGradient>
              </Defs>
              
              {/* Gradient Fill */}
              <Path d={fillPath} fill="url(#glow)" />
              
              {/* Curved Line */}
              <Path d={path} fill="none" stroke={colors.primary} strokeWidth="4" strokeLinecap="round" />
              
              {/* Data Points */}
              {points.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r="5" fill={colors.background} stroke={colors.primary} strokeWidth="3" />
              ))}
            </Svg>

            {/* Mask for reveal animation */}
            <Animated.View 
              style={[
                StyleSheet.absoluteFillObject, 
                { 
                  backgroundColor: colors.background, 
                  transform: [{ translateX: maskTranslateX }] 
                }
              ]} 
            />
          </View>
          
          {/* Labels underneath */}
          <View style={styles.labelsContainer}>
            {points.map((p, i) => (
              <View key={i} style={{ alignItems: 'center', width: 50 }}>
                <ThemedText style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>{p.label}</ThemedText>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  }
});
