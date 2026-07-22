import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HapticButton } from '@/components/HapticButton';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

function TransactionRow({ title, date, amount, type, colorScheme }: any) {
  const colors = Colors[colorScheme as 'light' | 'dark'];
  const isPositive = type === 'credit';
  
  // Modern icon styling based on transaction type
  const iconName = isPositive ? 'arrow-down-outline' : 'arrow-up-outline';
  const iconColor = isPositive ? '#10B981' : colors.text;
  const iconBg = isPositive ? 'rgba(16, 185, 129, 0.1)' : colors.backgroundSelected;

  return (
    <View style={styles.transactionRow}>
      <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1, paddingRight: 16 }}>
        <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{title}</ThemedText>
        <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
          {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <ThemedText style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
          {isPositive ? '+' : '-'}TZS {amount}
        </ThemedText>
        {isPositive && <ThemedText style={{ fontSize: 12, color: '#10B981', marginTop: 4, fontWeight: '600' }}>Completed</ThemedText>}
      </View>
    </View>
  );
}

export default function TransactionsScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session } = useAuth();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');

  useEffect(() => {
    if (!session?.user.id) return;
    
    const fetchTransactions = async () => {
      const { data: wallet } = await supabase.from('wallets').select('id').eq('profile_id', session.user.id).single();
      if (wallet) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false });
        if (txs) setTransactions(txs);
      }
      setLoading(false);
    };
    
    fetchTransactions();
  }, [session]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'in') return transactions.filter(tx => tx.type === 'topup' || tx.type === 'credit');
    if (filter === 'out') return transactions.filter(tx => tx.type !== 'topup' && tx.type !== 'credit');
    return transactions;
  }, [transactions, filter]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filteredTransactions.forEach(tx => {
      const date = new Date(tx.created_at);
      
      // Determine relative label (Today, Yesterday, or Date string)
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      if (date.toDateString() === today.toDateString()) dateLabel = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday';

      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const FilterPill = ({ label, value }: { label: string, value: 'all' | 'in' | 'out' }) => {
    const isActive = filter === value;
    return (
      <HapticButton 
        hapticType="selection"
        style={[
          styles.filterPill, 
          { 
            backgroundColor: isActive ? colors.text : 'transparent',
            
          }
        ]}
        onPress={() => setFilter(value)}
      >
        <ThemedText style={{ 
          fontSize: 14, 
          fontWeight: isActive ? '700' : '600', 
          color: isActive ? colors.background : colors.textSecondary 
        }}>
          {label}
        </ThemedText>
      </HapticButton>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Sleek Header */}
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Activity</ThemedText>
        <HapticButton style={styles.backBtn}>
          <Ionicons name="search" size={24} color={colors.text} />
        </HapticButton>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <FilterPill label="All" value="all" />
        <FilterPill label="Money In" value="in" />
        <FilterPill label="Money Out" value="out" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : filteredTransactions.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="receipt-outline" size={48} color={colors.border} />
            <ThemedText style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16 }}>No transactions found.</ThemedText>
          </View>
        ) : (
          Object.keys(groupedTransactions).map((dateLabel) => (
            <View key={dateLabel} style={styles.dateGroup}>
              <ThemedText style={[styles.dateLabel, { color: colors.textSecondary }]}>{dateLabel}</ThemedText>
              
              <View style={styles.transactionsContainer}>
                {groupedTransactions[dateLabel].map((tx, index) => (
                  <View key={tx.id}>
                    <TransactionRow 
                      title={tx.description || 'Transaction'} 
                      date={tx.created_at} 
                      amount={tx.amount.toLocaleString()} 
                      type={tx.type === 'topup' ? 'credit' : 'debit'} 
                      colorScheme={colorScheme} 
                    />
                    {index < groupedTransactions[dateLabel].length - 1 && (
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    
  },
  scrollContent: { paddingHorizontal: Spacing.four, paddingBottom: 60 },
  dateGroup: {
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transactionsContainer: {
    paddingVertical: 0,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    marginLeft: 68, // Aligns with the text, skipping the icon
    marginRight: 16,
    opacity: 0.5,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  }
});
