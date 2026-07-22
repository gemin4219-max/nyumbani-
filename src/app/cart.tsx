import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { hapticHeavy, hapticMedium, hapticLight, hapticError, hapticSuccess } from '@/lib/haptics';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useCart } from '@/providers/CartProvider';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function CartScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  
  const { items, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { session, profile, refreshProfile } = useAuth();
  
  const [checkingOut, setCheckingOut] = useState(false);
  const [address, setAddress] = useState(profile?.address || '');
  const [contactPhone, setContactPhone] = useState(profile?.phone_number || '');

  const handleCheckout = async () => {
    if (items.length === 0) return;

    Alert.alert(
      "Confirm Checkout",
      `Total Cost: TZS ${cartTotal.toLocaleString()}\nThis will be deducted from your wallet.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            if (!address.trim()) {
              hapticError();
              Alert.alert("Required", "Please provide a delivery address.");
              return;
            }
            if (!contactPhone.trim()) {
              hapticError();
              Alert.alert("Required", "Please provide a contact phone number.");
              return;
            }

            setCheckingOut(true);
            
            // 1. Check if user has enough balance
            const currentBalance = profile?.wallet_balance || 0;
            if (currentBalance < cartTotal) {
              Alert.alert("Insufficient Funds", "Please top up your wallet to complete this purchase.");
              setCheckingOut(false);
              return;
            }

            // 2. Deduct balance
            const newBalance = currentBalance - cartTotal;
            const { error: walletError } = await supabase
              .from('profiles')
              .update({ wallet_balance: newBalance })
              .eq('id', session?.user.id);
            
            if (walletError) {
              Alert.alert("Error", "Failed to deduct wallet balance.");
              setCheckingOut(false);
              return;
            }

            // 3. Create a booking/transaction record
            const orderItems = items.map(item => `${item.quantity}x ${item.title} (TZS ${item.price})`).join('\n');
            const finalNotes = `Delivery Address: ${address}\nContact Phone: ${contactPhone}\n\nOrder Details:\n${orderItems}`;

            const { error: bookingError } = await supabase
              .from('bookings')
              .insert({
                profile_id: session?.user.id,
                service_type: 'market',
                status: 'paid',
                scheduled_date: new Date().toISOString(),
                amount: cartTotal,
                notes: finalNotes
              });

            if (bookingError) {
              // Note: In a real app we'd want a transaction to rollback the wallet deduction if this fails
              console.error("Booking error:", bookingError);
            }

            // Refresh profile to get new balance
            await refreshProfile();
            
            setCheckingOut(false);
            clearCart();

            Alert.alert("Success!", "Your order has been placed successfully.", [
              { text: "OK", onPress: () => { hapticSuccess(); router.push('/(tabs)'); } }
            ]);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { hapticMedium(); router.back(); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Your Cart</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="cart-outline" size={64} color={colors.textSecondary} />
          <ThemedText style={{ marginTop: 16, color: colors.textSecondary, fontSize: 16 }}>Your cart is empty.</ThemedText>
          <TouchableOpacity onPress={() => { hapticMedium(); router.back(); }} style={[styles.continueBtn]}>
            <ThemedText style={{ color: colors.text, fontWeight: '600' }}>Continue Shopping</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {items.map(item => (
              <View key={item.id} style={[styles.cartItem]}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="pricetag" size={24} color={colors.textSecondary} />
                  </View>
                )}
                
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <ThemedText style={{ fontWeight: '700', fontSize: 16, color: colors.text }} numberOfLines={1}>{item.title}</ThemedText>
                  <ThemedText style={{ color: colors.primary, fontWeight: '600', marginTop: 4 }}>
                    TZS {item.price.toLocaleString()} <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>/ {item.unit}</ThemedText>
                  </ThemedText>
                  
                  <View style={styles.quantityControl}>
                    <TouchableOpacity onPress={() => { hapticLight(); updateQuantity(item.id, item.quantity - 1); }} style={[styles.qBtn, { backgroundColor: colors.background }]}>
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText style={{ width: 32, textAlign: 'center', fontWeight: '600', color: colors.text }}>{item.quantity}</ThemedText>
                    <TouchableOpacity onPress={() => { hapticLight(); updateQuantity(item.id, item.quantity + 1); }} style={[styles.qBtn, { backgroundColor: colors.background }]}>
                      <Ionicons name="add" size={16} color={colors.text} />
                    </TouchableOpacity>
                    
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity onPress={() => { hapticError(); removeFromCart(item.id); }}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <View style={[styles.checkoutForm]}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Delivery Address</ThemedText>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                placeholder="Where should we deliver this?"
                placeholderTextColor={colors.textSecondary}
                value={address}
                onChangeText={setAddress}
              />
              
              <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 12 }}>Contact Phone Number</ThemedText>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                placeholder="e.g. 07XXXXXXXX"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={contactPhone}
                onChangeText={setContactPhone}
              />
            </View>
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: colors.backgroundElement, borderTopColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 16 }}>Total</ThemedText>
              <ThemedText style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>TZS {cartTotal.toLocaleString()}</ThemedText>
            </View>

            <TouchableOpacity 
              style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
              onPress={() => { hapticHeavy(); handleCheckout(); }}
              disabled={checkingOut}
            >
              {checkingOut ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Ionicons name="wallet-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Pay & Checkout</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  scrollContent: { padding: Spacing.four },
  
  continueBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  
  cartItem: { flexDirection: 'row', padding: 12, borderRadius: 16,  marginBottom: 12 },
  itemImage: { width: 80, height: 80, borderRadius: 12 },
  
  quantityControl: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  qBtn: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  
  checkoutForm: { padding: 16, borderRadius: 16,  marginTop: Spacing.two, marginBottom: Spacing.four },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 15 },

  footer: { padding: Spacing.four, paddingBottom: Spacing.six, borderTopWidth: 1 },
  checkoutBtn: { height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }
});
