import React, { useState, useEffect } from 'react';
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
import { supabase } from '../../services/supabase'; // make sure your supabase client is exported here

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AssignedComplaints({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [assignedComplaints, setAssignedComplaints] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.log('Error fetching session:', error.message);
        return;
      }
      setUserId(session?.user?.id || null);
    };
    fetchUser();
  }, []);

  // Fetch assigned complaints whenever userId changes
  useEffect(() => {
    if (!userId) return;

    const fetchAssigned = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error fetching assigned complaints:', error.message);
      } else {
        setAssignedComplaints(data || []);
      }
      setLoading(false);
    };

    fetchAssigned();
  }, [userId]);

  const openDetails = (item: any) => {
    setSelected(item);
    setModalVisible(true);
  };

  const openViewModal = (item: any) => {
    setSelected(item);
    setViewModalVisible(true);
  };

  const closeViewModal = () => {
    setSelected(null);
    setViewModalVisible(false);
  };

  const closeDetails = () => {
    setModalVisible(false);
    setSelected(null);
  };

  // Update status in Supabase
  const updateStatus = async (status: string) => {
    if (!selected) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const { error } = await supabase
      .from('complaints')
      .update({ status })
      .eq('id', selected.id);

    if (error) {
      Alert.alert('Error', `Failed to update status: ${error.message}`);
    } else {
      Alert.alert('Success', `Complaint marked as ${status}`);
      // Refresh list
      setAssignedComplaints(prev =>
        prev.map(c => (c.id === selected.id ? { ...c, status } : c))
      );
      closeDetails();
    }
  };

  const filteredData = assignedComplaints
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
        <Text style={styles.headerTitle}>My Assigned Complaints</Text>
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
        ListEmptyComponent={() => !loading ? <Text style={{ textAlign: 'center', marginTop: 20 }}>No assigned complaints.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>Priority: {item.priority}</Text>
              <Text style={[styles.status, { color: getColor(item.status) }]}>{item.status}</Text>
            </View>
            <TouchableOpacity style={[styles.viewBtn, { backgroundColor: '#1E5F9E' }]} onPress={() => openViewModal(item)}>
              <Ionicons name="eye-outline" size={18} color="#fff" />
              <Text style={styles.viewBtnText}>View</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* View Complaint Modal */}
      <Modal visible={viewModalVisible} animationType="slide" transparent onRequestClose={closeViewModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.viewModalCard}>
            <View style={styles.viewModalHeader}>
              <Text style={styles.viewModalTitle}>Complaint Details</Text>
              <TouchableOpacity onPress={closeViewModal}>
                <Ionicons name="close-outline" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Title:</Text>
                <Text style={styles.detailValue}>{selected?.title}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Student Name:</Text>
                <Text style={styles.detailValue}>{selected?.student}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Registration Number:</Text>
                <Text style={styles.detailValue}>{selected?.registration_number || 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{selected?.category}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, { color: getColor(selected?.status) }]}>{selected?.status}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Priority:</Text>
                <Text style={[styles.detailValue, {
                  color: selected?.priority === 'Critical' ? '#FF3B30' : selected?.priority === 'High' ? '#FF9800' : '#4CAF50'
                }]}>{selected?.priority}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Urgency:</Text>
                <Text style={styles.detailValue}>{selected?.urgency}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailDescription}>{selected?.details || selected?.description}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Submitted:</Text>
                <Text style={styles.detailValue}>
                  {selected?.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.closeViewBtn} onPress={closeViewModal}>
              <Text style={styles.closeViewText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeDetails}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            <Text style={styles.modalText}>Status: {selected?.status}</Text>
            <Text style={[styles.modalText, { marginTop: 8 }]}>{selected?.details}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
              <TouchableOpacity style={[styles.updateBtn, { flex: 1, marginRight: 8 }]} onPress={() => updateStatus('Resolved')}>
                <Text style={styles.updateText}>Resolve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.updateBtn, { flex: 1, backgroundColor: '#FF9800' }]} onPress={() => updateStatus('In-Progress')}>
                <Text style={styles.updateText}>In-Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.updateBtn, { flex: 1, backgroundColor: '#FF3B30', marginLeft: 8 }]} onPress={() => { Alert.alert('Escalated', 'Complaint escalated'); closeDetails(); }}>
                <Text style={styles.updateText}>Escalate</Text>
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
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12 },
  title: { fontWeight: '600', color: '#0F3057' },
  subtitle: { fontSize: 12, color: '#777', marginTop: 3 },
  status: { marginTop: 5, fontSize: 12, fontWeight: '600' },
  updateBtn: { backgroundColor: '#1E5F9E', padding: 8, borderRadius: 8, marginBottom: 6, alignItems: 'center' },
  updateText: { color: '#fff', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F3057' },
  modalText: { marginTop: 8, color: '#555' },
  closeBtn: { marginTop: 14, alignItems: 'center' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  viewBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  viewModalCard: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 16, maxHeight: '80%' },
  viewModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  viewModalTitle: { fontSize: 18, fontWeight: '700', color: '#0F3057' },
  detailRow: { marginBottom: 12 },
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#0F3057' },
  detailDescription: { fontSize: 14, color: '#555', lineHeight: 20 },
  closeViewBtn: { marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, alignItems: 'center' },
  closeViewText: { color: '#1E5F9E', fontWeight: '600' },
});