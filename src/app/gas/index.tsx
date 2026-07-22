import React from 'react';
import { StyleSheet, View, FlatList, useColorScheme, Dimensions } from 'react-native';
import { HapticButton } from '@/components/HapticButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { ShopItemCardFullWidth } from '@/components/cards';

import { supabase } from '@/lib/supabase';

export default function GasScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [gasItems, setGasItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchGasItems();
  }, []);

  const fetchGasItems = async () => {
    const { data } = await supabase.from('gas_items').select('*').order('created_at', { ascending: false });
    if (data) setGasItems(data);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Gas Refill</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={gasItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingBottom: Spacing.four }}>
            <ThemedText style={{ fontSize: 32, fontWeight: '800', color: colors.text, lineHeight: 36 }}>Fast Delivery.</ThemedText>
            <ThemedText style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8, lineHeight: 22 }}>
              Need a refill? Select your gas cylinder brand and size. We deliver it straight to your home.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <ShopItemCardFullWidth 
            item={{...item, image: item.image_url ? { uri: item.image_url } : require('../../../assets/images/sokoni.png')}} 
            colorScheme={colorScheme} 
            type="gas"
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
});
