import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, ActivityIndicator, Image } from 'react-native';
import { HapticButton } from '@/components/HapticButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function PaymentsScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session } = useAuth();
  
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    if (!session?.user.id) return;
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('profile_id', session.user.id)
      .order('is_default', { ascending: false });
    
    if (data) setMethods(data);
    setLoading(false);
  };

  const handleSetDefault = async (id: string) => {
    if (!session?.user.id) return;
    await supabase.from('payment_methods').update({ is_default: false }).eq('profile_id', session.user.id);
    await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
    fetchMethods();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('payment_methods').delete().eq('id', id);
    fetchMethods();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Payment Methods</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : methods.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={colors.border} />
            <ThemedText style={{ color: colors.textSecondary, marginTop: 16 }}>No payment methods linked.</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              Add a mobile money number or card to checkout faster.
            </ThemedText>
          </View>
        ) : (
          methods.map((method) => (
            <View key={method.id} style={[styles.methodCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.providerIcon, { backgroundColor: colors.backgroundSelected }]}>
                  <Ionicons name={method.provider === 'Visa' ? 'card' : 'phone-portrait'} size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{method.provider}</ThemedText>
                  <ThemedText style={{ color: colors.textSecondary, marginTop: 4 }}>{method.account_number}</ThemedText>
                </View>
                {method.is_default && (
                  <View style={[styles.defaultBadge, { backgroundColor: 'rgba(212, 175, 55, 0.2)' }]}>
                    <ThemedText style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Default</ThemedText>
                  </View>
                )}
              </View>

              <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
                {!method.is_default && (
                  <HapticButton hapticType="selection" onPress={() => handleSetDefault(method.id)}>
                    <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Set as Default</ThemedText>
                  </HapticButton>
                )}
                <HapticButton hapticType="error" onPress={() => handleDelete(method.id)} style={{ marginLeft: 'auto' }}>
                  <ThemedText style={{ color: '#EF4444', fontWeight: '600' }}>Remove</ThemedText>
                </HapticButton>
              </View>
            </View>
          ))
        )}

        {/* Add New Button */}
        <HapticButton hapticType="heavy"
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={async () => {
             // Mock adding a payment method
             if (!session?.user.id) return;
             await supabase.from('payment_methods').insert({
               profile_id: session.user.id,
               type: 'mobile_money',
               provider: 'M-PESA',
               last_four: '9876',
               is_default: methods.length === 0
             });
             fetchMethods();
          }}
        >
          <Ionicons name="add" size={20} color="#000" />
          <ThemedText style={{ color: '#000', fontWeight: '700', marginLeft: 8 }}>Add New Method</ThemedText>
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  methodCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  }
});
