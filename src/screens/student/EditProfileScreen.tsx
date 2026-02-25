import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ProfileContext } from '../../context/ProfileContext';

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
  success: '#10B981',
  error: '#EF4444',
};

interface ProfileData {
  name: string;
  phone: string;
  location: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
}

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { profile, setProfile } = useContext(ProfileContext);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: profile.name,
    phone: profile.phone,
    location: profile.location,
    dateOfBirth: profile.dateOfBirth,
    guardianName: profile.guardianName,
    guardianPhone: profile.guardianPhone,
  });

  const [originalData] = useState<ProfileData>({ ...profileData });
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const headerOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(50);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    contentTranslate.value = withTiming(0, { duration: 500 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslate.value }],
    opacity: headerOpacity.value,
  }));

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    const newData = { ...profileData, [field]: value };
    setProfileData(newData);
    setIsModified(JSON.stringify(newData) !== JSON.stringify(originalData));
  };

  const handleSave = () => {
    // Validate fields
    if (!profileData.name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty');
      return;
    }
    if (!profileData.phone.trim()) {
      Alert.alert('Validation Error', 'Phone cannot be empty');
      return;
    }
    if (!profileData.location.trim()) {
      Alert.alert('Validation Error', 'Location cannot be empty');
      return;
    }
    if (!profileData.guardianName.trim()) {
      Alert.alert('Validation Error', 'Guardian name cannot be empty');
      return;
    }
    if (!profileData.guardianPhone.trim()) {
      Alert.alert('Validation Error', 'Guardian phone cannot be empty');
      return;
    }

    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      // update global profile
      setProfile({
        name: profileData.name,
        phone: profileData.phone,
        location: profileData.location,
        dateOfBirth: profileData.dateOfBirth,
        guardianName: profileData.guardianName,
        guardianPhone: profileData.guardianPhone,
      });
      Alert.alert(
        'Success',
        'Your profile has been updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }, 1000);
  };

  const renderInputField = ({
    label,
    icon,
    iconColor,
    value,
    field,
    placeholder,
    keyboardType = 'default',
    index,
  }: {
    label: string;
    icon: string;
    iconColor: string;
    value: string;
    field: keyof ProfileData;
    placeholder: string;
    keyboardType?: any;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).duration(500)}
      style={styles.fieldWrapper}
    >
      <View style={styles.fieldContainer}>
        <View style={[styles.fieldIcon, { backgroundColor: iconColor + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.fieldInputWrapper}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textLight}
            value={value}
            onChangeText={(text) => handleInputChange(field, text)}
            keyboardType={keyboardType}
            editable={!isSaving}
          />
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[contentStyle]}>
          {/* Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {renderInputField({
              label: 'Full Name',
              icon: 'account-outline',
              iconColor: COLORS.primary,
              value: profileData.name,
              field: 'name',
              placeholder: 'Enter your full name',
              index: 0,
            })}
            {renderInputField({
              label: 'Phone Number',
              icon: 'phone-outline',
              iconColor: COLORS.primary,
              value: profileData.phone,
              field: 'phone',
              placeholder: 'Enter your phone',
              keyboardType: 'phone-pad',
              index: 1,
            })}
            {renderInputField({
              label: 'Location',
              icon: 'map-marker-outline',
              iconColor: COLORS.secondary,
              value: profileData.location,
              field: 'location',
              placeholder: 'Enter your location',
              index: 2,
            })}
            {renderInputField({
              label: 'Date of Birth',
              icon: 'calendar-outline',
              iconColor: COLORS.accent,
              value: profileData.dateOfBirth,
              field: 'dateOfBirth',
              placeholder: 'Enter your date of birth',
              index: 3,
            })}
          </View>

          {/* Emergency Contact Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            {renderInputField({
              label: 'Guardian Name',
              icon: 'account-circle-outline',
              iconColor: COLORS.primary,
              value: profileData.guardianName,
              field: 'guardianName',
              placeholder: 'Enter guardian name',
              index: 4,
            })}
            {renderInputField({
              label: 'Guardian Phone',
              icon: 'phone-outline',
              iconColor: COLORS.primary,
              value: profileData.guardianPhone,
              field: 'guardianPhone',
              placeholder: 'Enter guardian phone',
              keyboardType: 'phone-pad',
              index: 5,
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, isSaving && { opacity: 0.6 }]}
              onPress={() => navigation.goBack()}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!isModified || isSaving) && { opacity: 0.6 },
              ]}
              onPress={handleSave}
              disabled={!isModified || isSaving}
              activeOpacity={0.7}
            >
              {isSaving ? (
                <Text style={styles.saveButtonText}>Saving...</Text>
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={COLORS.surface}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Note */}
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.noteText}>
              Academic information cannot be edited. Contact administration for changes.
            </Text>
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

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
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
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 40,
  },

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

  fieldWrapper: {
    marginBottom: 12,
  },

  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  fieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  fieldInputWrapper: {
    flex: 1,
  },

  fieldLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },

  fieldInput: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: 6,
  },

  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 24,
  },

  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },

  saveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.surface,
    letterSpacing: 0.3,
  },

  noteContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.textLight,
  },

  noteText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
});
