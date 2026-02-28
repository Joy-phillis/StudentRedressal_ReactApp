import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#1E5F9E',
  background: '#F4F7FB',
  card: '#FFFFFF',
  text: '#0F3057',
  textLight: '#6B7280',
};

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
    <View style={styles.header}>
  <TouchableOpacity
    style={styles.backBtn}
    onPress={() => navigation.goBack()}
  >
    <Ionicons name="arrow-back" size={22} color="#fff" />
  </TouchableOpacity>

  <View style={styles.headerContent}>
    <Text style={styles.headerTitle}>Privacy Policy</Text>
    <Text style={styles.headerSubtitle}>
      Your data security & confidentiality
    </Text>
  </View>
</View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {renderCard(
          'Information We Collect',
          'person-circle-outline',
          'We collect profile details including name, email, role, and complaint submissions to ensure proper case handling.'
        )}

        {renderCard(
          'Data Usage',
          'analytics-outline',
          'Your information is used strictly for complaint processing, institutional administration, and service improvement.'
        )}

        {renderCard(
          'Data Protection',
          'shield-checkmark-outline',
          'All user data is secured through Supabase authentication and encrypted communication protocols.'
        )}

        {renderCard(
          'Data Sharing',
          'lock-closed-outline',
          'Personal data is never shared with third parties outside authorized institutional officials.'
        )}

        <Text style={styles.footer}>
          © 2026 Student Redressal System
        </Text>
      </ScrollView>
    </View>
  );

  function renderCard(title: string, icon: any, content: string) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <Text style={styles.cardText}>{content}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
 header: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: COLORS.primary,
  paddingTop: 60,
  paddingBottom: 20,
  paddingHorizontal: 20,
  borderBottomLeftRadius: 30,
  borderBottomRightRadius: 30,
},

backBtn: {
  paddingRight: 15, // spacing from title
},

headerContent: {
  flex: 1, // take remaining space
  justifyContent: 'center',
},

headerTitle: {
  color: '#fff',
  fontSize: 22,
  fontWeight: '700',
},

headerSubtitle: {
  color: '#E0E7FF',
  marginTop: 2,
  fontSize: 13,
},

  container: {
    padding: 20,
    marginTop: -25,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  cardTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  cardText: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 30,
    marginBottom: 20,
  },
});