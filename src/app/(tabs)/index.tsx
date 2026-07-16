import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme, ImageBackground, FlatList, Dimensions, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { PropertyCard, ShopItemCard } from '@/components/cards';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - Spacing.four * 2;

const SERVICES = [
  { id: '1', title: 'Pango', image: require('../../../assets/images/pango.png'), route: '/property/' },
  { id: '2', title: 'Usafi', image: require('../../../assets/images/usafi.png'), route: '/cleaning/' },
  { id: '3', title: 'Kuhama', image: require('../../../assets/images/kuhama.png'), route: '/relocation/' },
  { id: '4', title: 'Sokoni', image: require('../../../assets/images/sokoni.png'), route: '/market/' },
];

function ServiceCarousel({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  const router = useRouter();
  const colors = Colors[colorScheme];
  const flatListRef = React.useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = (currentIndex + 1) % SERVICES.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 4000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== currentIndex) {
      setCurrentIndex(roundIndex);
    }
  };

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={flatListRef}
        data={SERVICES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.carouselSlide}
            activeOpacity={0.9}
            onPress={() => router.push(item.route as any)}
          >
            <ImageBackground source={item.image} style={styles.carouselImage} imageStyle={{ borderRadius: 24 }}>
              <View style={styles.carouselOverlay}>
                <ThemedText style={{ fontWeight: '800', fontSize: 24, color: '#FFFFFF', marginBottom: 4 }}>{item.title}</ThemedText>
                <ThemedText style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Tap to explore services</ThemedText>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      />
      <View style={styles.pagination}>
        {SERVICES.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && [styles.activeDot, { backgroundColor: colors.primary }]]} />
        ))}
      </View>
    </View>
  );
}



export default function HomeTab() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { profile, session } = useAuth();
  
  const [recentActivity, setRecentActivity] = React.useState<any>(null);
  const [featuredProperties, setFeaturedProperties] = React.useState<any[]>([]);
  const [featuredSokoni, setFeaturedSokoni] = React.useState<any[]>([]);
  const [featuredUsafi, setFeaturedUsafi] = React.useState<any[]>([]);
  const [featuredKariakoo, setFeaturedKariakoo] = React.useState<any[]>([]);

  const [refreshing, setRefreshing] = useState(false);

  const fetchAllData = async () => {
    if (!session?.user.id) return;
    
    // Fetch Recent Activity
    const { data: activityData } = await supabase
      .from('bookings')
      .select('*')
      .eq('profile_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (activityData) setRecentActivity(activityData);

    // Fetch Properties
    const { data: propData } = await supabase.from('properties').select('*').eq('status', 'vacant').limit(3);
    if (propData) setFeaturedProperties(propData);

    // Fetch Marketplace Items
    const [{ data: sokoni }, { data: usafi }, { data: kariakoo }] = await Promise.all([
      supabase.from('sokoni_items').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('usafi_services').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('kariakoo_items').select('*').order('created_at', { ascending: false }).limit(5)
    ]);
    if (sokoni) setFeaturedSokoni(sokoni);
    if (usafi) setFeaturedUsafi(usafi);
    if (kariakoo) setFeaturedKariakoo(kariakoo);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [session])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >

        {/* AUTO-PLAYING SERVICE CAROUSEL */}
        <ServiceCarousel colorScheme={colorScheme} />

        {/* HOT & NEW PROPERTIES */}
        <View style={styles.sectionHeader}>
          <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Hot & New Pango</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.propertyScroll}>
          {featuredProperties.length > 0 ? (
            featuredProperties.map((prop) => <PropertyCard key={prop.id} property={prop} colorScheme={colorScheme} />)
          ) : (
            <ThemedText style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No properties available right now.</ThemedText>
          )}
        </ScrollView>

        {/* HOT & NEW SOKONI */}
        {featuredSokoni.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Hot & New Sokoni</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.propertyScroll}>
              {featuredSokoni.map((item) => (
                <ShopItemCard key={item.id} item={{...item, image: require('../../../assets/images/sokoni.png')}} colorScheme={colorScheme} type="sokoni" />
              ))}
            </ScrollView>
          </>
        )}

        {/* HOT & NEW USAFI */}
        {featuredUsafi.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Hot & New Usafi</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.propertyScroll}>
              {featuredUsafi.map((item) => (
                <ShopItemCard key={item.id} item={{...item, image: require('../../../assets/images/usafi.png')}} colorScheme={colorScheme} type="usafi" />
              ))}
            </ScrollView>
          </>
        )}

        {/* HOT & NEW KARIAKOO */}
        {featuredKariakoo.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Hot & New Kariakoo</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.propertyScroll}>
              {featuredKariakoo.map((item) => (
                <ShopItemCard key={item.id} item={{...item, image: require('../../../assets/images/kuhama.png')}} colorScheme={colorScheme} type="kariakoo" />
              ))}
            </ScrollView>
          </>
        )}

        {/* RECENT ACTIVITY */}
        <View style={styles.sectionHeader}>
          <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Recent Activity</ThemedText>
        </View>
        
        {recentActivity ? (
          <View style={[styles.activityCard, { backgroundColor: colors.backgroundElement }]}>
            <View style={[styles.activityIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="calendar-outline" color="#3B82F6" size={20} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <ThemedText style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                {recentActivity.service_type.charAt(0).toUpperCase() + recentActivity.service_type.slice(1)} Booking
              </ThemedText>
              <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                {new Date(recentActivity.scheduled_date).toLocaleString()}
              </ThemedText>
            </View>
            <View style={[styles.payBtn, { backgroundColor: colors.backgroundSelected }]}>
              <ThemedText style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>{recentActivity.status}</ThemedText>
            </View>
          </View>
        ) : (
          <View style={[styles.activityCard, { backgroundColor: colors.backgroundElement, flexDirection: 'column' }]}>
             <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', width: '100%', paddingVertical: 12 }}>
               No recent activity.
             </ThemedText>
             <TouchableOpacity 
               style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 8 }}
               onPress={async () => {
                 const { error } = await supabase.from('bookings').insert({
                   profile_id: session.user.id,
                   service_type: 'cleaning',
                   status: 'confirmed',
                   scheduled_date: new Date().toISOString(),
                   amount: 30000
                 });
                 
                 if (error) {
                   alert('Database Error! Did you run setup_database.sql in Supabase? Details: ' + error.message);
                 } else {
                   alert('Test Booking Created! Please reload the app (Press "r" in terminal).');
                 }
               }}
             >
                <ThemedText style={{ color: '#000', fontWeight: '700' }}>Generate Test Booking</ThemedText>
             </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },

  carouselContainer: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  carouselSlide: {
    width: CAROUSEL_WIDTH,
    height: 220,
    marginHorizontal: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  carouselImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  carouselOverlay: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activeDot: {
    width: 20,
    height: 6,
    borderRadius: 3,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  propertyScroll: {
    paddingHorizontal: Spacing.four,
    gap: 16,
  },
  propertyCard: {
    width: 280,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 160,
  },
  shopCard: {
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  shopImage: {
    width: '100%',
    height: 110,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },

  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    padding: 16,
    borderRadius: 20,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  }
});
