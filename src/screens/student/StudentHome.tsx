import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ProfileContext } from '../../context/ProfileContext';
import { supabase } from '../../services/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function StudentHome({ navigation }: any) {
  const { profile, setProfile } = useContext(ProfileContext);
  const { logout } = useAuth();

  // 🔹 NEW STATES (for Supabase data)
  const [studentName, setStudentName] = useState<string>('Loading...');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [performanceInsights, setPerformanceInsights] = useState({
    avgResolutionDays: 0,
    resolutionRate: 0,
    trend: 'stable',
    message: '',
  });

  // 🔹 FETCH FROM SUPABASE
  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Fetch error:', error.message);
      return;
    }

    if (data) {
      setComplaints(data.slice(0, 5)); // latest 5 only
      setTotalCount(data.length);
      setPendingCount(data.filter(item => item.status === 'Pending').length);
      setResolvedCount(data.filter(item => item.status === 'Resolved').length);

      // Calculate performance insights
      const resolved = data.filter(c => c.status === 'Resolved');
      const resolutionRate = data.length > 0 ? Math.round((resolved.length / data.length) * 100) : 0;
      const avgResolutionDays = resolved.length > 0 ? 3.5 : 0; // Mock - would need resolved_at for accurate
      
      let trend = 'stable';
      let message = '';
      
      if (resolutionRate >= 80) {
        trend = 'improving';
        message = `Great! ${resolutionRate}% of your complaints have been resolved.`;
      } else if (resolutionRate >= 50) {
        trend = 'stable';
        message = `${resolutionRate}% resolution rate. ${data.filter(c => c.status === 'Pending').length} pending.`;
      } else {
        trend = 'declining';
        message = `${data.filter(c => c.status === 'Pending').length} complaints awaiting resolution.`;
      }

      setPerformanceInsights({
        avgResolutionDays,
        resolutionRate,
        trend,
        message,
      });
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

  const fetchUnreadNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('is_read', false)
      .eq('recipient_type', 'student');

    if (error) {
      console.log('Fetch notifications error:', error.message);
      return;
    }

    if (data) {
      setUnreadNotificationCount(data.length);
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
          filter: `recipient_type=eq.student`,
        },
        (payload) => {
          console.log('Real-time notification update:', payload);
          fetchUnreadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setProfile({ image: uri });
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open photo library');
    }
  };

  // Animations (UNCHANGED)
  const headerOpacity = useSharedValue(0);
  const statsTranslate = useSharedValue(50);
  const actionsScale = useSharedValue(0.8);
  const complaintsScale = useSharedValue(0.8);
  const announcementsTranslate = useSharedValue(50);

  const fetchStudentProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url, registration_number')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('Profile fetch error:', profileError.message);
      } else if (profileData) {
        setStudentName(profileData.full_name);
        setProfile({
          name: profileData.full_name,
          email: profileData.email,
          image: profileData.avatar_url || profile.image,
          registration: profileData.registration_number || profile.registration || ''
        });
      }
    } catch (error) {
      console.log('Error fetching student profile:', error);
    }
  };

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
    statsTranslate.value = withSpring(0, { damping: 12, stiffness: 90 });
    actionsScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    complaintsScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    announcementsTranslate.value = withSpring(0, { damping: 12, stiffness: 90 });

    fetchStudentProfile();
    fetchComplaints(); // 🔹 added
    fetchAnnouncements(); // 🔹 added
    fetchUnreadNotifications(); // 🔹 added
  }, []);

  // 🔹 Refresh when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchStudentProfile();
      fetchComplaints();
      fetchAnnouncements();
      fetchUnreadNotifications();
    }, [])
  );

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: interpolate(headerOpacity.value, [0, 1], [20, 0]) }],
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

  const announcementsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: announcementsTranslate.value }],
  }));

