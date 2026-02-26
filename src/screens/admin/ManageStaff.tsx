import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const staff = [
  { id: '1', name: 'Mr. Adams', workload: 5, email: 'adams@university.edu' },
  { id: '2', name: 'Ms. Clara', workload: 2, email: 'clara@university.edu' },
];

export default function ManageStaff({ navigation }: any) {
  const [selected, setSelected] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const open = (s: any) => { setSelected(s); setModalVisible(true); };
  const close = () => { setModalVisible(false); setSelected(null); };

  const reassign = (id: string) => {
    Alert.alert('Reassign', `Open reassign flow for staff ${id} (simulated).`);
    close();
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

      <FlatList
        data={staff}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => open(item)}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.workload}>{item.workload} Active Cases</Text>
              <View style={styles.loadBarBg}>
                <View style={[styles.loadBar, { width: `${Math.min(item.workload * 12 + 10, 100)}%` }]} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalName}>{selected?.name}</Text>
            <Text style={styles.modalText}>Email: {selected?.email}</Text>
            <Text style={styles.modalText}>Active Cases: {selected?.workload}</Text>
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1E5F9E', marginRight: 8 }]} onPress={() => reassign(selected?.id)}>
                <Text style={{ color: '#fff' }}>Reassign</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]} onPress={() => { Alert.alert('Remove', 'Remove staff (simulated).'); close(); }}>
                <Text style={{ color: '#fff' }}>Remove</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ marginTop: 12, alignSelf: 'center' }} onPress={close}><Text style={{ color: '#1E5F9E' }}>Close</Text></TouchableOpacity>
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
  name: { fontWeight: '600', color: '#0F3057', fontSize: 16 },
  workload: { marginTop: 6, color: '#777' },
  loadBarBg: { height: 8, backgroundColor: '#eef3fb', borderRadius: 6, marginTop: 8, overflow: 'hidden' },
  loadBar: { height: '100%', backgroundColor: '#1E5F9E' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalName: { fontSize: 18, fontWeight: '700', color: '#0F3057' },
  modalText: { marginTop: 8, color: '#555' },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
});