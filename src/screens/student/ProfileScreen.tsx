import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ProfileContext } from '../../context/ProfileContext';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#2E5090',
  secondary: '#FF6B6B',
  accent: '#4CAF50',
  warning: '#FFA500',
  info: '#2196F3',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1A2332',
  textLight: '#6B7280',
  border: '#E5E7EB',
  shadow: '#000000',
  success: '#10B981',
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { profile, setProfile } = useContext(ProfileContext);
  
  const headerScale = useSharedValue(0.8);
  const headerOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(50);
  const contentOpacity = useSharedValue(0);

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

  useFocusEffect(
    React.useCallback(() => {
      headerScale.value = withSpring(1, { damping: 13, stiffness: 100 });
      headerOpacity.value = withTiming(1, { duration: 400 });
      contentTranslate.value = withTiming(0, { duration: 500 });
      contentOpacity.value = withTiming(1, { duration: 500 });
    }, [])
  );

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslate.value }],
    opacity: contentOpacity.value,
  }));

  const renderInfoCard = ({
    icon,
    iconColor,
    label,
    value,
    index,
  }: {
    icon: string;
    iconColor: string;
    label: string;
    value: string;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).duration(500)}
      style={styles.infoCardWrapper}
    >
      <View style={styles.infoCard}>
        <View style={[styles.infoIcon, { backgroundColor: iconColor + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderAcademicCard = ({
    icon,
    iconColor,
    title,
    description,
    index,
  }: {
    icon: string;
    iconColor: string;
    title: string;
    description: string;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).duration(500)}
      style={styles.academicCardWrapper}
    >
      <View style={styles.academicCard}>
        <View style={[styles.academicIcon, { backgroundColor: iconColor + '20' }]}>
          <FontAwesome5 name={icon} size={18} color={iconColor} solid />
        </View>
        <View style={styles.academicContent}>
          <Text style={styles.academicTitle}>{title}</Text>
          <Text style={styles.academicDesc}>{description}</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Back Button */}
        <Animated.View style={[styles.headerContainer, headerStyle]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonBg}>
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile' as any)}
          >
            <Ionicons name="pencil" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Student Avatar Card */}
        <Animated.View style={[styles.avatarCard, headerStyle]}>
          <View style={styles.avatarWrapper}>
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
              style={styles.cameraButton}
              onPress={handleUploadPhoto}
              activeOpacity={0.7}
            >
              <View style={styles.cameraBg}>
                <Ionicons name="camera" size={18} color={COLORS.surface} />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.studentName}>{profile.name}</Text>
          <Text style={styles.designation}>{profile.department}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: COLORS.accent + '20' }]}>
              <Text style={[styles.badgeText, { color: COLORS.accent }]}>Active Student</Text>
            </View>
          </View>
        </Animated.View>

        {/* Content Sections */}
        <Animated.View style={[contentStyle]}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {renderInfoCard({
              icon: 'email-outline',
              iconColor: COLORS.primary,
              label: 'Email',
              value: profile.email,
              index: 0,
            })}
            {renderInfoCard({
              icon: 'phone-outline',
              iconColor: COLORS.info,
              label: 'Phone',
              value: profile.phone,
              index: 1,
            })}
            {renderInfoCard({
              icon: 'map-marker-outline',
              iconColor: COLORS.secondary,
              label: 'Location',
              value: profile.location,
              index: 2,
            })}
            {renderInfoCard({
              icon: 'calendar-outline',
              iconColor: COLORS.warning,
              label: 'Date of Birth',
              value: profile.dateOfBirth,
              index: 3,
            })}
          </View>

          {/* Academic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic Details</Text>
            {renderInfoCard({
              icon: 'card-account-details-outline',
              iconColor: COLORS.primary,
              label: 'Registration Number',
              value: profile.registration,
              index: 4,
            })}
            {renderInfoCard({
              icon: 'university',
              iconColor: COLORS.accent,
              label: 'Department',
              value: profile.department || '',
              index: 5,
            })}
            {renderInfoCard({
              icon: 'school-outline',
              iconColor: COLORS.info,
              label: 'Semester',
              value: profile.semester || '',
              index: 6,
            })}
            {renderInfoCard({
              icon: 'graph-outline',
              iconColor: COLORS.success,
              label: 'GPA',
              value: profile.gpa || '',
              index: 7,
            })}
          </View>

          {/* Academic Performance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            {renderAcademicCard({
              icon: 'task-check',
              iconColor: COLORS.success,
              title: 'Attendance',
              description: '92% (Present: 69/75 classes)',
              index: 8,
            })}
            {renderAcademicCard({
              icon: 'medal',
              iconColor: COLORS.warning,
              title: 'Rank',
              description: '#5 in class of 120 students',
              index: 9,
            })}
            {renderAcademicCard({
              icon: 'trophy',
              iconColor: COLORS.accent,
              title: 'Achievements',
              description: 'Dean\'s List • Best Project Award 2025',
              index: 10,
            })}
          </View>

          {/* Complaint Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Complaint Statistics</Text>
            <View style={styles.statsGrid}>
              <Animated.View
                entering={FadeInDown.delay(300).duration(500)}
                style={styles.statBox}
              >
                <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Total</Text>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(350).duration(500)}
                style={styles.statBox}
              >
                <View style={[styles.statIcon, { backgroundColor: COLORS.warning + '20' }]}>
                  <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.warning} />
                </View>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(400).duration(500)}
                style={styles.statBox}
              >
                <View style={[styles.statIcon, { backgroundColor: COLORS.success + '20' }]}>
                  <MaterialCommunityIcons name="check-circle-outline" size={24} color={COLORS.success} />
                </View>
                <Text style={styles.statNumber}>9</Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </Animated.View>
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            {renderInfoCard({
              icon: 'account-circle-outline',
              iconColor: COLORS.primary,
              label: 'Guardian Name',
              value: profile.guardianName,
              index: 11,
            })}
            {renderInfoCard({
              icon: 'phone-outline',
              iconColor: COLORS.info,
              label: 'Guardian Phone',
              value: profile.guardianPhone,
              index: 12,
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Download', 'Downloading profile document...')}
            >
              <MaterialCommunityIcons name="download-outline" size={20} color={COLORS.surface} />
              <Text style={styles.actionButtonText}>Download Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => Alert.alert('Share', 'Share profile coming soon!')}
            >
              <MaterialCommunityIcons name="share-variant-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>Share Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Profile Last Updated</Text>
            <Text style={styles.footerDate}>25th February 2026</Text>
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
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
    paddingBottom: 32,
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    marginHorizontal: -12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
    letterSpacing: 0.3,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Avatar Card
  avatarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.background,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 50,
    fontWeight: '700',
    color: COLORS.surface,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  cameraBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  designation: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 12,
  },
  badgeContainer: {
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
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

  // Info Cards
  infoCardWrapper: {
    marginBottom: 10,
  },
  infoCard: {
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
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 18,
  },

  // Academic Cards
  academicCardWrapper: {
    marginBottom: 10,
  },
  academicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  academicIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  academicContent: {
    flex: 1,
  },
  academicTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  academicDesc: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
  },

  // Action Buttons
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 0,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  shareButton: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.surface,
    marginLeft: 10,
    letterSpacing: 0.3,
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerDate: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});