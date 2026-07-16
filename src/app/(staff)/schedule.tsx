import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

export default function StaffScheduleScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Schedule</ThemedText>
      </View>
      <View style={styles.content}>
        <ThemedText style={{ color: colors.textSecondary }}>Your weekly schedule will appear here.</ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
