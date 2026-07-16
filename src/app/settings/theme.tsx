import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export default function ThemeScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  // Mock state since Expo doesn't natively allow forced override easily without a custom provider
  const [selectedTheme, setSelectedTheme] = useState('system');

  const Option = ({ label, value, icon }: any) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={() => setSelectedTheme(value)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
        <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{label}</ThemedText>
      </View>
      <View style={[styles.radio, { borderColor: selectedTheme === value ? colors.primary : colors.border }]}>
        {selectedTheme === value && <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Theme Settings</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>
        <View style={[styles.sectionContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Option label="System Default" value="system" icon="phone-portrait-outline" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Option label="Light Mode" value="light" icon="sunny-outline" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Option label="Dark Mode" value="dark" icon="moon-outline" />
        </View>

        <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 16, paddingHorizontal: 4 }}>
          Currently, Nyumbani matches your device's system appearance. If you select System Default, it will automatically switch between Light and Dark themes based on your phone's settings.
        </ThemedText>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  backBtn: { padding: 4 },
  scrollContent: { padding: Spacing.four },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  sectionContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  divider: {
    height: 1,
    marginLeft: 48,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
  }
});
