import React from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, TouchableOpacity, ImageBackground, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export default function RelocationScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Kuhama</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ImageBackground 
          source={require('../../../assets/images/kuhama.png')} 
          style={styles.heroImage}
          imageStyle={{ borderRadius: 24 }}
        >
          <View style={styles.heroOverlay}>
             <ThemedText style={{ color: '#FFF', fontSize: 32, fontWeight: '800' }}>Moving made easy.</ThemedText>
             <ThemedText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 8 }}>Stress-free relocation for your home or office across Tanzania.</ThemedText>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          <View style={[styles.featureCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Ionicons name="car-sport" size={32} color={colors.primary} />
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 12 }}>Reliable Trucks</ThemedText>
            <ThemedText style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>We have a fleet of trucks ready to move your items safely.</ThemedText>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 12 }}>Safe & Secure</ThemedText>
            <ThemedText style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>Your belongings are packed and transported with the utmost care.</ThemedText>
          </View>

          <TouchableOpacity 
            onPress={() => Linking.openURL('tel:+255700000000')}
            style={[styles.callBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="call" size={24} color="#000" />
            <ThemedText style={{ fontSize: 18, fontWeight: '800', color: '#000', marginLeft: 12 }}>Call to Book a Truck</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  scrollContent: { padding: Spacing.four, paddingBottom: 100 },
  heroImage: { width: '100%', height: 280, justifyContent: 'flex-end' },
  heroOverlay: { backgroundColor: 'rgba(0,0,0,0.5)', padding: Spacing.four, borderRadius: 24, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  content: { marginTop: Spacing.six },
  featureCard: { padding: Spacing.four, borderRadius: 20, borderWidth: 1, marginBottom: Spacing.four },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginTop: Spacing.four }
});
