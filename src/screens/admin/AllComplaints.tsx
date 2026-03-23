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
import { supabase } from '../../services/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AllComplaints({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const [complaints, setComplaints] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingComplaint, setDeletingComplaint] = useState(false);

  // Fetch complaints
  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setComplaints(data);
  };

  // Fetch staff
  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'staff');
    if (!error && data) setStaffList(data);
  };

  useEffect(() => {
    fetchComplaints();
    fetchStaff();
  }, []);

  const openDetails = (item: any) => {
    setSelected(item);
    setSelectedStaff(item.assigned_to || null);
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
    setSelected(null);
    setSelectedStaff(null);
    setModalVisible(false);
  };

  // Update status in Supabase from View Modal
  const updateStatusFromView = async (status: string) => {
    if (!selected) return;
    setUpdatingStatus(true);

    const { error } = await supabase
      .from('complaints')
      .update({ status })
      .eq('id', selected.id);

    if (error) {
      Alert.alert('Error', `Failed to update status: ${error.message}`);
    } else {
      Alert.alert('Success', `Complaint marked as ${status}`);
      // Update local state
      setComplaints(prev =>
        prev.map(c => (c.id === selected.id ? { ...c, status } : c))
      );
      setSelected({ ...selected, status });
      setUpdatingStatus(false);
    }
  };

  // Delete complaint from Supabase
  const deleteComplaint = async () => {
    if (!selected) return;

    Alert.alert(
      'Delete Complaint',
      'Are you sure you want to delete this resolved complaint? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingComplaint(true);
            const { error } = await supabase
              .from('complaints')
              .delete()
              .eq('id', selected.id);

            if (error) {
              Alert.alert('Error', `Failed to delete: ${error.message}`);
              setDeletingComplaint(false);
            } else {
              Alert.alert('Success', 'Complaint deleted successfully');
              // Remove from local state
              setComplaints(prev => prev.filter(c => c.id !== selected.id));
              setDeletingComplaint(false);
              closeViewModal();
            }
          },
        },
      ]
    );
  };

  const assignToStaff = async () => {
    if (!selectedStaff) {
      Alert.alert('Error', 'Please select a staff member');
      return;
    }

    if (selected?.assigned_to === selectedStaff) {
      Alert.alert('Info', 'This staff is already assigned');
      return;
    }

    const { error } = await supabase
      .from('complaints')
      .update({ assigned_to: selectedStaff, status: 'In-Progress' })
      .eq('id', selected?.id);

    if (!error) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      Alert.alert('Success', 'Complaint assigned successfully!');
      fetchComplaints();
      closeDetails();
    } else {
      console.error(error);
      Alert.alert('Failed', 'Failed to assign complaint. Try again.');
    }
  };

  const filteredData = complaints
    .filter(
      c =>
        (filter === 'All' || c.status === filter) &&
        c.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));

  const getColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return '#FF9800';
      case 'Resolved':
        return '#4CAF50';
      case 'In-Progress':
        return '#1E5F9E';
      case 'Overdue':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#0F3057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Complaints</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search & Sort */}
      <View style={styles.rowControls}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#777" />
          <TextInput
            placeholder="Search complaints..."
            style={styles.input}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortAsc(s => !s)}>
          <Ionicons name={sortAsc ? 'arrow-up' : 'arrow-down'} size={20} color="#0F3057" />
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
        {['All', 'Pending', 'In-Progress', 'Resolved', 'Overdue'].map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.filterBtn, filter === item && { backgroundColor: '#1E5F9E' }]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && { color: '#fff' }]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Complaints List */}
      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.card, item.assigned_to ? { borderLeftColor: '#1E90FF' } : {}]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>Student: {item.student}</Text>
              <Text style={[styles.status, { color: getColor(item.status) }]}>
                {item.status} • {item.priority} Priority
              </Text>
              {item.assigned_to && (
                <Text style={styles.assignedText}>
                  Assigned to: {staffList.find(s => s.id === item.assigned_to)?.full_name || 'Staff'}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={[styles.viewBtn, { backgroundColor: '#1E5F9E' }]}
                onPress={() => openViewModal(item)}
              >
                <Ionicons name="eye-outline" size={18} color="#fff" />
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openDetails(item)}>
                <Ionicons name="ellipsis-vertical" size={18} color="#999" />
              </TouchableOpacity>
            </View>
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
                <Text style={styles.detailValue}>{selected?.reg_no || 'N/A'}</Text>
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

              {selected?.assigned_to && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Assigned To:</Text>
                  <Text style={styles.detailValue}>
                    {staffList.find(s => s.id === selected.assigned_to)?.full_name || 'Staff'}
                  </Text>
                </View>
              )}

              {/* Status Update Section */}
              <View style={styles.statusUpdateSection}>
                <Text style={styles.statusUpdateLabel}>Update Status:</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[styles.statusButton, selected?.status === 'Pending' && { backgroundColor: '#FF9800' }]}
                    onPress={() => updateStatusFromView('Pending')}
                    disabled={updatingStatus}
                  >
                    <Text style={[styles.statusButtonText, selected?.status === 'Pending' && { color: '#fff' }]}>Pending</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, selected?.status === 'In-Progress' && { backgroundColor: '#1E5F9E' }]}
                    onPress={() => updateStatusFromView('In-Progress')}
                    disabled={updatingStatus}
                  >
                    <Text style={[styles.statusButtonText, selected?.status === 'In-Progress' && { color: '#fff' }]}>In-Progress</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, selected?.status === 'Resolved' && { backgroundColor: '#4CAF50' }]}
                    onPress={() => updateStatusFromView('Resolved')}
                    disabled={updatingStatus}
                  >
                    <Text style={[styles.statusButtonText, selected?.status === 'Resolved' && { color: '#fff' }]}>Resolved</Text>
                  </TouchableOpacity>
                </View>
                {updatingStatus && (
                  <Text style={styles.updatingText}>Updating status...</Text>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.closeViewBtn} onPress={closeViewModal}>
              <Text style={styles.closeViewText}>Close</Text>
            </TouchableOpacity>

            {/* Delete Button - Only show for Resolved complaints */}
            {selected?.status === 'Resolved' && (
              <TouchableOpacity
                style={[styles.deleteBtn, deletingComplaint && { opacity: 0.5 }]}
                onPress={deleteComplaint}
                disabled={deletingComplaint}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.deleteBtnText}>
                  {deletingComplaint ? 'Deleting...' : 'Delete Complaint'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeDetails}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            <Text style={styles.modalText}>Student: {selected?.student}</Text>
            <Text style={styles.modalText}>Status: {selected?.status}</Text>
            <Text style={[styles.modalText, { marginBottom: 12 }]}>{selected?.details}</Text>

            <Text style={{ fontWeight: '600', marginBottom: 8 }}>Assign to Staff</Text>
            {staffList.map(staff => (
              <TouchableOpacity
                key={staff.id}
                style={[
                  styles.staffBtn,
                  selectedStaff === staff.id && { backgroundColor: '#1E5F9E' },
                ]}
                onPress={() => setSelectedStaff(staff.id)}
              >
                <Text
                  style={{
                    color: selectedStaff === staff.id ? '#fff' : '#0F3057',
                    fontWeight: '600',
                  }}
                >
                  {staff.full_name}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: 'row', marginTop: 18 }}>
              <TouchableOpacity style={[styles.assignBtn, { flex: 1 }]} onPress={assignToStaff}>
                <Text style={styles.assignText}>Assign</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.escalateBtn, { flex: 1, marginLeft: 8 }]} onPress={closeDetails}>
                <Text style={styles.assignText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
  assignedText: { marginTop: 6, fontSize: 12, color: '#1E90FF', fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F3057', marginBottom: 6 },
  modalText: { color: '#555', marginBottom: 6 },
  staffBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E5F9E',
    marginBottom: 8,
    alignItems: 'center',
  },
  assignBtn: { backgroundColor: '#1E5F9E', padding: 10, borderRadius: 8, alignItems: 'center' },
  escalateBtn: { backgroundColor: '#FF3B30', padding: 10, borderRadius: 8, alignItems: 'center' },
  assignText: { color: '#fff', fontWeight: '600' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
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
  statusUpdateSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  statusUpdateLabel: { fontSize: 14, fontWeight: '600', color: '#0F3057', marginBottom: 10 },
  statusButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statusButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  statusButtonText: { fontSize: 12, fontWeight: '600', color: '#555' },
  updatingText: { fontSize: 11, color: '#888', marginTop: 8, textAlign: 'center' },
  deleteBtn: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});