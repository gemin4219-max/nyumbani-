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
import { useAuth } from '@/providers/AuthProvider';

const PANGO_FEATURES = ['WiFi', 'AC', 'Security', 'Parking', 'Furnished', 'Pool', 'Gym', 'Balcony'];

export default function ManagePangoScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { session } = useAuth();

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [image, setImage] = useState<{ uri: string, base64?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (data) setProperties(data);
    setLoading(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
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
    setAddress('');
    setPrice('');
    setDescription('');
    setSelectedFeatures([]);
    setImage(null);
    setIsEditing(false);
  };

  const handleEditClick = (prop: any) => {
    setEditingId(prop.id);
    setTitle(prop.title);
    setAddress(prop.address);
    setPrice(prop.price.toString());
    setDescription(prop.description || '');
    setSelectedFeatures(prop.features || []);
    setImage(prop.image_url ? { uri: prop.image_url } : null);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Property', 'Are you sure you want to delete this property forever?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('properties').delete().eq('id', id);
        fetchProperties();
      }}
    ]);
  };

  const handleSave = async () => {
    if (!title || !price || !address) {
      alert('Please fill out Title, Address, and Price.');
      return;
    }
    
    setSaving(true);

    let uploadedImageUrl = image?.uri;

    // If there's a new image with base64, upload it
    if (image?.base64) {
      const fileName = `${Date.now()}_pango.jpg`;
      const { data, error: uploadError } = await supabase.storage
        .from('public_images')
        .upload(fileName, decode(image.base64), { contentType: 'image/jpeg' });

      if (uploadError) {
        alert('Image Upload Failed! Did you create the public_images bucket? ' + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('public_images').getPublicUrl(fileName);
      uploadedImageUrl = publicUrlData.publicUrl;
    }

    const payload = {
      title,
      address,
      price: Number(price),
      description,
      features: selectedFeatures,
      image_url: uploadedImageUrl,
      owner_id: session?.user?.id,
    };

    let error;
    if (editingId) {
      const res = await supabase.from('properties').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('properties').insert({ ...payload, status: 'vacant' });
      error = res.error;
    }

    setSaving(false);

    if (error) {
      alert('Error saving property: ' + error.message);
    } else {
      alert(editingId ? 'Property Updated!' : 'Property Posted!');
      resetForm();
      fetchProperties();
    }
  };

  if (isEditing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetForm} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{editingId ? 'Edit Property' : 'Post New Property'}</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Image Picker */}
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
            <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Property Title</ThemedText>
            <TextInput style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement }]} value={title} onChangeText={setTitle} placeholder="e.g. Masaki Luxury Villa" placeholderTextColor={colors.textSecondary} />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Location / Address</ThemedText>
            <TextInput style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement }]} value={address} onChangeText={setAddress} placeholder="e.g. Masaki, Dar es Salaam" placeholderTextColor={colors.textSecondary} />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Monthly Rent (TZS)</ThemedText>
            <TextInput style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement }]} value={price} onChangeText={setPrice} placeholder="e.g. 2500000" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Detailed Description</ThemedText>
            <TextInput style={[styles.textArea, { color: colors.text, backgroundColor: colors.backgroundElement }]} value={description} onChangeText={setDescription} placeholder="Describe the property..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} />
          </View>

          <ThemedText style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 4 }}>Features</ThemedText>
          <View style={styles.featuresContainer}>
            {PANGO_FEATURES.map(feat => {
              const active = selectedFeatures.includes(feat);
              return (
                <TouchableOpacity key={feat} onPress={() => toggleFeature(feat)} style={[styles.featureChip, { backgroundColor: active ? colors.primary : colors.backgroundElement, borderColor: active ? colors.primary : colors.border }]}>
                  <ThemedText style={{ color: active ? '#000' : colors.text, fontSize: 13, fontWeight: '600' }}>{feat}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={[styles.postBtn, { backgroundColor: colors.primary, opacity: (!title || !price || !address) ? 0.5 : 1 }]} onPress={handleSave} disabled={saving || !title || !price || !address}>
            {saving ? <ActivityIndicator color="#000" /> : <ThemedText style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>{editingId ? 'Save Changes' : 'Publish to Live App'}</ThemedText>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // LIST VIEW
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Manage Pango</ThemedText>
        <TouchableOpacity onPress={() => setIsEditing(true)}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : properties.length === 0 ? (
          <ThemedText style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>No properties found.</ThemedText>
        ) : (
          properties.map(prop => (
            <View key={prop.id} style={[styles.listItem]}>
              {prop.image_url ? (
                <Image source={{ uri: prop.image_url }} style={styles.listImage} />
              ) : (
                <View style={[styles.listImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="home" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={{ fontWeight: '700', fontSize: 16, color: colors.text }} numberOfLines={1}>{prop.title}</ThemedText>
                <ThemedText style={{ color: colors.primary, fontWeight: '600', marginTop: 4 }}>TZS {prop.price.toLocaleString()}</ThemedText>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={1}>{prop.address}</ThemedText>
              </View>
              <View style={{ gap: 8 }}>
                <TouchableOpacity onPress={() => handleEditClick(prop)} style={[styles.actionBtn, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                  <Ionicons name="pencil" size={16} color="#D4AF37" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(prop.id)} style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
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
  
  // List Styles
  listItem: { flexDirection: 'row', padding: 12, borderRadius: 16,  marginBottom: 12, alignItems: 'center' },
  listImage: { width: 64, height: 64, borderRadius: 12 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  // Form Styles
  imagePicker: { height: 160, borderRadius: 16,  borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.five, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  inputContainer: { marginBottom: Spacing.four },
  textInput: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  textArea: { height: 120, borderRadius: 16,  paddingHorizontal: 16, paddingTop: 16, fontSize: 16, textAlignVertical: 'top' },
  featuresContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.five },
  featureChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,  },
  postBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.four }
});
