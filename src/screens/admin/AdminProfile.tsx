import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { uploadProfileImage } from '../../services/storageService';

export default function AdminProfile({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  // 🔹 FETCH PROFILE DATA
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setName(profile.full_name);
        setEmail(profile.email);
        setCreatedAt(new Date(profile.created_at).toLocaleDateString());
        setAvatarUrl(profile.avatar_url ?? null);
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  // 🔹 IMAGE PICK + UPLOAD
  const handleUploadImage = async () => {
    if (!userId) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const image = result.assets[0];
      setUploading(true);

      // Upload using storageService
      const { url, error } = await uploadProfileImage(userId, image.uri);

      if (error) throw new Error(error);

      // Update profile table with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(url);
      Alert.alert('Success', 'Profile image updated and saved!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Error',
        'Upload failed. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  // 🔹 UPDATE NAME
  const handleSave = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', userId);

    if (error) {
      Alert.alert('Error', 'Could not update profile');
    } else {
      Alert.alert('Success', 'Profile updated successfully');
    }
  };

  // 🔹 LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#1E5F9E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={24} color="#0F3057" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Administrator Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleUploadImage}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle" size={110} color="#1E5F9E" />
            )}
            <View style={styles.cameraIcon}>
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.roleBadge}>Administrator</Text>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#eee' }]}
              value={email}
              editable={false}
            />

            <Text style={styles.label}>Account Created</Text>
            <Text style={styles.staticText}>{createdAt}</Text>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB', paddingHorizontal: 20, paddingTop: 60 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F3057' },

  profileCard: { backgroundColor: '#fff', marginTop: 25, padding: 20, borderRadius: 18, elevation: 5, alignItems: 'center' },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1E5F9E', padding: 6, borderRadius: 20 },
  roleBadge: { marginTop: 10, backgroundColor: '#1E5F9E', color: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: '600' },
  infoSection: { width: '100%', marginTop: 20 },
  label: { marginTop: 14, fontSize: 12, color: '#777' },
  input: { backgroundColor: '#f2f6fb', padding: 12, borderRadius: 10, marginTop: 6 },
  staticText: { marginTop: 6, fontSize: 14, color: '#333' },
  saveBtn: { marginTop: 20, backgroundColor: '#1E5F9E', padding: 14, borderRadius: 12, alignItems: 'center' },
  logoutBtn: { flexDirection: 'row', backgroundColor: '#FF3B30', padding: 16, borderRadius: 16, marginTop: 25, justifyContent: 'center', alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
});