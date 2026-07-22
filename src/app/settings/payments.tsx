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

export default function PaymentsScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session } = useAuth();
  
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  
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
          methods.map((method, index) => (
            <View key={method.id}>
              <View style={styles.rowItem}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                  <Ionicons name="phone-portrait-outline" size={22} color="#D4AF37" />
                </View>
                
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <ThemedText style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Mobile Money</ThemedText>
                    {method.is_default && (
                      <View style={[styles.defaultBadge, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
                        <ThemedText style={{ color: '#D4AF37', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Default</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>{method.phone_number}</ThemedText>
                  
                  <View style={styles.actionRow}>
                    {!method.is_default && (
                      <HapticButton hapticType="selection" onPress={() => handleSetDefault(method.id)}>
                        <ThemedText style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>Set as Default</ThemedText>
                      </HapticButton>
                    )}
                    <HapticButton hapticType="error" onPress={() => handleDelete(method.id)}>
                      <ThemedText style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>Remove</ThemedText>
                    </HapticButton>
                  </View>
                </View>
              </View>
              
              {index < methods.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))
        )}

        {/* Add New Button */}
        <HapticButton hapticType="heavy"
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="#000" />
          <ThemedText style={{ color: '#000', fontWeight: '700', marginLeft: 8 }}>Add New Method</ThemedText>
        </HapticButton>
      </ScrollView>

      {/* Add Payment Method Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent]}>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Add Mobile Money</ThemedText>
            
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Phone Number (e.g. 07XXXXXXXX)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />
            
            <View style={styles.modalActions}>
              <HapticButton 
                style={[styles.modalBtn, { backgroundColor: colors.background }]} 
                onPress={() => {
                  setShowAddModal(false);
                  setNewPhone('');
                }}
              >
                <ThemedText style={{ color: colors.text }}>Cancel</ThemedText>
              </HapticButton>
              
              <HapticButton 
                style={[styles.modalBtn, { backgroundColor: colors.primary }]} 
                onPress={async () => {
                  if (!newPhone.trim()) return;
                  if (!session?.user.id) return;
                  
                  const { error } = await supabase.from('payment_methods').insert({
                    profile_id: session.user.id,
                    phone_number: newPhone.trim(),
                    is_default: methods.length === 0
                  });
                  
                  if (error) {
                    alert("Error saving payment method: " + error.message);
                    return;
                  }
                  
                  setNewPhone('');
                  setShowAddModal(false);
                  fetchMethods();
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
  scrollContent: { paddingHorizontal: Spacing.four, paddingBottom: 60, paddingTop: Spacing.two },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  rowItem: { flexDirection: 'row', paddingVertical: 20 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  divider: { height: 1, marginLeft: 60, opacity: 0.5 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
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
