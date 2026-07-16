import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, useColorScheme, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { PropertyCard } from '@/components/cards';

const { width } = Dimensions.get('window');

export default function PangoScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [properties, setProperties] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProperties = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setProperties(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Pango</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <FlatList 
        data={properties}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ paddingBottom: Spacing.four }}>
            <ThemedText style={{ fontSize: 32, fontWeight: '800', color: colors.text, lineHeight: 36 }}>Find your next home.</ThemedText>
            <ThemedText style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8, lineHeight: 22 }}>Browse all available properties in Tanzania.</ThemedText>
          </View>
        }
        ListEmptyComponent={
          <ThemedText style={{ padding: Spacing.four, color: colors.textSecondary }}>No properties found.</ThemedText>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: Spacing.four, width: '100%' }}>
            <PropertyCard property={item} colorScheme={colorScheme} fullWidth={true} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  scrollContent: { paddingTop: Spacing.two, paddingBottom: 100, paddingHorizontal: Spacing.four },
});