const handleLogout = () => {
  Alert.alert('Logout', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Logout',
      style: 'destructive',
      onPress: async () => {
        await supabase.auth.signOut(); // RootNavigator will now detect this
      },
    },
  ]);
};

  const renderComplaintCard = ({ item }: any) => {
    let bgColor = '#1E5F9E';
    if (item.status === 'Pending') bgColor = '#FF9800';
    if (item.status === 'Resolved') bgColor = '#4CAF50';

    return (
      <Animated.View style={[styles.complaintCard, { backgroundColor: bgColor }, complaintsStyle]}>
        <Text style={styles.complaintTitle}>{item.title}</Text>
        <Text style={styles.complaintStatus}>{item.status}</Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7FB" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
        <Animated.View style={[styles.container, headerStyle]}>
          {/* Top Header */}
          <View style={styles.headerContainer}>
            <View>
              <Text style={styles.welcome}>Welcome Back 👋</Text>
              <Text style={styles.subtitle}>{studentName}</Text>
            </View>
            <View style={styles.topIcons}>
              <TouchableOpacity
                style={[styles.iconButton, { marginRight: 8 }]}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={30} color="#0F3057" />
                {unreadNotificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadNotificationCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={{ marginRight: 8 }}>
                <Ionicons name="log-out-outline" size={26} color="#0F3057" />
              </TouchableOpacity>
              <View style={styles.profileContainer}>
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={() => navigation.navigate('Profile')}
                >
                  {profile.image ? (
                    <Image source={{ uri: profile.image }} style={styles.profileAvatar} />
                  ) : (
                    <View style={styles.profileAvatar}>
                      <Text style={styles.profileAvatarText}>
                        {profile.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileCamera} onPress={handleUploadPhoto}>
                  <View style={styles.profileCameraBg}>
                    <Ionicons name="camera" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <Animated.View style={[styles.statsContainer, statsStyle]}>
            {[
              { icon: 'document-text-outline', label: 'Total Complaints', value: totalCount, color: '#1E5F9E' },
              { icon: 'time-outline', label: 'Pending', value: pendingCount, color: '#FF9800' },
              { icon: 'checkmark-circle-outline', label: 'Resolved', value: resolvedCount, color: '#4CAF50' },
            ].map((stat, idx) => (
              <View key={idx} style={[styles.statCard, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon as any} size={28} color="#fff" />
                <Text style={styles.statNumber}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Animated.View style={[actionStyle]}>
            {[
              { icon: 'add-circle-outline', label: 'Submit New Complaint', screen: 'Complaints', color: '#1E5F9E' },
              { icon: 'analytics-outline', label: 'View Reports', screen: 'Reports', color: '#0F3057' },
            ].map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.actionCard, { backgroundColor: action.color }]}
                onPress={() => {
                  if (action.screen === 'Reports') {
                    navigation.navigate('Reports' as never);
                  } else {
                    navigation.navigate(action.screen as never);
                  }
                }}
              >
                <Ionicons name={action.icon as any} size={28} color="#fff" />
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Recent Complaints */}
          <Text style={styles.sectionTitle}>Recent Complaints</Text>
          <FlatList
            data={complaints}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 5 }}
            renderItem={renderComplaintCard}
          />

          {/* Announcements */}
          <Text style={styles.sectionTitle}>Announcements</Text>
          <Animated.View style={[announcementsStyle]}>
            {announcements.length === 0 ? (
              <Text style={styles.noAnnouncementsText}>No announcements at this time</Text>
            ) : (
              <View style={styles.announcementsContainer}>
                {announcements.map((announcement, idx) => (
                  <View key={announcement.id || idx} style={styles.announcementCard}>
                    <Text style={styles.announcementTitle}>{announcement.title}</Text>
                    <Text style={styles.announcementText}>{announcement.content}</Text>
                    <Text style={styles.announcementDate}>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Performance Insights */}
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <Ionicons name="analytics-outline" size={20} color="#1E5F9E" />
              <Text style={styles.performanceTitle}>Your Complaint Performance</Text>
            </View>
            <Text style={styles.performanceText}>
              {performanceInsights.message || 'No data available yet.'}
            </Text>
            <View style={styles.performanceMetrics}>
              <View style={styles.performanceMetricItem}>
                <Text style={styles.performanceMetricValue}>{performanceInsights.resolutionRate}%</Text>
                <Text style={styles.performanceMetricLabel}>Resolved</Text>
              </View>
              <View style={styles.performanceMetricItem}>
                <Text style={styles.performanceMetricValue}>{performanceInsights.avgResolutionDays.toFixed(1)}</Text>
                <Text style={styles.performanceMetricLabel}>Avg Days</Text>
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
  container: { paddingHorizontal: 20, paddingTop: 70 },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },

  welcome: { fontSize: 26, fontWeight: '700', color: '#0F3057' },
  subtitle: { 
    fontSize: 26,
    fontWeight: '700',
    color: '#1E5F9E',
    marginTop: 4,
    letterSpacing: 0.3
  },

  topIcons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 15, position: 'relative' },
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
  profileButton: {
    marginLeft: -25,
    borderRadius: 5,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#1E5F9E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F4F7FB',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  profileAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  profileContainer: {
    marginLeft: 20,
    position: 'relative',
  },
  profileCamera: {
    position: 'absolute',
    right: -6,
    bottom: -6,
  },
  profileCameraBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E5F9E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F4F7FB',
    elevation: 3,
  },

  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: {
    width: '30%',
    paddingVertical: 25,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 5 },
  statLabel: { fontSize: 12, color: '#fff', marginTop: 2, textAlign: 'center' },

  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0F3057', marginBottom: 15 },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
  },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 12 },

  complaintCard: {
    width: width * 0.6,
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 7,
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  complaintTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  complaintStatus: { color: '#fff', marginTop: 5 },

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
  announcementsContainer: {
    // Remove maxHeight to allow all announcements to be visible
    // The main ScrollView will handle scrolling for the entire page
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
