import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

export default function ManageStudents({ navigation }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

 const fetchStudents = async () => {
  setLoading(true);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name', { ascending: true });

  if (error) {
    Alert.alert('Error', error.message);
    setStudents([]);
  } else {
    setStudents(data || []);
  }
  setLoading(false);
};
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) Alert.alert('Error', error.message);
    else {
      fetchStudents();
      Alert.alert('Updated', 'Student status updated successfully.');
    }
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

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
        <TextInput
          placeholder="Search students..."
          value={search}
          onChangeText={setSearch}
          style={styles.input}
        />
      </View>

      {loading && <ActivityIndicator size="large" color="#1E5F9E" style={{ marginVertical: 10 }} />}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.full_name}</Text>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                { backgroundColor: item.status === 'Active' ? '#4CAF50' : '#FF3B30' }
              ]}
              onPress={() => toggleStatus(item.id, item.status)}
            >
              <Text style={{ color: '#fff', fontSize: 12 }}>
                {item.status || 'Active'}
              </Text>
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