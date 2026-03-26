import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useRealTime } from '../../context/RealTimeContext';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#2E5090',
  secondary: '#FF6B6B',
  accent: '#4CAF50',
  pending: '#FFA500',
  resolved: '#4CAF50',
  inProgress: '#2196F3',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1A2332',
  textLight: '#6B7280',
  border: '#E5E7EB',
  shadow: '#000000',
  error: '#EF4444',
  success: '#10B981',
};



export default function ComplaintsScreen() {
  const navigation = useNavigation<any>();
  const { refreshTrigger } = useRealTime();

  const [regNo, setRegNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Male');
  const [year, setYear] = useState('1');
  const [course, setCourse] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Normal');
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  
  // Modal states
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [urgencyModalVisible, setUrgencyModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  
  const urgencyOptions = [
    { value: 'Normal', label: 'Normal', icon: 'information-circle-outline', color: '#4CAF50', description: 'Standard processing time' },
    { value: 'High', label: 'High', icon: 'warning-outline', color: '#FF9800', description: 'Requires prompt attention' },
    { value: 'Critical', label: 'Critical', icon: 'alert-circle-outline', color: '#FF3B30', description: 'Urgent action required' },
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male', icon: 'gender-male', color: '#2196F3' },
    { value: 'Female', label: 'Female', icon: 'gender-female', color: '#E91E63' },
    { value: 'Other', label: 'Other', icon: 'gender-male-female', color: '#9C27B0' },
  ];

  const yearOptions = [
    { value: '1', label: '1st Year', icon: 'numeric-1-circle-outline', description: 'First year of study' },
    { value: '2', label: '2nd Year', icon: 'numeric-2-circle-outline', description: 'Second year of study' },
    { value: '3', label: '3rd Year', icon: 'numeric-3-circle-outline', description: 'Third year of study' },
    { value: '4', label: '4th Year', icon: 'numeric-4-circle-outline', description: 'Fourth year of study' },
  ];

  // Animations
  const headerScale = useSharedValue(0.8);
  const headerOpacity = useSharedValue(0);
  const formTranslate = useSharedValue(100);
  const formOpacity = useSharedValue(0);
  const historyTranslate = useSharedValue(50);
  const historyOpacity = useSharedValue(0);
  const submitScale = useSharedValue(1);

 useEffect(() => {
  headerScale.value = withSpring(1, { damping: 13, stiffness: 100 });
  headerOpacity.value = withTiming(1, { duration: 400 });
  formTranslate.value = withTiming(0, { duration: 500 });
  formOpacity.value = withTiming(1, { duration: 500 });
  historyTranslate.value = withTiming(0, { duration: 600 });
  historyOpacity.value = withTiming(1, { duration: 600 });

  fetchComplaints(); // ✅ added
}, [refreshTrigger]);
const fetchComplaints = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('User not authenticated');
      return;
    }

    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', user.id) // Only fetch current user's complaints
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Fetch error:', error.message);
      return;
    }

    if (data) {
      const formatted = data.map((item) => ({
        id: item.id,
        reg: item.registration_number,
        title: item.title,
        name: item.full_name,
        course: item.course,
        status: item.status,
        date: item.created_at.slice(0, 10),
        category: item.category,
      }));

      setHistory(formatted);
    }
  } catch (error) {
    console.log('Error fetching complaints:', error);
  }
};

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  const formStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslate.value }],
    opacity: formOpacity.value,
  }));

  const historyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: historyTranslate.value }],
    opacity: historyOpacity.value,
  }));

  const submitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  // Validation
  const validateForm = () => {
    const newErrors: any = {};
    if (!regNo) newErrors.regNo = 'Registration Number is required';
    if (!fullName) newErrors.fullName = 'Full Name is required';
    if (!course) newErrors.course = 'Course is required';
    if (!title) newErrors.title = 'Complaint Title is required';
    if (!description) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async () => {
  if (!validateForm()) return;

  setSubmitting(true);
  submitScale.value = withSpring(0.95, { damping: 12, stiffness: 100 });

  try {
    // First, get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      Alert.alert('Error', 'User not authenticated. Please login again.');
      setSubmitting(false);
      submitScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      return;
    }

    const { data, error } = await supabase
      .from('complaints')
      .insert([
        {
          registration_number: regNo,
          full_name: fullName,
          gender,
          year,
          course,
          title,
          category,
          description,
          urgency,
          user_id: user.id, // Link to authenticated user
        },
      ])
      .select();

    submitScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert(
      'Success ✓',
      'Your complaint has been submitted successfully!',
      [{ text: 'OK' }]
    );

    if (data && data.length > 0) {
      const newComplaint = data[0];

      const formattedComplaint = {
        id: newComplaint.id,
        reg: newComplaint.registration_number,
        title: newComplaint.title,
        name: newComplaint.full_name,
        course: newComplaint.course,
        status: newComplaint.status,
        date: newComplaint.created_at.slice(0, 10),
        category: newComplaint.category,
      };

      setHistory((prev) => [formattedComplaint, ...prev]);
    }

    // Reset form
    setRegNo('');
    setFullName('');
    setGender('Male');
    setYear('1');
    setCourse('');
    setTitle('');
    setCategory('');
    setDescription('');
    setUrgency('Normal');
  } catch (err: any) {
    setSubmitting(false);
    submitScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    Alert.alert('Error', err.message || 'Failed to submit complaint');
  }
};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return COLORS.pending;
      case 'Resolved':
        return COLORS.resolved;
      case 'In-Progress':
        return COLORS.inProgress;
      default:
        return COLORS.primary;
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Library':
        return 'book';
      case 'Cafeteria':
        return 'utensils';
      case 'Lab':
        return 'flask';
      case 'Hostel':
        return 'bed';
      case 'Transport':
        return 'bus';
      default:
        return 'question';
    }
  };

  const openViewModal = (item: any) => {
    setSelectedComplaint(item);
    setViewModalVisible(true);
  };

  const closeViewModal = () => {
    setSelectedComplaint(null);
    setViewModalVisible(false);
    setRating(0);
    setHasRated(false);
  };

  // Submit rating for resolved complaint
  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating to continue.');
      return;
    }

    if (!selectedComplaint) return;

    setSubmittingRating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        setSubmittingRating(false);
        return;
      }

      // Get the assigned staff ID for this complaint
      const { data: complaintData } = await supabase
        .from('complaints')
        .select('assigned_to, title')
        .eq('id', selectedComplaint.id)
        .single();

      // Insert rating into ratings table
      const { error: ratingError } = await supabase
        .from('ratings')
        .insert([
          {
            complaint_id: selectedComplaint.id,
            user_id: user.id,
            rating: rating,
            feedback: '',
          },
        ]);

      if (ratingError) throw ratingError;

      // Create notification for assigned staff (if any)
      if (complaintData?.assigned_to) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert([
            {
              recipient_id: complaintData.assigned_to,
              recipient_type: 'staff',
              type: 'rating',
              title: 'New Rating Received',
              message: `You received a ${rating}-star rating for "${complaintData.title}"`,
              is_read: false,
            },
          ]);

        if (notifError) console.log('Notification error:', notifError.message);
      }

      // Create notification for admin
      const { error: adminNotifError } = await supabase
        .from('notifications')
        .insert([
          {
            recipient_type: 'admin',
            type: 'rating',
            title: 'New Rating Received',
            message: `Student rated complaint "${complaintData?.title || 'Resolved Complaint'}" with ${rating} stars`,
            is_read: false,
          },
        ]);

      if (adminNotifError) console.log('Admin notification error:', adminNotifError.message);

      Alert.alert('Thank You!', `You rated this complaint ${rating} star${rating > 1 ? 's' : ''}. Your feedback helps us improve!`);
      setHasRated(true);
      setSubmittingRating(false);
    } catch (error: any) {
      console.error('Rating error:', error);
      Alert.alert('Error', error.message || 'Failed to submit rating');
      setSubmittingRating(false);
    }
  };

  const renderHistoryCard = ({ item, index }: any) => {
    const bgColor = getStatusColor(item.status);

    return (
      <Animated.View
        entering={FadeInUp.delay(300 + index * 100).duration(500)}
        style={styles.historyCardWrapper}
      >
        <View style={[styles.historyCard, { borderLeftColor: bgColor }]}>
          <View style={styles.historyHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: bgColor + '20' }]}>
              <FontAwesome5 name={getCategoryIcon(item.category)} size={14} color={bgColor} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
              <Text style={styles.statusBadgeText}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.historyTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.historyMeta}>
            {item.name} • {item.course}
          </Text>
          <Text style={styles.historyDate}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.textLight} /> {item.date}
          </Text>
          <TouchableOpacity
            style={[styles.viewDetailsBtn, { backgroundColor: bgColor }]}
            onPress={() => openViewModal(item)}
          >
            <Ionicons name="eye-outline" size={16} color="#fff" />
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 120 : 100 }}
      >
        {/* Header */}
        <Animated.View style={[styles.headerContainer, headerStyle]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonBg}>
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Submit a Complaint</Text>
            <Text style={styles.headerSubtitle}>Help us improve by reporting issues</Text>
          </View>
        </Animated.View>

        {/* Form Section */}
        <Animated.View style={[formStyle]}>
          <View style={styles.formContainer}>
            {/* Personal Information Section */}
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Personal Information</Text>
              </View>
              
              {/* Registration Number */}
              <View>
                <Text style={styles.label}>Registration Number *</Text>
                <View style={[
                  styles.inputContainer,
                  errors.regNo && styles.inputError
                ]}>
                  <Ionicons name="card-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your registration number"
                    value={regNo}
                    onChangeText={setRegNo}
                    style={styles.input}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
                {errors.regNo && (
                  <Text style={styles.errorText}>
                    <Ionicons name="alert-circle" size={12} color={COLORS.error} /> {errors.regNo}
                  </Text>
                )}
              </View>

              {/* Full Name */}
              <View>
                <Text style={styles.label}>Full Name *</Text>
                <View style={[
                  styles.inputContainer,
                  errors.fullName && styles.inputError
                ]}>
                  <Ionicons name="person-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your full name"
                    value={fullName}
                    onChangeText={setFullName}
                    style={styles.input}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
                {errors.fullName && (
                  <Text style={styles.errorText}>
                    <Ionicons name="alert-circle" size={12} color={COLORS.error} /> {errors.fullName}
                  </Text>
                )}
              </View>

              {/* Gender and Year of Study Row */}
              <View style={styles.twoColumnRow}>
                <View style={styles.column}>
                  <Text style={styles.label}>Gender</Text>
                  <TouchableOpacity
                    style={styles.pickerContainer}
                    onPress={() => setGenderModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="male-female-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                    <View style={styles.pickerValueContainer}>
                      <Text style={[
                        styles.pickerValue,
                        { color: gender === 'Male' ? '#2196F3' : gender === 'Female' ? '#E91E63' : '#9C27B0' }
                      ]}>
                        {gender}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Year of Study</Text>
                  <TouchableOpacity
                    style={styles.pickerContainer}
                    onPress={() => setYearModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="school-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                    <View style={styles.pickerValueContainer}>
                      <Text style={styles.pickerValue}>
                        {year === '1' ? '1st Year' : year === '2' ? '2nd Year' : year === '3' ? '3rd Year' : '4th Year'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Course */}
              <View>
                <Text style={styles.label}>Course *</Text>
                <View style={[
                  styles.inputContainer,
                  errors.course && styles.inputError
                ]}>
                  <MaterialCommunityIcons name="book-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your course"
                    value={course}
                    onChangeText={setCourse}
                    style={styles.input}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
                {errors.course && (
                  <Text style={styles.errorText}>
                    <Ionicons name="alert-circle" size={12} color={COLORS.error} /> {errors.course}
                  </Text>
                )}
              </View>
            </View>

            {/* Complaint Details Section */}
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeader}>
                <Ionicons name="alert-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Complaint Details</Text>
              </View>

              {/* Complaint Title */}
              <View>
                <Text style={styles.label}>Complaint Title *</Text>
                <View style={[
                  styles.inputContainer,
                  errors.title && styles.inputError
                ]}>
                  <Ionicons name="pencil-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Brief title of your complaint"
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
                {errors.title && (
                  <Text style={styles.errorText}>
                    <Ionicons name="alert-circle" size={12} color={COLORS.error} /> {errors.title}
                  </Text>
                )}
              </View>

              {/* Category and Urgency Row */}
              <View style={styles.twoColumnRow}>
                <View style={styles.column}>
                  <Text style={styles.label}>Category</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerContainer,
                      errors.category && styles.inputError
                    ]}
                    onPress={() => {
                      setCategorySearch(category);
                      setCategoryModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="format-list-bulleted" size={18} color={COLORS.primary} style={styles.inputIcon} />
                    <View style={styles.pickerValueContainer}>
                      <Text style={category ? styles.pickerValue : styles.pickerPlaceholder}>
                        {category || 'Select category'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                  {errors.category && (
                    <Text style={styles.errorText}>
                      <Ionicons name="alert-circle" size={12} color={COLORS.error} /> {errors.category}
                    </Text>
                  )}
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Urgency</Text>
                  <TouchableOpacity
                    style={styles.pickerContainer}
                    onPress={() => setUrgencyModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="alert-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                    <View style={styles.pickerValueContainer}>
                      <Text style={[
                        styles.pickerValue,
                        { color: urgency === 'Critical' ? '#FF3B30' : urgency === 'High' ? '#FF9800' : '#4CAF50' }
                      ]}>
                        {urgency}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Description */}
              <View>
                <Text style={styles.label}>Detailed Description *</Text>
                <View style={[
                  styles.inputContainer,
                  styles.descriptionContainer,
                  errors.description && styles.inputError
                ]}>
                  <Ionicons name="document-text-outline" size={18} color={COLORS.primary} style={[styles.inputIcon, { marginTop: 12 }]} />
                  <TextInput
                    placeholder="Provide detailed information about your complaint..."
                    value={description}
                    onChangeText={setDescription}
                    style={[styles.input, styles.descriptionInput]}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
                {errors.description && (
                  <Text style={styles.errorText}>
                    <Ionicons name="alert-circle" size={12} color={COLORS.error} /> {errors.description}
                  </Text>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <Animated.View style={[submitStyle]}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <>
                    <MaterialCommunityIcons name="loading" size={22} color="#fff" style={styles.loadingIcon} />
                    <Text style={styles.submitText}>Submitting...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="send" size={22} color="#fff" />
                    <Text style={styles.submitText}>Submit Complaint</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Recent Complaints Section */}
        {history.length > 0 && (
          <>
            <Text style={[styles.sectionTitleMain]}>Recent Complaints</Text>
            <Animated.View style={[historyStyle]}>
              <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.historyListContainer}
                renderItem={renderHistoryCard}
              />
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* View Complaint Modal */}
      <Modal visible={viewModalVisible} animationType="slide" transparent onRequestClose={closeViewModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.viewModalCard}>
            <View style={styles.viewModalHeader}>
              <Text style={styles.viewModalTitle}>Complaint Details</Text>
              <TouchableOpacity onPress={closeViewModal}>
                <Ionicons name="close-outline" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Title:</Text>
                <Text style={styles.detailValue}>{selectedComplaint?.title}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Student Name:</Text>
                <Text style={styles.detailValue}>{selectedComplaint?.name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Registration Number:</Text>
                <Text style={styles.detailValue}>{selectedComplaint?.reg || 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{selectedComplaint?.category}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, { color: getStatusColor(selectedComplaint?.status) }]}>{selectedComplaint?.status}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date Submitted:</Text>
                <Text style={styles.detailValue}>{selectedComplaint?.date}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Course:</Text>
                <Text style={styles.detailValue}>{selectedComplaint?.course}</Text>
              </View>

              {/* Rating Section - Only show for Resolved complaints */}
              {selectedComplaint?.status === 'Resolved' && !hasRated && (
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingTitle}>Rate this Resolution</Text>
                  <Text style={styles.ratingSubtitle}>How satisfied are you with the resolution?</Text>
                  <View style={styles.starContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        onPressIn={() => setHoverRating(star)}
                        onPressOut={() => setHoverRating(0)}
                        disabled={submittingRating}
                      >
                        <Ionicons
                          name={star <= (hoverRating || rating) ? 'star' : 'star-outline'}
                          size={40}
                          color={star <= (hoverRating || rating) ? '#FFB800' : '#CCCCCC'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.ratingValue}>
                    {rating > 0 ? `${rating} Star${rating > 1 ? 's' : ''}` : 'Tap to rate'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.submitRatingBtn, submittingRating && { opacity: 0.6 }]}
                    onPress={submitRating}
                    disabled={submittingRating || rating === 0}
                  >
                    <Text style={styles.submitRatingText}>
                      {submittingRating ? 'Submitting...' : 'Submit Rating'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Already Rated Message */}
              {selectedComplaint?.status === 'Resolved' && hasRated && (
                <View style={styles.ratedSection}>
                  <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                  <Text style={styles.ratedText}>Thank you! You have rated this complaint.</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeViewBtn} onPress={closeViewModal}>
              <Text style={styles.closeViewText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.categoryModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close-outline" size={28} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={COLORS.textLight} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Type to search or create category..."
                placeholderTextColor={COLORS.textLight}
                value={categorySearch}
                onChangeText={setCategorySearch}
                autoFocus
              />
              {categorySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCategorySearch('')}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.modalSubtitle}>Choose from suggestions or type your own</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.categoryList}>
              {['Library', 'SCIT Department', 'SESS Department', 'Hostel', 'Finance', 'Security', 'Mess', 'Marks']
                .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                .map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.categoryOption,
                      category === cat && styles.categoryOptionSelected
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setCategoryModalVisible(false);
                      setErrors({ ...errors, category: undefined });
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={
                        cat === 'Library' ? 'book-open-page-variant' :
                        cat === 'Hostel' ? 'bed' :
                        cat === 'Finance' ? 'cash-multiple' :
                        cat === 'Security' ? 'shield-account' :
                        cat === 'Mess' ? 'silverware-fork-knife' :
                        cat === 'Marks' ? 'clipboard-text' :
                        cat === 'SCIT Department' || cat === 'SESS Department' ? 'school' :
                        'domain'
                      }
                      size={20}
                      color={category === cat ? COLORS.primary : COLORS.textLight}
                    />
                    <Text style={[
                      styles.categoryOptionText,
                      category === cat && styles.categoryOptionTextSelected
                    ]}>
                      {cat}
                    </Text>
                    {category === cat && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}

              {categorySearch.length > 0 && (
                <TouchableOpacity
                  style={[styles.categoryOption, styles.categoryOptionCustom]}
                  onPress={() => {
                    setCategory(categorySearch);
                    setCategoryModalVisible(false);
                    setErrors({ ...errors, category: undefined });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.accent} />
                  <Text style={styles.categoryOptionTextCustom}>
                    Use "{categorySearch}" as category
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Urgency Modal */}
      <Modal
        visible={urgencyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setUrgencyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.urgencyModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Urgency Level</Text>
              <TouchableOpacity onPress={() => setUrgencyModalVisible(false)}>
                <Ionicons name="close-outline" size={28} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>How urgent is this complaint?</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {urgencyOptions.map((option, idx) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.urgencyOption,
                    urgency === option.value && { backgroundColor: option.color + '10', borderColor: option.color }
                  ]}
                  onPress={() => {
                    setUrgency(option.value);
                    setUrgencyModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.urgencyIconContainer, { backgroundColor: option.color + '20' }]}>
                    <Ionicons name={option.icon as any} size={24} color={option.color} />
                  </View>
                  <View style={styles.urgencyContent}>
                    <Text style={[
                      styles.urgencyLabel,
                      { color: urgency === option.value ? option.color : COLORS.text }
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.urgencyDescription}>{option.description}</Text>
                  </View>
                  <View style={[
                    styles.urgencyRadio,
                    { borderColor: option.color },
                    urgency === option.value && { backgroundColor: option.color }
                  ]}>
                    {urgency === option.value && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setUrgencyModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gender Modal */}
      <Modal
        visible={genderModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setGenderModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.genderModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setGenderModalVisible(false)}>
                <Ionicons name="close-outline" size={28} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Choose your gender identity</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    gender === option.value && { backgroundColor: option.color + '10', borderColor: option.color }
                  ]}
                  onPress={() => {
                    setGender(option.value);
                    setGenderModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.genderIconContainer, { backgroundColor: option.color + '20' }]}>
                    <MaterialCommunityIcons name={option.icon as any} size={28} color={option.color} />
                  </View>
                  <View style={styles.genderContent}>
                    <Text style={[
                      styles.genderLabel,
                      { color: gender === option.value ? option.color : COLORS.text }
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  <View style={[
                    styles.genderRadio,
                    { borderColor: option.color },
                    gender === option.value && { backgroundColor: option.color }
                  ]}>
                    {gender === option.value && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setGenderModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Year of Study Modal */}
      <Modal
        visible={yearModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setYearModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.yearModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Year of Study</Text>
              <TouchableOpacity onPress={() => setYearModalVisible(false)}>
                <Ionicons name="close-outline" size={28} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Select your current year of study</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {yearOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.yearOption,
                    year === option.value && { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary }
                  ]}
                  onPress={() => {
                    setYear(option.value);
                    setYearModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.yearIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                    <MaterialCommunityIcons name={option.icon as any} size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.yearContent}>
                    <Text style={[
                      styles.yearLabel,
                      { color: year === option.value ? COLORS.primary : COLORS.text }
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.yearDescription}>{option.description}</Text>
                  </View>
                  <View style={[
                    styles.yearRadio,
                    { borderColor: COLORS.primary },
                    year === option.value && { backgroundColor: COLORS.primary }
                  ]}>
                    {year === option.value && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setYearModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 42,
  },

  // Header Styles
  headerContainer: {
    marginBottom: 28,
    marginTop: 8,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerContent: {
    marginLeft: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Form Container
  formContainer: {
    paddingHorizontal: 4,
  },

  // Section Styles
  sectionWrapper: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: 0.3,
  },

  // Label Styles
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 0.3,
  },

  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + '08',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    padding: 0,
  },

  // Picker Container
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  picker: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },

  // Description Input
  descriptionContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },

  // Two Column Layout
  twoColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  column: {
    flex: 1,
    marginRight: 12,
  },

  // Error Styles
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 2,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Submit Button
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  loadingIcon: {
    marginRight: 8,
  },

  // History List
  historyListContainer: {
    paddingBottom: 20,
  },
  historyCardWrapper: {
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    borderLeftWidth: 4,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  historyMeta: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  viewDetailsText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  viewModalCard: { width: '90%', backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, maxHeight: '80%' },
  viewModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  viewModalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  detailRow: { marginBottom: 12 },
  detailLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textLight, marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  closeViewBtn: { marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, alignItems: 'center' },
  closeViewText: { color: COLORS.primary, fontWeight: '600' },
  ratingSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center' },
  ratingTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  ratingSubtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 16, textAlign: 'center' },
  starContainer: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  ratingValue: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  submitRatingBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, minWidth: 150, alignItems: 'center' },
  submitRatingText: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },
  ratedSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center', gap: 8 },
  ratedText: { fontSize: 14, fontWeight: '600', color: COLORS.success, textAlign: 'center' },

  // Picker Styles
  pickerValueContainer: { flex: 1 },
  pickerValue: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  pickerPlaceholder: { fontSize: 15, color: COLORS.textLight, fontWeight: '500' },

  // Category Modal Styles
  categoryModalCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  categoryList: {
    maxHeight: 300,
    marginVertical: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  categoryOptionText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  categoryOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryOptionCustom: {
    backgroundColor: COLORS.accent + '10',
    borderColor: COLORS.accent,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  categoryOptionTextCustom: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Urgency Modal Styles
  urgencyModalCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  urgencyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  urgencyContent: {
    flex: 1,
  },
  urgencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  urgencyDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  urgencyRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Gender Modal Styles
  genderModalCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    maxHeight: '60%',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  genderIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  genderContent: {
    flex: 1,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  genderRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Year of Study Modal Styles
  yearModalCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    maxHeight: '65%',
  },
  yearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  yearIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  yearContent: {
    flex: 1,
  },
  yearLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  yearDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  yearRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});