import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  Platform,
  LayoutAnimation,
  UIManager,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  primary: '#1E5F9E',
  secondary: '#FF3B30',
  background: '#F4F7FB',
  surface: '#FFFFFF',
  text: '#0F3057',
  textLight: '#6B7280',
};

export default function AdminSettingsScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>({});
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [supportModal, setSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);

  const headerScale = useSharedValue(0.9);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerScale.value = withSpring(1);
    headerOpacity.value = withTiming(1, { duration: 400 });
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Error', 'Could not fetch user info');
      setLoadingProfile(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('id', user.id)
      .single();

    if (profileError) {
      Alert.alert('Error', profileError.message);
      setLoadingProfile(false);
      return;
    }

    setProfile({
      id: user.id,
      name: profileData.full_name,
      email: profileData.email,
      image: profileData.avatar_url || null,
    });
    setLoadingProfile(false);
  };

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  const faqs = [
    { q: 'How do I assign complaints?', a: 'Open the complaint and assign to staff via the Assign button.' },
    { q: 'How to escalate issues?', a: 'Select Escalate on a complaint to notify higher authority.' },
    { q: 'How do I update my profile?', a: 'Tap your avatar or use the edit button to change profile details.' },
  ];

  const handleUploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow gallery access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfile({ ...profile, image: result.assets[0].uri });
      Alert.alert('Success', 'Profile photo updated!');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoadingPassword(false);

    if (error) Alert.alert('Error', error.message);
    else {
      Alert.alert('Success', 'Password updated successfully');
      setPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  };

  const handleSendSupport = async () => {
    if (!supportMessage) {
      Alert.alert('Error', 'Please enter a message.');
      return;
    }
    setLoadingSupport(true);
    const { error } = await supabase.from('support_messages').insert([
      { message: supportMessage, admin_email: profile.email },
    ]);
    setLoadingSupport(false);
    if (error) Alert.alert('Error', error.message);
    else {
      Alert.alert('Success', 'Message sent successfully');
      setSupportMessage('');
      setSupportModal(false);
    }
  };

  const toggleFaq = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaqIndex(openFaqIndex === i ? null : i);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await supabase.auth.signOut() },
    ]);
  };

  if (loadingProfile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PROFILE HEADER */}
        <Animated.View style={[styles.profileCard, headerStyle]}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleUploadPhoto}>
              {profile.image ? (
                <Image source={{ uri: profile.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={40} color="#fff" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.email}>{profile.email}</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('AdminProfile')}>
              <Ionicons name="pencil" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* DASHBOARD */}
       {/* DASHBOARD */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Dashboard</Text>

  <TouchableOpacity
    style={styles.dashboardCard}
    onPress={() => navigation.navigate('Staff')}
  >
    <MaterialIcons name="people-outline" size={24} color={COLORS.primary} />
    <Text style={styles.dashboardText}>Manage Staff</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.dashboardCard}
    onPress={() => navigation.navigate('Complaints')}
  >
    <MaterialIcons name="error-outline" size={24} color={COLORS.primary} />
    <Text style={styles.dashboardText}>View Complaints</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.dashboardCard}
    onPress={() => navigation.navigate('Students')}
  >
    <MaterialIcons name="assignment" size={24} color={COLORS.primary} />
    <Text style={styles.dashboardText}>Manage Students</Text>
  </TouchableOpacity>
</View>

        {/* PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          {renderToggle('Push Notifications', notifications, setNotifications)}
          {renderToggle('Dark Mode', darkMode, setDarkMode)}
        </View>

        {/* SECURITY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          {renderToggle('Two-Factor Authentication', twoFactor, setTwoFactor)}
          <TouchableOpacity style={styles.actionItem} onPress={() => setPasswordModal(true)}>
            <Text style={styles.actionText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={18} />
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & FAQ</Text>
          {faqs.map((f, i) => (
            <View key={i} style={styles.faqItem}>
              <TouchableOpacity onPress={() => toggleFaq(i)} style={styles.faqHeader}>
                <Text style={styles.faqQ}>{f.q}</Text>
                <Ionicons name={openFaqIndex === i ? 'chevron-up' : 'chevron-down'} size={20} />
              </TouchableOpacity>
              {openFaqIndex === i && <Text style={styles.faqA}>{f.a}</Text>}
            </View>
          ))}
          <TouchableOpacity style={styles.contactBtn} onPress={() => setSupportModal(true)}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color="#fff" />
            <Text style={styles.contactText}>Send Support Message</Text>
          </TouchableOpacity>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PASSWORD MODAL */}
      <Modal visible={passwordModal} transparent animationType="slide">
        <Animated.View style={[styles.modalContainer, headerStyle]}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Change Password</Text>

            {/* Current Password */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                placeholder="Current Password"
                secureTextEntry={!showCurrent}
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowCurrent(!showCurrent)}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                placeholder="New Password"
                secureTextEntry={!showNew}
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNew(!showNew)}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                placeholder="Confirm New Password"
                secureTextEntry={!showConfirm}
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {loadingPassword ? (
              <ActivityIndicator style={{ marginTop: 12 }} />
            ) : (
              <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Update Password</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setPasswordModal(false)}>
              <Text style={{ marginTop: 10, color: COLORS.secondary, textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      {/* SUPPORT MODAL */}
      <Modal visible={supportModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Send Message</Text>
            <TextInput
              placeholder="Write your message..."
              multiline
              style={[styles.input, { height: 120 }]}
              value={supportMessage}
              onChangeText={setSupportMessage}
            />
            {loadingSupport ? (
              <ActivityIndicator style={{ marginTop: 12 }} />
            ) : (
              <TouchableOpacity style={styles.modalButton} onPress={handleSendSupport}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Send</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setSupportModal(false)}>
              <Text style={{ marginTop: 10, color: COLORS.secondary, textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  function renderToggle(label: string, value: boolean, setter: any) {
    return (
      <View style={styles.toggleItem}>
        <Text style={styles.toggleText}>{label}</Text>
        <Switch value={value} onValueChange={setter} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 35 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: { backgroundColor: COLORS.surface, margin: 16, padding: 16, borderRadius: 12, elevation: 2 },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', right: 0, bottom: 0, backgroundColor: COLORS.primary, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  email: { color: COLORS.textLight, marginTop: 4 },
  section: { marginVertical: 12, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  toggleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  toggleText: { color: COLORS.text, fontSize: 15 },
  actionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  actionText: { fontSize: 15, color: COLORS.text },
  dashboardCard: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: COLORS.surface, borderRadius: 12, marginVertical: 6, elevation: 1 },
  dashboardText: { marginLeft: 12, fontSize: 15, fontWeight: '600', color: COLORS.text },
  faqItem: { backgroundColor: COLORS.surface, padding: 12, borderRadius: 10, marginBottom: 8 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  faqA: { marginTop: 6, color: COLORS.textLight },
  contactBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, marginTop: 6 },
  contactText: { color: '#fff', marginLeft: 8 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.secondary, padding: 15, margin: 16, borderRadius: 12 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: COLORS.surface, padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: COLORS.text, textAlign: 'center' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, position: 'relative' },
  inputIcon: { position: 'absolute', left: 10, zIndex: 10 },
  input: { flex: 1, backgroundColor: '#f2f2f2', padding: 12, borderRadius: 8, paddingLeft: 36 },
  eyeIcon: { position: 'absolute', right: 10 },
  modalButton: { backgroundColor: COLORS.primary, padding: 12, alignItems: 'center', borderRadius: 8, marginTop: 8 },
});