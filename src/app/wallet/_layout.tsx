import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function WalletLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      presentation: 'modal',
      animation: 'slide_from_bottom',
      contentStyle: { backgroundColor: colors.background }
    }}>
      <Stack.Screen name="transfer" />
      <Stack.Screen name="withdraw" />
      <Stack.Screen name="topup" />
      <Stack.Screen name="luku" />
      <Stack.Screen name="water" />
      {/* Analytics and Transactions might still feel better as standard pages, but we'll include them here for now */}
      <Stack.Screen name="transactions" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}
