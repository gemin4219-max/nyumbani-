import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme } from 'react-native';
import { HapticButton } from '@/components/HapticButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

const FAQS = [
  {
    q: 'How do I top up my wallet?',
    a: 'You can top up your wallet by going to the Wallet tab, tapping "Top Up", and selecting Mobile Money or Card. Enter the amount and follow the prompts.'
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes, you can cancel any booking before the service provider has been dispatched. Go to your Activity tab, select the booking, and tap "Cancel".'
  },
  {
    q: 'How do I add a new delivery address?',
    a: 'Go to Profile > Saved Addresses and tap "Add New Address". You can also set it as your default address for future bookings.'
  },
  {
    q: 'Are the Usafi cleaners vetted?',
    a: 'Absolutely. All our cleaning professionals go through a rigorous background check and training process before they can accept bookings on Nyumbani.'
  }
];

export default function HelpScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Help Center</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 16 }}>
          <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSelected }]}>
            <Ionicons name="help-buoy" size={48} color={colors.primary} />
          </View>
          <ThemedText style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 16 }}>How can we help?</ThemedText>
        </View>

        <ThemedText style={styles.sectionTitle}>Frequently Asked Questions</ThemedText>
        <View style={[styles.sectionContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          {FAQS.map((faq, index) => {
            const isExpanded = expanded === index;
            return (
              <View key={index} style={{ borderBottomWidth: index === FAQS.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
                <HapticButton 
                  style={styles.faqRow}
                  onPress={() => setExpanded(isExpanded ? null : index)}
                >
                  <ThemedText style={{ flex: 1, fontSize: 16, fontWeight: '600', color: colors.text }}>{faq.q}</ThemedText>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
                </HapticButton>
                {isExpanded && (
                  <View style={styles.faqAnswer}>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
                      {faq.a}
                    </ThemedText>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Contact Support CTA */}
        <HapticButton 
          style={[styles.contactBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          onPress={() => router.push('/settings/contact')}
        >
          <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} style={{ marginRight: 16 }} />
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Need more help?</ThemedText>
            <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Contact our 24/7 support team.</ThemedText>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
        </HapticButton>

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
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 24,
  }
});
