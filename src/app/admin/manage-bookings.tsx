import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { HapticButton } from '@/components/HapticButton';
import { hapticSuccess, hapticError, hapticHeavy } from '@/lib/haptics';

export default function ManageBookingsScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    // Fetch all bookings and join with profiles to get the customer's name
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles ( full_name, phone_number )
      `)
      .order('created_at', { ascending: false });
      
    if (data) {
      setBookings(data);
    }
    setLoading(false);
  };

  const updateStatus = async (booking: any, newStatus: string) => {
    hapticHeavy();
    setLoading(true);
    
    // 1. Update Booking Status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', booking.id);

    if (bookingError) {
      hapticError();
      Alert.alert('Error', 'Failed to update booking status.');
      setLoading(false);
      return;
    }

    // 2. Automated Escrow Logic
    if (newStatus === 'cancelled') {
      // REFUND LOGIC
      // Find the user's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('profile_id', booking.profile_id)
        .single();
        
      if (wallet && booking.amount) {
        // Refund the balance
        const newBalance = Number(wallet.balance) + Number(booking.amount);
        await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);
        
        // Log refund transaction
        await supabase.from('transactions').insert({
          wallet_id: wallet.id,
          profile_id: booking.profile_id,
          amount: booking.amount,
          type: 'transfer',
          status: 'completed',
          description: `Refund for cancelled ${booking.service_type} booking`
        });
      }
    } else if (newStatus === 'completed') {
      // SETTLE LOGIC
      // We can mark any pending payments as completed
      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('profile_id', booking.profile_id)
        .eq('type', 'payment')
        .eq('status', 'pending');
    }

    hapticSuccess();
    Alert.alert('Success', `Booking marked as ${newStatus}.`);
    await fetchBookings();
  };

  const promptStatusChange = (booking: any) => {
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      Alert.alert('Closed', 'This booking is already closed.');
      return;
    }

    Alert.alert(
      'Update Status',
      'What is the new status of this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        ...(booking.status === 'pending' ? [{ text: 'Mark In Progress', onPress: () => updateStatus(booking, 'in_progress') }] : []),
        { text: 'Mark Completed', onPress: () => updateStatus(booking, 'completed') },
        { text: 'Cancel Booking (Refund)', style: 'destructive', onPress: () => updateStatus(booking, 'cancelled') },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return '#F59E0B'; // Amber
      case 'in_progress': return '#D4AF37'; // Blue
      case 'completed': return '#10B981'; // Green
      case 'cancelled': return '#EF4444'; // Red
      default: return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Manage Bookings</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading && bookings.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : bookings.length === 0 ? (
          <ThemedText style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>No bookings found.</ThemedText>
        ) : (
          bookings.map(booking => (
            <TouchableOpacity 
              key={booking.id} 
              onPress={() => promptStatusChange(booking)}
              style={[styles.bookingCard]}
            >
              <View style={styles.cardHeader}>
                <ThemedText style={{ fontWeight: '700', fontSize: 16, color: colors.text, textTransform: 'capitalize' }}>
                  {booking.service_type}
                </ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                  <ThemedText style={{ color: getStatusColor(booking.status), fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
                    {booking.status.replace('_', ' ')}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.customerInfo}>
                <ThemedText style={{ fontSize: 14, color: colors.text, fontWeight: '600' }}>
                  <Ionicons name="person" size={14} /> {booking.profiles?.full_name || 'Unknown User'}
                </ThemedText>
                <ThemedText style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                  <Ionicons name="call" size={14} /> {booking.profiles?.phone_number || 'No phone'}
                </ThemedText>
              </View>

              <ThemedText style={{ fontSize: 14, color: colors.textSecondary, marginTop: 12 }}>
                {booking.notes}
              </ThemedText>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.cardFooter}>
                <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>
                  Scheduled: {new Date(booking.scheduled_date).toLocaleDateString()}
                </ThemedText>
                <ThemedText style={{ fontWeight: '800', color: colors.primary }}>
                  TZS {booking.amount?.toLocaleString() || 0}
                </ThemedText>
              </View>
            </TouchableOpacity>
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
  scrollContent: { padding: Spacing.four },
  bookingCard: { padding: 16, borderRadius: 16,  marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  customerInfo: { backgroundColor: 'rgba(0,0,0,0.05)', padding: 12, borderRadius: 8 },
  divider: { height: 1, marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});
