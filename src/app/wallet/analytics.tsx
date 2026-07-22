import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { AnalyticsChart, DataPoint } from '@/components/AnalyticsChart';
import { HapticButton } from '@/components/HapticButton';

export default function AnalyticsScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { session } = useAuth();
  const router = useRouter();

  const [monthlySpent, setMonthlySpent] = useState<number>(0);
  const [todaySpent, setTodaySpent] = useState<number>(0);
  const [thisWeekSpent, setThisWeekSpent] = useState<number>(0);
  const [avgWeeklySpent, setAvgWeeklySpent] = useState<number>(0);
  const [highestWeek, setHighestWeek] = useState<string>('N/A');
  const [chartData, setChartData] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (!session?.user.id) return;

    const fetchAnalytics = async () => {
      // 1. Get Wallet ID
      const { data: walletData } = await supabase
        .from('wallets')
        .select('id')
        .eq('profile_id', session.user.id)
        .single();

      if (!walletData) return;
      const walletId = walletData.id;

      // 2. Fetch monthly transactions
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: monthlyTxs } = await supabase
        .from('transactions')
        .select('amount, type, created_at')
        .eq('wallet_id', walletId)
        .gte('created_at', firstDayOfMonth)
        .neq('type', 'topup');
        
      if (monthlyTxs) {
        const spent = monthlyTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
        setMonthlySpent(spent);

        const weeks = [0, 0, 0, 0];
        monthlyTxs.forEach((tx) => {
          const txDate = new Date(tx.created_at);
          const dayOfMonth = txDate.getDate();
          let weekIndex = Math.floor((dayOfMonth - 1) / 7);
          if (weekIndex > 3) weekIndex = 3;
          weeks[weekIndex] += Number(tx.amount);
        });

        // Calculate Insights
        const activeWeeksCount = weeks.filter(w => w > 0).length || 1;
        setAvgWeeklySpent(spent / activeWeeksCount);
        
        // Calculate Today's Spend
        const todayStr = new Date().toISOString().split('T')[0];
        const dailyTxs = monthlyTxs.filter(tx => tx.created_at.startsWith(todayStr));
        setTodaySpent(dailyTxs.reduce((sum, tx) => sum + Number(tx.amount), 0));

        // Calculate This Week's Spend (Starting from Sunday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);
        const thisWeekTxs = monthlyTxs.filter(tx => new Date(tx.created_at) >= startOfWeek);
        setThisWeekSpent(thisWeekTxs.reduce((sum, tx) => sum + Number(tx.amount), 0));
        
        let maxVal = -1;
        let maxIdx = 0;
        weeks.forEach((val, idx) => {
          if (val > maxVal) { maxVal = val; maxIdx = idx; }
        });
        setHighestWeek(`Week ${maxIdx + 1}`);

        setChartData([
          { label: 'Wk 1', value: weeks[0] },
          { label: 'Wk 2', value: weeks[1] },
          { label: 'Wk 3', value: weeks[2] },
          { label: 'Wk 4', value: weeks[3] },
        ]);
      }
    };

    fetchAnalytics();
  }, [session]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </HapticButton>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* FLOATING HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={[styles.badge]}>
            <ThemedText style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Spent This Month
            </ThemedText>
          </View>
          
          <ThemedText style={{ fontSize: 48, fontWeight: '800', color: colors.text, marginTop: 16, lineHeight: 56, letterSpacing: -1.5 }}>
            TZS {monthlySpent.toLocaleString()}
          </ThemedText>
        </View>

        {/* GLOWING LINE CHART */}
        <View style={styles.chartContainer}>
          {chartData.length > 0 ? (
            <AnalyticsChart data={chartData} height={220} />
          ) : (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
               <ThemedText style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No spending data for this month.</ThemedText>
            </View>
          )}
        </View>

        {/* MODERN INSIGHTS LIST */}
        <View style={styles.insightsSection}>
          <ThemedText style={styles.sectionTitle}>Insights</ThemedText>

          {/* Today's Spend */}
          <View style={styles.insightListItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.insightIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="today" size={24} color="#10B981" />
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }} numberOfLines={1}>Today's Spend</ThemedText>
                <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>Daily insight</ThemedText>
              </View>
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'right' }}>
              TZS {todaySpent.toLocaleString()}
            </ThemedText>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* This Week's Spend */}
          <View style={styles.insightListItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.insightIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Ionicons name="calendar" size={24} color="#8B5CF6" />
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }} numberOfLines={1}>This Week</ThemedText>
                <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>Weekly insight</ThemedText>
              </View>
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'right' }}>
              TZS {thisWeekSpent.toLocaleString()}
            </ThemedText>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          {/* Average Spend */}
          <View style={styles.insightListItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.insightIcon, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Ionicons name="calculator" size={24} color="#D4AF37" />
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }} numberOfLines={1}>Average Weekly</ThemedText>
                <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>Based on active weeks</ThemedText>
              </View>
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'right' }}>
              TZS {avgWeeklySpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </ThemedText>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Highest Spend */}
          <View style={styles.insightListItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.insightIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="flame" size={24} color="#F59E0B" />
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }} numberOfLines={1}>Highest Spend</ThemedText>
                <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>Peak expenditure</ThemedText>
              </View>
            </View>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'right' }}>
              {highestWeek}
            </ThemedText>
          </View>

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
  },
  backBtn: { padding: 4, alignSelf: 'flex-start' },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    
  },
  chartContainer: {
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.six,
  },
  insightsSection: {
    paddingHorizontal: Spacing.four,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  insightListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  insightIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
    opacity: 0.5,
  }
});
