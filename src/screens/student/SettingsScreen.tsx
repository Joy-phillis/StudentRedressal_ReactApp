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
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ProfileContext } from '../../context/ProfileContext';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#2E5090',
  secondary: '#FF6B6B',
  accent: '#4CAF50',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1A2332',
  textLight: '#6B7280',
  border: '#E5E7EB',
  shadow: '#000000',
  warning: '#FFA500',
};

interface ToggleSetting {
  id: string;
  label: string;
  description: string;
  value: boolean;
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { profile, setProfile } = useContext(ProfileContext);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

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
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setProfile({ image: uri });
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const headerScale = useSharedValue(0.8);
  const headerOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(50);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    headerScale.value = withSpring(1, { damping: 13, stiffness: 100 });
    headerOpacity.value = withTiming(1, { duration: 400 });
    contentTranslate.value = withTiming(0, { duration: 500 });
    contentOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslate.value }],
    opacity: contentOpacity.value,
  }));

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Logout',
          onPress: () => {
            Alert.alert('Logged Out', 'You have been logged out successfully!');
            navigation.replace('Login');
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  const renderSettingItem = ({
    icon,
    iconColor,
    title,
    description,
    onPress,
    index,
  }: {
    icon: string;
    iconColor: string;
    title: string;
    description: string;
    onPress: () => void;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).duration(500)}
      style={styles.settingItemWrapper}
    >
      <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderToggleItem = ({
    icon,
    iconColor,
    title,
    description,
    value,
    onToggle,
    index,
  }: {
    icon: string;
    iconColor: string;
    title: string;
    description: string;
    value: boolean;
    onToggle: (val: boolean) => void;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).duration(500)}
      style={styles.settingItemWrapper}
    >
      <View style={styles.settingItem}>
        <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
          thumbColor={value ? COLORS.primary : COLORS.textLight}
        />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header - Profile Card */}
        <Animated.View style={[styles.profileCard, headerStyle]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profile.image ? (
                <Image
                  source={{ uri: profile.image }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{profile.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={handleUploadPhoto}
              >
                <Ionicons name="camera" size={16} color={COLORS.surface} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Rajesh Singh</Text>
              <Text style={styles.profileEmail}>rajesh.singh@student.edu</Text>
              <View style={styles.regNoContainer}>
                <Text style={styles.regNoLabel}>Registration: </Text>
                <Text style={styles.regNoValue}>2023001</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditProfile' as any)}
            >
              <Ionicons name="pencil" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Complaints</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>9</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </Animated.View>

        {/* Content Sections */}
        <Animated.View style={[contentStyle]}>
          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
            {renderToggleItem({
              icon: 'bell-outline',
              iconColor: COLORS.primary,
              title: 'Push Notifications',
              description: 'Get real-time complaint updates',
              value: notifications,
              onToggle: setNotifications,
              index: 0,
            })}
            {renderToggleItem({
              icon: 'email-outline',
              iconColor: COLORS.warning,
              title: 'Email Notifications',
              description: 'Receive updates via email',
              value: emailNotifications,
              onToggle: setEmailNotifications,
              index: 1,
            })}
          </View>

          {/* Privacy & Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Security</Text>
            {renderToggleItem({
              icon: 'lock-outline',
              iconColor: COLORS.secondary,
              title: 'Private Profile',
              description: 'Only you can see your complaints',
              value: privateProfile,
              onToggle: setPrivateProfile,
              index: 2,
            })}
            {renderToggleItem({
              icon: 'shield-check-outline',
              iconColor: COLORS.accent,
              title: 'Two-Factor Auth',
              description: 'Extra security for your account',
              value: twoFactorAuth,
              onToggle: setTwoFactorAuth,
              index: 3,
            })}
            {renderSettingItem({
              icon: 'lock-reset',
              iconColor: COLORS.primary,
              title: 'Change Password',
              description: 'Update your account password',
              onPress: () =>
                Alert.alert('Change Password', 'Password change coming soon!'),
              index: 4,
            })}
          </View>

          {/* Display Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display</Text>
            {renderToggleItem({
              icon: 'moon-waning-crescent',
              iconColor: '#6B7280',
              title: 'Dark Mode',
              description: 'Easy on the eyes',
              value: darkMode,
              onToggle: setDarkMode,
              index: 5,
            })}
            {renderSettingItem({
              icon: 'text-box-outline',
              iconColor: COLORS.primary,
              title: 'Font Size',
              description: 'Adjust text size',
              onPress: () => Alert.alert('Font Size', 'Font settings coming soon!'),
              index: 6,
            })}
            {renderSettingItem({
              icon: 'palette-outline',
              iconColor: COLORS.primary,
              title: 'Theme',
              description: 'Choose your color theme',
              onPress: () => Alert.alert('Theme', 'Theme settings coming soon!'),
              index: 7,
            })}
          </View>

          {/* Account Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            {renderSettingItem({
              icon: 'account-circle-outline',
              iconColor: COLORS.primary,
              title: 'Edit Profile',
              description: 'Update your information',
              onPress: () => navigation.navigate('EditProfile' as any),
              index: 8,
            })}
            {renderSettingItem({
              icon: 'credit-card-outline',
              iconColor: COLORS.warning,
              title: 'Payment Methods',
              description: 'Manage your payment information',
              onPress: () =>
                Alert.alert('Payment', 'Payment settings coming soon!'),
              index: 9,
            })}
            {renderSettingItem({
              icon: 'download-outline',
              iconColor: COLORS.primary,
              title: 'Download Data',
              description: 'Export your data',
              onPress: () =>
                Alert.alert('Download Data', 'Data export coming soon!'),
              index: 10,
            })}
          </View>

          {/* Help & Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Help & Support</Text>
            {renderSettingItem({
              icon: 'help-circle-outline',
              iconColor: COLORS.accent,
              title: 'Help Center',
              description: 'Browse FAQs and guides',
              onPress: () => Alert.alert('Help Center', 'Help coming soon!'),
              index: 11,
            })}
            {renderSettingItem({
              icon: 'bug-outline',
              iconColor: COLORS.secondary,
              title: 'Report a Bug',
              description: 'Help us improve the app',
              onPress: () =>
                Alert.alert(
                  'Report Bug',
                  'Please describe the issue:\n\n(Bug reporting form would appear here)',
                  [{ text: 'OK' }]
                ),
              index: 12,
            })}
            {renderSettingItem({
              icon: 'information-outline',
              iconColor: COLORS.primary,
              title: 'About App',
              description: 'Version 1.0.0 • Terms & Privacy',
              onPress: () =>
                Alert.alert('About', 'Student Redressal Version 1.0.0'),
              index: 13,
            })}
          </View>

          {/* Logout Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.surface} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* App Version */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>App Version 1.0.0</Text>
            <Text style={styles.footerSubText}>© 2026 Student Redressal System</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 32,
  },

  // Profile Card
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 28,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.surface,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  regNoContainer: {
    flexDirection: 'row',
  },
  regNoLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  regNoValue: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  editProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile Stats
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
    marginLeft: 4,
    letterSpacing: 0.3,
  },

  // Setting Items
  settingItemWrapper: {
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    lineHeight: 18,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
    marginLeft: 8,
    letterSpacing: 0.3,
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
  },
});
