import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TextInput, useColorScheme, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HapticButton } from '@/components/HapticButton';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function TransferScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session } = useAuth();
  
  const [balance, setBalance] = useState<number>(0);
  const [walletId, setWalletId] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [recipient, setRecipient] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (!session?.user.id) return;
    const fetchWallet = async () => {
      const { data } = await supabase.from('wallets').select('*').eq('profile_id', session.user.id).single();
      if (data) {
        setBalance(data.balance);
        setWalletId(data.id);
      }
    };
    fetchWallet();
  }, [session]);

  // Debounced Search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const searchUsers = async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${searchQuery}%`)
        .neq('id', session?.user.id)
        .limit(5);
        
      if (data) setSearchResults(data);
      setSearching(false);
    };
    
    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTransfer = async () => {
    if (!recipient) {
      Alert.alert("Select a recipient", "Please select who you want to send money to.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid transfer amount.");
      return;
    }
    if (numAmount > balance) {
      Alert.alert("Insufficient Funds", "You do not have enough money in your wallet.");
      return;
    }
    
    setTransferring(true);
    
    try {
      // 1. Get Recipient's Wallet
      const { data: recWallet, error: rwError } = await supabase
        .from('wallets')
        .select('*')
        .eq('profile_id', recipient.id)
        .single();
        
      if (!recWallet || rwError) {
        Alert.alert("Error", "Recipient does not have an active wallet.");
        setTransferring(false);
        return;
      }
      
      // 2. Deduct from Sender
      await supabase.from('wallets').update({ balance: balance - numAmount }).eq('id', walletId);
      
      // 3. Add to Recipient
      await supabase.from('wallets').update({ balance: recWallet.balance + numAmount }).eq('id', recWallet.id);
      
      // 4. Record Sender Transaction (Debit)
      await supabase.from('transactions').insert({
        wallet_id: walletId,
        profile_id: session!.user.id,
        amount: numAmount,
        type: 'transfer',
        description: `Transfer to ${recipient.full_name || 'User'}`
      });
      
      // 5. Record Recipient Transaction (Credit)
      await supabase.from('transactions').insert({
        wallet_id: recWallet.id,
        profile_id: recipient.id,
        amount: numAmount,
        type: 'transfer',
        description: `Transfer from ${session?.user.email || 'User'}`
      });
      
      setTransferring(false);
      Alert.alert("Success!", `You have successfully transferred TZS ${numAmount.toLocaleString()} to ${recipient.full_name || 'User'}.`, [
        { text: "OK", onPress: () => router.replace('/wallet/') }
      ]);
      
    } catch (err) {
      setTransferring(false);
      Alert.alert("Transfer Failed", "An error occurred during the transfer.");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Header */}
        <View style={styles.header}>
          <HapticButton onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </HapticButton>
          <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Transfer</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.balanceBanner, { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.3)' }]}>
            <ThemedText style={{ color: '#D4AF37', fontWeight: '600' }}>Available Balance</ThemedText>
            <ThemedText style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 4 }}>
              TZS {balance.toLocaleString()}
            </ThemedText>
          </View>

          {/* STEP 1: Select Recipient */}
          {!recipient ? (
            <View style={styles.stepContainer}>
              <ThemedText style={styles.sectionTitle}>1. Who are you sending to?</ThemedText>
              
              <View style={[styles.searchBox]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Search by name..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searching && <ActivityIndicator size="small" color={colors.primary} />}
              </View>

              {searchResults.length > 0 && (
                <View style={[styles.resultsContainer]}>
                  {searchResults.map((user, idx) => (
                    <TouchableOpacity 
                      key={user.id} 
                      style={[styles.userRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                      onPress={() => setRecipient(user)}
                    >
                      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <ThemedText style={{ color: '#000', fontWeight: '700' }}>
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
                        </ThemedText>
                      </View>
                      <View>
                        <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                          {user.full_name || 'Unknown User'}
                        </ThemedText>
                        <ThemedText style={{ fontSize: 13, color: colors.textSecondary }}>
                          ID: {user.id.substring(0,8)}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            /* STEP 2: Enter Amount */
            <View style={styles.stepContainer}>
              <ThemedText style={styles.sectionTitle}>Transfer To</ThemedText>
              
              <View style={[styles.selectedUserBox, { backgroundColor: colors.backgroundElement, borderColor: colors.primary }]}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <ThemedText style={{ color: '#000', fontWeight: '700' }}>
                    {recipient.full_name ? recipient.full_name.charAt(0).toUpperCase() : '?'}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                    {recipient.full_name || 'Unknown User'}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={() => setRecipient(null)} style={{ padding: 8 }}>
                  <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ThemedText style={[styles.sectionTitle, { marginTop: 24 }]}>Amount</ThemedText>
              <View style={[styles.amountBox]}>
                <ThemedText style={{ fontSize: 24, fontWeight: '700', color: colors.textSecondary, marginRight: 8 }}>TZS</ThemedText>
                <TextInput
                  style={[styles.amountInput, { color: colors.text }]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>
              
              <View style={styles.quickAmounts}>
                {[5000, 10000, 50000].map(val => (
                  <TouchableOpacity 
                    key={val} 
                    style={[styles.quickChip, { backgroundColor: colors.backgroundSelected }]}
                    onPress={() => setAmount(val.toString())}
                  >
                    <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>+{val / 1000}k</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </ScrollView>

        {recipient && (
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <HapticButton 
              hapticType="heavy"
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: (!amount || transferring) ? 0.5 : 1 }]}
              onPress={handleTransfer}
              disabled={!amount || transferring}
            >
              {transferring ? (
                <ActivityIndicator color="#000" />
              ) : (
                <ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Send Securely</ThemedText>
              )}
            </HapticButton>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: 100 },
  balanceBanner: { padding: 16, borderRadius: 16,  marginBottom: 24, alignItems: 'center' },
  stepContainer: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16 },
  resultsContainer: { marginTop: 8, borderRadius: 16,  overflow: 'hidden' },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  selectedUserBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16,  },
  amountBox: { flexDirection: 'row', alignItems: 'center', height: 72, borderRadius: 20,  paddingHorizontal: 20 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '800' },
  quickAmounts: { flexDirection: 'row', gap: 12, marginTop: 16 },
  quickChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  footer: { padding: Spacing.four, borderTopWidth: 1 },
  submitBtn: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }
});
