import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { HapticButton } from '@/components/HapticButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const STATUS_ORDER = ['pending', 'confirmed', 'in_progress', 'completed'];

export default function BookingProgressScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBooking = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      Alert.alert('Error', 'Could not load booking details.');
    } else {
      setBooking(data);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchBooking();
    }, [id])
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ThemedText>Booking not found.</ThemedText>
        <HapticButton onPress={() => router.back()} style={{ marginTop: 20 }}>
          <ThemedText style={{ color: colors.primary }}>Go Back</ThemedText>
        </HapticButton>
      </View>
    );
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(booking.status);
  const isCancelled = booking.status === 'cancelled';

  const renderTimelineItem = (status: string, index: number, title: string, desc: string) => {
    const isCompleted = currentStatusIndex >= index;
    const isCurrent = currentStatusIndex === index;
    const isPast = currentStatusIndex > index;

    let iconColor = colors.border;
    let iconName = 'ellipse-outline';

    if (isCompleted) {
      iconColor = colors.primary;
      iconName = 'checkmark-circle';
    }
    if (isCurrent) {
      iconColor = '#D4AF37';
      iconName = 'radio-button-on';
    }

    if (isCancelled && index > 0) {
      iconColor = colors.border;
      iconName = 'ellipse-outline';
    }

    return (
      <View key={status} style={styles.timelineRow}>
        <View style={styles.timelineLeft}>
          <Ionicons name={iconName as any} size={24} color={iconColor} />
          {index < STATUS_ORDER.length - 1 && (
            <View style={[styles.timelineLine, { backgroundColor: isPast && !isCancelled ? colors.primary : colors.border }]} />
          )}
        </View>
        <View style={styles.timelineRight}>
          <ThemedText style={{ fontSize: 16, fontWeight: '700', color: isCompleted || isCurrent ? colors.text : colors.textSecondary }}>
            {title}
          </ThemedText>
          <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
            {desc}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Booking Progress</ThemedText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.backgroundSelected }]}>
              <Ionicons name="briefcase-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, textTransform: 'capitalize' }}>
                {booking.service_type} Service
              </ThemedText>
              <ThemedText style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                {new Date(booking.scheduled_date).toLocaleString()}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <ThemedText style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Details:</ThemedText>
          <ThemedText style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
            {booking.notes || 'No extra notes provided.'}
          </ThemedText>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
             <ThemedText style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Estimated Cost:</ThemedText>
             <ThemedText style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>TZS {booking.amount?.toLocaleString() || '0'}</ThemedText>
          </View>
        </View>

        <ThemedText style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 24 }}>Tracking Status</ThemedText>
        
        {isCancelled ? (
          <View style={[styles.card, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}>
            <ThemedText style={{ fontSize: 16, fontWeight: '700', color: '#EF4444', textAlign: 'center' }}>This booking was cancelled.</ThemedText>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {renderTimelineItem('pending', 0, 'Booking Received', 'We have received your booking request and are assigning a professional.')}
            {renderTimelineItem('confirmed', 1, 'Booking Confirmed', 'A professional has been assigned and will arrive at the scheduled time.')}
            {renderTimelineItem('in_progress', 2, 'Service In Progress', 'The professional is currently working on your request.')}
            {renderTimelineItem('completed', 3, 'Completed', 'The service has been completed successfully.')}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  scrollContent: { padding: Spacing.four, paddingBottom: 100 },
  card: { padding: 16, borderRadius: 16,  marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  divider: { height: 1, width: '100%', marginBottom: 16 },
  timelineContainer: { paddingLeft: 12 },
  timelineRow: { flexDirection: 'row', marginBottom: 0, minHeight: 80 },
  timelineLeft: { width: 40, alignItems: 'center' },
  timelineLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineRight: { flex: 1, paddingBottom: 32, paddingLeft: 8 }
});
