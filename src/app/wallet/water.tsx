import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TextInput, ActivityIndicator, useColorScheme, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HapticButton } from '@/components/HapticButton';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function WaterScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session } = useAuth();

  const [accountNumber, setAccountNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [billDetails, setBillDetails] = useState<any>(null);

  useEffect(() => {
    if (session?.user.id) {
      supabase.from('water_accounts').select('*').eq('profile_id', session.user.id).then(({ data }) => {
        if (data) setSavedAccounts(data);
      });
    }
  }, [session]);

  const handleCheckBill = async () => {
    if (!accountNumber || accountNumber.length < 5) {
      Alert.alert('Invalid Account', 'Please enter a valid water account number.');
      return;
    }

    setProcessing(true);
    try {
      // Simulate API call to water provider
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock bill
      const randomBalance = Math.floor(5000 + Math.random() * 45000);
      setBillDetails({
        name: 'John Doe',
        accountNumber: accountNumber,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        balance: randomBalance
      });
    } catch (error) {
      Alert.alert('Error', 'Could not fetch bill details.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayBill = async () => {
    if (!billDetails || billDetails.balance <= 0) return;

    setProcessing(true);

    try {
      if (!session?.user.id) throw new Error('Not authenticated');

      // 1. Get Wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('profile_id', session.user.id)
        .single();

      if (walletError || !wallet) throw new Error('Wallet not found.');
      if (Number(wallet.balance) < Number(billDetails.balance)) throw new Error('Insufficient wallet balance. Please top up first.');

      // 2. Simulate Payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Deduct from wallet
      const newBalance = Number(wallet.balance) - Number(billDetails.balance);
      await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);

      // 4. Create transaction
      await supabase.from('transactions').insert({
        wallet_id: wallet.id,
        type: 'water',
        amount: -Number(billDetails.balance),
        reference: `WTR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'completed',
        description: `Water Bill - ${accountNumber}`
      });

      // 5. Save account if new
      if (!savedAccounts.find(a => a.account_number === accountNumber)) {
        await supabase.from('water_accounts').insert({
          profile_id: session.user.id,
          account_number: accountNumber,
          last_balance: 0
        });
      }

      Alert.alert('Payment Successful', 'Your water bill has been paid.', [
        { text: 'OK', onPress: () => router.push('/(tabs)/wallet') }
      ]);
      
    } catch (error: any) {
      console.error(error);
      Alert.alert('Payment Failed', error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <HapticButton onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </HapticButton>
          <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Pay Water Bill</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <ThemedText style={{ color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Account Number</ThemedText>
            <View style={[styles.phoneInputContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <Ionicons name="water-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.phoneInput, { color: colors.text }]}
                value={accountNumber}
                onChangeText={(text) => {
                  setAccountNumber(text);
                  if (billDetails) setBillDetails(null); // reset bill if account changes
                }}
                keyboardType="default"
                autoCapitalize="characters"
                placeholder="e.g. DAW-123456"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {savedAccounts.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, marginLeft: 4 }}>Saved Accounts</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {savedAccounts.map(a => (
                  <HapticButton 
                    key={a.id} 
                    hapticType="selection"
                    style={[styles.savedMeterBtn, { backgroundColor: colors.backgroundElement, borderColor: accountNumber === a.account_number ? colors.primary : colors.border }]}
                    onPress={() => {
                      setAccountNumber(a.account_number);
                      setBillDetails(null);
                    }}
                  >
                    <Ionicons name="home-outline" size={16} color={accountNumber === a.account_number ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
                    <ThemedText style={{ fontWeight: '600', fontSize: 14, color: accountNumber === a.account_number ? colors.primary : colors.text }}>{a.name}</ThemedText>
                  </HapticButton>
                ))}
              </ScrollView>
            </View>
          )}

          {billDetails ? (
            <View style={[styles.billCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <ThemedText style={{ color: colors.textSecondary }}>Customer Name</ThemedText>
                <ThemedText style={{ fontWeight: '600' }}>{billDetails.name}</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <ThemedText style={{ color: colors.textSecondary }}>Due Date</ThemedText>
                <ThemedText style={{ fontWeight: '600' }}>{billDetails.dueDate}</ThemedText>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' }}>
                <ThemedText style={{ color: colors.textSecondary }}>Total Due</ThemedText>
                <ThemedText style={{ fontSize: 24, fontWeight: '800', color: colors.primary }}>
                  TZS {billDetails.balance.toLocaleString()}
                </ThemedText>
              </View>

              <HapticButton 
                hapticType="heavy"
                style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: processing ? 0.7 : 1, marginTop: 24 }]}
                onPress={handlePayBill}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Pay Now</ThemedText>
                )}
              </HapticButton>
            </View>
          ) : (
            <HapticButton 
              hapticType="selection"
              style={[styles.submitBtn, { backgroundColor: colors.backgroundSelected, opacity: processing ? 0.7 : 1, marginTop: 24 }]}
              onPress={handleCheckBill}
              disabled={processing || !accountNumber}
            >
              {processing ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <ThemedText style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>Check Bill</ThemedText>
              )}
            </HapticButton>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  scrollContent: { padding: Spacing.four },
  inputGroup: { marginBottom: 24 },
  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  phoneInput: { flex: 1, fontSize: 16, fontWeight: '500' },
  savedMeterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginRight: 12 },
  submitBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  billCard: { padding: 24, borderRadius: 24, borderWidth: 1, marginTop: 8 },
  divider: { height: 1, width: '100%' }
});
