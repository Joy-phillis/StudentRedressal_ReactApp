import React, { useState, useEffect, useContext } from 'react';
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
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ProfileContext, ProfileData } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

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
  border: '#E5E7EB',
};

const DARK_COLORS = {
  primary: '#3B82F6',
  secondary: '#FF3B30',
  background: '#1A1A2E',
  surface: '#16213E',
  text: '#E8E8E8',
  textLight: '#A0A0A0',
};

const faqs = [
  { q: 'How can I track my complaint?', a: 'Go to Dashboard → My Complaints to see status updates.' },
  { q: 'How long does resolution take?', a: 'Most issues are resolved within 3–7 working days.' },
  { q: 'Is my complaint confidential?', a: 'Yes. Your complaint is visible only to assigned authorities.' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { profile, setProfile } = useContext(ProfileContext);
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [supportModal, setSupportModal] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);

  // Animation values for support modal
  const modalTranslateY = useSharedValue(100);
  const modalOpacity = useSharedValue(0);
  const inputScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const [supabaseProfile, setSupabaseProfile] = useState<any>(null);
  const [registrationNumber, setRegistrationNumber] = useState('');

  const headerScale = useSharedValue(0.9);
  const headerOpacity = useSharedValue(0);

  // Fetch profile data from Supabase
  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.log('Profile fetch error:', profileError.message);
        } else if (profileData) {
          setSupabaseProfile(profileData);
          setProfile({
            name: profileData.full_name,
            email: profileData.email,
            image: profileData.avatar_url || profile.image,
            registration: profileData.registration_number || profile.registration
          });
        }

        // Fetch registration number from complaints table
        const { data: complaintData, error: complaintError } = await supabase
          .from('complaints')
          .select('registration_number')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (complaintError) {
          console.log('Complaint fetch error:', complaintError.message);
        } else if (complaintData) {
          setRegistrationNumber(complaintData.registration_number);
          setProfile({ registration: complaintData.registration_number });
        }
      }
    } catch (error) {
      console.log('Error fetching profile data:', error);
    }
  };

  useEffect(() => {
    fetchProfileData();
    headerScale.value = withSpring(1);
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  // Sync darkMode state with ThemeContext
  useEffect(() => {
    setDarkMode(isDark);
  }, [isDark]);

  const toggleDarkMode = async (value: boolean) => {
    setDarkMode(value);
    toggleTheme(value); // Use ThemeContext's toggleTheme
  };

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

  const buttonPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

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
      setProfile({ image: result.assets[0].uri });
      Alert.alert('Success', 'Profile updated successfully.');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    setLoadingPassword(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password updated successfully.');
      setPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

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
    buttonScale.value = withSpring(0.95);
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
          sender_type: 'student',
          receiver_type: 'admin',
          subject: supportSubject,
          content: supportMessage,
          message_type: 'support'
        }]);
      if (error) throw error;
      Alert.alert('Success', 'Message sent successfully to support team!');
      setSupportModal(false);
      setSupportSubject('');
      setSupportMessage('');
      modalTranslateY.value = 100;
      modalOpacity.value = 0;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message.');
    } finally {
      setLoadingSupport(false);
      buttonScale.value = withSpring(1);
    }
  };

  const handleInputFocus = () => {
    inputScale.value = withSpring(1.02);
  };

  const handleInputBlur = () => {
    inputScale.value = withSpring(1);
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const handleCloseSupport = () => {
    setSupportModal(false);
  };

  const toggleFaq = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaqIndex(openFaqIndex === i ? null : i);
  };

  // unified logout alert that uses context
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

  // Dynamic colors based on dark mode
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
              <Text style={[styles.reg, { color: darkMode ? COLORS.primary : COLORS.primary }]}>Reg No: {profile.registration}</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="pencil" size={20} color={darkMode ? COLORS.primary : COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* PREFERENCES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, textStyle]}>Preferences</Text>
          {renderToggle('Push Notifications', notifications, setNotifications)}
          {renderToggle('Email Notifications', emailNotifications, setEmailNotifications)}
          {renderToggle('Dark Mode', darkMode, toggleDarkMode)}

          {/* Language Selection */}
          <TouchableOpacity style={[styles.actionItem, surfaceStyle]} onPress={() => Alert.alert('Language', 'English (Default)')}>
            <Text style={[styles.actionText, textStyle]}>Language</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[{ marginRight: 8 }, textLightStyle]}>English</Text>
              <Ionicons name="chevron-forward" size={18} color={darkMode ? COLORS.textDark : COLORS.text} />
            </View>
          </TouchableOpacity>

          {/* Theme Selection */}
          <TouchableOpacity style={[styles.actionItem, surfaceStyle]} onPress={() => Alert.alert('Theme', 'Default Theme')}>
            <Text style={[styles.actionText, textStyle]}>Theme</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[{ marginRight: 8 }, textLightStyle]}>Default</Text>
              <Ionicons name="chevron-forward" size={18} color={darkMode ? COLORS.textDark : COLORS.text} />
            </View>
          </TouchableOpacity>
        </View>

        {/* PRIVACY */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, textStyle]}>Privacy & Security</Text>
          {renderToggle('Private Profile', privateProfile, setPrivateProfile)}
          {renderToggle('Two-Factor Authentication', twoFactor, setTwoFactor)}

          <TouchableOpacity style={[styles.actionItem, surfaceStyle]} onPress={() => setPasswordModal(true)}>
            <Text style={[styles.actionText, textStyle]}>Change Password</Text>
            <Ionicons name="chevron-forward" size={18} color={darkMode ? COLORS.textDark : COLORS.text} />
          </TouchableOpacity>

          {/* Account Security */}
          <TouchableOpacity style={[styles.actionItem, surfaceStyle]} onPress={() => Alert.alert('Account Security', 'Your account is secure')}>
            <Text style={[styles.actionText, textStyle]}>Account Security</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#4CAF50" style={{ marginRight: 8 }} />
              <Ionicons name="chevron-forward" size={18} color={darkMode ? COLORS.textDark : COLORS.text} />
            </View>
          </TouchableOpacity>

          {/* Data Usage */}
          <TouchableOpacity style={[styles.actionItem, surfaceStyle]} onPress={() => Alert.alert('Data Usage', 'Manage your data usage settings')}>
            <Text style={[styles.actionText, textStyle]}>Data Usage</Text>
            <Ionicons name="chevron-forward" size={18} color={darkMode ? COLORS.textDark : COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* HELP */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, textStyle]}>Help & Support</Text>

          {faqs.map((f, i) => (
            <View key={i} style={[styles.faqItem, surfaceStyle]}>
              <TouchableOpacity onPress={() => toggleFaq(i)} style={styles.faqHeader}>
                <Text style={[styles.faqQ, textStyle]}>{f.q}</Text>
                <Ionicons name={openFaqIndex === i ? 'chevron-up' : 'chevron-down'} size={20} color={darkMode ? COLORS.textDark : COLORS.text} />
              </TouchableOpacity>
              {openFaqIndex === i && <Text style={[styles.faqA, textLightStyle]}>{f.a}</Text>}
            </View>
          ))}

          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:support@studentredressal.edu?subject=Support Request&body=Please describe your issue here...')}>
            <Ionicons name="mail-outline" size={18} color="#fff" />
            <Text style={styles.contactText}>Email Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.contactBtn, { marginTop: 10 }]} onPress={() => Linking.openURL('tel:+254700000000')}>
            <Ionicons name="call-outline" size={18} color="#fff" />
            <Text style={styles.contactText}>Call Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.contactBtn, { marginTop: 10 }]} onPress={() => setSupportModal(true)}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color="#fff" />
            <Text style={styles.contactText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        {/* ABOUT */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, textStyle]}>About</Text>

          <TouchableOpacity style={[styles.actionItem, surfaceStyle]} onPress={() => navigation.navigate('TermsConditions')}>
            <Text style={[styles.actionText, textStyle]}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={18} color={darkMode ? COLORS.textDark : COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, surfaceStyle]} onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={[styles.actionText, textStyle]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={darkMode ? COLORS.textDark : COLORS.text} />
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
        <View style={styles.modalContainer}>
          <View style={[styles.modalBox, surfaceStyle]}>
            <Text style={[styles.modalTitle, textStyle]}>Change Password</Text>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Current Password"
                secureTextEntry={!showCurrent}
                style={[styles.input, { backgroundColor: darkMode ? COLORS.surfaceDark : '#f2f2f2', color: darkMode ? COLORS.textDark : COLORS.text }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholderTextColor={COLORS.textLight}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
                <Ionicons name={showCurrent ? "eye-off" : "eye"} size={20} color={darkMode ? COLORS.textLightDark : COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="New Password"
                secureTextEntry={!showNew}
                style={[styles.input, { backgroundColor: darkMode ? COLORS.surfaceDark : '#f2f2f2', color: darkMode ? COLORS.textDark : COLORS.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholderTextColor={COLORS.textLight}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                <Ionicons name={showNew ? "eye-off" : "eye"} size={20} color={darkMode ? COLORS.textLightDark : COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Confirm New Password"
                secureTextEntry={!showConfirm}
                style={[styles.input, { backgroundColor: darkMode ? COLORS.surfaceDark : '#f2f2f2', color: darkMode ? COLORS.textDark : COLORS.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor={COLORS.textLight}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                <Ionicons name={showConfirm ? "eye-off" : "eye"} size={20} color={darkMode ? COLORS.textLightDark : COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {loadingPassword ? <ActivityIndicator color={COLORS.primary} size="large" style={styles.loading} /> : (
              <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword} disabled={loadingPassword}>
                <Text style={styles.modalButtonText}>Update Password</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setPasswordModal(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SUPPORT MODAL - Simple Working Version */}
      <Modal visible={supportModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setSupportModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[styles.modalBox, {maxHeight: '80%'}, surfaceStyle]}>
            <View style={styles.modalHeader}>
              <Ionicons name="chatbox-ellipses-outline" size={24} color={darkMode ? COLORS.primary : COLORS.primary} />
              <Text style={[styles.modalTitle, textStyle]}>Send Support Message</Text>
              <TouchableOpacity onPress={() => setSupportModal(false)}>
                <Ionicons name="close-outline" size={24} color={darkMode ? COLORS.textLightDark : COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, textStyle]}>Subject *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { color: darkMode ? COLORS.textDark : COLORS.text }]}
                  placeholder="Enter subject"
                  value={supportSubject}
                  onChangeText={setSupportSubject}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, textStyle]}>Message *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: darkMode ? COLORS.textDark : COLORS.text }]}
                  placeholder="Describe your issue..."
                  multiline
                  numberOfLines={4}
                  value={supportMessage}
                  onChangeText={setSupportMessage}
                  placeholderTextColor={COLORS.textLight}
                  textAlignVertical="top"
                />
              </View>
              <Text style={[styles.counterText, textLightStyle]}>{supportMessage.length}/500</Text>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleSendSupport} disabled={loadingSupport}>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>{loadingSupport ? 'Sending...' : 'Send Message'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setSupportModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: COLORS.background,paddingTop: 20 },
  profileCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, margin: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, borderRadius: 12, padding: 4 },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  email: { fontSize: 13, color: COLORS.textLight },
  reg: { fontSize: 12, color: COLORS.primary },
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  toggleItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, marginBottom: 10 },
  toggleText: { fontWeight: '600', color: COLORS.text },
  actionItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, marginBottom: 10 },
  actionText: { fontWeight: '600', color: COLORS.text },
  faqItem: { backgroundColor: COLORS.surface, padding: 12, borderRadius: 12, marginBottom: 8 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  faqQ: { fontWeight: '600', color: COLORS.text },
  faqA: { marginTop: 8, color: COLORS.textLight },
  contactBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 },
  contactText: { color: '#fff', marginLeft: 6 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.secondary, padding: 15, borderRadius: 15, marginHorizontal: 20, marginBottom: 30 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  modalContainer: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20 
  },
  modalBox: { 
    backgroundColor: COLORS.surface, 
    padding: 0,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: COLORS.text,
    marginLeft: 12,
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  required: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    minHeight: 50,
  },
  textAreaWrapper: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 50,
  },
  eyeIcon: {
    padding: 14,
  },
  textArea: {
    height: 120,
    paddingBottom: 14,
  },
  characterCounter: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  counterText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  modalButton: { 
    flexDirection: 'row',
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 20,
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 24,
  },
  cancelText: {
    color: COLORS.secondary, 
    fontSize: 16,
    fontWeight: '600'
  },
  loading: {
    marginVertical: 20,
  },
  dummyContent: {
    padding: 24,
    backgroundColor: COLORS.surface,
  },
  dummyText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 22,
  },
});
