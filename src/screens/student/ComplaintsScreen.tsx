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
  const [category, setCategory] = useState('Library');
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
    setCategory('Library');
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

              {/* Gender and Year Row */}
              <View style={styles.twoColumnRow}>
                <View style={styles.column}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.pickerContainer}>
                    <Ionicons name="male-female-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                    <Picker
                      selectedValue={gender}
                      style={styles.picker}
                      onValueChange={setGender}
                    >
                      <Picker.Item label="Male" value="Male" />
                      <Picker.Item label="Female" value="Female" />
                      <Picker.Item label="Other" value="Other" />
                    </Picker>
                  </View>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Year</Text>
                  <View style={styles.pickerContainer}>
                    <Ionicons name="school-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                    <Picker
                      selectedValue={year}
                      style={styles.picker}
                      onValueChange={setYear}
                    >
                      <Picker.Item label="1st Year" value="1" />
                      <Picker.Item label="2nd Year" value="2" />
                      <Picker.Item label="3rd Year" value="3" />
                      <Picker.Item label="4th Year" value="4" />
                    </Picker>
                  </View>
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
                  <View style={styles.pickerContainer}>
                    <MaterialCommunityIcons name="format-list-bulleted" size={18} color={COLORS.primary} style={styles.inputIcon} />
                    <Picker
                      selectedValue={category}
                      style={styles.picker}
                      onValueChange={setCategory}
                    >
                      <Picker.Item label="Library" value="Library" />
                      <Picker.Item label="SCIT Department" value="SCIT Department" />
                      <Picker.Item label="SESS Department" value="SESS Department" />
                      <Picker.Item label="Hostel" value="Hostel" />
                      <Picker.Item label="Finance" value="Finance" />
                      <Picker.Item label="Security" value="Security" />
                      <Picker.Item label="Mess" value="Mess" />
                      <Picker.Item label="Marks" value="Marks" />
                      <Picker.Item label="Other" value="Other" />
                    </Picker>
                  </View>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Urgency</Text>
                  <View style={styles.pickerContainer}>
                    <Ionicons name="alert-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                    <Picker
                      selectedValue={urgency}
                      style={styles.picker}
                      onValueChange={setUrgency}
                    >
                      <Picker.Item label="Normal" value="Normal" />
                      <Picker.Item label="High" value="High" />
                      <Picker.Item label="Critical" value="Critical" />
                    </Picker>
                  </View>
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
});