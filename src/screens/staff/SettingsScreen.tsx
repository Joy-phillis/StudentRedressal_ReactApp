import React, { useState, useEffect, useContext } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Switch,
  Platform,
  TextInput,
  LayoutAnimation,
  UIManager,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SettingsScreen({ navigation }: any) {
  const faqs = [
    { q: 'How do I update assignment status?', a: 'Open the complaint from the Assigned tab and mark it resolved or in-progress.' },
    { q: 'How to escalate a complaint?', a: 'Use the escalate button inside complaint details.' },
    { q: 'How to change my profile?', a: 'Tap your avatar to update your profile photo and edit details.' },
  ];

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('Staff Name');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  const [supportModal, setSupportModal] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);

  // Animation values for support modal
  const modalTranslateY = useSharedValue(100);
  const modalOpacity = useSharedValue(0);
  const inputScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const fetchStaffProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('Profile fetch error:', error.message);
      } else if (data) {
        setStaffName(data.full_name || 'Staff Name');
      }
    } catch (error) {
      console.log('Error fetching staff profile:', error);
    }
  };

  useEffect(() => {
    fetchStaffProfile();
  }, []);

  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri as string);
        Alert.alert('Success', 'Profile image updated!');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open photo library');
    }
  };

  const { logout } = useAuth();
  const handleLogout = () => {
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

  const toggleFaq = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaqIndex(openFaqIndex === i ? null : i);
  };

  const submitContact = () => {
    if (!contactName || !contactEmail || !contactMsg) { Alert.alert('Incomplete', 'Please fill all fields.'); return; }
    Alert.alert('Message sent', 'Support will contact you shortly (simulated).');
    setContactName(''); setContactEmail(''); setContactMsg('');
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
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          sender_type: 'staff',
          receiver_type: 'admin',
          subject: supportSubject,
          content: supportMessage,
          message_type: 'support'
        }]).select();
      if (error) throw error;
      console.log('Inserted message:', data);
      Alert.alert('Success', 'Message sent successfully to support team!');
      setSupportModal(false);
      setSupportSubject('');
      setSupportMessage('');
      modalTranslateY.value = 100;
      modalOpacity.value = 0;
    } catch (error: any) {
      console.error('Supabase error:', error);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={24} color="#0F3057" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileButton} onPress={handleUploadPhoto}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileAvatar}><Ionicons name="person-circle-outline" size={80} color="#1E5F9E" /></View>
            )}
            <View style={styles.profileCamera}><Ionicons name="camera" size={20} color="#fff" /></View>
          </TouchableOpacity>
          <Text style={styles.adminName}>{staffName}</Text>
        </View>

        <View style={styles.settingsSection}>
          <View style={styles.settingItem}><Text style={styles.settingLabel}>Enable Notifications</Text><Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ true: '#1E5F9E', false: '#ccc' }} thumbColor={Platform.OS === 'android' ? '#fff' : undefined} /></View>
          <View style={styles.settingItem}><Text style={styles.settingLabel}>Dark Mode</Text><Switch value={darkModeEnabled} onValueChange={setDarkModeEnabled} trackColor={{ true: '#1E5F9E', false: '#ccc' }} thumbColor={Platform.OS === 'android' ? '#fff' : undefined} /></View>
        </View>

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

          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:support@studentredressal.edu?subject=Staff Support Request&body=Please describe your issue here...')}>
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

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SUPPORT MODAL */}
      <Modal visible={supportModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => setSupportModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[styles.modalBox, {maxHeight: '80%'}]}>
            <Animated.View style={[styles.modalBox, modalStyle]}>
              <View style={styles.modalHeader}>
                <Ionicons name="chatbox-ellipses-outline" size={24} color="#1E5F9E" />
                <Text style={styles.modalTitle}>Send Support Message</Text>
                <TouchableOpacity onPress={() => setSupportModal(false)}>
                  <Ionicons name="close-outline" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Subject *</Text>
                <View style={[styles.inputWrapper, { minHeight: 50 }]}>
                  <TextInput
                    style={[styles.input, { minHeight: 50, paddingVertical: 16 }]}
                    placeholder="Enter subject"
                    value={supportSubject}
                    onChangeText={setSupportSubject}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Message *</Text>
                <View style={[styles.inputWrapper, { minHeight: 120 }]}>
                  <TextInput
                    style={[styles.input, styles.textArea, { paddingVertical: 16 }]}
                    placeholder="Describe your issue..."
                    multiline
                    numberOfLines={4}
                    value={supportMessage}
                    onChangeText={setSupportMessage}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholderTextColor="#6B7280"
                    textAlignVertical="top"
                  />
                </View>
                <Text style={styles.counterText}>{supportMessage.length}/500</Text>
              </View>

              <TouchableOpacity 
                style={[styles.modalButton, buttonPressStyle]} 
                onPress={handleSendSupport} 
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={loadingSupport}
              >
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>{loadingSupport ? 'Sending...' : 'Send Message'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSupportModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  backBtn: { padding: 4 },
  profileSection: { alignItems: 'center', marginBottom: 20 },
  profileButton: { position: 'relative' },
  profileAvatar: { width: 100, height: 100, borderRadius: 70, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  profileCamera: { position: 'absolute', right: -6, bottom: -6, backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.background },
  adminName: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  settingsSection: { paddingHorizontal: 20, marginBottom: 25 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, marginBottom: 10 },
  settingLabel: { fontWeight: '600', color: COLORS.text },
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: COLORS.text },
  toggleItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, marginBottom: 10 },
  toggleText: { fontWeight: '600', color: COLORS.text },
  actionItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, marginBottom: 10 },
  actionText: { fontWeight: '600', color: COLORS.text },
  faqItem: { backgroundColor: COLORS.surface, padding: 12, borderRadius: 12, marginBottom: 8 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  faqQ: { fontWeight: '600', color: COLORS.text },
  faqA: { marginTop: 8, color: COLORS.textLight },
  contactBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 },
  contactText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    padding: 14,
    marginTop: 4,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  counterText: {
    fontSize: 12,
    color: COLORS.textLight,
    alignSelf: 'flex-end',
    marginTop: 4,
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
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
});


