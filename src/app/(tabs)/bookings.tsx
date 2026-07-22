import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme } from 'react-native';
import { HapticButton } from '@/components/HapticButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

function ActivityItem({ title, date, status, icon, colorScheme, onPress }: any) {
  const colors = Colors[colorScheme as 'light' | 'dark'];
  
  const getStatusColor = () => {
    if (status === 'confirmed' || status === 'pending') return '#D4AF37';
    if (status === 'in_progress') return '#F59E0B';
    if (status === 'completed') return '#10B981';
    if (status === 'cancelled') return '#EF4444';
    return colors.textSecondary;
  };

  return (
    <HapticButton onPress={onPress} hapticType="selection" style={[styles.activityItem]}>
      <View style={[styles.iconBox, { backgroundColor: colors.backgroundSelected }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.activityInfo}>
        <ThemedText style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{title}</ThemedText>
        <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{date}</ThemedText>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
        <ThemedText style={{ fontSize: 12, fontWeight: '600', color: getStatusColor() }}>{status}</ThemedText>
      </View>
    </HapticButton>
  );
}

export default function BookingsTab() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const [activeTab, setActiveTab] = useState('Upcoming');
  const { session } = useAuth();
  const router = useRouter();
  
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);

  React.useEffect(() => {
    if (!session?.user.id) return;

    const fetchBookings = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('scheduled_date', { ascending: false });

      if (data) {
        setUpcoming(data.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)));
        setPast(data.filter(b => ['completed', 'cancelled'].includes(b.status)));
      }
    };

    fetchBookings();
  }, [session]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      
      <View style={styles.header}>
        <ThemedText style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>Activity</ThemedText>
      </View>

      <View style={[styles.segmentControl, { backgroundColor: colors.border }]}>
        {['Upcoming', 'Past'].map(tab => (
          <HapticButton hapticType="selection"
            key={tab}
            style={[styles.segmentBtn, activeTab === tab && { backgroundColor: colors.backgroundElement }]}
            onPress={() => setActiveTab(tab)}
          >
            <ThemedText style={{ fontWeight: activeTab === tab ? '600' : '500', color: activeTab === tab ? colors.text : colors.textSecondary }}>
              {tab}
            </ThemedText>
          </HapticButton>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'Upcoming' ? (
          upcoming.length === 0 ? (
            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>No upcoming activity.</ThemedText>
          ) : (
            upcoming.map(b => (
              <ActivityItem 
                key={b.id} 
                title={b.service_type.charAt(0).toUpperCase() + b.service_type.slice(1)} 
                date={new Date(b.scheduled_date).toLocaleString()} 
                status={b.status} 
                icon="calendar-outline" 
                colorScheme={colorScheme} 
                onPress={() => router.push(`/booking/${b.id}`)}
              />
            ))
          )
        ) : (
          past.length === 0 ? (
            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>No past activity.</ThemedText>
          ) : (
            past.map(b => (
              <ActivityItem 
                key={b.id} 
                title={b.service_type.charAt(0).toUpperCase() + b.service_type.slice(1)} 
                date={new Date(b.scheduled_date).toLocaleString()} 
                status={b.status} 
                icon="checkmark-circle-outline" 
                colorScheme={colorScheme} 
                onPress={() => router.push(`/booking/${b.id}`)}
              />
            ))
          )
        )}
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
  segmentControl: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    padding: 4,
    borderRadius: 12,
    marginBottom: Spacing.three,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  }
});
