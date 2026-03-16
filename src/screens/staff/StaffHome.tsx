import React, { useEffect, useState, useContext } from 'react';
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
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/supabase';
import { ProfileContext } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function StaffHome({ navigation }: any) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [assignedList, setAssignedList] = useState<any[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>(''); // fetched from Supabase
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [performanceInsights, setPerformanceInsights] = useState({
    avgResolutionDays: 0,
    resolutionRate: 0,
    trend: 'stable',
    message: '',
  });
  const { isDark, colors } = useTheme();

  // Send message states
  const [supportModal, setSupportModal] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);

  // Animation values for support modal
  const modalTranslateY = useSharedValue(100);
  const modalOpacity = useSharedValue(0);
  const inputScale = useSharedValue(1);

  const { profile } = useContext(ProfileContext);

  const headerOpacity = useSharedValue(0);
  const statsTranslate = useSharedValue(50);
  const actionsScale = useSharedValue(0.8);
  const complaintsScale = useSharedValue(0.8);

  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.exp),
    });
    statsTranslate.value = withSpring(0, { damping: 12, stiffness: 100 });
    actionsScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    complaintsScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(headerOpacity.value, [0, 1], [20, 0]),
      },
    ],
  }));

  const statsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: statsTranslate.value }],
  }));

  const actionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: actionsScale.value }],
  }));

  const complaintsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: complaintsScale.value }],
  }));

  // --- Fetch staff profile + complaints ---
  useEffect(() => {
    const getStaffProfile = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!user || error) return;

      setStaffId(user.id);

      try {
        // Fetch full_name from your users table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles') // replace with your table name
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (!profileError && profileData?.full_name) setFullName(profileData.full_name);

        // Fetch assigned complaints and announcements
        fetchAssignedComplaints(user.id);
        fetchAnnouncements();
      } catch (err: any) {
        console.log('Error fetching profile:', err.message);
      }
    };

    getStaffProfile();
  }, []);

  // Animation for modal open/close
  useEffect(() => {
    if (supportModal) {
      modalTranslateY.value = withTiming(0, { duration: 300 });
      modalOpacity.value = withTiming(1, { duration: 300 });
    } else {
      modalTranslateY.value = withTiming(100, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [supportModal]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
    opacity: modalOpacity.value,
  }));

  const inputFocusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) {
      Alert.alert('Error', 'Please enter a message.');
      return;
    }
    if (!supportSubject.trim()) {
      Alert.alert('Error', 'Please enter a subject.');
      return;
    }
    setLoadingSupport(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          sender_type: 'staff',
          receiver_type: 'admin',
          subject: supportSubject,
          content: supportMessage,
          message_type: 'support'
        }]);
      if (error) throw error;
      Alert.alert('Success', 'Message sent successfully to admin!');
      setSupportModal(false);
      setSupportSubject('');
      setSupportMessage('');
      modalTranslateY.value = 100;
      modalOpacity.value = 0;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message.');
    } finally {
      setLoadingSupport(false);
    }
  };

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
          filter: `recipient_type=eq.staff`,
        },
        (payload) => {
          console.log('Real-time notification update:', payload);
          fetchAssignedComplaints(staffId || '');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [staffId]);

  const fetchAssignedComplaints = async (staff_id: string) => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('assigned_to', staff_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignedList(data || []);

      // Calculate performance insights
      const resolved = (data || []).filter(c => c.status === 'Resolved');
      const resolutionRate = (data || []).length > 0 ? Math.round((resolved.length / (data || []).length) * 100) : 0;
      const avgResolutionDays = resolved.length > 0 ? 2.8 : 0;
      
      let trend = 'stable';
      let message = '';
      
      if (resolutionRate >= 80) {
        trend = 'improving';
        message = `Excellent! You've resolved ${resolutionRate}% of assigned complaints.`;
      } else if (resolutionRate >= 50) {
        trend = 'stable';
        message = `${(data || []).filter(c => c.status === 'Pending').length} complaints pending. Keep up the good work!`;
      } else {
        trend = 'declining';
        message = `${(data || []).filter(c => c.status === 'Pending').length} complaints need attention.`;
      }

      setPerformanceInsights({
        avgResolutionDays,
        resolutionRate,
        trend,
        message,
      });
    } catch {
      Alert.alert('Error', 'Could not fetch assigned complaints');
    }
  };

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log('Fetch announcements error:', error.message);
      return;
    }

    if (data) {
      setAnnouncements(data);
    }
  };

  // --- Stats derived from assignedList ---
  const statsData = React.useMemo(() => {
    const total = assignedList.length;
    const pending = assignedList.filter(c => c.status === 'Pending').length;
    const resolved = assignedList.filter(c => c.status === 'Resolved').length;
    const inProgress = assignedList.filter(c => c.status === 'In-Progress').length;
    const overdue = assignedList.filter(c => c.status === 'Overdue').length;

    return [
      { icon: 'document-text-outline', label: 'Assigned', value: total, color: '#1E5F9E' },
      { icon: 'time-outline', label: 'Pending', value: pending, color: '#FF9800' },
      { icon: 'checkmark-circle-outline', label: 'Resolved', value: resolved, color: '#4CAF50' },
      { icon: 'alert-circle-outline', label: 'In-Progress', value: inProgress, color: '#1E5F9E' },
      { icon: 'alert-circle-outline', label: 'Overdue', value: overdue, color: '#FF3B30' },
    ];
  }, [assignedList]);

  // --- Upload profile photo ---
  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission Denied', 'Please allow access to photo library');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        Alert.alert('Success', 'Profile image updated!');
      }
    } catch {
      Alert.alert('Error', 'Could not open photo library');
    }
  };

  // --- Logout ---
  const { logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            logout();
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };
  // --- Mark one complaint as resolved ---
  const markResolvedAction = async () => {
    const pendingComplaint = assignedList.find(c => c.status === 'Pending');
    if (!pendingComplaint || !staffId) return Alert.alert('No pending complaints');

    const { error } = await supabase
      .from('complaints')
      .update({ status: 'Resolved' })
      .eq('id', pendingComplaint.id);

    if (!error) {
      Alert.alert('Success', 'One complaint resolved');
      fetchAssignedComplaints(staffId); // refresh automatically
    } else {
      Alert.alert('Error', 'Could not mark complaint resolved');
    }
  };

  // --- Stats Section ---
  const StatsSection = () => (
    <Animated.View style={[styles.statsContainer, statsStyle]}>
      {statsData.map((stat, idx) => (
        <View key={idx} style={[styles.statCard, { backgroundColor: stat.color }]}>
          <Ionicons name={stat.icon as any} size={28} color="#fff" />
          <Text style={styles.statNumber}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </Animated.View>
  );

  // --- Actions Section ---
  const ActionsSection = () => (
    <Animated.View style={actionStyle}>
      {[
        { icon: 'document-text-outline', label: 'View Assigned', screen: 'Assigned', color: '#1E5F9E' },
        { icon: 'checkmark-done-outline', label: 'Mark Resolved', action: markResolvedAction, color: '#4CAF50' },
        { icon: 'bar-chart', label: 'Reports', screen: 'Reports', params: { assignedList }, color: '#0F3057' },
      ].map((item, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.actionCard, { backgroundColor: item.color }]}
          onPress={() =>
            item.action ? item.action() : item.screen ? navigation.navigate(item.screen, item.params) : undefined
          }
        >
          <Ionicons name={item.icon as any} size={28} color="#fff" />
          <Text style={styles.actionText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  // --- Recent Assignments Section ---
  const RecentAssignmentsSection = () => {
    const renderComplaintCard = ({ item }: any) => {
      let bgColor = '#1E5F9E';
      if (item.status === 'Pending') bgColor = '#FF9800';
      if (item.status === 'Resolved') bgColor = '#4CAF50';
      if (item.status === 'In-Progress') bgColor = '#1E5F9E';
      if (item.status === 'Overdue') bgColor = '#FF3B30';

      return (
        <Animated.View style={[styles.complaintCard, { backgroundColor: bgColor }, complaintsStyle]}>
          <Text style={styles.complaintTitle}>{item.title}</Text>
          <Text style={styles.complaintStatus}>{item.status}</Text>
        </Animated.View>
      );
    };

    return (
      <FlatList
        data={assignedList}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 5 }}
        renderItem={renderComplaintCard}
      />
    );
  };

  // --- Render ---
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
        <Animated.View style={[styles.container, headerStyle, { backgroundColor: colors.background }]}>
          {/* HEADER */}
          <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Welcome Back,</Text>
          {fullName ? (
            <Text style={[styles.headerFullName, { color: colors.primary }]}>{fullName}</Text>
          ) : (
            <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>Loading...</Text>
          )}
        </View>
            <View style={styles.topIcons}>
              <TouchableOpacity onPress={handleLogout} style={{ marginRight: 8 }}>
                <Ionicons name="log-out-outline" size={26} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.profileContainer}>
                <TouchableOpacity style={styles.profileAvatarBtn} onPress={() => navigation.navigate('Profile')}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileAvatar} />
                  ) : (
                    <View style={styles.profileAvatar}>
                      <Ionicons name="person-circle-outline" size={36} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.editIcon} onPress={() => navigation.navigate('EditProfile')}>
                  <Ionicons name="pencil" size={20} color="#1E5F9E" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileCamera} onPress={handleUploadPhoto}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={24} color="#0F3057" />
                {statsData
                  .filter(s => s.label === 'Pending' || s.label === 'Overdue')
                  .reduce((sum, s) => sum + s.value, 0) > 0 && (
                  <View style={styles.notificationBadgeTextContainer}>
                    <Text style={styles.notificationBadgeText}>
                      {statsData
                        .filter(s => s.label === 'Pending' || s.label === 'Overdue')
                        .reduce((sum, s) => sum + s.value, 0)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* BODY */}
          <Text style={styles.sectionTitle}>My Stats</Text>
          <StatsSection />

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ActionsSection />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Assignment</Text>
          <RecentAssignmentsSection />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Announcements</Text>
          <Animated.View style={styles.announcementsContainer}>
            {announcements.length === 0 ? (
              <Text style={[styles.noAnnouncementsText, { color: colors.textLight }]}>No announcements at this time</Text>
            ) : (
              announcements.map((announcement, idx) => (
                <View key={announcement.id || idx} style={[styles.announcementCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.announcementTitle, { color: colors.text }]}>{announcement.title}</Text>
                  <Text style={[styles.announcementText, { color: colors.text }]}>{announcement.content}</Text>
                  <Text style={[styles.announcementDate, { color: colors.textLight }]}>
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </Animated.View>

          {/* Performance Insights */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance Insights</Text>
          <View style={[styles.performanceCard, { backgroundColor: colors.surface }]}>
            <View style={styles.performanceHeader}>
              <Ionicons name="analytics-outline" size={20} color={colors.primary} />
              <Text style={[styles.performanceTitle, { color: colors.text }]}>Your Performance</Text>
            </View>
            <Text style={[styles.performanceText, { color: colors.textLight }]}>
              {performanceInsights.message || 'No data available yet.'}
            </Text>
            <View style={styles.performanceMetrics}>
              <View style={styles.performanceMetricItem}>
                <Text style={[styles.performanceMetricValue, { color: colors.primary }]}>{performanceInsights.resolutionRate}%</Text>
                <Text style={[styles.performanceMetricLabel, { color: colors.textLight }]}>Resolved</Text>
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
                  {performanceInsights.trend.charAt(0).toUpperCase() + performanceInsights.trend.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.performanceBar}>
              <View style={[styles.performanceBarFill, { width: `${performanceInsights.resolutionRate}%`, backgroundColor: performanceInsights.resolutionRate >= 80 ? '#4CAF50' : performanceInsights.resolutionRate >= 50 ? '#FF9800' : '#FF3B30' }]} />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  container: { paddingHorizontal: 25, paddingTop: Platform.OS === 'ios' ? 50 : 65 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  topIcons: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#0F3057' },
  headerFullName: { fontSize: 22, fontWeight: '800', color: '#0F3057', marginTop: 4 },
  headerSubtitle: { fontSize: 16, fontWeight: '600', color: '#0F3057', marginTop: 4 },
  profileContainer: { position: 'relative', marginRight: 12 },
  profileAvatarBtn: {
    position: 'relative',
  },
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
  editIcon: {
    position: 'absolute',
    right: -20,
    top: -8,
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 12,
    elevation: 2,
  },
  profileCamera: {
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
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0F3057', marginBottom: 12, marginTop: 16 },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  statCard: { width: '48%', padding: 16, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statLabel: { marginTop: 4, color: '#fff', fontSize: 12 },
  actionCard: { width: '48%', padding: 16, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 2 },
  actionText: { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#fff' },
  complaintCard: { padding: 14, borderRadius: 10, marginBottom: 10, elevation: 1 },
  complaintTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  complaintStatus: { marginTop: 3, fontSize: 11, fontWeight: '600', color: '#fff' },
  notificationBadgeTextContainer: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  announcementsContainer: {
    marginBottom: 20,
  },
  announcementCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F3057',
    marginBottom: 5,
  },
  announcementText: { fontSize: 14, color: '#0F3057' },
  announcementDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
  },
  noAnnouncementsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },

  // Performance Insights Styles
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
  performanceText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
    lineHeight: 18,
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
});