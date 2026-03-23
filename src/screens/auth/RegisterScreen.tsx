import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

interface RegisterScreenProps {
  setUserRole: (role: string) => void;
}

export default function RegisterScreen({ setUserRole }: RegisterScreenProps) {
  const navigation = useNavigation<any>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'staff'>('student');
  const [secureText, setSecureText] = useState(true);
  const [secureConfirmText, setSecureConfirmText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  // 🔹 Error States
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  const nameFocus = useSharedValue(0);
  const emailFocus = useSharedValue(0);
  const passwordFocus = useSharedValue(0);
  const confirmFocus = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    translateY.value = withSpring(0);
  }, []);

  const animatedContainer = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getFocusStyle = (focusValue: any) =>
    useAnimatedStyle(() => ({
      borderColor: interpolateColor(
        focusValue.value,
        [0, 1],
        ['#E0E0E0', '#1E5F9E']
      ),
    }));

  // 🔹 Validation Functions
  const validateEmail = (value: string) => {
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(value.trim());
  };

  const validatePassword = (value: string) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;
    return passwordRegex.test(value);
  };

  const validateFullName = (value: string) => {
    if (value.trim().length < 3) return false;
    if (/^\d+$/.test(value)) return false;
    return true;
  };

  const handleRegister = async () => {
    let valid = true;

    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');

    if (!validateFullName(fullName)) {
      setNameError('Enter a valid full name');
      valid = false;
    }

    if (!validateEmail(email)) {
      setEmailError('Enter valid email');
      valid = false;
    }

    if (!validatePassword(password)) {
      setPasswordError('Weak password');
      valid = false;
    }

    if (confirmPassword !== password) {
      setConfirmError('Passwords do not match');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    // 1️⃣ Create Auth User
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setEmailError(error.message);
      return;
    }

    const user = data.user;

    if (user) {
      // 2️⃣ Insert into profiles table with default status
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            full_name: fullName,
            email: email,
            role: selectedRole,
            status: 'Active', // default status so admin sees it
          },
        ]);

      if (profileError) {
        setLoading(false);
        alert(profileError.message);
        return;
      }

      // 🔥 Important: Log user out immediately
      await supabase.auth.signOut();

      // ✅ Success Message
      alert('Registration successful! Please login to continue.');

      // ✅ Go back to Login
      navigation.navigate('Login');
    }

    setLoading(false);
  };

  const isFormValid =
    validateFullName(fullName) &&
    validateEmail(email) &&
    validatePassword(password) &&
    confirmPassword === password &&
    !loading;

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <Animated.View style={[styles.container, animatedContainer]}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register to continue</Text>

          {/* Role Selector */}
          <View style={styles.roleContainer}>
            {['student', 'staff'].map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleButton,
                  selectedRole === role && styles.roleButtonActive,
                ]}
                onPress={() => setSelectedRole(role as 'student' | 'staff')}
              >
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === role && styles.roleTextActive,
                  ]}
                >
                  {role.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Full Name */}
          <Animated.View style={[styles.inputContainer, getFocusStyle(nameFocus)]}>
            <Ionicons name="person-outline" size={20} color="#555" />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#888888"
              style={styles.input}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (nameError) setNameError('');
              }}
              onFocus={() => (nameFocus.value = withTiming(1))}
              onBlur={() => (nameFocus.value = withTiming(0))}
            />
          </Animated.View>
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          {/* Email */}
          <Animated.View style={[styles.inputContainer, getFocusStyle(emailFocus)]}>
            <Ionicons name="mail-outline" size={20} color="#555" />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#888888"
              style={styles.input}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              onFocus={() => (emailFocus.value = withTiming(1))}
              onBlur={() => (emailFocus.value = withTiming(0))}
            />
          </Animated.View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          {/* Password */}
          <Animated.View style={[styles.inputContainer, getFocusStyle(passwordFocus)]}>
            <Ionicons name="lock-closed-outline" size={20} color="#555" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#888888"
              secureTextEntry={secureText}
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              onFocus={() => (passwordFocus.value = withTiming(1))}
              onBlur={() => (passwordFocus.value = withTiming(0))}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={() => setShowPasswordHint(true)}>
                <Ionicons name="information-circle-outline" size={20} color="#1E5F9E" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <Ionicons
                  name={secureText ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          {/* Confirm Password */}
          <Animated.View style={[styles.inputContainer, getFocusStyle(confirmFocus)]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#555" />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#888888"
              secureTextEntry={secureConfirmText}
              style={styles.input}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmError) setConfirmError('');
              }}
              onFocus={() => (confirmFocus.value = withTiming(1))}
              onBlur={() => (confirmFocus.value = withTiming(0))}
            />
            <TouchableOpacity onPress={() => setSecureConfirmText(!secureConfirmText)}>
              <Ionicons
                name={secureConfirmText ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#555"
              />
            </TouchableOpacity>
          </Animated.View>
          {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              !isFormValid && { opacity: 0.6 },
            ]}
            onPress={handleRegister}
            disabled={!isFormValid}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerTextBtn}>REGISTER</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}> Login</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Secure • Confidential • Transparent
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Password Requirements Modal */}
      <Modal visible={showPasswordHint} animationType="fade" transparent onRequestClose={() => setShowPasswordHint(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.passwordModalCard}>
            <View style={styles.passwordModalHeader}>
              <Ionicons name="shield-checkmark" size={32} color="#1E5F9E" />
              <Text style={styles.passwordModalTitle}>Password Requirements</Text>
            </View>
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.requirementText}>Minimum 8 characters</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.requirementText}>At least 1 uppercase letter (A-Z)</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.requirementText}>At least 1 lowercase letter (a-z)</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.requirementText}>At least 1 number (0-9)</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.requirementText}>At least 1 special character (@, $, !, %, *, ?, &, #, etc.)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closePasswordHintBtn} onPress={() => setShowPasswordHint(false)}>
              <Text style={styles.closePasswordHintText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ...StyleSheet.flatten({
    wrapper: {
      flex: 1,
      backgroundColor: '#F4F7FB',
    },
  }),
  container: {
    marginHorizontal: 25,
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0F3057',
  },
  subtitle: {
    textAlign: 'center',
    color: '#777',
    marginBottom: 20,
    marginTop: 5,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E5F9E',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#1E5F9E',
  },
  roleText: {
    color: '#1E5F9E',
    fontSize: 12,
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 5,
    backgroundColor: '#FAFAFA',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    color: '#000000',
  },
  registerButton: {
    backgroundColor: '#0F3057',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  registerTextBtn: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#1E5F9E',
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordModalCard: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  passwordModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  passwordModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F3057',
  },
  requirementsList: {
    marginBottom: 20,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  closePasswordHintBtn: {
    backgroundColor: '#1E5F9E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closePasswordHintText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});