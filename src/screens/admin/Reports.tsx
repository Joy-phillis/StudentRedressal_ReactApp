import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Reports({ navigation }: any) {
  const [range, setRange] = useState<'month'|'quarter'|'year'>('month');

  const metrics = {
    month: { complaints: 32, resolution: 89, avgDays: 2.3 },
    quarter: { complaints: 96, resolution: 87, avgDays: 2.6 },
    year: { complaints: 410, resolution: 85, avgDays: 3.1 },
  };

  const m = metrics[range];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#0F3057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics & Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.rangeRow}>
        <TouchableOpacity style={[styles.rangeBtn, range === 'month' && styles.rangeActive]} onPress={() => setRange('month')}><Text style={range === 'month' ? styles.rangeTextActive : styles.rangeText}>Month</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.rangeBtn, range === 'quarter' && styles.rangeActive]} onPress={() => setRange('quarter')}><Text style={range === 'quarter' ? styles.rangeTextActive : styles.rangeText}>Quarter</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.rangeBtn, range === 'year' && styles.rangeActive]} onPress={() => setRange('year')}><Text style={range === 'year' ? styles.rangeTextActive : styles.rangeText}>Year</Text></TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.metricTitle}>Total Complaints</Text>
        <Text style={styles.metricValue}>{m.complaints}</Text>

        <Text style={styles.metricTitle}>Resolution Rate</Text>
        <Text style={styles.metricValue}>{m.resolution}%</Text>

        <Text style={styles.metricTitle}>Average Response Time</Text>
        <Text style={styles.metricValue}>{m.avgDays} Days</Text>

        <View style={{ marginTop: 16 }}>
          <Text style={{ color: '#555', marginBottom: 8 }}>Resolution Trend</Text>
          <View style={styles.sparkRow}>
            {[80, 85, 88, 89, 92].map((v, i) => (
              <View key={i} style={[styles.sparkBar, { height: 40 + v - 75 }]} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB', paddingHorizontal: 20, paddingTop: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F3057' },
  backBtn: { padding: 4 },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 15, marginTop: 12 },
  metricTitle: { color: '#777', marginTop: 12 },
  metricValue: { fontSize: 20, fontWeight: '700', color: '#1E5F9E' },
  rangeRow: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 8 },
  rangeBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', marginRight: 8 },
  rangeActive: { backgroundColor: '#1E5F9E' },
  rangeText: { color: '#0F3057' },
  rangeTextActive: { color: '#fff' },
  sparkRow: { flexDirection: 'row', alignItems: 'flex-end', height: 80 },
  sparkBar: { width: 12, backgroundColor: '#1E5F9E', marginRight: 6, borderRadius: 4 },
});