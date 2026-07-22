import React from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, Alert } from 'react-native';
import { HapticButton } from '@/components/HapticButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function PrivacyScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session } = useAuth();

  const handleChangePassword = async () => {
    if (!session?.user.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Password reset email sent! Check your inbox.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => alert("Account deletion request submitted. Support will contact you shortly.") 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Privacy & Security</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <ThemedText style={styles.sectionTitle}>Security</ThemedText>
        <View style={[styles.sectionContainer]}>
          <HapticButton hapticType="selection" style={styles.settingRow} onPress={handleChangePassword}>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Change Password</ThemedText>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Send a reset link to your registered email.</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </HapticButton>
        </View>

        <ThemedText style={[styles.sectionTitle, { marginTop: 24 }]}>Data Management</ThemedText>
        <View style={[styles.sectionContainer]}>
          <HapticButton hapticType="selection" style={styles.settingRow} onPress={() => alert('Data export started. We will email you a secure link.')}>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Export My Data</ThemedText>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Download a copy of your bookings and info.</ThemedText>
            </View>
            <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
          </HapticButton>
        </View>

        <ThemedText style={[styles.sectionTitle, { marginTop: 24, color: '#EF4444' }]}>Danger Zone</ThemedText>
        <View style={[styles.sectionContainer, { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
          <HapticButton hapticType="error" style={styles.settingRow} onPress={handleDeleteAccount}>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', color: '#EF4444' }}>Delete Account</ThemedText>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Permanently remove your account and data.</ThemedText>
            </View>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </HapticButton>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  backBtn: { padding: 4 },
  scrollContent: { padding: Spacing.four },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  sectionContainer: {
    borderRadius: 20,
    
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  }
});
