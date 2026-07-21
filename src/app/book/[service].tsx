import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, ScrollView, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { HapticButton } from '@/components/HapticButton';
import { hapticHeavy, hapticSuccess, hapticError } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function BookServiceScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { service, amount, propertyId, propertyTitle } = useLocalSearchParams();
  const { session, profile, refreshProfile } = useAuth();

  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState(profile?.address || '');
  const [contactPhone, setContactPhone] = useState(profile?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(1); // 1 = tomorrow, 2 = day after, etc.
  const [selectedTime, setSelectedTime] = useState(1); // 1 = morning, 2 = afternoon, 3 = evening
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  const isViewing = service === 'viewing';

  useEffect(() => {
    if (session?.user.id) {
      supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('is_default', { ascending: false })
        .then(({ data }) => {
          if (data) setSavedAddresses(data);
        });
    }
  }, [session]);

  const serviceName = (service as string)?.charAt(0).toUpperCase() + (service as string)?.slice(1);
  const parsedAmount = amount ? Number(amount) : 0;

  const handleBooking = async () => {
    if (!session?.user) {
      Alert.alert('Error', 'You must be logged in to book a service.');
      return;
    }
    if (!isViewing && !address.trim()) {
      hapticError();
      Alert.alert('Required', 'Please provide an address for the service.');
      return;
    }
    if (!contactPhone.trim()) {
      hapticError();
      Alert.alert('Required', 'Please provide a contact phone number.');
      return;
    }

    setLoading(true);
    hapticHeavy();

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + selectedDate);

    // service type in DB enum is ('cleaning', 'relocation', 'maintenance', 'market')
    // Note: usafi maps to cleaning
    const dbServiceType = service === 'usafi' ? 'cleaning' : service;

    // 1. Fetch User Wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('profile_id', session.user.id)
      .single();

    if (walletError || !wallet) {
      setLoading(false);
      Alert.alert('Error', 'Could not fetch your wallet balance.');
      return;
    }

    // 2. Check Sufficient Balance
    if (Number(wallet.balance) < parsedAmount) {
      setLoading(false);
      hapticError();
      Alert.alert(
        'Insufficient Balance', 
        `You need TZS ${parsedAmount.toLocaleString()} to book this service. Your current balance is TZS ${Number(wallet.balance).toLocaleString()}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Top Up Now', onPress: () => router.push('/(tabs)/wallet') }
        ]
      );
      return;
    }

    // 3. Deduct Wallet Balance (Escrow Hold)
    const newBalance = Number(wallet.balance) - parsedAmount;
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (updateError) {
      setLoading(false);
      Alert.alert('Error', 'Failed to hold funds.');
      return;
    }

    // 4. Create Pending Payment Transaction
    await supabase.from('transactions').insert({
      wallet_id: wallet.id,
      profile_id: session.user.id,
      amount: parsedAmount,
      type: 'payment',
      status: 'pending',
      description: `Booking hold for ${serviceName}`
    });

    const finalAddress = isViewing ? 'At Property' : address;
    const finalNotes = isViewing
      ? `Property: ${propertyTitle}\nTime Preference: ${['Morning', 'Afternoon', 'Evening'][selectedTime - 1]}\nContact Phone: ${contactPhone}\nNotes: ${notes}`
      : `Address: ${address}\nContact Phone: ${contactPhone}\nNotes: ${notes}`;

    // 5. Create Booking
    const { error } = await supabase
      .from('bookings')
      .insert({
        profile_id: session.user.id,
        service_type: dbServiceType,
        status: 'pending',
        scheduled_date: scheduledDate.toISOString(),
        amount: parsedAmount,
        notes: finalNotes
      });

    setLoading(false);

    if (error) {
      hapticError();
      Alert.alert('Booking Failed', error.message);
    } else {
      // 6. Save address to profile AND address book if it changed
      if (!isViewing && address !== profile?.address) {
        // Update main profile address
        await supabase
          .from('profiles')
          .update({ address: address })
          .eq('id', session.user.id);
          
        // Add to address book
        await supabase
          .from('addresses')
          .insert({
            profile_id: session.user.id,
            title: 'Saved Location',
            full_address: address,
            is_default: false
          });
        
        if (refreshProfile) {
          await refreshProfile();
        }
      }

      hapticSuccess();
      Alert.alert('Success', 'Your booking has been received!', [
        { text: 'OK', onPress: () => router.push('/(tabs)/bookings') }
      ]);
    }
  };

  const dates = [
    { id: 1, label: 'Tomorrow' },
    { id: 2, label: 'In 2 Days' },
    { id: 3, label: 'In 3 Days' },
    { id: 7, label: 'Next Week' },
  ];

  const times = [
    { id: 1, label: 'Morning' },
    { id: 2, label: 'Afternoon' },
    { id: 3, label: 'Evening' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Book {serviceName}</ThemedText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {isViewing && (
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Property Details</ThemedText>
            <ThemedText style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>{propertyTitle}</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Ionicons name="information-circle" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>Your viewing will take place at this property.</ThemedText>
            </View>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
            {isViewing ? 'When do you want to view?' : 'When do you need this?'}
          </ThemedText>
          <View style={styles.dateChips}>
            {dates.map((d) => (
              <HapticButton
                key={d.id}
                hapticType="selection"
                style={[
                  styles.chip,
                  { backgroundColor: colors.background, borderColor: selectedDate === d.id ? colors.primary : colors.border }
                ]}
                onPress={() => setSelectedDate(d.id)}
              >
                <ThemedText style={{ color: selectedDate === d.id ? colors.primary : colors.textSecondary, fontWeight: selectedDate === d.id ? '600' : '400' }}>
                  {d.label}
                </ThemedText>
              </HapticButton>
            ))}
          </View>

          {isViewing && (
            <>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 24, marginBottom: 16 }}>Time of Day</ThemedText>
              <View style={styles.dateChips}>
                {times.map((t) => (
                  <HapticButton
                    key={t.id}
                    hapticType="selection"
                    style={[
                      styles.chip,
                      { backgroundColor: colors.background, borderColor: selectedTime === t.id ? colors.primary : colors.border }
                    ]}
                    onPress={() => setSelectedTime(t.id)}
                  >
                    <ThemedText style={{ color: selectedTime === t.id ? colors.primary : colors.textSecondary, fontWeight: selectedTime === t.id ? '600' : '400' }}>
                      {t.label}
                    </ThemedText>
                  </HapticButton>
                ))}
              </View>
            </>
          )}
        </View>

        {!isViewing && (
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Service Location</ThemedText>
            
            {savedAddresses.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {savedAddresses.map((addr) => (
                  <HapticButton
                    key={addr.id}
                    hapticType="selection"
                    style={[
                      styles.chip,
                      { 
                        marginRight: 8,
                        backgroundColor: address === addr.full_address ? colors.primary : colors.background, 
                        borderColor: address === addr.full_address ? colors.primary : colors.border 
                      }
                    ]}
                    onPress={() => setAddress(addr.full_address)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name={addr.title.toLowerCase() === 'home' ? 'home' : 'business'} size={14} color={address === addr.full_address ? '#000' : colors.textSecondary} />
                      <ThemedText style={{ marginLeft: 4, color: address === addr.full_address ? '#000' : colors.textSecondary, fontWeight: address === addr.full_address ? '600' : '400' }}>
                        {addr.title}
                      </ThemedText>
                    </View>
                  </HapticButton>
                ))}
              </ScrollView>
            )}

            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Enter your full address"
              placeholderTextColor={colors.textSecondary}
              value={address}
              onChangeText={setAddress}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 }}>
              <Ionicons name="information-circle" size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <ThemedText style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}>
                Please provide a location that is accessible by Bolt for easy dispatch and delivery.
              </ThemedText>
            </View>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Contact Phone Number</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            placeholder="e.g. 07XXXXXXXX"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={contactPhone}
            onChangeText={setContactPhone}
          />

          <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 24, marginBottom: 12 }}>Additional Notes</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            placeholder={isViewing ? "E.g. How many people are coming?" : "Any special instructions?"}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.backgroundElement, borderTopColor: colors.border }]}>
        <View style={{ marginBottom: 16 }}>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>Estimated Total</ThemedText>
          <ThemedText style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>TZS {parsedAmount.toLocaleString()}</ThemedText>
        </View>
        
        <HapticButton 
          hapticType="heavy"
          style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Confirm Booking</ThemedText>
          )}
        </HapticButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  scrollContent: { padding: Spacing.four, paddingBottom: 100 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  dateChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  footer: { padding: Spacing.four, borderTopWidth: 1 },
  confirmBtn: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});
