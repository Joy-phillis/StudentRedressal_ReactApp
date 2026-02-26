import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// reuse sample data from StaffHome; in real app this would come from API
const sampleAssigned = [
  { id: '1', title: 'Room AC Not Working', status: 'Pending', priority: 'High' },
  { id: '2', title: 'Broken Projector', status: 'In-Progress', priority: 'Medium' },
  { id: '3', title: 'Water Leakage in Lab', status: 'Resolved', priority: 'Low' },
  { id: '4', title: 'Door Lock Jammed', status: 'Pending', priority: 'Low' },
  { id: '5', title: 'Network Downtime', status: 'In-Progress', priority: 'High' },
  { id: '6', title: 'Light Flickering', status: 'Resolved', priority: 'Low' },
];

export default function StaffReports({ navigation, route }: any) {
  const [range, setRange] = useState<'month' | 'quarter' | 'year'>('month');
  const assigned = route.params?.assignedList ?? sampleAssigned;

  // compute metrics from passed data
  const metrics = useMemo(() => {
    const total = assigned.length;
    const pending = assigned.filter((c: any) => c.status === 'Pending').length;
    const resolved = assigned.filter((c: any) => c.status === 'Resolved').length;
    const inProgress = assigned.filter((c: any) => c.status === 'In-Progress').length;
    const rate = total === 0 ? 0 : Math.round((resolved / total) * 100);
    const avgDays = 2 + (pending * 0.1);
    return { total, pending, resolved, inProgress, rate, avgDays };
  }, [range, assigned]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#0F3057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.rangeRow}>
        <TouchableOpacity style={[styles.rangeBtn, range === 'month' && styles.rangeActive]} onPress={() => setRange('month')}>
          <Text style={range === 'month' ? styles.rangeTextActive : styles.rangeText}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.rangeBtn, range === 'quarter' && styles.rangeActive]} onPress={() => setRange('quarter')}>
          <Text style={range === 'quarter' ? styles.rangeTextActive : styles.rangeText}>Quarter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.rangeBtn, range === 'year' && styles.rangeActive]} onPress={() => setRange('year')}>
          <Text style={range === 'year' ? styles.rangeTextActive : styles.rangeText}>Year</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.card}>
          <Text style={styles.metricTitle}>Total Assigned</Text>
          <Text style={styles.metricValue}>{metrics.total}</Text>

          <Text style={styles.metricTitle}>Pending</Text>
          <Text style={styles.metricValue}>{metrics.pending}</Text>

          <Text style={styles.metricTitle}>Resolved</Text>
          <Text style={styles.metricValue}>{metrics.resolved}</Text>

          <Text style={styles.metricTitle}>In-Progress</Text>
          <Text style={styles.metricValue}>{metrics.inProgress}</Text>

          <Text style={styles.metricTitle}>Resolution Rate</Text>
          <Text style={styles.metricValue}>{metrics.rate}%</Text>

          <Text style={styles.metricTitle}>Avg Response Time</Text>
          <Text style={styles.metricValue}>{metrics.avgDays.toFixed(1)} Days</Text>

          <View style={{ marginTop: 16 }}>
            <Text style={{ color: '#555', marginBottom: 8 }}>Completion Trend</Text>
            <View style={styles.sparkRow}>
              {[metrics.rate - 5, metrics.rate, metrics.rate + 3, metrics.rate + 1, metrics.rate + 4].map((v, i) => (
                <View key={i} style={[styles.sparkBar, { height: 40 + v - 75 }]} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB', paddingHorizontal: 20, paddingTop: 40 },
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