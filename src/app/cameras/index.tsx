import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, useColorScheme, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticMedium, hapticHeavy, hapticSelection } from '@/lib/haptics';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { HapticButton } from '@/components/HapticButton';

export default function CamerasHubScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [cameras, setCameras] = useState<any[]>([]);

  const loadCameras = async () => {
    try {
      const stored = await AsyncStorage.getItem('@nyumbani_cameras');
      if (stored) {
        setCameras(JSON.parse(stored));
      } else {
        setCameras([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCameras();
    }, [])
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remove Camera', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            hapticHeavy();
            const updated = cameras.filter(c => c.id !== id);
            setCameras(updated);
            await AsyncStorage.setItem('@nyumbani_cameras', JSON.stringify(updated));
          } catch (e) {}
        } 
      }
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Smart Home</ThemedText>
        <HapticButton onPress={() => router.push('/cameras/add')} style={styles.backBtn}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </HapticButton>
      </View>

      <FlatList
        data={cameras}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingBottom: Spacing.four }}>
            <ThemedText style={{ fontSize: 32, fontWeight: '800', color: colors.text, lineHeight: 36 }}>Your Cameras.</ThemedText>
            <ThemedText style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8, lineHeight: 22 }}>Monitor your home securely.</ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40, padding: 20, borderRadius: 20, backgroundColor: colors.backgroundElement, borderWidth: 1 }}>
            <Ionicons name="videocam-off-outline" size={48} color={colors.textSecondary} />
            <ThemedText style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.text }}>No cameras linked</ThemedText>
            <ThemedText style={{ marginTop: 8, textAlign: 'center', color: colors.textSecondary }}>Link your IP cameras to view live feeds right from the Nyumbani app.</ThemedText>
            <HapticButton 
              hapticType="heavy" 
              onPress={() => router.push('/cameras/add')} 
              style={{ marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            >
              <ThemedText style={{ color: '#000', fontWeight: '700' }}>Link a Camera</ThemedText>
            </HapticButton>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => { hapticSelection(); router.push(`/cameras/${item.id}`); }}
            style={[styles.cameraCard]}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Ionicons name="videocam" size={24} color="#D4AF37" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{item.name}</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 }} />
                  <ThemedText style={{ fontSize: 13, color: colors.textSecondary }}>Online</ThemedText>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  scrollContent: { paddingTop: Spacing.two, paddingBottom: 100, paddingHorizontal: Spacing.four },
  cameraCard: { borderRadius: 16,  marginBottom: 16 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }
});
