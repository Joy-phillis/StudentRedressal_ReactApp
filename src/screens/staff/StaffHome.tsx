import React, { useEffect, useState } from 'react';
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

const { width } = Dimensions.get('window');

export default function StaffHome({ navigation }: any) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [assignedList, setAssignedList] = useState<any[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>(''); // fetched from Supabase

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

        // Fetch assigned complaints
        fetchAssignedComplaints(user.id);
      } catch (err: any) {
        console.log('Error fetching profile:', err.message);
      }
    };

    getStaffProfile();
  }, []);

  const fetchAssignedComplaints = async (staff_id: string) => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('assigned_to', staff_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignedList(data || []);
    } catch {
      Alert.alert('Error', 'Could not fetch assigned complaints');
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
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => supabase.auth.signOut().then(() => navigation.replace('Login')),
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7FB" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
        <Animated.View style={[styles.container, headerStyle]}>
          {/* HEADER */}
          <View style={styles.header}>
        <View>
  <Text style={styles.headerTitle}>Welcome Back,</Text>
  {fullName ? (
    <Text style={styles.headerFullName}>{fullName}</Text>
  ) : (
    <Text style={styles.headerSubtitle}>Loading...</Text>
  )}
</View>
            <View style={styles.topIcons}>
              <TouchableOpacity onPress={handleLogout} style={{ marginRight: 8 }}>
                <Ionicons name="log-out-outline" size={26} color="#0F3057" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileContainer} onPress={() => navigation.navigate('Profile')}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileAvatar} />
                ) : (
                  <View style={styles.profileAvatar}>
                    <Ionicons name="person-circle-outline" size={36} color="#fff" />
                  </View>
                )}
                <TouchableOpacity style={styles.profileCamera} onPress={handleUploadPhoto}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>

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

          <Text style={styles.sectionTitle}>Recent Assignment</Text>
          <RecentAssignmentsSection />
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
});