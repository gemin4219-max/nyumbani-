import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HapticButton } from '@/components/HapticButton';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ManageWithdrawalsScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    // Fetch all withdrawals and join with profiles
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        profiles (
          full_name
        )
      `)
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching withdrawals:", error);
    }
      
    if (data) setWithdrawals(data);
    setLoading(false);
  };

  const handleApprove = async (transaction: any) => {
    Alert.alert(
      "Confirm Transfer",
      `Have you manually sent TZS ${transaction.amount.toLocaleString()} to the user via their requested method?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Mark Completed", 
          style: "default",
          onPress: async () => {
            const { error } = await supabase
              .from('transactions')
              .update({ status: 'completed' })
              .eq('id', transaction.id);
            
            if (!error) {
              fetchWithdrawals();
            } else {
              Alert.alert("Error", "Could not update transaction status.");
            }
          }
        }
      ]
    );
  };

  const handleReject = async (transaction: any) => {
    Alert.alert(
      "Reject Withdrawal",
      "This will cancel the withdrawal and refund the amount back to the user's wallet.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reject & Refund", 
          style: "destructive",
          onPress: async () => {
            // 1. Mark as failed
            await supabase.from('transactions').update({ status: 'failed' }).eq('id', transaction.id);
            
            // 2. Refund wallet
            const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', transaction.wallet_id).single();
            if (wallet) {
              await supabase.from('wallets').update({ balance: wallet.balance + transaction.amount }).eq('id', transaction.wallet_id);
            }
            
            fetchWithdrawals();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Withdrawal Requests</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : withdrawals.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.primary} />
            <ThemedText style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16 }}>No pending withdrawals!</ThemedText>
          </View>
        ) : (
          withdrawals.map((req, index) => (
            <View key={req.id}>
              <View style={styles.rowItem}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                  <Ionicons name="cash-outline" size={22} color="#D4AF37" />
                </View>
                
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <ThemedText style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                    {req.profiles?.full_name || 'Unknown User'}
                  </ThemedText>
                  
                  <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                    {req.description}
                  </ThemedText>
                  
                  {req.status === 'pending' ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity 
                        style={[styles.smallBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} 
                        onPress={() => handleReject(req)}
                      >
                        <ThemedText style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>Reject</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.smallBtn, { backgroundColor: colors.primary }]} 
                        onPress={() => handleApprove(req)}
                      >
                        <ThemedText style={{ color: '#000', fontWeight: '700', fontSize: 12 }}>Mark Paid</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <ThemedText style={{ 
                      fontSize: 12, 
                      fontWeight: '700', 
                      color: req.status === 'completed' ? '#10B981' : '#EF4444', 
                      marginTop: 8, 
                      textTransform: 'uppercase' 
                    }}>
                      {req.status}
                    </ThemedText>
                  )}
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                    TZS {req.amount.toLocaleString()}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </ThemedText>
                </View>
              </View>
              
              {index < withdrawals.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: Spacing.four, paddingBottom: 60, paddingTop: Spacing.two },
  rowItem: { flexDirection: 'row', paddingVertical: 16 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16 },
  divider: { height: 1, marginLeft: 58, opacity: 0.5 },
});
