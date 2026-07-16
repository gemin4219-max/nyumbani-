import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

function ActionButton({ icon, label, colorScheme }: any) {
  const colors = Colors[colorScheme as 'light' | 'dark'];
  return (
    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
      <View style={[styles.actionIcon, { backgroundColor: colors.backgroundSelected }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <ThemedText style={{ fontSize: 13, fontWeight: '500', color: colors.text, marginTop: 8 }}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

function TransactionRow({ title, date, amount, type, colorScheme }: any) {
  const colors = Colors[colorScheme as 'light' | 'dark'];
  const isPositive = type === 'credit';

  return (
    <View style={styles.transactionRow}>
      <View style={[styles.txIcon, { backgroundColor: colors.backgroundSelected }]}>
        <Ionicons name={isPositive ? 'arrow-down' : 'arrow-up'} size={20} color={isPositive ? '#10B981' : colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{title}</ThemedText>
        <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{date}</ThemedText>
      </View>
      <ThemedText style={{ fontSize: 16, fontWeight: '700', color: isPositive ? '#10B981' : colors.text }}>
        {isPositive ? '+' : '-'} TZS {amount}
      </ThemedText>
    </View>
  );
}

export default function WalletTab() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { session } = useAuth();
  
  const [balance, setBalance] = React.useState<number>(0);
  const [transactions, setTransactions] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!session?.user.id) return;

    const fetchWallet = async () => {
      const { data } = await supabase
        .from('wallets')
        .select('*')
        .eq('profile_id', session.user.id)
        .single();
      if (data) {
        setBalance(data.balance);
        fetchTransactions(data.id);
      }
    };

    const fetchTransactions = async (walletId: string) => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setTransactions(data);
    };

    fetchWallet();
  }, [session]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <ThemedText style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>Wallet</ThemedText>
        </View>

        {/* BALANCE CARD */}
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <ThemedText style={{ color: 'rgba(0,0,0,0.6)', fontSize: 14, fontWeight: '700' }}>Available Balance</ThemedText>
          <ThemedText style={{ color: '#000000', fontSize: 36, lineHeight: 44, fontWeight: '800', marginTop: 8 }}>
            TZS {balance.toLocaleString()}
          </ThemedText>
          <ThemedText style={{ color: 'rgba(0,0,0,0.7)', fontSize: 13, marginTop: 4, fontWeight: '600' }}>Tap to view details</ThemedText>
          
          <View style={styles.cardDecoration} />
          <View style={styles.cardDecoration2} />
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsRow}>
          <ActionButton icon="add" label="Top Up" colorScheme={colorScheme} />
          <ActionButton icon="swap-horizontal" label="Transfer" colorScheme={colorScheme} />
          <ActionButton icon="arrow-down" label="Withdraw" colorScheme={colorScheme} />
          <ActionButton icon="scan" label="Scan" colorScheme={colorScheme} />
        </View>

        {/* TRANSACTIONS */}
        <View style={styles.sectionHeader}>
          <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Recent Transactions</ThemedText>
          <TouchableOpacity>
            <ThemedText style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>See All</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.transactionsContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          {transactions.length === 0 ? (
            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', padding: 16 }}>No transactions yet.</ThemedText>
          ) : (
            transactions.map((tx) => (
              <TransactionRow 
                key={tx.id}
                title={tx.description || 'Transaction'} 
                date={new Date(tx.created_at).toLocaleDateString()} 
                amount={tx.amount.toLocaleString()} 
                type={tx.type === 'topup' ? 'credit' : 'debit'} 
                colorScheme={colorScheme} 
              />
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  balanceCard: {
    marginHorizontal: Spacing.four,
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: Spacing.four,
  },
  cardDecoration: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -50,
    right: -50,
  },
  cardDecoration2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    bottom: -30,
    right: 40,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.five,
  },
  actionBtn: {
    alignItems: 'center',
    width: '23%',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  transactionsContainer: {
    marginHorizontal: Spacing.four,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 20,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  }
});
