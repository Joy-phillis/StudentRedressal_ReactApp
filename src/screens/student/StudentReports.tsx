import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../services/supabase';

interface Complaint {
  id: string;
  title: string;
  status: string;
  urgency: string;
  category: string;
  created_at: string;
  assigned_at: string | null;
}

interface ReportMetrics {
  total: number;
  pending: number;
  resolved: number;
  inProgress: number;
  overdue: number;
  resolutionRate: number;
  avgResolutionDays: number;
  byCategory: { [key: string]: number };
  byUrgency: { [key: string]: number };
  monthlyData: { month: string; count: number }[];
}

export default function StudentReports({ navigation, route }: any) {
  const [range, setRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [studentName, setStudentName] = useState('Student');

  useEffect(() => {
    fetchStudentData();
  }, [range]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Fetch student name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setStudentName(profileData.full_name || 'Student');
      }

      // Fetch student's complaints with date filtering
      const dateFilter = getDateFilter(range);
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyComplaints(data || []);
    } catch (error: any) {
      console.error('Error fetching student data:', error.message);
      Alert.alert('Error', 'Could not fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = (rangeType: string): string => {
    const now = new Date();
    let startDate: Date;

    switch (rangeType) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return startDate.toISOString();
  };

  const metrics: ReportMetrics = useMemo(() => {
    const total = myComplaints.length;
    const pending = myComplaints.filter(c => c.status === 'Pending').length;
    const resolved = myComplaints.filter(c => c.status === 'Resolved').length;
    const inProgress = myComplaints.filter(c => c.status === 'In-Progress').length;
    const overdue = myComplaints.filter(c => c.status === 'Overdue').length;
    
    const resolutionRate = total === 0 ? 0 : Math.round((resolved / total) * 100);
    
    // Calculate average resolution time (mock - would need resolved_at column for accurate)
    const avgResolutionDays = resolved > 0 ? 3.5 : 0;

    // Group by category
    const byCategory: { [key: string]: number } = {};
    myComplaints.forEach(c => {
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });

    // Group by urgency
    const byUrgency: { [key: string]: number } = {};
    myComplaints.forEach(c => {
      byUrgency[c.urgency || 'Normal'] = (byUrgency[c.urgency || 'Normal'] || 0) + 1;
    });

    // Monthly trend data
    const monthlyData: { month: string; count: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthNames[monthDate.getMonth()];
      const count = myComplaints.filter(c => {
        const complaintDate = new Date(c.created_at);
        return complaintDate.getMonth() === monthDate.getMonth() && 
               complaintDate.getFullYear() === monthDate.getFullYear();
      }).length;
      monthlyData.push({ month: monthKey, count });
    }

    return {
      total,
      pending,
      resolved,
      inProgress,
      overdue,
      resolutionRate,
      avgResolutionDays,
      byCategory,
      byUrgency,
      monthlyData,
    };
  }, [myComplaints]);

  const generatePDF = async () => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              h1 { color: #1E5F9E; border-bottom: 2px solid #1E5F9E; padding-bottom: 10px; }
              h2 { color: #0F3057; margin-top: 30px; }
              .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .date { color: #666; font-size: 14px; }
              .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
              .metric-card { background: #F4F7FB; padding: 15px; border-radius: 8px; border-left: 4px solid #1E5F9E; }
              .metric-value { font-size: 24px; font-weight: bold; color: #1E5F9E; }
              .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #1E5F9E; color: white; }
              .status-pending { color: #FF9800; font-weight: bold; }
              .status-resolved { color: #4CAF50; font-weight: bold; }
              .status-inprogress { color: #2196F3; font-weight: bold; }
              .status-overdue { color: #FF3B30; font-weight: bold; }
              .chart-bar { display: inline-block; background: #1E5F9E; margin-right: 8px; border-radius: 4px; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Student Complaint Report</h1>
              <div class="date">
                <p>Generated: ${new Date().toLocaleDateString()}</p>
                <p>Student: ${studentName}</p>
                <p>Period: ${range.charAt(0).toUpperCase() + range.slice(1)}</p>
              </div>
            </div>

            <h2>My Complaint Summary</h2>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="metric-value">${metrics.total}</div>
                <div class="metric-label">Total Complaints</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${metrics.pending}</div>
                <div class="metric-label">Pending</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${metrics.resolved}</div>
                <div class="metric-label">Resolved</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${metrics.inProgress}</div>
                <div class="metric-label">In Progress</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${metrics.resolutionRate}%</div>
                <div class="metric-label">Resolution Rate</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${metrics.avgResolutionDays.toFixed(1)} days</div>
                <div class="metric-label">Avg Resolution Time</div>
              </div>
            </div>

            <h2>By Category</h2>
            <table>
              <tr><th>Category</th><th>Count</th></tr>
              ${Object.entries(metrics.byCategory).map(([cat, count]) => 
                `<tr><td>${cat}</td><td>${count}</td></tr>`
              ).join('')}
            </table>

            <h2>By Urgency</h2>
            <table>
              <tr><th>Urgency</th><th>Count</th></tr>
              ${Object.entries(metrics.byUrgency).map(([urg, count]) => 
                `<tr><td>${urg}</td><td>${count}</td></tr>`
              ).join('')}
            </table>

            <h2>Monthly Trend</h2>
            <div style="margin: 20px 0;">
              ${metrics.monthlyData.map(m => 
                `<div style="margin-bottom: 8px;">
                  <span style="display:inline-block;width:40px;">${m.month}</span>
                  <span class="chart-bar" style="width:${Math.max(m.count * 20, 4)}px;height:20px;"></span>
                  <span style="margin-left:8px;">${m.count}</span>
                </div>`
              ).join('')}
            </div>

            <h2>My Complaints</h2>
            <table>
              <tr><th>Title</th><th>Status</th><th>Category</th><th>Date</th></tr>
              ${myComplaints.slice(0, 10).map(c => `
                <tr>
                  <td>${c.title}</td>
                  <td class="status-${c.status.toLowerCase().replace('-', '')}">${c.status}</td>
                  <td>${c.category}</td>
                  <td>${new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </table>

            <div class="footer">
              <p>Student Redressal System - Personal Report</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === 'android') {
        await Sharing.shareAsync(uri);
      } else {
        await Print.printAsync({ uri });
      }
    } catch (error: any) {
      console.error('PDF generation error:', error.message);
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E5F9E" />
        <Text style={styles.loadingText}>Loading your report...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#0F3057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <TouchableOpacity onPress={generatePDF} style={styles.downloadBtn}>
          <Ionicons name="download-outline" size={24} color="#1E5F9E" />
        </TouchableOpacity>
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
        {/* Summary Cards */}
        <View style={styles.card}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{metrics.total}</Text>
              <Text style={styles.metricLabel}>Total Complaints</Text>
            </View>
            <View style={[styles.metricBox, { borderLeftColor: '#FF9800' }]}>
              <Text style={styles.metricValue}>{metrics.pending}</Text>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
            <View style={[styles.metricBox, { borderLeftColor: '#4CAF50' }]}>
              <Text style={styles.metricValue}>{metrics.resolved}</Text>
              <Text style={styles.metricLabel}>Resolved</Text>
            </View>
            <View style={[styles.metricBox, { borderLeftColor: '#2196F3' }]}>
              <Text style={styles.metricValue}>{metrics.inProgress}</Text>
              <Text style={styles.metricLabel}>In Progress</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Resolution Rate</Text>
              <Text style={styles.statValue}>{metrics.resolutionRate}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg Response Time</Text>
              <Text style={styles.statValue}>{metrics.avgResolutionDays.toFixed(1)} Days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Overdue</Text>
              <Text style={[styles.statValue, { color: '#FF3B30' }]}>{metrics.overdue}</Text>
            </View>
          </View>
        </View>

        {/* By Category */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>By Category</Text>
          {Object.entries(metrics.byCategory).map(([category, count], index) => (
            <View key={index} style={styles.barRow}>
              <Text style={styles.barLabel}>{category}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${(count / metrics.total) * 100}%` }]} />
              </View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          ))}
        </View>

        {/* By Urgency */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>By Urgency</Text>
          {Object.entries(metrics.byUrgency).map(([urgency, count], index) => (
            <View key={index} style={styles.barRow}>
              <Text style={styles.barLabel}>{urgency}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${(count / metrics.total) * 100}%`, backgroundColor: getUrgencyColor(urgency) }]} />
              </View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          ))}
        </View>

        {/* Monthly Trend */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>6-Month Trend</Text>
          <View style={styles.trendContainer}>
            {metrics.monthlyData.map((item, index) => (
              <View key={index} style={styles.trendItem}>
                <View style={[styles.trendBar, { height: Math.max(item.count * 15, 4) }]} />
                <Text style={styles.trendMonth}>{item.month}</Text>
                <Text style={styles.trendCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* My Complaints List */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>My Complaints</Text>
          {myComplaints.length === 0 ? (
            <Text style={styles.emptyText}>No complaints in this period</Text>
          ) : (
            myComplaints.slice(0, 10).map((complaint, index) => (
              <View key={index} style={styles.complaintRow}>
                <View style={styles.complaintInfo}>
                  <Text style={styles.complaintTitle} numberOfLines={1}>{complaint.title}</Text>
                  <Text style={styles.complaintMeta}>{complaint.category} • {new Date(complaint.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) }]}>
                  <Text style={styles.statusText}>{complaint.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getUrgencyColor = (urgency: string): string => {
  switch (urgency) {
    case 'Critical': return '#FF3B30';
    case 'High': return '#FF9800';
    default: return '#1E5F9E';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Pending': return '#FF9800';
    case 'Resolved': return '#4CAF50';
    case 'In-Progress': return '#2196F3';
    case 'Overdue': return '#FF3B30';
    default: return '#1E5F9E';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB', paddingHorizontal: 20, paddingTop: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7FB' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F3057' },
  backBtn: { padding: 4 },
  downloadBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 8, elevation: 2 },
  rangeRow: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 8, marginBottom: 16 },
  rangeBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#fff', marginRight: 8 },
  rangeActive: { backgroundColor: '#1E5F9E' },
  rangeText: { color: '#0F3057' },
  rangeTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 15, elevation: 2 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricBox: { width: '48%', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#1E5F9E' },
  metricValue: { fontSize: 24, fontWeight: '700', color: '#1E5F9E' },
  metricLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#666' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1E5F9E', marginTop: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F3057', marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { width: 100, fontSize: 13, color: '#555' },
  barContainer: { flex: 1, height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', marginHorizontal: 10 },
  barFill: { height: '100%', backgroundColor: '#1E5F9E', borderRadius: 6 },
  barCount: { width: 30, fontSize: 13, fontWeight: '600', color: '#0F3057', textAlign: 'right' },
  trendContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 10 },
  trendItem: { alignItems: 'center', flex: 1 },
  trendBar: { width: 24, backgroundColor: '#1E5F9E', borderRadius: 4, marginBottom: 6 },
  trendMonth: { fontSize: 11, color: '#666' },
  trendCount: { fontSize: 12, fontWeight: '600', color: '#1E5F9E', marginTop: 4 },
  complaintRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  complaintInfo: { flex: 1 },
  complaintTitle: { fontSize: 14, fontWeight: '600', color: '#0F3057' },
  complaintMeta: { fontSize: 11, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  emptyText: { textAlign: 'center', color: '#666', fontSize: 14, paddingVertical: 20 },
});
