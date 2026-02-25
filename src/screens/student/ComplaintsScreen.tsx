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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const dummyHistory = [
  { id: '1', reg: '2023001', name: 'Alice Johnson', course: 'BSc CS', status: 'Pending', date: '2026-02-20' },
  { id: '2', reg: '2023002', name: 'Bob Smith', course: 'BCom', status: 'Resolved', date: '2026-02-18' },
  { id: '3', reg: '2023003', name: 'Carol Lee', course: 'BSc Physics', status: 'In-Progress', date: '2026-02-15' },
];

export default function ComplaintsScreen() {
  const navigation = useNavigation<any>();

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
  const [history, setHistory] = useState(dummyHistory);

  // Animations
  const formScale = useSharedValue(0.8);
  const historyTranslate = useSharedValue(50);

  useEffect(() => {
    formScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    historyTranslate.value = withSpring(0, { damping: 12, stiffness: 90 });
  }, []);

  const formStyle = useAnimatedStyle(() => ({
    transform: [{ scale: formScale.value }],
  }));

  const historyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: historyTranslate.value }],
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

  const handleSubmit = () => {
    if (!validateForm()) return;
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      Alert.alert('Success', 'Complaint submitted successfully!');
      const newComplaint = {
        id: (history.length + 1).toString(),
        reg: regNo,
        name: fullName,
        course,
        status: 'Pending',
        date: new Date().toISOString().slice(0, 10),
      };
      setHistory([newComplaint, ...history]);
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
    }, 1000);
  };

  const renderHistoryCard = ({ item }: any) => {
    let bgColor = '#1E5F9E';
    if (item.status === 'Pending') bgColor = '#FF9800';
    if (item.status === 'Resolved') bgColor = '#4CAF50';
    return (
      <View style={[styles.historyCard, { backgroundColor: bgColor }]}>
        <Text style={styles.historyTitle}>{item.title}</Text>
        <Text style={styles.historyDetails}>{item.name} | {item.course}</Text>
        <Text style={styles.historyStatus}>{item.status}</Text>
        <Text style={styles.historyDate}>{item.date}</Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 120 : 100 }}
    >
      {/* Header with Back */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F3057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Complaint Form</Text>
        <Text style={styles.headerSubtitle}>Submit your complaint to get quick resolution</Text>
      </View>

      {/* Form */}
      <Animated.View style={[formStyle]}>
        {/* Registration Number */}
        <View style={styles.inputContainer}>
          <Ionicons name="card-outline" size={20} color="#0F3057" style={styles.inputIcon} />
          <TextInput placeholder="Registration Number" value={regNo} onChangeText={setRegNo} style={styles.input} />
        </View>
        {errors.regNo && <Text style={styles.errorText}>{errors.regNo}</Text>}

        {/* Full Name */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#0F3057" style={styles.inputIcon} />
          <TextInput placeholder="Full Name" value={fullName} onChangeText={setFullName} style={styles.input} />
        </View>
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

        {/* Gender Picker */}
        <View style={styles.inputContainer}>
          <Ionicons name="male-female-outline" size={20} color="#0F3057" style={styles.inputIcon} />
          <Picker
            selectedValue={gender}
            style={styles.picker}
            onValueChange={(itemValue: string) => setGender(itemValue)}
          >
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

        {/* Year Picker */}
        <View style={styles.inputContainer}>
          <Ionicons name="school-outline" size={20} color="#0F3057" style={styles.inputIcon} />
          <Picker
            selectedValue={year}
            style={styles.picker}
            onValueChange={(itemValue: string) => setYear(itemValue)}
          >
            <Picker.Item label="1st Year" value="1" />
            <Picker.Item label="2nd Year" value="2" />
            <Picker.Item label="3rd Year" value="3" />
            <Picker.Item label="4th Year" value="4" />
          </Picker>
        </View>

        {/* Course */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="book-outline" size={20} color="#0F3057" style={styles.inputIcon} />
          <TextInput placeholder="Course" value={course} onChangeText={setCourse} style={styles.input} />
        </View>
        {errors.course && <Text style={styles.errorText}>{errors.course}</Text>}

        {/* Complaint Title */}
        <View style={styles.inputContainer}>
          <Ionicons name="pencil-outline" size={20} color="#0F3057" style={styles.inputIcon} />
          <TextInput placeholder="Complaint Title" value={title} onChangeText={setTitle} style={styles.input} />
        </View>
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

        {/* Category Picker */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#0F3057" style={styles.inputIcon} />
          <Picker
            selectedValue={category}
            style={styles.picker}
            onValueChange={(itemValue: string) => setCategory(itemValue)}
          >
            <Picker.Item label="Library" value="Library" />
            <Picker.Item label="Cafeteria" value="Cafeteria" />
            <Picker.Item label="Lab" value="Lab" />
            <Picker.Item label="Hostel" value="Hostel" />
            <Picker.Item label="Transport" value="Transport" />
          </Picker>
        </View>

        {/* Description */}
        <View style={[styles.inputContainer, { height: 120, alignItems: 'flex-start' }]}>
          <Ionicons name="document-text-outline" size={20} color="#0F3057" style={styles.inputIcon} />
          <TextInput
            placeholder="Detailed Description"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
            multiline
          />
        </View>
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

        {/* Urgency Picker */}
        <View style={styles.inputContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#0F3057" style={styles.inputIcon} />
          <Picker
            selectedValue={urgency}
            style={styles.picker}
            onValueChange={(itemValue: string) => setUrgency(itemValue)}
          >
            <Picker.Item label="Normal" value="Normal" />
            <Picker.Item label="High" value="High" />
            <Picker.Item label="Critical" value="Critical" />
          </Picker>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && { backgroundColor: '#777' }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Ionicons name="send-outline" size={22} color="#fff" />
          <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Complaint'}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Complaint History */}
      <Text style={styles.sectionTitle}>Your Recent Complaints</Text>
      <Animated.View style={[historyStyle]}>
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 5, paddingBottom: 20 }}
          renderItem={renderHistoryCard}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB', paddingHorizontal: 20, paddingTop: 20 },

  headerContainer: { marginBottom: 20 },
  backButton: { marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#0F3057', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: '#777', marginBottom: 15 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#0F3057' },

  picker: { flex: 1, color: '#0F3057' },

  errorText: { color: '#FF3B30', marginBottom: 8, marginLeft: 5 },

  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E5F9E',
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 25,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },

  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0F3057', marginBottom: 15 },

  historyCard: {
    width: width * 0.65,
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 7,
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  historyTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  historyDetails: { color: '#fff', fontSize: 12, marginTop: 2 },
  historyStatus: { color: '#fff', marginTop: 5, fontWeight: '600' },
  historyDate: { color: '#fff', fontSize: 11, marginTop: 3 },
});