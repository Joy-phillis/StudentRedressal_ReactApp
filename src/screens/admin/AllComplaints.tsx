import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const dummyComplaints = [
  { id: '1', title: 'Broken Lab PC', student: 'John Doe', status: 'Pending', priority: 'High', details: 'Lab PC in room 204 not booting.' },
  { id: '2', title: 'Hostel Water Issue', student: 'Mary Jane', status: 'In-Progress', priority: 'Medium', details: 'Low water pressure in block B.' },
  { id: '3', title: 'Library AC Fault', student: 'Alex Kim', status: 'Resolved', priority: 'Low', details: 'AC serviced by maintenance team.' },
  { id: '4', title: 'Cafeteria Hygiene', student: 'Daniel Ray', status: 'Overdue', priority: 'High', details: 'Repeated hygiene complaints from students.' },
];

export default function AllComplaints({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openDetails = (item: any) => {
    setSelected(item);
    setModalVisible(true);
  };

  const closeDetails = () => {
    setModalVisible(false);
    setSelected(null);
  };

  const assignToStaff = (complaintId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Alert.alert('Assign', `Complaint ${complaintId} assigned to staff member (simulated).`);
    closeDetails();
  };

  const filteredData = dummyComplaints
    .filter(c => (filter === 'All' || c.status === filter) && c.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));

  const getColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#FF9800';
      case 'Resolved': return '#4CAF50';
      case 'In-Progress': return '#1E5F9E';
      case 'Overdue': return '#FF3B30';
      default: return '#999';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#0F3057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Complaints</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.rowControls}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#777" />
          <TextInput placeholder="Search complaints..." style={styles.input} value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortAsc(s => !s)}>
          <Ionicons name={sortAsc ? 'arrow-up' : 'arrow-down'} size={20} color="#0F3057" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
        {['All', 'Pending', 'In-Progress', 'Resolved', 'Overdue'].map(item => (
          <TouchableOpacity key={item} style={[styles.filterBtn, filter === item && { backgroundColor: '#1E5F9E' }]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && { color: '#fff' }]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => openDetails(item)} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>Student: {item.student}</Text>
              <Text style={[styles.status, { color: getColor(item.status) }]}>{item.status} • {item.priority} Priority</Text>
            </View>
            <View>
              <TouchableOpacity style={styles.assignBtn} onPress={() => assignToStaff(item.id)}>
                <Text style={styles.assignText}>Assign</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.escalateBtn} onPress={() => Alert.alert('Escalate', 'Escalation noted (simulated).')}>
                <Text style={styles.assignText}>Escalate</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeDetails}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            <Text style={styles.modalText}>Reported by: {selected?.student}</Text>
            <Text style={styles.modalText}>Status: {selected?.status}</Text>
            <Text style={[styles.modalText, { marginTop: 8 }]}>{selected?.details}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
              <TouchableOpacity style={[styles.assignBtn, { flex: 1, marginRight: 8 }]} onPress={() => assignToStaff(selected?.id)}>
                <Text style={styles.assignText}>Assign</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.escalateBtn, { flex: 1 }]} onPress={() => { Alert.alert('Escalated', 'Complaint escalated (simulated).'); closeDetails(); }}>
                <Text style={styles.assignText}>Escalate</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeDetails}><Text style={{ color: '#1E5F9E' }}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB', paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F3057' },
  backBtn: { padding: 4 },
  rowControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  searchBox: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'center' },
  input: { marginLeft: 10, flex: 1 },
  sortBtn: { marginLeft: 10, backgroundColor: '#fff', padding: 10, borderRadius: 10 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#fff', borderRadius: 20, marginRight: 10 },
  filterText: { fontSize: 13, color: '#0F3057' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, flexDirection: 'row' },
  title: { fontWeight: '600', color: '#0F3057' },
  subtitle: { fontSize: 12, color: '#777', marginTop: 3 },
  status: { marginTop: 5, fontSize: 12, fontWeight: '600' },
  assignBtn: { backgroundColor: '#1E5F9E', padding: 8, borderRadius: 8, marginBottom: 6, alignItems: 'center' },
  escalateBtn: { backgroundColor: '#FF3B30', padding: 8, borderRadius: 8, alignItems: 'center' },
  assignText: { color: '#fff', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F3057' },
  modalText: { marginTop: 8, color: '#555' },
  closeBtn: { marginTop: 14, alignItems: 'center' },
});