import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, TextInput, ActivityIndicator } from 'react-native';
import { HapticButton } from '@/components/HapticButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export default function ContactScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!subject || !message) {
      alert('Please fill out all fields.');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      alert('Message sent successfully! Our team will get back to you within 24 hours.');
      router.back();
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <HapticButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </HapticButton>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Contact Support</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={{ marginBottom: 24 }}>
          <ThemedText style={{ fontSize: 16, color: colors.textSecondary }}>
            Have a question or facing an issue? Send us a message and our support team will help you out.
          </ThemedText>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Subject</ThemedText>
          <TextInput
            style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement }]}
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g., Booking Issue"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Message</ThemedText>
          <TextInput
            style={[styles.textArea, { color: colors.text, backgroundColor: colors.backgroundElement }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Please describe your issue in detail..."
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </View>

        <HapticButton hapticType="heavy"
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: (!subject || !message) ? 0.5 : 1 }]}
          onPress={handleSend}
          disabled={sending || !subject || !message}
        >
          {sending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700', marginRight: 8 }}>Send Message</ThemedText>
              <Ionicons name="send" size={18} color="#000" />
            </>
          )}
        </HapticButton>

        {/* Alternative Contact */}
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>Or reach us directly at:</ThemedText>
          <ThemedText style={{ color: colors.primary, fontSize: 16, fontWeight: '700', marginTop: 8 }}>support@nyumbani.co.tz</ThemedText>
          <ThemedText style={{ color: colors.primary, fontSize: 16, fontWeight: '700', marginTop: 4 }}>+255 700 000 000</ThemedText>
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
  inputContainer: {
    marginBottom: Spacing.four,
  },
  textInput: {
    height: 56,
    borderRadius: 16,
    
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 150,
    borderRadius: 16,
    
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  sendBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  }
});
