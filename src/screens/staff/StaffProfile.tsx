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

export default function StaffProfile() {
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

        {/* Avatar Card */}
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
        </Animated.View>

        {/* Info cards */}
        <Animated.View style={[contentStyle]}>
          {renderInfoCard({
            icon: 'account',
            iconColor: COLORS.primary,
            label: 'Name',
            value: profile.name,
            index: 0,
          })}
          {renderInfoCard({
            icon: 'phone',
            iconColor: COLORS.info,
            label: 'Phone',
            value: profile.phone,
            index: 1,
          })}
          {renderInfoCard({
            icon: 'map-marker',
            iconColor: COLORS.warning,
            label: 'Location',
            value: profile.location,
            index: 2,
          })}
          {renderInfoCard({
            icon: 'calendar',
            iconColor: COLORS.accent,
            label: 'Joined',
            value: profile.dateOfBirth,
            index: 3,
          })}
        </Animated.View>

        {/* Staff-specific section (e.g., department info) */}
        <Animated.View style={[contentStyle]}>
          {renderAcademicCard({
            icon: 'briefcase',
            iconColor: COLORS.secondary,
            title: 'Department',
            description: 'Maintenance',
            index: 0,
          })}
          {renderAcademicCard({
            icon: 'clock-outline',
            iconColor: COLORS.info,
            title: 'Shift',
            description: 'Day',
            index: 1,
          })}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 60 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 6 },
  backButtonBg: { backgroundColor: COLORS.surface, padding: 6, borderRadius: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  editButton: { padding: 6 },
  avatarCard: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.surface, fontSize: 32, fontWeight: '700' },
  cameraButton: { position: 'absolute', right: -6, bottom: -6 },
  cameraBg: { backgroundColor: COLORS.primary, padding: 8, borderRadius: 20 },
  infoCardWrapper: { marginBottom: 12 },
  infoCard: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, alignItems: 'center' },
  infoIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 14, color: COLORS.textLight },
  infoValue: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  academicCardWrapper: { marginBottom: 12 },
  academicCard: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, alignItems: 'center' },
  academicIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  academicContent: { flex: 1 },
  academicTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  academicDesc: { fontSize: 12, color: COLORS.textLight },
});