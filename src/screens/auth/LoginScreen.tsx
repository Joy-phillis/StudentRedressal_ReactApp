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

interface LoginScreenProps {
  setUserRole: (role: string) => void;
}

export default function LoginScreen({ setUserRole }: LoginScreenProps) {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'admin' | 'staff'>('student');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const containerOpacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  const emailFocus = useSharedValue(0);
  const passwordFocus = useSharedValue(0);

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 800 });
    translateY.value = withSpring(0);
  }, []);

  const animatedContainer = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      emailFocus.value,
      [0, 1],
      ['#E0E0E0', '#1E5F9E']
    ),
  }));

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      passwordFocus.value,
      [0, 1],
      ['#E0E0E0', '#1E5F9E']
    ),
  }));

  // 🔹 Improved Email Validation
  const validateEmail = (value: string) => {
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(value.trim());
  };

  // 🔹 Strong Password Validation
  const validatePassword = (value: string) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{6,}$/;
    return passwordRegex.test(value);
  };

const handleLogin = async () => {
  let valid = true;

  const trimmedEmail = email.trim();

  setEmailError('');
  setPasswordError('');
  setSuccessMessage('');

  if (!trimmedEmail) {
    setEmailError('Email is required');
    valid = false;
  } else if (!validateEmail(trimmedEmail)) {
    setEmailError('Enter a valid email address');
    valid = false;
  }

  if (!password) {
    setPasswordError('Password is required');
    valid = false;
  } else if (password.length < 6) {
    setPasswordError('Password must be at least 6 characters');
    valid = false;
  }

  if (!valid) return;

  setLoading(true);

  // 🔐 Supabase Login
  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password: password,
  });

  if (error) {
    setLoading(false);
    setPasswordError(error.message);
    return;
  }

  if (data.user) {
    // 🔍 Fetch user's actual role from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      setLoading(false);
      setPasswordError('Error verifying user role. Please try again.');
      return;
    }

    if (!profileData) {
      setLoading(false);
      setPasswordError('User profile not found. Please contact support.');
      return;
    }

    const actualRole = profileData.role;
    
    // 🔒 Validate selected role matches actual role
    if (actualRole !== selectedRole) {
      setLoading(false);
      setPasswordError(`Invalid role selection. Your account is registered as ${actualRole.toUpperCase()}. Please select the correct role.`);
      return;
    }

    // ✅ Success message
    setSuccessMessage('Login successful! Redirecting...');

    // ⏳ Small delay so user sees message
    setTimeout(() => {
      setUserRole(selectedRole);
    }, 1200);
  }

  setLoading(false);
};

  const isFormValid =
    validateEmail(email) &&
    validatePassword(password) &&
    !loading;

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, animatedContainer]}>
        <Text style={styles.title}>Student Redressal</Text>
        <Text style={styles.subtitle}>Login to continue</Text>

        {/* Role Selector */}
        <View style={styles.roleContainer}>
          {['student', 'staff', 'admin'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleButton,
                selectedRole === role && styles.roleButtonActive,
              ]}
              onPress={() =>
                setSelectedRole(role as 'student' | 'admin' | 'staff')
              }
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

        {/* Email */}
        <Animated.View style={[styles.inputContainer, emailAnimatedStyle]}>
          <Ionicons name="mail-outline" size={20} color="#555" />
          <TextInput
            placeholder="Email Address"
            placeholderTextColor="#999"
            style={styles.input}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            onBlur={() => {
              emailFocus.value = withTiming(0);
              if (email && !validateEmail(email)) {
                setEmailError('Enter a valid email address');
              }
            }}
            onFocus={() => (emailFocus.value = withTiming(1))}
          />
        </Animated.View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        {/* Password */}
        <Animated.View style={[styles.inputContainer, passwordAnimatedStyle]}>
          <Ionicons name="lock-closed-outline" size={20} color="#555" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={secureText}
            style={styles.input}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
            onBlur={() => {
              passwordFocus.value = withTiming(0);
              if (password && !validatePassword(password)) {
                setPasswordError(
                  'Min 8 chars, 1 uppercase, 1 lowercase, 1 number & 1 special character'
                );
              }
            }}
            onFocus={() => (passwordFocus.value = withTiming(1))}
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

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            !isFormValid && { opacity: 0.6 },
          ]}
          onPress={handleLogin}
          disabled={!isFormValid}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            Don’t have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}> Register</Text>
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
  wrapper: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    justifyContent: 'center',
  },
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
    marginBottom: 25,
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
    color: '#000',
  },
  loginButton: {
    backgroundColor: '#0F3057',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  registerText: {
    color: '#666',
  },
  registerLink: {
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

function setSuccessMessage(arg0: string) {
  throw new Error('Function not implemented.');
}
