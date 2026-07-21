import { Tabs } from 'expo-router';
import { useColorScheme, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { hapticMedium, hapticHeavy } from '@/lib/haptics';

import { Colors } from '@/constants/theme';
import { useCart } from '@/providers/CartProvider';
import { ThemedText } from '@/components/themed-text';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { itemCount } = useCart();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: colors.background,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerTintColor: colors.text,
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            onPress={(e) => { hapticMedium(); props.onPress?.(e); }}
          />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Activity',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="list-outline" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="wallet-outline" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" color={color} size={24} />
          ),
        }}
      />
      </Tabs>
      
      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <TouchableOpacity 
        onPress={() => { hapticHeavy(); router.push('/cart'); }}
          style={{
          position: 'absolute',
          bottom: 100, // Above the tab bar
          right: 20,
          backgroundColor: colors.primary,
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
          zIndex: 999
        }}
      >
        <Ionicons name="cart" size={28} color="#000" />
        {itemCount > 0 && (
          <View style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: '#EF4444',
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.background
          }}>
            <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>{itemCount}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
