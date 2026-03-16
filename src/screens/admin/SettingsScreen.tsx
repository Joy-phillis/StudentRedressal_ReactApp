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
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  primary: '#1E5F9E',
  secondary: '#FF3B30',
  background: '#F4F7FB',
  backgroundDark: '#1A1A2E',
  surface: '#FFFFFF',
  surfaceDark: '#16213E',
  text: '#0F3057',
  textDark: '#E8E8E8',
  textLight: '#6B7280',
  textLightDark: '#A0A0A0',
};

const DARK_COLORS = {
  primary: '#3B82F6',
  secondary: '#FF3B30',
  background: '#1A1A2E',
  surface: '#16213E',
  text: '#E8E8E8',
  textLight: '#A0A0A0',
};

export default function AdminSettingsScreen() {
  const navigation = useNavigation<any>();
  const { isDark, toggleTheme, colors } = useTheme();
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
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);

  // Animation values for modals
  const modalTranslateY = useSharedValue(100);
  const modalOpacity = useSharedValue(0);
  const passwordModalTranslateY = useSharedValue(100);
  const passwordModalOpacity = useSharedValue(0);

  useEffect(() => {
    if (supportModal) {
      modalTranslateY.value = withTiming(0, { duration: 300 });
      modalOpacity.value = withTiming(1, { duration: 300 });
    } else {
      modalTranslateY.value = withTiming(100, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [supportModal]);

  useEffect(() => {
    if (passwordModal) {
      passwordModalTranslateY.value = withTiming(0, { duration: 300 });
      passwordModalOpacity.value = withTiming(1, { duration: 300 });
    } else {
      passwordModalTranslateY.value = withTiming(100, { duration: 200 });
      passwordModalOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [passwordModal]);

  const headerScale = useSharedValue(0.9);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerScale.value = withSpring(1);
    headerOpacity.value = withTiming(1, { duration: 400 });
    fetchProfile();
  }, []);

  // Sync darkMode state with ThemeContext
  useEffect(() => {
    setDarkMode(isDark);
  }, [isDark]);

  const toggleDarkMode = async (value: boolean) => {
    setDarkMode(value);
    toggleTheme(value); // Use ThemeContext's toggleTheme
  };

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
      Alert.alert('Error', 'All password fields are required');
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
    try {
      // First verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        setLoadingPassword(false);
        return;
      }

      // Update password via Supabase Auth
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Success', 'Password updated successfully');
      setPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleSendSupport = async () => {
    if (!supportSubject.trim()) {
      Alert.alert('Error', 'Please enter a subject.');
      return;
    }
    if (!supportMessage.trim()) {
      Alert.alert('Error', 'Please enter a message.');
      return;
    }
    
    setLoadingSupport(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated.');
        setLoadingSupport(false);
        return;
      }

      // Insert messages for both students and staff (separate entries per receiver_type)
      const messageTypes = ['student', 'staff'] as const;
      const messagePromises = messageTypes.map(async (receiverType) => {
        const { error } = await supabase
          .from('messages')
          .insert([{
            sender_id: user.id,
            sender_type: 'admin',
            receiver_type: receiverType,
            subject: supportSubject,
            content: supportMessage,
            message_type: 'notification'  // Valid value per schema
          }]);
        if (error) throw error;
      });

      await Promise.all(messagePromises);

      // Create notifications for all students and staff
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, role')
        .in('role', ['student', 'staff']);

      if (profiles && profiles.length > 0) {
        const notifications = profiles.map(p => ({
          recipient_id: p.id,
          recipient_type: p.role,
          title: supportSubject,
          message: supportMessage,
          type: 'announcement',
          is_read: false
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) throw notifError;
      }

      Alert.alert('Success', 'Message sent successfully to all students and staff!');
      setSupportSubject('');
      setSupportMessage('');
      setSupportModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message.');
    } finally {
      setLoadingSupport(false);
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
        <ActivityIndicator size="large" color={darkMode ? COLORS.primary : COLORS.primary} />
      </View>
    );
  }

  // Dynamic colors based on dark mode
  const currentColors = darkMode ? DARK_COLORS : COLORS;
  const containerStyle = {
    backgroundColor: darkMode ? COLORS.backgroundDark : COLORS.background,
  };
  const surfaceStyle = {
    backgroundColor: darkMode ? COLORS.surfaceDark : COLORS.surface,
  };
  const textStyle = {
    color: darkMode ? COLORS.textDark : COLORS.text,
  };
  const textLightStyle = {
    color: darkMode ? COLORS.textLightDark : COLORS.textLight,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={darkMode ? COLORS.backgroundDark : COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PROFILE HEADER */}
        <Animated.View style={[styles.profileCard, headerStyle, surfaceStyle]}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleUploadPhoto}>
              {profile.image ? (
                <Image source={{ uri: profile.image }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: darkMode ? COLORS.primary : COLORS.primary }]}>
                  <Ionicons name="person" size={40} color="#fff" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.name, textStyle]}>{profile.name}</Text>
              <Text style={[styles.email, textLightStyle]}>{profile.email}</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('AdminProfile')}>
              <Ionicons name="pencil" size={20} color={darkMode ? COLORS.primary : COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* DASHBOARD */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, textStyle]}>Dashboard</Text>

          <TouchableOpacity
            style={[styles.dashboardCard, surfaceStyle]}
            onPress={() => navigation.navigate('Staff')}
          >
            <MaterialIcons name="people-outline" size={24} color={darkMode ? COLORS.primary : COLORS.primary} />
            <Text style={[styles.dashboardText, textStyle]}>Manage Staff</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dashboardCard, surfaceStyle]}
            onPress={() => navigation.navigate('Complaints')}
          >
            <MaterialIcons name="error-outline" size={24} color={darkMode ? COLORS.primary : COLORS.primary} />
            <Text style={[styles.dashboardText, textStyle]}>View Complaints</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dashboardCard, surfaceStyle]}
            onPress={() => navigation.navigate('Students')}
          >
            <MaterialIcons name="assignment" size={24} color={darkMode ? COLORS.primary : COLORS.primary} />
            <Text style={[styles.dashboardText, textStyle]}>Manage Students</Text>
          </TouchableOpacity>
        </View>

        {/* PREFERENCES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, textStyle]}>Preferences</Text>
          {renderToggle('Push Notifications', notifications, setNotifications)}
          {renderToggle('Dark Mode', darkMode, toggleDarkMode)}
        </View>

        {/* SECURITY */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, textStyle]}>Security</Text>
          {renderToggle('Two-Factor Authentication', twoFactor, setTwoFactor)}
          <TouchableOpacity style={[styles.actionItem, surfaceStyle]} onPress={() => setPasswordModal(true)}>
            <Text style={[styles.actionText, textStyle]}>Change Password</Text>
            <Ionicons name="chevron-forward" size={18} color={darkMode ? COLORS.textDark : COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, textStyle]}>Help & FAQ</Text>
          {faqs.map((f, i) => (
            <View key={i} style={[styles.faqItem, surfaceStyle]}>
              <TouchableOpacity onPress={() => toggleFaq(i)} style={styles.faqHeader}>
                <Text style={[styles.faqQ, textStyle]}>{f.q}</Text>
                <Ionicons name={openFaqIndex === i ? 'chevron-up' : 'chevron-down'} size={20} color={darkMode ? COLORS.textDark : COLORS.text} />
              </TouchableOpacity>
              {openFaqIndex === i && <Text style={[styles.faqA, textLightStyle]}>{f.a}</Text>}
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
      <Modal visible={passwordModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setPasswordModal(false)}>
          <Animated.View style={[styles.modalContent, { opacity: passwordModalOpacity, transform: [{ translateY: passwordModalTranslateY }] }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="lock-closed-outline" size={24} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModal(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Current Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Current Password *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter current password"
                    secureTextEntry={!showCurrent}
                    style={[styles.input, { paddingHorizontal: 40 }]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholderTextColor={COLORS.textLight}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowCurrent(!showCurrent)}>
                    <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>New Password *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="key-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter new password"
                    secureTextEntry={!showNew}
                    style={[styles.input, { paddingHorizontal: 40 }]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholderTextColor={COLORS.textLight}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNew(!showNew)}>
                    <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm New Password *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="key-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirm}
                    style={[styles.input, { paddingHorizontal: 40 }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholderTextColor={COLORS.textLight}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {loadingPassword ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={COLORS.primary} />
            ) : (
              <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword}>
                <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Update Password</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={() => setPasswordModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* SUPPORT MODAL */}
      <Modal visible={supportModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setSupportModal(false)}>
          <Animated.View style={[styles.modalContent, { opacity: modalOpacity, transform: [{ translateY: modalTranslateY }] }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="chatbox-ellipses-outline" size={24} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Send Support Message</Text>
              <TouchableOpacity onPress={() => setSupportModal(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Subject *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { paddingHorizontal: 16 }]}
                    placeholder="Enter subject"
                    placeholderTextColor={COLORS.textLight}
                    value={supportSubject}
                    onChangeText={setSupportSubject}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Message *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { height: 120, textAlignVertical: 'top', paddingHorizontal: 16 }]}
                    placeholder="Describe your issue..."
                    placeholderTextColor={COLORS.textLight}
                    multiline
                    numberOfLines={4}
                    value={supportMessage}
                    onChangeText={setSupportMessage}
                  />
                </View>
                <Text style={styles.counterText}>{supportMessage.length}/500</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={handleSendSupport} disabled={loadingSupport}>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>{loadingSupport ? 'Sending...' : 'Send Message'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setSupportModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  function renderToggle(label: string, value: boolean, setter: any) {
    return (
      <View style={[styles.toggleItem, surfaceStyle]}>
        <Text style={[styles.toggleText, textStyle]}>{label}</Text>
        <Switch 
          value={value} 
          onValueChange={setter}
          trackColor={{ true: darkMode ? COLORS.primary : '#1E5F9E', false: '#ccc' }}
          thumbColor={Platform.OS === 'android' ? (darkMode ? COLORS.surfaceDark : '#fff') : undefined}
        />
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
  modalContent: { width: '90%', maxWidth: 400, maxHeight: '80%', backgroundColor: COLORS.surface, borderRadius: 20, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  modalScroll: { paddingHorizontal: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: COLORS.surface },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginLeft: 12, flex: 1 },
  inputContainer: { paddingVertical: 8, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: COLORS.surface, overflow: 'hidden', minHeight: 50, marginBottom: 12 },
  input: { flex: 1, borderWidth: 0, borderRadius: 0, paddingHorizontal: 40, paddingVertical: 14, fontSize: 16, color: COLORS.text, minHeight: 50 },
  inputIcon: { position: 'absolute', left: 14, zIndex: 10 },
  eyeIcon: { position: 'absolute', right: 14, padding: 10, zIndex: 10 },
  counterText: { fontSize: 12, color: COLORS.textLight, alignSelf: 'flex-end', marginTop: 4, marginBottom: 8 },
  modalButton: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 24, marginBottom: 16, marginTop: 8 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  cancelButton: { alignItems: 'center', paddingVertical: 16, marginBottom: 24 },
  cancelText: { color: COLORS.secondary, fontSize: 16, fontWeight: '600' },
});