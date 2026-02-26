import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const studentsInit = [
  { id: '1', name: 'Joy Phillis', status: 'Active' },
  { id: '2', name: 'Mary Jane', status: 'Suspended' },
  { id: '3', name: 'Alex Kim', status: 'Active' },
];

export default function ManageStudents({ navigation }: any) {
  const [students, setStudents] = useState(studentsInit);
  const [search, setSearch] = useState('');

  const toggleStatus = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Suspended' : 'Active' } : s));
    Alert.alert('Updated', 'Student status updated (simulated).');
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#0F3057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Students</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchBox}>
        <TextInput placeholder="Search students..." value={search} onChangeText={setSearch} style={styles.input} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity style={[styles.statusBtn, { backgroundColor: item.status === 'Active' ? '#4CAF50' : '#FF3B30' }]} onPress={() => toggleStatus(item.id)}>
              <Text style={{ color: '#fff', fontSize: 12 }}>{item.status}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB', paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F3057' },
  backBtn: { padding: 4 },
  searchBox: { backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 12 },
  input: { fontSize: 14 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '600', color: '#0F3057' },
  statusBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
});