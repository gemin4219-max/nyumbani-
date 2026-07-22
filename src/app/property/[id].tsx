import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme, ImageBackground, Dimensions, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  const [property, setProperty] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (id === 'dummy') {
      setProperty({
        id: 'dummy',
        title: 'Masaki Luxury Villa',
        address: 'Masaki, Dar es Salaam',
        price: '2500000',
        description: 'Experience ultimate luxury in this beautiful Masaki villa. Featuring 4 spacious bedrooms, a private pool, modern kitchen, and 24/7 security. Perfect for families looking for comfort and elegance in a prime location.',
        status: 'vacant'
      });
      setLoading(false);
      return;
    }

    const fetchProperty = async () => {
      const { data } = await supabase.from('properties').select('*').eq('id', id).single();
      if (data) {
        setProperty(data);
      }
      setLoading(false);
    };

    if (id) fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText style={{ color: colors.text }}>Loading Details...</ThemedText>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText style={{ color: colors.text }}>Property not found.</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
           <ThemedText style={{ color: colors.primary }}>Go Back</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HEADER IMAGE */}
        <ImageBackground 
          source={property.image_url ? { uri: property.image_url } : require('../../../assets/images/pango.png')} 
          style={styles.headerImage}
        >
          <View style={styles.imageOverlay}>
            <SafeAreaHeader router={router} colors={colors} />
            <View style={{ flex: 1 }} />
            <View style={styles.statusBadge}>
              <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
                {property.status}
              </ThemedText>
            </View>
          </View>
        </ImageBackground>

        {/* DETAILS SECTION */}
        <View style={[styles.detailsContainer, { backgroundColor: colors.background }]}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{property.title}</ThemedText>
              <ThemedText style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6 }}>
                <Ionicons name="location-outline" size={14} /> {property.address}
              </ThemedText>
            </View>
            <TouchableOpacity style={[styles.bookmarkBtn, { backgroundColor: colors.backgroundElement }]}>
               <Ionicons name="bookmark-outline" color={colors.text} size={20} />
            </TouchableOpacity>
          </View>

          <View style={[styles.priceCard]}>
            <ThemedText style={{ fontSize: 14, color: colors.textSecondary }}>Rent Price</ThemedText>
            <ThemedText style={{ fontSize: 24, fontWeight: '800', color: colors.primary, marginTop: 4 }}>
              TZS {Number(property.price).toLocaleString()} <ThemedText style={{ fontSize: 14, fontWeight: '400', color: colors.textSecondary }}>/ month</ThemedText>
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Description</ThemedText>
            <ThemedText style={{ fontSize: 15, lineHeight: 24, color: colors.textSecondary, marginTop: 12 }}>
              {property.description || 'No description provided for this property.'}
            </ThemedText>
          </View>
          
          <View style={styles.section}>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Features</ThemedText>
            <View style={styles.featuresGrid}>
              <FeatureItem icon="bed-outline" label="3 Beds" colors={colors} />
              <FeatureItem icon="water-outline" label="2 Baths" colors={colors} />
              <FeatureItem icon="car-outline" label="Parking" colors={colors} />
              <FeatureItem icon="wifi-outline" label="Wi-Fi" colors={colors} />
            </View>
          </View>
        </View>

      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
         <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]} 
            activeOpacity={0.8}
            onPress={() => {
              router.push(`/book/viewing?amount=0&propertyId=${property.id}&propertyTitle=${encodeURIComponent(property.title)}`);
            }}
         >
            <ThemedText style={{ fontSize: 16, fontWeight: '700', color: '#000' }}>Book Viewing</ThemedText>
         </TouchableOpacity>
      </View>
    </View>
  );
}

function SafeAreaHeader({ router, colors }: any) {
  return (
    <View style={styles.safeHeader}>
       <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
       </TouchableOpacity>
    </View>
  )
}

function FeatureItem({ icon, label, colors }: any) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <ThemedText style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 8 }}>{label}</ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImage: {
    width: width,
    height: 350,
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: Spacing.four,
  },
  safeHeader: {
    marginTop: 50, // Safe area top margin approx
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailsContainer: {
    padding: Spacing.four,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.two,
  },
  bookmarkBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceCard: {
    marginTop: Spacing.five,
    padding: Spacing.four,
    borderRadius: 20,
    
  },
  section: {
    marginTop: Spacing.six,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: Spacing.four,
  },
  featureItem: {
    width: (width - Spacing.four * 2 - 12 * 3) / 4,
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
