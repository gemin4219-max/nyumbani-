import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, useColorScheme, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { ShopItemCard } from '@/components/cards';

const { width } = Dimensions.get('window');

export default function CleaningScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('usafi_services')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setItems(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Usafi</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.scrollContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ paddingBottom: Spacing.four }}>
            <ThemedText style={{ fontSize: 32, fontWeight: '800', color: colors.text, lineHeight: 36 }}>Expert Cleaning.</ThemedText>
            <ThemedText style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8, lineHeight: 22 }}>Book professional cleaners for your home or office.</ThemedText>
          </View>
        }
        ListEmptyComponent={
          <ThemedText style={{ padding: Spacing.four, color: colors.textSecondary }}>No services found.</ThemedText>
        }
        renderItem={({ item }) => (
          <ShopItemCard 
            item={{...item, image: require('../../../assets/images/usafi.png')}} 
            colorScheme={colorScheme} 
            type="usafi"
            fullWidth={false}
          />
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
  columnWrapper: { justifyContent: 'space-between', marginBottom: Spacing.four }
});
