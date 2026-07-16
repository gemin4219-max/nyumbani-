import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function AddressesScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session } = useAuth();
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    if (!session?.user.id) return;
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('profile_id', session.user.id)
      .order('is_default', { ascending: false });
    
    if (data) setAddresses(data);
    setLoading(false);
  };

  const handleSetDefault = async (id: string) => {
    if (!session?.user.id) return;
    // Clear all defaults first
    await supabase.from('addresses').update({ is_default: false }).eq('profile_id', session.user.id);
    // Set new default
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    fetchAddresses();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Saved Addresses</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={colors.border} />
            <ThemedText style={{ color: colors.textSecondary, marginTop: 16 }}>No saved addresses found.</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>Add an address to make booking easier.</ThemedText>
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={[styles.addressCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={styles.addressHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={addr.title.toLowerCase() === 'home' ? 'home' : 'business'} size={20} color={colors.primary} />
                  <ThemedText style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginLeft: 8 }}>{addr.title}</ThemedText>
                </View>
                {addr.is_default && (
                  <View style={[styles.defaultBadge, { backgroundColor: 'rgba(212, 175, 55, 0.2)' }]}>
                    <ThemedText style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Default</ThemedText>
                  </View>
                )}
              </View>
              
              <ThemedText style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
                {addr.full_address}
              </ThemedText>

              <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
                {!addr.is_default && (
                  <TouchableOpacity onPress={() => handleSetDefault(addr.id)}>
                    <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Set as Default</ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(addr.id)} style={{ marginLeft: 'auto' }}>
                  <ThemedText style={{ color: '#EF4444', fontWeight: '600' }}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Add New Button */}
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={async () => {
             // Mock adding an address
             if (!session?.user.id) return;
             await supabase.from('addresses').insert({
               profile_id: session.user.id,
               title: 'Home',
               full_address: 'Masaki, Dar es Salaam, Tanzania',
               is_default: addresses.length === 0
             });
             fetchAddresses();
          }}
        >
          <Ionicons name="add" size={20} color="#000" />
          <ThemedText style={{ color: '#000', fontWeight: '700', marginLeft: 8 }}>Add New Address</ThemedText>
        </TouchableOpacity>
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
  addressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
