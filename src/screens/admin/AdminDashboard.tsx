import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
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

const { width } = Dimensions.get('window');

export default function AdminDashboard({ navigation }: any) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { logout } = useAuth();

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

  // 🔹 ANIMATIONS (UNCHANGED)
  const fade = useSharedValue(0);
  const slide = useSharedValue(40);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.exp) });
    slide.value = withSpring(0, { damping: 14, stiffness: 120 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: slide.value }],
  }));

  // 🔹 FETCH DASHBOARD DATA
  const fetchDashboardData = async () => {
    // USERS
    const { data: users } = await supabase.from('profiles').select('role');

    let students = 0;
    let staff = 0;

    if (users) {
      students = users.filter(u => u.role === 'student').length;
      staff = users.filter(u => u.role === 'staff').length;
    }

    // COMPLAINTS
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
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
        setProfileImage(result.assets[0].uri as string);
        Alert.alert('Success', 'Profile image updated!');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open photo library');
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7FB" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
        <Animated.View style={[styles.container, animatedStyle]}>

          {/* EVERYTHING BELOW IS 100% YOUR ORIGINAL UI — UNTOUCHED */}

          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Welcome Back,</Text>
              <Text style={styles.headerSubtitle}>System Administrator</Text>
            </View>

            <View style={styles.topIcons}>
              <TouchableOpacity onPress={handleLogout} style={{ marginRight: 8 }}>
                <Ionicons name="log-out-outline" size={26} color="#0F3057" />
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

              <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => navigation.navigate('AllComplaints')}>
                <Ionicons name="notifications-outline" size={24} color="#0F3057" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.alertBox}>
            <Ionicons name="alert-circle-outline" size={22} color="#fff" />
            <Text style={styles.alertText}>
              {breakdown[3].value} Complaints are overdue and require immediate attention.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.kpiContainer}>
            {kpis.map((item, i) => (
              <View key={i} style={[styles.kpiCard, { transform: [{ translateY: i % 2 ? 6 : 0 }] }]}>
                <Text style={styles.kpiValue}>{item.value}</Text>
                <Text style={styles.kpiLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Complaint Breakdown</Text>
          <View style={styles.breakdownContainer}>
            {breakdown.map((b, i) => (
              <View key={i} style={[styles.breakdownCard, { backgroundColor: b.color }]}>
                <Text style={styles.breakdownValue}>{b.value}</Text>
                <Text style={styles.breakdownLabel}>{b.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Management Tools</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity style={styles.toolCard} onPress={() => navigation.navigate('AllComplaints')}>
              <Ionicons name="list" size={28} color="#1E5F9E" />
              <Text style={styles.toolText}>All Complaints</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolCard} onPress={() => navigation.navigate('ManageStaff')}>
              <Ionicons name="people" size={28} color="#1E5F9E" />
              <Text style={styles.toolText}>Manage Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolCard} onPress={() => navigation.navigate('ManageStudents')}>
              <Ionicons name="school" size={28} color="#1E5F9E" />
              <Text style={styles.toolText}>Manage Students</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolCard} onPress={() => navigation.navigate('Reports')}>
              <Ionicons name="bar-chart" size={28} color="#1E5F9E" />
              <Text style={styles.toolText}>Reports</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Recent Complaints</Text>
          <FlatList data={recentComplaints} keyExtractor={item => item.id} renderItem={renderComplaint} scrollEnabled={false} />

          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceText}>Average resolution time has improved by 12% this month.</Text>
            <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 6, overflow: 'hidden' }}>
              <View style={{ width: '72%', height: '100%', backgroundColor: '#1E5F9E' }} />
            </View>
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
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  performanceText: { fontSize: 13, color: '#555', marginBottom: 8 },
});