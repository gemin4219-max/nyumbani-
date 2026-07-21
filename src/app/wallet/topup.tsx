import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { requestUssdPush } from '@/lib/clickpesa';
import { hapticMedium, hapticSuccess, hapticError } from '@/lib/haptics';

export default function TopUpScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { session } = useAuth();

  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedNumbers, setSavedNumbers] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user.id) {
      supabase
        .from('payment_methods')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setSavedNumbers(data);
        });
    }
  }, [session]);

  const handleTopUp = async () => {
    if (!amount || !phoneNumber) {
      alert('Please enter an amount and phone number.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (!session?.user.id) {
      alert('You must be logged in.');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch user's wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('profile_id', session.user.id)
        .single();
        
      if (walletError || !walletData) {
        throw new Error('Could not find wallet for user.');
      }

      // 2. Add to transactions table AS PENDING before calling ClickPesa
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          wallet_id: walletData.id,
          profile_id: session.user.id,
          amount: numAmount,
          type: 'topup',
          status: 'pending',
          description: 'Wallet Top Up via ClickPesa Mobile Money'
        })
        .select()
        .single();

      if (txError || !txData) throw new Error('Could not create pending transaction.');

      // 3. Call ClickPesa API with the real transaction ID as the orderReference
      await requestUssdPush(numAmount, phoneNumber, txData.id);

      // 4. Save the phone number if it's new
      if (!savedNumbers.find(sn => sn.phone_number === phoneNumber)) {
        await supabase.from('payment_methods').insert({
          profile_id: session.user.id,
          phone_number: phoneNumber
        });
      }

      // We DO NOT update the wallet balance here anymore.
      // The Supabase Edge Function will receive the webhook from ClickPesa
      // and update the wallet balance securely on the backend.

      hapticSuccess();
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 4000);

    } catch (error: any) {
      console.error(error);
      hapticError();
      alert(`Top up failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
         <Ionicons name="time" size={100} color="#3B82F6" />
         <ThemedText style={{ fontSize: 24, fontWeight: '800', marginTop: 20, color: colors.text, textAlign: 'center' }}>Request Sent!</ThemedText>
         <ThemedText style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 32, lineHeight: 24 }}>
           Please check your phone and enter your Mobile Money PIN to complete the payment. Your wallet will update automatically once processed.
         </ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Top Up Wallet</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.four }}>
        <ThemedText style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 24 }}>
          Enter the amount you wish to add to your wallet and the mobile number to be billed via ClickPesa.
        </ThemedText>

        <ThemedText style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Amount (TZS)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }]}
          placeholder="e.g. 10000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <ThemedText style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 20, marginBottom: 8 }}>Mobile Money Number</ThemedText>
        
        {savedNumbers.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {savedNumbers.map((sn) => (
              <TouchableOpacity
                key={sn.id}
                style={[
                  styles.chip,
                  { 
                    marginRight: 8,
                    backgroundColor: phoneNumber === sn.phone_number ? colors.primary : colors.background, 
                    borderColor: phoneNumber === sn.phone_number ? colors.primary : colors.border 
                  }
                ]}
                onPress={() => { hapticMedium(); setPhoneNumber(sn.phone_number); }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="call" size={14} color={phoneNumber === sn.phone_number ? '#000' : colors.textSecondary} />
                  <ThemedText style={{ marginLeft: 6, color: phoneNumber === sn.phone_number ? '#000' : colors.textSecondary, fontWeight: phoneNumber === sn.phone_number ? '600' : '400' }}>
                    {sn.phone_number}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }]}
          placeholder="e.g. 07XXXXXXXX"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <View style={[styles.infoBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <ThemedText style={{ flex: 1, marginLeft: 12, fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
            You will receive a USSD prompt on your phone to enter your Mobile Money PIN and authorize this payment via ClickPesa.
          </ThemedText>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} 
          activeOpacity={0.8}
          onPress={() => { hapticMedium(); handleTopUp(); }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <ThemedText style={{ fontSize: 16, fontWeight: '700', color: '#000' }}>Pay with ClickPesa</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
  },
  footer: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  }
});
