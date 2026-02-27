import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

export default function ManageStaff({ navigation }: any) {
  const [staff, setStaff] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

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

  const open = (s: any) => {
    setSelected(s);
    setModalVisible(true);
  };
  const close = () => {
    setModalVisible(false);
    setSelected(null);
  };

  const removeStaff = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else {
      fetchStaff();
      close();
      Alert.alert('Removed', 'Staff removed successfully.');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) Alert.alert('Error', error.message);
    else {
      fetchStaff();
      Alert.alert('Updated', 'Staff status updated successfully.');
    }
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
          <TouchableOpacity style={styles.card} onPress={() => open(item)}>
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
                onPress={() => toggleStatus(item.id, item.status)}
              >
                <Text style={styles.statusText}>{item.status || 'Active'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalName}>{selected?.full_name}</Text>
            <Text style={styles.modalText}>Email: {selected?.email}</Text>
            <Text style={styles.modalText}>Role: {selected?.role}</Text>
            <Text style={styles.modalText}>Status: {selected?.status || 'Active'}</Text>

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FF3B30', flex: 1 }]}
                onPress={() => removeStaff(selected?.id)}
              >
                <Text style={{ color: '#fff' }}>Remove</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: 12, alignSelf: 'center' }} onPress={close}>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F3057' },
  backBtn: { padding: 4 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '600', color: '#0F3057', fontSize: 16 },
  workload: { marginTop: 6, color: '#777' },
  statusBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalName: { fontSize: 18, fontWeight: '700', color: '#0F3057' },
  modalText: { marginTop: 8, color: '#555' },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
});