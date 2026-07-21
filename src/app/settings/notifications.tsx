import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, Switch } from 'react-native';
import { HapticButton } from '@/components/HapticButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export default function NotificationsScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [promoEnabled, setPromoEnabled] = useState(true);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Notifications</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <ThemedText style={styles.sectionTitle}>Delivery Methods</ThemedText>
        <View style={[styles.sectionContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Push Notifications</ThemedText>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Get alerts directly on your device instantly.</ThemedText>
            </View>
            <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: colors.primary, false: colors.border }} />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Email Alerts</ThemedText>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Receive booking confirmations and receipts via email.</ThemedText>
            </View>
            <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ true: colors.primary, false: colors.border }} />
          </View>
        </View>

        <ThemedText style={[styles.sectionTitle, { marginTop: 24 }]}>Alert Types</ThemedText>
        <View style={[styles.sectionContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Promotions & Offers</ThemedText>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Discounts on Pango, Usafi, and Sokoni items.</ThemedText>
            </View>
            <Switch value={promoEnabled} onValueChange={setPromoEnabled} trackColor={{ true: colors.primary, false: colors.border }} />
          </View>
        </View>

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
    marginLeft: 16,
  }
});
