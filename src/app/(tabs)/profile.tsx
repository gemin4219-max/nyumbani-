import React from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, Modal, TextInput, ActivityIndicator, Linking } from 'react-native';
import { HapticButton } from '@/components/HapticButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

function ProfileOption({ icon, label, showArrow = true, colorScheme, isDestructive = false, onPress }: any) {
  const colors = Colors[colorScheme as 'light' | 'dark'];
  const contentColor = isDestructive ? '#EF4444' : colors.text;

  return (
    <HapticButton style={styles.optionRow} onPress={onPress}>
      <View style={[styles.optionIcon, { backgroundColor: isDestructive ? 'rgba(239, 68, 68, 0.1)' : colors.backgroundSelected }]}>
        <Ionicons name={icon} size={20} color={isDestructive ? '#EF4444' : colors.primary} />
      </View>
      <ThemedText style={{ flex: 1, fontSize: 16, fontWeight: '500', color: contentColor }}>{label}</ThemedText>
      {showArrow && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
    </HapticButton>
  );
}

export default function ProfileTab() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { profile, session, refreshProfile } = useAuth();
  
  const fullName = profile?.full_name || 'Nyumbani User';
  const phone = profile?.phone_number || 'Add phone number';
  const address = profile?.address || 'Add location';
  const initial = fullName.charAt(0).toUpperCase();

  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(fullName);
  const [editPhone, setEditPhone] = React.useState(profile?.phone_number || '');
  const [editAddress, setEditAddress] = React.useState(profile?.address || '');
  const [saving, setSaving] = React.useState(false);

  const handleSafeLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        alert("Action not supported on this device (e.g. simulator).");
      }
    } catch (e) {
      alert("Error opening link.");
    }
  };

  const handleSaveProfile = async () => {
    if (!session?.user.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editName,
        phone_number: editPhone,
        address: editAddress
      })
      .eq('id', session.user.id);
    
    setSaving(false);
    if (!error) {
      setIsEditing(false);
      await refreshProfile(); // Sync the data!
      alert('Profile synced successfully!');
    } else {
      alert('Failed! Did you run the SQL? Error: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <ThemedText style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>Profile</ThemedText>
        </View>

        {/* USER PROFILE HEADER */}
        <View style={[styles.profileHeader]}>
          <View style={[styles.avatarLarge, { backgroundColor: colors.primary }]}>
            <ThemedText style={{ color: '#000', fontSize: 28, fontWeight: '700' }}>{initial}</ThemedText>
            <HapticButton hapticType="light"
              style={[styles.editBadge, { backgroundColor: colors.backgroundSelected, borderColor: colors.backgroundElement }]}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={12} color={colors.primary} />
            </HapticButton>
          </View>
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <ThemedText style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{fullName}</ThemedText>
            <ThemedText style={{ fontSize: 15, color: colors.textSecondary, marginTop: 4 }}>{phone}</ThemedText>
            
            {profile?.user_type === 'admin' && (
              <HapticButton hapticType="heavy"
                style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 16, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => router.push('/admin/')}
              >
                <Ionicons name="settings" size={16} color="#000" style={{ marginRight: 8 }} />
                <ThemedText style={{ color: '#000', fontWeight: '700', fontSize: 13 }}>Admin Dashboard</ThemedText>
              </HapticButton>
            )}
            
            <ThemedText style={{ fontSize: 14, color: colors.textSecondary, marginTop: 12 }}>
              <Ionicons name="location-outline" size={12} /> {address}
            </ThemedText>
          </View>
          <HapticButton hapticType="light"
            style={[styles.editProfileBtn, { borderColor: colors.border }]}
            onPress={() => setIsEditing(true)}
          >
            <ThemedText style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Edit Profile</ThemedText>
          </HapticButton>
        </View>

        {/* SETTINGS SECTIONS */}
        <ThemedText style={styles.sectionTitle}>Account Settings</ThemedText>
        <View style={styles.sectionContainer}>
          <ProfileOption icon="person-outline" label="Personal Information" colorScheme={colorScheme} onPress={() => setIsEditing(true)} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ProfileOption icon="location-outline" label="Saved Addresses" colorScheme={colorScheme} onPress={() => router.push('/settings/addresses')} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ProfileOption icon="card-outline" label="Payment Methods" colorScheme={colorScheme} onPress={() => router.push('/settings/payments')} />
        </View>

        <ThemedText style={styles.sectionTitle}>App Preferences</ThemedText>
        <View style={styles.sectionContainer}>
          <ProfileOption icon="notifications-outline" label="Notifications" colorScheme={colorScheme} onPress={() => router.push('/settings/notifications')} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ProfileOption icon="shield-checkmark-outline" label="Privacy & Security" colorScheme={colorScheme} onPress={() => router.push('/settings/privacy')} />
        </View>

        <ThemedText style={styles.sectionTitle}>Support</ThemedText>
        <View style={styles.sectionContainer}>
          <ProfileOption icon="help-circle-outline" label="Help Center" colorScheme={colorScheme} onPress={() => router.push('/settings/help')} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ProfileOption icon="chatbubble-ellipses-outline" label="Contact Support" colorScheme={colorScheme} onPress={() => router.push('/settings/contact')} />
        </View>

        <View style={{ height: 24 }} />

        <View style={[styles.sectionContainer, { marginTop: 24 }]}>
          <ProfileOption 
            icon="log-out-outline" 
            label="Log Out" 
            showArrow={false} 
            isDestructive={true} 
            colorScheme={colorScheme} 
            onPress={() => supabase.auth.signOut()} 
          />
        </View>

        <ThemedText style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 32 }}>
          Nyumbani App Version 1.0.0
        </ThemedText>

      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal visible={isEditing} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <View style={[styles.modalContent]}>
            <View style={styles.modalHeader}>
              <ThemedText style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Edit Profile</ThemedText>
              <HapticButton hapticType="light" onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </HapticButton>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Full Name</ThemedText>
              <TextInput
                style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Phone Number</ThemedText>
              <TextInput
                style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="e.g. +255 700 000 000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Location / Address</ThemedText>
              <TextInput
                style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="e.g. Masaki, Dar es Salaam"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

              <HapticButton hapticType="heavy"
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (<ActivityIndicator color="#000" />) : (<ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Save Changes</ThemedText>)}
            </HapticButton>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  scrollContent: {
    paddingBottom: Spacing.seven,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  sectionContainer: {
    marginHorizontal: Spacing.four,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  divider: {
    height: 1,
    marginLeft: 64, // Aligns with text
  },
  editProfileBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.five,
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  inputContainer: {
    marginBottom: Spacing.four,
  },
  textInput: {
    height: 56,
    borderRadius: 16,
    
    paddingHorizontal: 16,
    fontSize: 16,
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  }
});
