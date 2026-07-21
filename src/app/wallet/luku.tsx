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

export default function LukuScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session } = useAuth();

  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [savedMeters, setSavedMeters] = useState<any[]>([]);
  const [tokenReceipt, setTokenReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user.id) {
      supabase.from('luku_meters').select('*').eq('profile_id', session.user.id).then(({ data }) => {
        if (data) setSavedMeters(data);
      });
    }
  }, [session]);

  const handleBuyLuku = async () => {
    if (!meterNumber || meterNumber.length < 11) {
      Alert.alert('Invalid Meter', 'Please enter a valid 11-digit LUKU meter number.');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) < 1000) {
      Alert.alert('Invalid Amount', 'Minimum LUKU purchase is TZS 1,000.');
      return;
    }

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
      if (Number(wallet.balance) < Number(amount)) throw new Error('Insufficient wallet balance. Please top up first.');

      // 2. Simulate API Call to Tanesco / Aggregator
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Generate fake token
      const token1 = Math.floor(1000 + Math.random() * 9000);
      const token2 = Math.floor(1000 + Math.random() * 9000);
      const token3 = Math.floor(1000 + Math.random() * 9000);
      const token4 = Math.floor(1000 + Math.random() * 9000);
      const token5 = Math.floor(1000 + Math.random() * 9000);
      const generatedToken = `${token1} ${token2} ${token3} ${token4} ${token5}`;

      // 3. Deduct from wallet
      const newBalance = Number(wallet.balance) - Number(amount);
      await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);

      // 4. Create transaction
      await supabase.from('transactions').insert({
        wallet_id: wallet.id,
        type: 'luku',
        amount: -Number(amount),
        reference: generatedToken,
        status: 'completed',
        description: `LUKU Token for ${meterNumber}`
      });

      // 5. Save meter if new
      if (!savedMeters.find(m => m.meter_number === meterNumber)) {
        await supabase.from('luku_meters').insert({
          profile_id: session.user.id,
          meter_number: meterNumber,
          last_purchased_at: new Date().toISOString()
        });
      } else {
        await supabase.from('luku_meters').update({ last_purchased_at: new Date().toISOString() }).eq('meter_number', meterNumber);
      }

      setTokenReceipt(generatedToken);
      
    } catch (error: any) {
      console.error(error);
      Alert.alert('Transaction Failed', error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (tokenReceipt) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four }}>
          <View style={[styles.successCircle, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="checkmark" size={64} color="#10B981" />
          </View>
          <ThemedText style={{ fontSize: 24, fontWeight: '700', marginTop: 24 }}>Payment Successful</ThemedText>
          <ThemedText style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8 }}>Your LUKU token has been generated.</ThemedText>
          
          <View style={[styles.tokenCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <ThemedText style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Token Number</ThemedText>
            <ThemedText style={{ fontSize: 28, fontWeight: '800', color: colors.primary, textAlign: 'center', letterSpacing: 2 }}>{tokenReceipt}</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginTop: 16, fontSize: 14 }}>Meter: {meterNumber}</ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginTop: 4, fontSize: 14 }}>Amount: TZS {Number(amount).toLocaleString()}</ThemedText>
          </View>

          <HapticButton 
            hapticType="heavy"
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/wallet')}
          >
            <ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Back to Wallet</ThemedText>
          </HapticButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <HapticButton onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </HapticButton>
          <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Buy LUKU</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <ThemedText style={{ color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Meter Number</ThemedText>
            <View style={[styles.phoneInputContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <Ionicons name="flash-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.phoneInput, { color: colors.text }]}
                value={meterNumber}
                onChangeText={setMeterNumber}
                keyboardType="numeric"
                placeholder="e.g. 1422 3344 556"
                placeholderTextColor={colors.textSecondary}
                maxLength={14}
              />
            </View>
          </View>

          {savedMeters.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, marginLeft: 4 }}>Saved Meters</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {savedMeters.map(m => (
                  <HapticButton 
                    key={m.id} 
                    hapticType="selection"
                    style={[styles.savedMeterBtn, { backgroundColor: colors.backgroundElement, borderColor: meterNumber === m.meter_number ? colors.primary : colors.border }]}
                    onPress={() => setMeterNumber(m.meter_number)}
                  >
                    <Ionicons name="home-outline" size={16} color={meterNumber === m.meter_number ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
                    <ThemedText style={{ fontWeight: '600', fontSize: 14, color: meterNumber === m.meter_number ? colors.primary : colors.text }}>{m.name}</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 8 }}>{m.meter_number.slice(-4)}</ThemedText>
                  </HapticButton>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <ThemedText style={{ color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Amount (TZS)</ThemedText>
            <View style={[styles.phoneInputContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <ThemedText style={{ color: colors.textSecondary, marginRight: 8, fontWeight: '600' }}>TZS</ThemedText>
              <TextInput
                style={[styles.phoneInput, { color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <HapticButton 
            hapticType="heavy"
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: processing ? 0.7 : 1, marginTop: 24 }]}
            onPress={handleBuyLuku}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Buy Tokens</ThemedText>
            )}
          </HapticButton>

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
  successCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  tokenCard: { width: '100%', padding: 24, borderRadius: 24, borderWidth: 1, alignItems: 'center', marginTop: 32 },
  doneBtn: { width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 32 }
});
