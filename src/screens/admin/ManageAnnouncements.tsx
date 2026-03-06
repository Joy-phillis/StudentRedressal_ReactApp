import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../services/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
  priority: string;
}

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isActive, setIsActive] = useState(true);

  // Animations
  const headerOpacity = useSharedValue(0);
  const listTranslate = useSharedValue(30);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) });
    listTranslate.value = withSpring(0, { damping: 12, stiffness: 90 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerOpacity.value * 10 }],
  }));

  const listStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: listTranslate.value }],
  }));

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error fetching announcements:', error);
      Alert.alert('Error', 'Failed to fetch announcements');
    } else {
      setAnnouncements(data || []);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAnnouncements();
    }, [])
  );

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (title.trim().length < 5) {
      Alert.alert('Validation Error', 'Title must be at least 5 characters long');
      return;
    }

    if (content.trim().length < 10) {
      Alert.alert('Validation Error', 'Content must be at least 10 characters long');
      return;
    }

    setLoading(true);
    const announcementData = {
      title: title.trim(),
      content: content.trim(),
      priority,
      is_active: isActive,
    };

    try {
      if (editingAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        Alert.alert('Success', 'Announcement updated successfully');
      } else {
        // Create new announcement
        const { error } = await supabase
          .from('announcements')
          .insert([announcementData]);

        if (error) throw error;
        Alert.alert('Success', 'Announcement created successfully');
      }

      // Reset form and close modal
      setTitle('');
      setContent('');
      setPriority('normal');
      setIsActive(true);
      setEditingAnnouncement(null);
      setModalVisible(false);
      fetchAnnouncements();
    } catch (error) {
      console.log('Error saving announcement:', error);
      Alert.alert('Error', 'Failed to save announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setPriority(announcement.priority);
    setIsActive(announcement.is_active);
    setModalVisible(true);
  };

  const handleDelete = (announcementId: number) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', announcementId);

              if (error) throw error;
              Alert.alert('Success', 'Announcement deleted successfully');
              fetchAnnouncements();
            } catch (error) {
              console.log('Error deleting announcement:', error);
              Alert.alert('Error', 'Failed to delete announcement. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return { bg: '#D32F2F', text: '#FFEBEE' };
      case 'high': return { bg: '#F57C00', text: '#FFF3E0' };
      case 'normal': return { bg: '#1E5F9E', text: '#E3F2FD' };
      case 'low': return { bg: '#4CAF50', text: '#E8F5E8' };
      default: return { bg: '#1E5F9E', text: '#E3F2FD' };
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'URGENT';
      case 'high': return 'HIGH';
      case 'normal': return 'NORMAL';
      case 'low': return 'LOW';
      default: return 'NORMAL';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? { bg: '#E8F5E8', text: '#2E7D32' } : { bg: '#F5F5F5', text: '#757575' };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Announcements</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingAnnouncement(null);
            setTitle('');
            setContent('');
            setPriority('normal');
            setIsActive(true);
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Announcement</Text>
        </TouchableOpacity>
      </View>

      {/* Announcements List */}
      <ScrollView style={styles.announcementsList}>
        {loading && announcements.length === 0 ? (
          <Text style={styles.loadingText}>Loading announcements...</Text>
        ) : announcements.length === 0 ? (
          <Text style={styles.noAnnouncementsText}>No announcements yet</Text>
        ) : (
          announcements.map((announcement) => (
            <View key={announcement.id} style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(announcement.priority).bg }]}>
                  <Text style={styles.priorityText}>{getPriorityText(announcement.priority)}</Text>
                </View>
              </View>
              
              <Text style={styles.announcementContent}>{announcement.content}</Text>
              
              <View style={styles.announcementFooter}>
                <Text style={styles.announcementDate}>
                  {new Date(announcement.created_at).toLocaleDateString()}
                </Text>
                <Text style={[
                  styles.statusText, 
                  { color: announcement.is_active ? '#4CAF50' : '#999' }
                ]}>
                  {announcement.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(announcement)}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(announcement.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Announcement Title"
              value={title}
              onChangeText={setTitle}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Announcement Content"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={priority}
                    onValueChange={(itemValue) => setPriority(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Low" value="low" />
                    <Picker.Item label="Normal" value="normal" />
                    <Picker.Item label="High" value="high" />
                    <Picker.Item label="Urgent" value="urgent" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <TouchableOpacity
                  style={[
                    styles.statusToggle,
                    { backgroundColor: isActive ? '#4CAF50' : '#999' }
                  ]}
                  onPress={() => setIsActive(!isActive)}
                >
                  <Text style={styles.statusToggleText}>
                    {isActive ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingAnnouncement(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : editingAnnouncement ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    marginTop: 46,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F3057',
    letterSpacing: 0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E5F9E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#1E5F9E',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  announcementsList: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
    fontSize: 16,
    fontStyle: 'italic',
  },
  noAnnouncementsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
    fontSize: 16,
    fontWeight: '600',
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1E5F9E',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F3057',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  announcementContent: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
    marginBottom: 16,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  announcementDate: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E6F3E6',
    color: '#2F855A',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  editButton: {
    backgroundColor: '#1E5F9E',
    shadowColor: '#1E5F9E',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: '#D32F2F',
    shadowColor: '#D32F2F',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '92%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F3057',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textArea: {
    height: 140,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  formGroup: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 13,
    color: '#4A5568',
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  statusToggle: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  statusToggleText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#CBD5E0',
  },
  saveButton: {
    backgroundColor: '#1E5F9E',
    shadowColor: '#1E5F9E',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cancelButtonText: {
    color: '#4A5568',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
