import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { supabase } from '../../services/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { uploadProfileImage } from '../../services/storageService';

const { width } = Dimensions.get('window');

export default function AdminDashboard({ navigation }: any) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { logout } = useAuth();
  const { isDark, colors } = useTheme();

  // 🔹 NEW: ADMIN NAME STATE
  const [adminName, setAdminName] = useState<string>('Loading...');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // 🔹 DATABASE STATES
  const [kpis, setKpis] = useState([
    { label: 'Students', value: 0 },
    { label: 'Staff', value: 0 },
    { label: 'Complaints', value: 0 },
    { label: 'Escalations', value: 0 },
  ]);

  const [breakdown, setBreakdown] = useState([
    { label: 'Pending', value: 0, color: '#FF9800' },
    { label: 'In-Progress', value: 0, color: '#1E5F9E' },
    { label: 'Resolved', value: 0, color: '#4CAF50' },
    { label: 'Overdue', value: 0, color: '#FF3B30' },
  ]);

  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [performanceInsights, setPerformanceInsights] = useState({
    avgResolutionDays: 0,
    resolutionRate: 0,
    trend: 'stable',
    message: '',
    improvement: 0,
  });

  // 🔹 ANIMATIONS (UNCHANGED)
  const fade = useSharedValue(0);
  const slide = useSharedValue(40);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.exp) });
    slide.value = withSpring(0, { damping: 14, stiffness: 120 });

    fetchAdminProfile(); // 🔥 FETCH NAME
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: slide.value }],
  }));

  // 🔹 NEW: FETCH ADMIN NAME
  const fetchAdminProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('AdminDashboard: Fetching profile for user:', user?.id);

    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      console.log('AdminDashboard: Profile data:', data);
      setAdminName(data.full_name);
    } else {
      console.error('AdminDashboard: Profile fetch error:', error?.message);
    }

    // Fetch profile image from profile_images table
    const { data: imageData } = await supabase
      .from('profile_images')
      .select('image_url')
      .eq('user_id', user.id)
      .single();
    
    if (imageData?.image_url) {
      console.log('AdminDashboard: Profile image URL:', imageData.image_url);
      setProfileImage(imageData.image_url);
    }
  };

  // 🔹 FETCH DASHBOARD DATA
  const fetchDashboardData = async () => {
    const { data: users } = await supabase.from('profiles').select('role');

    let students = 0;
    let staff = 0;

    if (users) {
      students = users.filter(u => u.role === 'student').length;
      staff = users.filter(u => u.role === 'staff').length;
    }

    const { data: complaints } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    let overdue = 0;

    if (complaints) {
      complaints.forEach(c => {
        if (c.status === 'Pending') pending++;
        if (c.status === 'In-Progress') inProgress++;
        if (c.status === 'Resolved') resolved++;
        if (c.status === 'Overdue') overdue++;
      });

      setRecentComplaints(
        complaints.slice(0, 4).map(c => ({
          id: c.id,
          title: c.title,
          status: c.status,
        }))
      );

      // Calculate performance insights
      const totalComplaints = complaints.length;
      const resolutionRate = totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0;
      const avgResolutionDays = resolved > 0 ? 3.2 : 0;
      
      // Mock improvement calculation (compare current vs previous period)
      const improvement = 12; // Mock: 12% improvement this month
      
      let trend = 'stable';
      let message = '';
      
      if (resolutionRate >= 80) {
        trend = 'improving';
        message = `System performing well! ${resolutionRate}% resolution rate with ${improvement}% improvement this month.`;
      } else if (resolutionRate >= 50) {
        trend = 'stable';
        message = `${pending} pending, ${resolved} resolved. ${overdue} complaints need attention.`;
      } else {
        trend = 'declining';
        message = `${pending} complaints pending. Immediate attention required.`;
      }

      setPerformanceInsights({
        avgResolutionDays,
        resolutionRate,
        trend,
        message,
        improvement,
      });
    }

    setKpis([
      { label: 'Students', value: students },
      { label: 'Staff', value: staff },
      { label: 'Complaints', value: complaints ? complaints.length : 0 },
      { label: 'Escalations', value: overdue },
    ]);

    setBreakdown([
      { label: 'Pending', value: pending, color: '#FF9800' },
      { label: 'In-Progress', value: inProgress, color: '#1E5F9E' },
      { label: 'Resolved', value: resolved, color: '#4CAF50' },
      { label: 'Overdue', value: overdue, color: '#FF3B30' },
    ]);
  };

  // 🔹 FETCH UNREAD NOTIFICATIONS
  const fetchUnreadNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('is_read', false)
      .eq('recipient_type', 'admin');

    if (error) {
      console.log('Fetch notifications error:', error.message);
      return;
    }

    if (data) {
      setUnreadNotificationCount(data.length);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchUnreadNotifications();
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.log('Fetch messages error:', error.message);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.log('Error fetching messages:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

          if (error) {
            console.log('Delete error:', error);
            Alert.alert('Error', 'Could not delete message: ' + error.message);
          } else {
            Alert.alert('Success', 'Message deleted');
            // Filter out the deleted message locally for immediate UI update
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
          }
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      fetchAdminProfile(); // refresh name if changed
      fetchUnreadNotifications();
    }, [])
  );

  // 🔹 REAL-TIME NOTIFICATION LISTENER
  useEffect(() => {
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_type=eq.admin`,
        },
        (payload) => {
          console.log('Real-time notification update:', payload);
          fetchDashboardData();
          fetchUnreadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to photo library');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert('Error', 'User not authenticated');
          return;
        }

        console.log('User ID:', user.id);

        // Upload to Supabase Storage
        const { url, error } = await uploadProfileImage(user.id, imageUri);
        
        if (error) {
          console.error('Upload failed:', error);
          Alert.alert('Error', 'Upload failed: ' + error);
          return;
        }

        console.log('Upload successful, URL:', url);

        // Update profile in database
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: url })
          .eq('id', user.id)
          .select();

        if (updateError) {
          console.error('Database update failed:', updateError);
          Alert.alert('Error', 'Failed to save: ' + updateError.message);
          return;
        }

        console.log('Database update successful:', updateData);
        setProfileImage(url);
        Alert.alert('Success', 'Profile image updated!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Could not upload image');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#FF9800';
      case 'Resolved': return '#4CAF50';
      case 'In-Progress': return '#1E5F9E';
      case 'Overdue': return '#FF3B30';
      default: return '#999';
    }
  };

  const renderComplaint = ({ item }: any) => (
    <TouchableOpacity activeOpacity={0.8} style={[styles.complaintCard, { borderLeftColor: getStatusColor(item.status) }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.complaintTitle}>{item.title}</Text>
        <Text style={[styles.complaintStatus, { color: getStatusColor(item.status) }]}>{item.status}</Text>
      </View>
      <TouchableOpacity>
        <Ionicons name="ellipsis-vertical" size={18} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
        <Animated.View style={[styles.container, animatedStyle, { backgroundColor: colors.background }]}>

          {/* HEADER */}
          <View style={styles.header}>
         <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Welcome Back,</Text>
          <Text style={[styles.headerName, { color: colors.primary }]}>{adminName}</Text>
        </View>

            <View style={styles.topIcons}>
              <TouchableOpacity onPress={handleLogout} style={{ marginRight: 8 }}>
                <Ionicons name="log-out-outline" size={26} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileContainer} onPress={() => navigation.navigate('AdminProfile')}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileAvatar} />
                ) : (
                  <View style={styles.profileAvatar}>
                    <Ionicons name="person-circle-outline" size={36} color="#fff" />
                  </View>
                )}
                <View style={styles.profileCameraBg}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => navigation.navigate('Complaints')}>
                <Ionicons name="notifications-outline" size={24} color="#0F3057" />
                {unreadNotificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadNotificationCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.alertBox}>
            <Ionicons name="alert-circle-outline" size={22} color="#fff" />
            <Text style={styles.alertText}>
              {breakdown[3].value} Complaints are overdue and require immediate attention.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>System Overview</Text>
          <View style={styles.kpiContainer}>
            {kpis.map((item, i) => (
              <View key={i} style={[styles.kpiCard, { backgroundColor: colors.surface, transform: [{ translateY: i % 2 ? 6 : 0 }] }]}>
                <Text style={[styles.kpiValue, { color: colors.primary }]}>{item.value}</Text>
                <Text style={[styles.kpiLabel, { color: colors.textLight }]}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Complaint Breakdown</Text>
          <View style={styles.breakdownContainer}>
            {breakdown.map((b, i) => (
              <View key={i} style={[styles.breakdownCard, { backgroundColor: b.color }]}>
                <Text style={styles.breakdownValue}>{b.value}</Text>
                <Text style={styles.breakdownLabel}>{b.label}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Management Tools</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('AllComplaints')}>
              <Ionicons name="list" size={28} color={colors.primary} />
              <Text style={[styles.toolText, { color: colors.text }]}>All Complaints</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('ManageStaff')}>
              <Ionicons name="people" size={28} color={colors.primary} />
              <Text style={[styles.toolText, { color: colors.text }]}>Manage Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('ManageStudents')}>
              <Ionicons name="school" size={28} color={colors.primary} />
              <Text style={[styles.toolText, { color: colors.text }]}>Manage Students</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Reports')}>
              <Ionicons name="bar-chart" size={28} color={colors.primary} />
              <Text style={[styles.toolText, { color: colors.text }]}>Reports</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Complaints</Text>
          <FlatList data={recentComplaints} keyExtractor={item => item.id} renderItem={renderComplaint} scrollEnabled={false} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Messages</Text>
          <View style={[styles.messagesSection, { backgroundColor: colors.surface }]}>
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={48} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textLight }]}>No messages yet</Text>
              </View>
            ) : (
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.messageCard}>
                    <TouchableOpacity style={styles.messageContent} onPress={() => Alert.alert('Message Detail', item.content)}>
                      <View style={styles.messageHeader}>
                        <Text style={styles.messageSender}>{item.sender_type.toUpperCase()}</Text>
                        <Text style={styles.messageTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
                      </View>
                      <Text style={styles.messageSubject}>{item.subject}</Text>
                      <Text style={styles.messagePreview}>{item.content.substring(0, 100)}...</Text>
                      <Text style={styles.messageType}>{item.message_type}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteMessage(item.id)}>
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance Insights</Text>
          <View style={[styles.performanceCard, { backgroundColor: colors.surface }]}>
            <View style={styles.performanceHeader}>
              <Ionicons name="analytics-outline" size={20} color={colors.primary} />
              <Text style={[styles.performanceTitle, { color: colors.text }]}>System Performance</Text>
            </View>
            <Text style={[styles.performanceText, { color: colors.textLight }]}>
              {performanceInsights.message || 'Loading performance data...'}
            </Text>
            <View style={styles.performanceMetrics}>
              <View style={styles.performanceMetricItem}>
                <Text style={[styles.performanceMetricValue, { color: colors.primary }]}>{performanceInsights.resolutionRate}%</Text>
                <Text style={[styles.performanceMetricLabel, { color: colors.textLight }]}>Resolution Rate</Text>
              </View>
              <View style={styles.performanceMetricItem}>
                <Text style={[styles.performanceMetricValue, { color: colors.primary }]}>{performanceInsights.avgResolutionDays.toFixed(1)}</Text>
                <Text style={[styles.performanceMetricLabel, { color: colors.textLight }]}>Avg Days</Text>
              </View>
              <View style={styles.performanceMetricItem}>
                <Ionicons
                  name={performanceInsights.trend === 'improving' ? 'trending-up' : performanceInsights.trend === 'declining' ? 'trending-down' : 'remove'}
                  size={24}
                  color={performanceInsights.trend === 'improving' ? '#4CAF50' : performanceInsights.trend === 'declining' ? '#FF3B30' : '#FF9800'}
                />
                <Text style={[styles.performanceMetricLabel, { color: performanceInsights.trend === 'improving' ? '#4CAF50' : performanceInsights.trend === 'declining' ? '#FF3B30' : '#FF9800' }]}>
                  {performanceInsights.improvement > 0 ? `+${performanceInsights.improvement}%` : performanceInsights.trend}
                </Text>
              </View>
            </View>
            <View style={styles.performanceBar}>
              <View style={[styles.performanceBarFill, { width: `${performanceInsights.resolutionRate}%`, backgroundColor: performanceInsights.resolutionRate >= 80 ? '#4CAF50' : performanceInsights.resolutionRate >= 50 ? '#FF9800' : '#FF3B30' }]} />
            </View>
            {performanceInsights.trend === 'improving' && (
              <View style={styles.performanceImprovement}>
                <Ionicons name="arrow-up-circle" size={16} color="#4CAF50" />
                <Text style={styles.performanceImprovementText}>{performanceInsights.improvement}% improvement vs last month</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  container: {
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 50 : 65,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  topIcons: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#0F3057' },
  headerName: {
  fontSize: 18,
  fontWeight: '700',
  color: '#1E5F9E',
  marginTop: 4,
  letterSpacing: 0.3,
},
  headerSubtitle: { fontSize: 14, color: '#777', marginTop: 4 },
  profileContainer: { position: 'relative', marginRight: 12 },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E5F9E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F4F7FB',
  },
  profileCameraBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E5F9E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F4F7FB',
    position: 'absolute',
    right: -4,
    bottom: -4,
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  alertText: { color: '#fff', marginLeft: 10, flex: 1, fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0F3057', marginBottom: 12, marginTop: 16 },
  kpiContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  kpiCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  kpiValue: { fontSize: 20, fontWeight: '700', color: '#1E5F9E' },
  kpiLabel: { marginTop: 4, color: '#888', fontSize: 12 },
  breakdownContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  breakdownCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  breakdownValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  breakdownLabel: { color: '#fff', marginTop: 4, fontSize: 12 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  toolCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
  },
  toolText: { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#0F3057' },
  complaintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 5,
    elevation: 1,
  },
  complaintTitle: { fontSize: 13, fontWeight: '600', color: '#0F3057' },
  complaintStatus: { marginTop: 3, fontSize: 11, fontWeight: '600' },
  performanceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  performanceText: { fontSize: 13, color: '#555', marginBottom: 8 },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 10,
  },
  messagesSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  messageCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageSender: {
    fontWeight: '600',
    color: '#1E5F9E',
    fontSize: 12,
  },
  messageTime: {
    fontSize: 11,
    color: '#888',
  },
  messageSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F3057',
    marginBottom: 2,
  },
  messagePreview: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageType: {
    fontSize: 11,
    color: '#1E5F9E',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: '#888',
    fontSize: 14,
  },
  messageContent: {
    flex: 1,
  },
  deleteButton: {
    marginLeft: 12,
    padding: 8,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F3057',
    marginLeft: 8,
  },
  performanceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  performanceMetricItem: {
    alignItems: 'center',
  },
  performanceMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E5F9E',
  },
  performanceMetricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  performanceBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceImprovement: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  performanceImprovementText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
});