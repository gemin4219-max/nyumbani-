import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ImageBackground, Dimensions, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { HapticButton } from '@/components/HapticButton';
import { hapticMedium, hapticSuccess, hapticHeavy } from '@/lib/haptics';
import { useCart } from '@/providers/CartProvider';
import { SkeletonLoader } from '@/components/SkeletonLoader';

const { width } = Dimensions.get('window');

function getTableName(type: string) {
  switch (type) {
    case 'sokoni': return 'sokoni_items';
    case 'kariakoo': return 'kariakoo_items';
    case 'gas': return 'gas_items';
    case 'usafi': return 'usafi_services';
    default: return null;
  }
}

export default function ProductDetailsScreen() {
  const { id, type } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  
  const { addToCart, items } = useCart();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id, type]);

  const fetchProduct = async () => {
    const tableName = getTableName(type as string);
    if (!tableName) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
      
    if (data) {
      setProduct(data);
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    hapticSuccess();
    addToCart({
      id: product.id,
      type: type as string,
      title: product.title,
      price: product.price,
      unit: product.unit,
      image_url: product.image_url
    });
  };

  const cartItem = items.find(i => i.id === id);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
         <View style={styles.header}>
            <HapticButton onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </HapticButton>
         </View>
         <View style={{ padding: Spacing.four }}>
            <SkeletonLoader width={width - 32} height={300} borderRadius={24} />
            <SkeletonLoader width={200} height={32} style={{ marginTop: 24 }} />
            <SkeletonLoader width={100} height={24} style={{ marginTop: 8 }} />
            <SkeletonLoader width={width - 32} height={100} style={{ marginTop: 24 }} />
         </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
         <View style={styles.header}>
            <HapticButton onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </HapticButton>
         </View>
         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText style={{ color: colors.textSecondary }}>Product not found.</ThemedText>
         </View>
      </SafeAreaView>
    );
  }

  const isService = type === 'usafi' || type === 'relocation';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Image */}
        <ImageBackground 
          source={product.image_url ? { uri: product.image_url } : require('../../../assets/images/sokoni.png')} 
          style={styles.heroImage}
        >
           <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
              <HapticButton onPress={() => router.back()} style={styles.heroBackBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </HapticButton>
           </SafeAreaView>
           
           {product.badge_text && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                 <ThemedText style={{ color: '#000', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
                   {product.badge_text}
                 </ThemedText>
              </View>
           )}
        </ImageBackground>

        {/* Content */}
        <View style={styles.content}>
          <ThemedText style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>
            {product.title}
          </ThemedText>
          
          <ThemedText style={{ fontSize: 20, fontWeight: '800', color: colors.primary, marginTop: 8 }}>
            TZS {Number(product.price).toLocaleString()} 
            {product.unit && <ThemedText style={{ fontSize: 16, fontWeight: '400', color: colors.textSecondary }}> / {product.unit}</ThemedText>}
          </ThemedText>

          {/* Description */}
          {product.description ? (
             <View style={styles.section}>
               <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Description</ThemedText>
               <ThemedText style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }}>
                 {product.description}
               </ThemedText>
             </View>
          ) : null}

          {/* Features */}
          {product.features && product.features.length > 0 ? (
             <View style={styles.section}>
               <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Features</ThemedText>
               <View style={styles.featuresList}>
                 {product.features.map((feat: string, idx: number) => (
                   <View key={idx} style={[styles.featureItem]}>
                     <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                     <ThemedText style={{ fontSize: 15, color: colors.text, marginLeft: 8 }}>{feat}</ThemedText>
                   </View>
                 ))}
               </View>
             </View>
          ) : null}
          
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
         {isService ? (
            <HapticButton 
              hapticType="heavy" 
              onPress={() => router.push(`/book/${type}?amount=${product.price}`)} 
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
               <Ionicons name="calendar-outline" color="#000" size={20} />
               <ThemedText style={{ fontSize: 16, fontWeight: '800', color: '#000', marginLeft: 8 }}>Book Now</ThemedText>
            </HapticButton>
         ) : (
            <HapticButton 
              hapticType="success" 
              onPress={handleAddToCart} 
              style={[styles.primaryBtn, { backgroundColor: cartItem ? colors.backgroundSelected : colors.primary }]}
            >
               <Ionicons name={cartItem ? "checkmark" : "cart-outline"} color={cartItem ? colors.primary : "#000"} size={20} />
               <ThemedText style={{ fontSize: 16, fontWeight: '800', color: cartItem ? colors.primary : "#000", marginLeft: 8 }}>
                 {cartItem ? `Added to Cart (${cartItem.quantity})` : 'Add to Cart'}
               </ThemedText>
            </HapticButton>
         )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { padding: Spacing.four },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: 'rgba(128,128,128,0.1)' },
  
  heroImage: { width: '100%', height: 350, justifyContent: 'space-between' },
  heroSafeArea: { paddingHorizontal: Spacing.four },
  heroBackBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)' },
  badge: { position: 'absolute', bottom: 16, left: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  
  content: { padding: Spacing.four, marginTop: Spacing.two },
  section: { marginTop: Spacing.six },
  
  featuresList: { gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.four, paddingBottom: Spacing.six },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16 }
});
