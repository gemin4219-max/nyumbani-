import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { CartProvider } from '@/providers/CartProvider';
import AnimatedSplashScreen from '@/components/AnimatedSplashScreen';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';

function RootLayoutNav() {
  const { isInitialized, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to the login page.
      router.replace('/(auth)/login');
    } else if (session && (inAuthGroup || segments.length === 0 || segments[0] === 'index')) {
      router.replace('/(tabs)/');
    }
  }, [isInitialized, session, segments]);

  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Stack screenOptions={{ 
      headerShown: false, 
      contentStyle: { backgroundColor: colors.background },
      animation: 'slide_from_right',
      presentation: 'card'
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="property/index" />
      <Stack.Screen name="cleaning/index" />
      <Stack.Screen name="relocation/index" />
      <Stack.Screen name="market/index" />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const customDarkTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: colors.background, card: colors.background, border: 'transparent' },
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.background, card: colors.background, border: 'transparent' },
  };

  return (
    <ThemeProvider value={scheme === 'dark' ? customDarkTheme : customLightTheme}>
      <AuthProvider>
        <CartProvider>
          <RootLayoutNav />
          <AnimatedSplashScreen />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
