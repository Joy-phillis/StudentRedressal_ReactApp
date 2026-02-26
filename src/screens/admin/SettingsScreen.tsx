import React, { useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqs = [
  { q: 'How do I assign a complaint?', a: 'Open the complaint and tap Assign. Choose a staff member to assign.' },
  { q: 'How to escalate?', a: 'Open the complaint and select Escalate to notify higher admins.' },
  { q: 'How to change my profile?', a: 'Tap your avatar to update your profile photo and edit details in profile screen.' },
];

export default function SettingsScreen({ navigation }: any) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');

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
    Alert.alert('Logout', 'Are you sure you want to logout?', [ { text: 'Cancel', style: 'cancel' }, { text: 'Logout', style: 'destructive', onPress: logout } ]);
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
          <Text style={styles.adminName}>Admin Name</Text>
        </View>

        <View style={styles.settingsSection}>
          <View style={styles.settingItem}><Text style={styles.settingLabel}>Enable Notifications</Text><Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ true: '#1E5F9E', false: '#ccc' }} thumbColor={Platform.OS === 'android' ? '#fff' : undefined} /></View>
          <View style={styles.settingItem}><Text style={styles.settingLabel}>Dark Mode</Text><Switch value={darkModeEnabled} onValueChange={setDarkModeEnabled} trackColor={{ true: '#1E5F9E', false: '#ccc' }} thumbColor={Platform.OS === 'android' ? '#fff' : undefined} /></View>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <Text style={styles.helpIntro}>Find quick answers or contact support directly.</Text>

          {faqs.map((f, i) => (
            <View key={i} style={styles.faqItem}>
              <TouchableOpacity onPress={() => toggleFaq(i)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.faqQ}>{f.q}</Text>
                <Ionicons name={openFaqIndex === i ? 'chevron-up' : 'chevron-down'} size={20} color="#777" />
              </TouchableOpacity>
              {openFaqIndex === i && <Text style={styles.faqA}>{f.a}</Text>}
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Contact Support</Text>
          <TextInput style={styles.input} placeholder="Your name" value={contactName} onChangeText={setContactName} />
          <TextInput style={styles.input} placeholder="Your email" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" />
          <TextInput style={[styles.input, { height: 100 }]} placeholder="Message" value={contactMsg} onChangeText={setContactMsg} multiline />
          <TouchableOpacity style={styles.sendBtn} onPress={submitContact}><Text style={{ color: '#fff' }}>Send Message</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Ionicons name="log-out-outline" size={20} color="#fff" /><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  container: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F3057' },
  backBtn: { padding: 4 },
  profileSection: { alignItems: 'center', marginBottom: 20 },
  profileButton: { position: 'relative' },
  profileAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1E5F9E', justifyContent: 'center', alignItems: 'center' },
  profileCamera: { position: 'absolute', right: -6, bottom: -6, backgroundColor: '#1E5F9E', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F4F7FB' },
  adminName: { fontSize: 20, fontWeight: '700', color: '#0F3057', marginTop: 12 },
  settingsSection: { marginBottom: 20 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12 },
  settingLabel: { fontSize: 16, color: '#0F3057', fontWeight: '600' },
  helpSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F3057', marginBottom: 8 },
  helpIntro: { color: '#666', marginBottom: 12 },
  faqItem: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 8 },
  faqQ: { color: '#0F3057', fontWeight: '600' },
  faqA: { marginTop: 8, color: '#555' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  sendBtn: { backgroundColor: '#1E5F9E', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF3B30', padding: 15, borderRadius: 15 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
});