import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

export default function ManageStudents({ navigation }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const openModal = (student: any) => {
    setSelected(student);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelected(null);
    setModalVisible(false);
  };

  const toggleStatus = async (student: any) => {
    if (!student) return;
    const newStatus = student.status === 'Active' ? 'Suspended' : 'Active';
    setActionLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', student.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Update local state to immediately reflect changes
      setStudents(prev =>
        prev.map(s => (s.id === student.id ? { ...s, status: newStatus } : s))
      );
      setSelected({ ...student, status: newStatus });
      Alert.alert('Success', `Student status changed to ${newStatus}`);
    }

    setActionLoading(false);
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
          <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.workload}>{item.email}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.statusBtn,
                  { backgroundColor: item.status === 'Active' ? '#4CAF50' : '#FF3B30' },
                ]}
                onPress={() => toggleStatus(item)}
              >
                <Text style={styles.statusText}>{item.status || 'Active'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal for student details */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalName}>{selected?.full_name}</Text>
            <Text style={styles.modalText}>Email: {selected?.email}</Text>
            <Text style={styles.modalText}>Role: {selected?.role}</Text>
            <Text style={styles.modalText}>Status: {selected?.status || 'Active'}</Text>

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: selected?.status === 'Active' ? '#FF3B30' : '#4CAF50',
                    flex: 1,
                  },
                ]}
                onPress={() => toggleStatus(selected)}
                disabled={actionLoading}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  {selected?.status === 'Active' ? 'Suspend' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: 12, alignSelf: 'center' }} onPress={closeModal}>
              <Text style={{ color: '#1E5F9E' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB', paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 30, fontWeight: '700', color: '#0F3057' },
  backBtn: { padding: 4 },
  searchBox: { backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 12 },
  input: { fontSize: 14 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '600', color: '#0F3057' },
  workload: { marginTop: 6, color: '#777' },
  statusBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalName: { fontSize: 18, fontWeight: '700', color: '#0F3057' },
  modalText: { marginTop: 8, color: '#555' },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
});