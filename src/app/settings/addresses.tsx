import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, ActivityIndicator, Modal, TextInput } from 'react-native';
import { HapticButton } from '@/components/HapticButton';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAddress, setNewAddress] = useState('');

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
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
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
            <View key={addr.id} style={[styles.addressCard]}>
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
                  <HapticButton hapticType="selection" onPress={() => handleSetDefault(addr.id)}>
                    <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Set as Default</ThemedText>
                  </HapticButton>
                )}
                <HapticButton hapticType="error" onPress={() => handleDelete(addr.id)} style={{ marginLeft: 'auto' }}>
                  <ThemedText style={{ color: '#EF4444', fontWeight: '600' }}>Delete</ThemedText>
                </HapticButton>
              </View>
            </View>
          ))
        )}

        {/* Add New Button */}
        <HapticButton hapticType="heavy"
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="#000" />
          <ThemedText style={{ color: '#000', fontWeight: '700', marginLeft: 8 }}>Add New Address</ThemedText>
        </HapticButton>
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent]}>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Add New Address</ThemedText>
            
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Title (e.g. Work, Home)"
              placeholderTextColor={colors.textSecondary}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            
            <TextInput
              style={[styles.input, { color: colors.text, marginTop: 12, height: 80 }]}
              placeholder="Full Address (e.g. 123 Masaki St...)"
              placeholderTextColor={colors.textSecondary}
              value={newAddress}
              onChangeText={setNewAddress}
              multiline
            />

            <View style={styles.modalActions}>
              <HapticButton 
                style={[styles.modalBtn, { backgroundColor: colors.background }]} 
                onPress={() => {
                  setShowAddModal(false);
                  setNewTitle('');
                  setNewAddress('');
                }}
              >
                <ThemedText style={{ color: colors.text }}>Cancel</ThemedText>
              </HapticButton>
              
              <HapticButton 
                style={[styles.modalBtn, { backgroundColor: colors.primary }]} 
                onPress={async () => {
                  if (!newTitle.trim() || !newAddress.trim()) return;
                  if (!session?.user.id) return;
                  
                  await supabase.from('addresses').insert({
                    profile_id: session.user.id,
                    title: newTitle.trim(),
                    full_address: newAddress.trim(),
                    is_default: addresses.length === 0
                  });
                  
                  setNewTitle('');
                  setNewAddress('');
                  setShowAddModal(false);
                  fetchAddresses();
                }}
              >
                <ThemedText style={{ color: '#000', fontWeight: '600' }}>Save</ThemedText>
              </HapticButton>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    
    padding: 24,
  },
  input: {
    
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  }
});
