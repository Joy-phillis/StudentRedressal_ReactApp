import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminProfile({ navigation }: any) {
  const [name, setName] = useState('System Administrator');
  const [email, setEmail] = useState('admin@university.edu');

  const handleSave = () => {
    Alert.alert('Saved', 'Profile updated (simulated).');
    navigation.goBack();
  };

  const { logout } = useAuth();
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back-outline" size={24} color="#0F3057" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.profileCard}>
        <Ionicons name="person-circle" size={100} color="#1E5F9E" />
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={{ color: '#fff' }}>Save</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Ionicons name="log-out-outline" size={20} color="#fff" /><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB', paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#0F3057' },
  profileCard: { backgroundColor: '#fff', marginTop: 20, padding: 18, borderRadius: 16, elevation: 4 },
  label: { marginTop: 12, color: '#777', fontSize: 12 },
  input: { backgroundColor: '#f2f6fb', padding: 10, borderRadius: 8, marginTop: 6 },
  saveBtn: { marginTop: 14, backgroundColor: '#1E5F9E', padding: 12, borderRadius: 10, alignItems: 'center' },
  logoutBtn: { flexDirection: 'row', backgroundColor: '#FF3B30', padding: 15, borderRadius: 15, marginTop: 18, justifyContent: 'center', alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
});