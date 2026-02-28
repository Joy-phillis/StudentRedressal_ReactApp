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

export default function TermsScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
  <StatusBar barStyle="light-content" />

  {/* HEADER */}
  <View style={styles.header}>
    {/* Back Button */}
    <TouchableOpacity
      style={styles.backBtn}
      onPress={() => navigation.goBack()}
    >
      <Ionicons name="arrow-back" size={22} color="#fff" />
    </TouchableOpacity>

    {/* Title & Subtitle */}
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>Terms & Conditions</Text>
      <Text style={styles.headerSubtitle}>Platform usage guidelines</Text>
    </View>
  </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {renderCard(
          'Acceptance of Terms',
          'document-text-outline',
          'By accessing this system, you agree to comply with institutional policies and platform regulations.'
        )}

        {renderCard(
          'User Responsibility',
          'create-outline',
          'Users must provide accurate complaint information. False or misleading submissions may result in disciplinary action.'
        )}

        {renderCard(
          'Confidentiality',
          'eye-off-outline',
          'All complaints are treated confidentially and accessed only by authorized institutional staff.'
        )}

        {renderCard(
          'System Misuse',
          'warning-outline',
          'Unauthorized access, tampering, or misuse of the platform is strictly prohibited and may lead to account suspension.'
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
  paddingTop: 60, // for status bar
  paddingBottom: 20,
  paddingHorizontal: 20,
  borderBottomLeftRadius: 30,
  borderBottomRightRadius: 30,
},

backBtn: {
  marginRight: 15, // spacing between arrow and title
},

headerContent: {
  flex: 1, // takes remaining space
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