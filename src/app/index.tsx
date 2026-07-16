import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

export default function SplashScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { isInitialized } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedText style={[styles.brandText, { color: colors.text }]}>Nyumbani</ThemedText>
      <ThemedText style={[styles.subText, { color: colors.textSecondary }]}>Your Digital Ecosystem</ThemedText>
      
      {!isInitialized && (
        <ActivityIndicator 
          style={styles.loader} 
          size="large" 
          color={colors.primary} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 40,
  },
  subText: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  loader: {
    position: 'absolute',
    bottom: 80,
  }
});
