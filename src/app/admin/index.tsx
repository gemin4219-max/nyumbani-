import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

export default function AdminDashboardScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { profile } = useAuth();

  const AdminCard = ({ title, icon, route, description }: any) => (
    <TouchableOpacity 
      style={[styles.adminCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
      onPress={() => router.push(route)}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSelected }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{title}</ThemedText>
        <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{description}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Admin Control Center</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={{ marginBottom: 32, paddingHorizontal: 4 }}>
          <ThemedText style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Welcome back,</ThemedText>
          <ThemedText style={{ fontSize: 24, fontWeight: '800', color: colors.primary }}>{profile?.full_name?.split(' ')[0] || 'Admin'}</ThemedText>
          <ThemedText style={{ fontSize: 15, color: colors.textSecondary, marginTop: 8 }}>
            Manage the entire Nyumbani ecosystem from here. Changes made here instantly reflect on the home screen for all users.
          </ThemedText>
        </View>

        <ThemedText style={styles.sectionTitle}>Content Management</ThemedText>
        
        <AdminCard 
          title="Manage Pango" 
          icon="business" 
          route="/admin/manage-pango"
          description="Post new rental properties and manage existing listings."
        />
        
        <AdminCard 
          title="Manage Sokoni" 
          icon="cart" 
          route="/admin/manage-sokoni"
          description="Add fresh groceries, set prices, and update stock."
        />

        <AdminCard 
          title="Manage Usafi" 
          icon="sparkles" 
          route="/admin/manage-usafi"
          description="Create new cleaning packages and update service rates."
        />

        <AdminCard 
          title="Manage Kariakoo" 
          icon="tv" 
          route="/admin/manage-kariakoo"
          description="Post wholesale electronics, furniture, and appliances."
        />

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
    marginBottom: Spacing.three,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  }
});
