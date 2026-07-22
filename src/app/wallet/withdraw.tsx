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

export default function WithdrawScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session } = useAuth();
  
  const [balance, setBalance] = useState<number>(0);
  const [walletId, setWalletId] = useState<string>('');
  
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('mobile_money');

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

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid withdrawal amount.");
      return;
    }
    if (numAmount > balance) {
      Alert.alert("Insufficient Funds", "You cannot withdraw more than your available balance.");
      return;
    }
    
    if (!recipientName.trim() || !phoneNumber.trim()) {
      Alert.alert("Missing Details", "Please enter the recipient's name and phone number.");
      return;
    }
    
    setWithdrawing(true);
    
    try {
      // 1. Deduct from Wallet
      await supabase.from('wallets').update({ balance: balance - numAmount }).eq('id', walletId);
      
      // 2. Record Transaction as PENDING for admin review
      await supabase.from('transactions').insert({
        wallet_id: walletId,
        profile_id: session!.user.id,
        amount: numAmount,
        type: 'withdrawal',
        status: 'pending',
        description: `To: ${recipientName.trim()} | Phone: ${phoneNumber.trim()} | Via: ${selectedMethod.toUpperCase()}`
      });
      
      setWithdrawing(false);
      Alert.alert("Withdrawal Requested", `Your withdrawal request for TZS ${numAmount.toLocaleString()} has been sent to the admin for processing.`, [
        { text: "OK", onPress: () => router.replace('/wallet/') }
      ]);
      
    } catch (err) {
      setWithdrawing(false);
      Alert.alert("Error", "An error occurred during withdrawal. Please try again.");
    }
  };

  const MethodOption = ({ id, name, icon }: any) => {
    const isActive = selectedMethod === id;
    return (
      <TouchableOpacity 
        style={[styles.methodOption, { 
          backgroundColor: isActive ? colors.backgroundSelected : colors.backgroundElement
        }]}
        onPress={() => setSelectedMethod(id)}
      >
        <View style={styles.methodIcon}>
          <Ionicons name={icon} size={24} color={isActive ? colors.text : colors.textSecondary} />
        </View>
        <ThemedText style={{ flex: 1, fontSize: 16, fontWeight: '600', color: isActive ? colors.text : colors.textSecondary }}>{name}</ThemedText>
        {isActive && <Ionicons name="checkmark" size={24} color={colors.text} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Header */}
        <View style={styles.header}>
          <HapticButton onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </HapticButton>
          <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Withdraw Funds</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.balanceBanner, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <ThemedText style={{ color: '#10B981', fontWeight: '600' }}>Available to Withdraw</ThemedText>
            <ThemedText style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 4 }}>
              TZS {balance.toLocaleString()}
            </ThemedText>
          </View>

          <ThemedText style={[styles.sectionTitle, { marginTop: 8 }]}>Amount</ThemedText>
          <View style={[styles.amountBox, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <ThemedText style={{ fontSize: 24, fontWeight: '700', color: colors.textSecondary, marginRight: 8 }}>TZS</ThemedText>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TouchableOpacity onPress={() => setAmount(balance.toString())}>
              <ThemedText style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>MAX</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.sectionTitle, { marginTop: 32 }]}>Withdraw To</ThemedText>
          <View style={{ gap: 4 }}>
            <MethodOption id="mobile_money" name="Mobile Money" icon="phone-portrait" />
            <MethodOption id="bank" name="Bank Account" icon="business" />
          </View>

          <ThemedText style={[styles.sectionTitle, { marginTop: 32 }]}>Recipient Details</ThemedText>
          
          <View style={[styles.inputBox, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Recipient Name"
              placeholderTextColor={colors.textSecondary}
              value={recipientName}
              onChangeText={setRecipientName}
            />
          </View>
          
          <View style={[styles.inputBox, { borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 12 }]}>
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Phone Number / Account Number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          {/* Button is now inside ScrollView so it doesn't hover awkwardly */}
          <View style={{ marginTop: 32, marginBottom: 32 }}>
            <HapticButton 
              hapticType="heavy"
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: (!amount || !recipientName || !phoneNumber || withdrawing) ? 0.5 : 1 }]}
              onPress={handleWithdraw}
              disabled={!amount || !recipientName || !phoneNumber || withdrawing}
            >
              {withdrawing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Confirm Withdrawal</ThemedText>
              )}
            </HapticButton>
          </View>

        </ScrollView>
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
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  amountBox: { flexDirection: 'row', alignItems: 'center', height: 72, borderRadius: 20, paddingHorizontal: 20 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '800' },
  inputBox: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, paddingHorizontal: 16 },
  textInput: { flex: 1, fontSize: 16 },
  methodOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  methodIcon: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  footer: { padding: Spacing.four, borderTopWidth: 1 },
  submitBtn: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }
});
