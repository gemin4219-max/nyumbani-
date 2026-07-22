import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useColorScheme, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const SOKONI_FEATURES = ['Organic', 'Fresh', 'Wholesale', 'Local', 'Imported'];

export default function ManageSokoniScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [badgeText, setBadgeText] = useState('New');
  const [description, setDescription] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [image, setImage] = useState<{ uri: string, base64?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('sokoni_items').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
      });
    }
  };

  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feat));
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setPrice('');
    setUnit('kg');
    setBadgeText('New');
    setDescription('');
    setSelectedFeatures([]);
    setImage(null);
    setIsEditing(false);
  };

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setPrice(item.price.toString());
    setUnit(item.unit);
    setBadgeText(item.badge_text || '');
    setDescription(item.description || '');
    setSelectedFeatures(item.features || []);
    setImage(item.image_url ? { uri: item.image_url } : null);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item forever?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('sokoni_items').delete().eq('id', id);
        fetchItems();
      }}
    ]);
  };

  const handleSave = async () => {
    if (!title || !price || !unit) {
      alert('Please fill out Title, Price, and Unit.');
      return;
    }
    
    setSaving(true);
    let uploadedImageUrl = image?.uri;

    if (image?.base64) {
      const fileName = `${Date.now()}_sokoni.jpg`;
      const { data, error: uploadError } = await supabase.storage
        .from('public_images')
        .upload(fileName, decode(image.base64), { contentType: 'image/jpeg' });

      if (uploadError) {
        alert('Image Upload Failed! ' + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('public_images').getPublicUrl(fileName);
      uploadedImageUrl = publicUrlData.publicUrl;
    }

    const payload = {
      title,
      price: Number(price),
      unit,
      badge_text: badgeText,
      description,
      features: selectedFeatures,
      image_url: uploadedImageUrl,
    };

    let error;
    if (editingId) {
      const res = await supabase.from('sokoni_items').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('sokoni_items').insert(payload);
      error = res.error;
    }

    setSaving(false);

    if (error) {
      alert('Error saving item: ' + error.message);
    } else {
      alert(editingId ? 'Item Updated!' : 'Item Posted!');
      resetForm();
      fetchItems();
    }
  };

  if (isEditing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetForm} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{editingId ? 'Edit Item' : 'Post New Item'}</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={pickImage} style={[styles.imagePicker]}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>Tap to upload photo</ThemedText>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Item Name</ThemedText>
            <TextInput style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement }]} value={title} onChangeText={setTitle} placeholder="e.g. Farm Fresh Tomatoes" placeholderTextColor={colors.textSecondary} />
          </View>

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Price (TZS)</ThemedText>
              <TextInput style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement }]} value={price} onChangeText={setPrice} placeholder="e.g. 5000" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Unit</ThemedText>
              <TextInput style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement }]} value={unit} onChangeText={setUnit} placeholder="e.g. kg, pc" placeholderTextColor={colors.textSecondary} />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Badge Text (Optional)</ThemedText>
            <TextInput style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement }]} value={badgeText} onChangeText={setBadgeText} placeholder="e.g. Hot, New" placeholderTextColor={colors.textSecondary} />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Detailed Description</ThemedText>
            <TextInput style={[styles.textArea, { color: colors.text, backgroundColor: colors.backgroundElement }]} value={description} onChangeText={setDescription} placeholder="Describe the item..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} />
          </View>

          <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Features</ThemedText>
          <View style={styles.featuresContainer}>
            {SOKONI_FEATURES.map(feat => {
              const active = selectedFeatures.includes(feat);
              return (
                <TouchableOpacity key={feat} onPress={() => toggleFeature(feat)} style={[styles.featureChip, { backgroundColor: active ? colors.primary : colors.backgroundElement, borderColor: active ? colors.primary : colors.border }]}>
                  <ThemedText style={{ color: active ? '#000' : colors.text, fontSize: 13, fontWeight: '600' }}>{feat}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={[styles.postBtn, { backgroundColor: colors.primary, opacity: (!title || !price || !unit) ? 0.5 : 1 }]} onPress={handleSave} disabled={saving || !title || !price || !unit}>
            {saving ? <ActivityIndicator color="#000" /> : <ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>{editingId ? 'Save Changes' : 'Publish to Live App'}</ThemedText>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Manage Sokoni</ThemedText>
        <TouchableOpacity onPress={() => setIsEditing(true)}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <ThemedText style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>No items found.</ThemedText>
        ) : (
          items.map(item => (
            <View key={item.id} style={[styles.listItem]}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.listImage} />
              ) : (
                <View style={[styles.listImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="cart" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={{ fontWeight: '700', fontSize: 16, color: colors.text }} numberOfLines={1}>{item.title}</ThemedText>
                <ThemedText style={{ color: colors.primary, fontWeight: '600', marginTop: 4 }}>TZS {item.price.toLocaleString()} <ThemedText style={{ fontSize: 12, color: colors.textSecondary }}>/ {item.unit}</ThemedText></ThemedText>
              </View>
              <View style={{ gap: 8 }}>
                <TouchableOpacity onPress={() => handleEditClick(item)} style={[styles.actionBtn, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                  <Ionicons name="pencil" size={16} color="#D4AF37" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Ionicons name="trash" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { padding: 4 },
  scrollContent: { padding: Spacing.four },
  listItem: { flexDirection: 'row', padding: 12, borderRadius: 16,  marginBottom: 12, alignItems: 'center' },
  listImage: { width: 64, height: 64, borderRadius: 12 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  imagePicker: { height: 160, borderRadius: 16,  borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.five, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  inputContainer: { marginBottom: Spacing.four },
  textInput: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  textArea: { height: 120, borderRadius: 16,  paddingHorizontal: 16, paddingTop: 16, fontSize: 16, textAlignVertical: 'top' },
  featuresContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.five },
  featureChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,  },
  postBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.four }
});
