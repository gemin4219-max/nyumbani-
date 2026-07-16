import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useColorScheme } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function AnimatedSplashScreen() {
  const { isInitialized } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const letterSpacingAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [shouldUnmount, setShouldUnmount] = useState(false);

  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Small delay before marking animation complete
      setTimeout(() => {
        setIsAnimationComplete(true);
      }, 500);
    });
  }, []);

  useEffect(() => {
    // Wait until both Auth is initialized AND entrance animation is done
    if (isInitialized && isAnimationComplete) {
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease)
      }).start(() => {
        setShouldUnmount(true);
      });
    }
  }, [isInitialized, isAnimationComplete]);

  if (shouldUnmount) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: '#000000', opacity: fadeOutAnim }]}>
      <Animated.View 
        style={{
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }}
      >
        <ThemedText 
          style={[styles.logoText, { color: colors.primary }]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          Nyumbani
        </ThemedText>
        <ThemedText style={[styles.tagline, { color: colors.textSecondary }]}>
          Pango. Usafi. Kuhama. Sokoni.
        </ThemedText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 16,
    textTransform: 'uppercase',
  }
});
