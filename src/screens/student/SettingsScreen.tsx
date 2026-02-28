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
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ProfileContext } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
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
  border: '#E5E7EB',
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

  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const [passwordModal, setPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [supportModal, setSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);

  const headerScale = useSharedValue(0.9);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerScale.value = withSpring(1);
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

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
    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoadingPassword(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password updated successfully.');
      setPasswordModal(false);
      setNewPassword('');
    }
  };

  const handleSendSupport = async () => {
    if (!supportMessage) {
      Alert.alert('Error', 'Please enter a message.');
      return;
    }
    setLoadingSupport(true);
    const { error } = await supabase.from('support_messages').insert([{ message: supportMessage, student_email: profile.email }]);
    setLoadingSupport(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Message sent successfully.');
      setSupportModal(false);
      setSupportMessage('');
    }
  };

  const toggleFaq = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaqIndex(openFaqIndex === i ? null : i);
  };

  // unified logout alert that uses context
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

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
              <Text style={styles.reg}>Reg No: {profile.registration}</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="pencil" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          {renderToggle('Push Notifications', notifications, setNotifications)}
          {renderToggle('Email Notifications', emailNotifications, setEmailNotifications)}
          {renderToggle('Dark Mode', darkMode, setDarkMode)}
        </View>

        {/* PRIVACY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          {renderToggle('Private Profile', privateProfile, setPrivateProfile)}
          {renderToggle('Two-Factor Authentication', twoFactor, setTwoFactor)}

          <TouchableOpacity style={styles.actionItem} onPress={() => setPasswordModal(true)}>
            <Text style={styles.actionText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={18} />
          </TouchableOpacity>
        </View>

        {/* HELP */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>

          {faqs.map((f, i) => (
            <View key={i} style={styles.faqItem}>
              <TouchableOpacity onPress={() => toggleFaq(i)} style={styles.faqHeader}>
                <Text style={styles.faqQ}>{f.q}</Text>
                <Ionicons name={openFaqIndex === i ? 'chevron-up' : 'chevron-down'} size={20} />
              </TouchableOpacity>
              {openFaqIndex === i && <Text style={styles.faqA}>{f.a}</Text>}
            </View>
          ))}

          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:support@studentredressal.edu')}>
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
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('TermsConditions')}>
            <Text style={styles.actionText}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={18} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={styles.actionText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} />
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
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput placeholder="Enter new password" secureTextEntry style={styles.input} value={newPassword} onChangeText={setNewPassword} />
            {loadingPassword ? <ActivityIndicator /> : (
              <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword}>
                <Text style={{ color: '#fff' }}>Update Password</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setPasswordModal(false)}>
              <Text style={{ marginTop: 10, color: COLORS.secondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SUPPORT MODAL */}
      <Modal visible={supportModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Send Message</Text>
            <TextInput placeholder="Write your message..." multiline style={[styles.input, { height: 120 }]} value={supportMessage} onChangeText={setSupportMessage} />
            {loadingSupport ? <ActivityIndicator /> : (
              <TouchableOpacity style={styles.modalButton} onPress={handleSendSupport}>
                <Text style={{ color: '#fff' }}>Send</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setSupportModal(false)}>
              <Text style={{ marginTop: 10, color: COLORS.secondary }}>Cancel</Text>
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
  toggleItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10 },
  toggleText: { fontWeight: '600' },
  actionItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10 },
  actionText: { fontWeight: '600' },
  faqItem: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 8 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  faqQ: { fontWeight: '600' },
  faqA: { marginTop: 8, color: '#555' },
  contactBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 },
  contactText: { color: '#fff', marginLeft: 6 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.secondary, padding: 15, borderRadius: 15, marginHorizontal: 20, marginBottom: 30 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 },
  modalButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 15 },
});