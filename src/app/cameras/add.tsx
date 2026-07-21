import React, { useState } from 'react';
import { StyleSheet, View, useColorScheme, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { HapticButton } from '@/components/HapticButton';

// A default public HLS stream (Big Buck Bunny) for demo purposes
const DEFAULT_STREAM_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

export default function AddCameraScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [name, setName] = useState('');
  const [streamUrl, setStreamUrl] = useState(DEFAULT_STREAM_URL);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !streamUrl) {
      alert('Please fill out all fields');
      return;
    }

    setSaving(true);
    try {
      const stored = await AsyncStorage.getItem('@nyumbani_cameras');
      const cameras = stored ? JSON.parse(stored) : [];
      
      const newCamera = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        streamUrl,
        createdAt: new Date().toISOString()
      };

      cameras.push(newCamera);
      await AsyncStorage.setItem('@nyumbani_cameras', JSON.stringify(cameras));
      
      hapticSuccess();
      router.back();
    } catch (e) {
      alert('Error saving camera');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Link Camera</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <ThemedText style={{ flex: 1, marginLeft: 12, fontSize: 13, color: colors.text, lineHeight: 20 }}>
            Enter your IP Camera's stream URL (HLS or MP4). If you don't have one, you can use the default sample video URL provided below to test the feature!
          </ThemedText>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Camera Location / Name</ThemedText>
          <TextInput 
            style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]} 
            value={name} 
            onChangeText={setName} 
            placeholder="e.g. Living Room, Front Door" 
            placeholderTextColor={colors.textSecondary} 
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Stream URL</ThemedText>
          <TextInput 
            style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]} 
            value={streamUrl} 
            onChangeText={setStreamUrl} 
            placeholder="http://..." 
            placeholderTextColor={colors.textSecondary} 
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <HapticButton 
          hapticType="heavy"
          style={[styles.postBtn, { backgroundColor: colors.primary, opacity: (!name || !streamUrl) ? 0.5 : 1 }]} 
          onPress={handleSave} 
          disabled={saving || !name || !streamUrl}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Save Camera</ThemedText>
          )}
        </HapticButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  scrollContent: { padding: Spacing.four },
  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 16, borderRadius: 12, marginBottom: Spacing.six, alignItems: 'center' },
  inputContainer: { marginBottom: Spacing.five },
  textInput: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  postBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.four }
});
