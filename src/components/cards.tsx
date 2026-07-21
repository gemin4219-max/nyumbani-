import React from 'react';
import { View, ImageBackground, StyleSheet, Linking } from 'react-native';
import { HapticButton } from '@/components/HapticButton';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { hapticHeavy, hapticMedium, hapticSuccess } from '@/lib/haptics';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useCart } from '@/providers/CartProvider';

export function PropertyCard({ property, colorScheme, fullWidth }: any) {
  const colors = Colors[colorScheme];
  const router = useRouter();
  
  return (
    <HapticButton 
      hapticType="selection"
      activeOpacity={0.9} 
      onPress={() => { hapticMedium(); router.push(`/property/${property.id}`); }}
      style={[
        styles.propertyCard, 
        { backgroundColor: colors.backgroundElement, borderColor: colors.border },
        fullWidth && { width: '100%', marginRight: 0 }
      ]}
    >
      <ImageBackground source={property.image_url ? { uri: property.image_url } : require('../../assets/images/pango.png')} style={styles.propertyImage} imageStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
        <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
           <ThemedText style={{ color: '#FFF', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Vacant</ThemedText>
        </View>
      </ImageBackground>
      <View style={{ padding: 16 }}>
        <ThemedText style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {property.title}
        </ThemedText>
        <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
          <Ionicons name="location-outline" size={12} /> {property.address}
        </ThemedText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <ThemedText style={{ fontSize: 15, fontWeight: '700', color: colors.primary }} numberOfLines={1}>
              TZS {Number(property.price).toLocaleString()} <ThemedText style={{ fontSize: 12, fontWeight: '400', color: colors.textSecondary }}>/ mo</ThemedText>
            </ThemedText>
          </View>
          <HapticButton hapticType="heavy"
            onPress={() => { hapticHeavy(); router.push(`/book/viewing?amount=0&propertyId=${property.id}&propertyTitle=${encodeURIComponent(property.title)}`); }}
            style={{ backgroundColor: colors.backgroundSelected, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
             <Ionicons name="calendar-outline" color={colors.primary} size={16} />
             <ThemedText style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginLeft: 6 }}>View</ThemedText>
          </HapticButton>
        </View>
      </View>
    </HapticButton>
  );
}

export function ShopItemCard({ item, colorScheme, type }: any) {
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { addToCart, items } = useCart();
  
  const cartItem = items.find(i => i.id === item.id);

  const handleAddToCart = () => {
    hapticSuccess();
    addToCart({
      id: item.id,
      type: type,
      title: item.title,
      price: item.price,
      unit: item.unit,
      image_url: item.image_url
    });
  };

  return (
    <HapticButton hapticType="selection"
      activeOpacity={0.9} 
      style={[styles.shopCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
    >
      <ImageBackground source={item.image_url ? { uri: item.image_url } : item.image} style={styles.shopImage} imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        {item.badge_text && (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
             <ThemedText style={{ color: '#000', fontSize: 10, fontWeight: '700' }}>{item.badge_text}</ThemedText>
          </View>
        )}
      </ImageBackground>
      <View style={{ padding: 12 }}>
        <ThemedText style={{ fontSize: 15, fontWeight: '700', color: colors.text }} numberOfLines={1}>{item.title}</ThemedText>
        <ThemedText style={{ fontSize: 14, fontWeight: '800', color: colors.primary, marginTop: 8 }}>
          TZS {item.price.toLocaleString()} <ThemedText style={{ fontSize: 12, fontWeight: '400', color: colors.textSecondary }}>/ {item.unit}</ThemedText>
        </ThemedText>
        {type === 'usafi' || type === 'relocation' ? (
          <HapticButton hapticType="heavy" onPress={() => router.push(`/book/${type}?amount=${item.price}`)} style={[styles.addToCartBtn, { backgroundColor: colors.backgroundSelected, marginTop: 12 }]}>
             <Ionicons name="calendar-outline" color={colors.primary} size={16} />
             <ThemedText style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginLeft: 4 }}>Book Now</ThemedText>
          </HapticButton>
        ) : (
          <HapticButton hapticType="success" onPress={handleAddToCart} style={[styles.addToCartBtn, { backgroundColor: cartItem ? colors.primary : colors.backgroundSelected, marginTop: 12 }]}>
             <Ionicons name={cartItem ? "checkmark" : "cart-outline"} color={cartItem ? "#000" : colors.primary} size={16} />
             <ThemedText style={{ fontSize: 12, fontWeight: '700', color: cartItem ? "#000" : colors.text, marginLeft: 4 }}>
               {cartItem ? `Added (${cartItem.quantity})` : 'Add'}
             </ThemedText>
          </HapticButton>
        )}
      </View>
    </HapticButton>
  );
}

export function ShopItemCardFullWidth({ item, colorScheme, type }: any) {
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { addToCart, items } = useCart();
  
  const cartItem = items.find(i => i.id === item.id);

  const handleAddToCart = () => {
    addToCart({
      id: item.id,
      type: type,
      title: item.title,
      price: item.price,
      unit: item.unit,
      image_url: item.image_url
    });
  };

  return (
    <HapticButton hapticType="selection"
      activeOpacity={0.9} 
      style={[styles.shopCardFull, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
    >
      {item.image_url ? (
        <ImageBackground source={{ uri: item.image_url }} style={styles.shopImageFull} imageStyle={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} />
      ) : (
        <ImageBackground source={item.image} style={styles.shopImageFull} imageStyle={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} />
      )}
      
      <View style={{ padding: 12, flex: 1, justifyContent: 'center' }}>
        <ThemedText style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>{item.title}</ThemedText>
        <ThemedText style={{ fontSize: 14, fontWeight: '800', color: colors.primary, marginTop: 4 }}>
          TZS {item.price.toLocaleString()} <ThemedText style={{ fontSize: 12, fontWeight: '400', color: colors.textSecondary }}>/ {item.unit}</ThemedText>
        </ThemedText>
        
        {type === 'usafi' || type === 'relocation' ? (
          <HapticButton hapticType="heavy" onPress={() => router.push(`/book/${type}?amount=${item.price}`)} style={[styles.addToCartBtn, { backgroundColor: colors.backgroundSelected, marginTop: 12 }]}>
             <Ionicons name="calendar-outline" color={colors.primary} size={16} />
             <ThemedText style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginLeft: 4 }}>Book Now</ThemedText>
          </HapticButton>
        ) : (
          <HapticButton hapticType="success" onPress={handleAddToCart} style={[styles.addToCartBtn, { backgroundColor: cartItem ? colors.primary : colors.backgroundSelected, marginTop: 12 }]}>
             <Ionicons name={cartItem ? "checkmark" : "cart-outline"} color={cartItem ? "#000" : colors.primary} size={16} />
             <ThemedText style={{ fontSize: 12, fontWeight: '700', color: cartItem ? "#000" : colors.text, marginLeft: 4 }}>
               {cartItem ? `Added (${cartItem.quantity})` : 'Add to Cart'}
             </ThemedText>
          </HapticButton>
        )}
      </View>
    </HapticButton>
  );
}

const styles = StyleSheet.create({
  propertyCard: { width: 280, marginRight: 16, borderRadius: 20, borderWidth: 1 },
  propertyImage: { width: '100%', height: 180 },
  shopCard: { width: 160, marginRight: 16, borderRadius: 16, borderWidth: 1 },
  shopImage: { width: '100%', height: 120 },
  addToCartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  
  shopCardFull: { flexDirection: 'row', marginBottom: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  shopImageFull: { width: 120, height: 120 }
});
