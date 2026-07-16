import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

export default function StaffJobsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] || 'Staff';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>
          Hello, {firstName}
        </ThemedText>
        <ThemedText style={{ fontSize: 16, color: colors.textSecondary }}>
          Here are your available jobs for today.
        </ThemedText>
      </View>
      <View style={styles.content}>
        <ThemedText style={{ color: colors.textSecondary }}>No pending jobs right now.</ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
