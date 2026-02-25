import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

  const handleLogin = () => {
    if (!email || !password) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setUserRole(selectedRole);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            onChangeText={setEmail}
            onFocus={() => (emailFocus.value = withTiming(1))}
            onBlur={() => (emailFocus.value = withTiming(0))}
          />
        </Animated.View>

        {/* Password */}
        <Animated.View style={[styles.inputContainer, passwordAnimatedStyle]}>
          <Ionicons name="lock-closed-outline" size={20} color="#555" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={secureText}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            onFocus={() => (passwordFocus.value = withTiming(1))}
            onBlur={() => (passwordFocus.value = withTiming(0))}
          />
          <TouchableOpacity onPress={() => setSecureText(!secureText)}>
            <Ionicons
              name={secureText ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#555"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
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
    marginBottom: 15,
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
});