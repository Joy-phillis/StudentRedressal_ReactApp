import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

export default function ManageStaff({ navigation }: any) {
  const [staff, setStaff] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'staff')
      .order('full_name', { ascending: true });

    if (error) {
      Alert.alert('Error', error.message);
      setStaff([]);
    } else {
      setStaff(data || []);
    }
    setLoading(false);
  };

  const openModal = (item: any) => {
    setSelected(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelected(null);
    setModalVisible(false);
  };

  const toggleStatus = async (user: any) => {
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    setActionLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // update the local state so button changes immediately
      setStaff(prev =>
        prev.map(s => (s.id === user.id ? { ...s, status: newStatus } : s))
      );
      setSelected({ ...user, status: newStatus });
      Alert.alert('Success', `Status changed to ${newStatus}`);
    }
    setActionLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#0F3057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Staff</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && <ActivityIndicator size="large" color="#1E5F9E" style={{ marginVertical: 10 }} />}

      <FlatList
        data={staff}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
            <View>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.workload}>{item.email}</Text>
            </View>
            <View>
              <TouchableOpacity
                style={[
                  styles.statusBtn,
                  { backgroundColor: item.status === 'Active' ? '#4CAF50' : '#FF3B30' }
                ]}
                onPress={() => toggleStatus(item)}
              >
                <Text style={{ color: '#fff', fontSize: 12 }}>{item.status}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal for Admin actions */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalName}>{selected?.full_name}</Text>
            <Text style={styles.modalText}>Email: {selected?.email}</Text>
            <Text style={styles.modalText}>Role: {selected?.role}</Text>
            <Text style={styles.modalText}>Status: {selected?.status}</Text>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: selected?.status === 'Active' ? '#FF3B30' : '#4CAF50', marginTop: 16 }
              ]}
              onPress={() => toggleStatus(selected)}
              disabled={actionLoading}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                {selected?.status === 'Active' ? 'Suspend' : 'Activate'}
              </Text>
            </TouchableOpacity>

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  headerTitle: { fontSize: 30, fontWeight: '700', color: '#0F3057' },
  backBtn: { padding: 4 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '600', color: '#0F3057', fontSize: 16 },
  workload: { marginTop: 6, color: '#777' },
  statusBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalName: { fontSize: 18, fontWeight: '700', color: '#0F3057' },
  modalText: { marginTop: 8, color: '#555' },
  actionBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
});