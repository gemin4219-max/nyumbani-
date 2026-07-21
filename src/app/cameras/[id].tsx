import React, { useState, useEffect } from 'react';
import { StyleSheet, View, useColorScheme, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { HapticButton } from '@/components/HapticButton';

const { width } = Dimensions.get('window');

export default function CameraViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [camera, setCamera] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadCamera = async () => {
      try {
        const stored = await AsyncStorage.getItem('@nyumbani_cameras');
        if (stored) {
          const cameras = JSON.parse(stored);
          const found = cameras.find((c: any) => c.id === id);
          if (found) setCamera(found);
          else setError(true);
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadCamera();
  }, [id]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
          {camera ? camera.name : 'Loading...'}
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
        ) : error || !camera ? (
          <ThemedText style={{ color: colors.textSecondary, marginTop: 40 }}>Camera not found.</ThemedText>
        ) : (
          <View style={styles.videoContainer}>
            <View style={styles.videoWrapper}>
              <Video
                style={styles.video}
                source={{ uri: camera.streamUrl }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay
                onError={(e) => {
                  console.error("Video Error:", e);
                  setError(true);
                }}
              />
            </View>
            <View style={[styles.statusBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.pulseDot, { backgroundColor: '#10B981' }]} />
                <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 8 }}>Live Feed Active</ThemedText>
              </View>
              <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                Connected to {camera.streamUrl}
              </ThemedText>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  content: { flex: 1, alignItems: 'center' },
  videoContainer: { width: '100%', alignItems: 'center' },
  videoWrapper: { width: width, height: width * (9/16), backgroundColor: '#000', marginTop: Spacing.four },
  video: { flex: 1 },
  statusBox: { width: width - Spacing.four * 2, padding: 16, borderRadius: 16, borderWidth: 1, marginTop: Spacing.six },
  pulseDot: { width: 10, height: 10, borderRadius: 5 }
});
