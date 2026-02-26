import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#2E5090',
  secondary: '#FF6B6B',
  accent: '#4CAF50',
  warning: '#FFA500',
  info: '#2196F3',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1A2332',
  textLight: '#6B7280',
  border: '#E5E7EB',
  shadow: '#000000',
  success: '#10B981',
};

interface Notification {
  id: string;
  type: 'complaint' | 'system' | 'announcement' | 'update' | 'urgent';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: string;
  actionable?: boolean;
  complaintId?: string;
  status?: string;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'complaint',
    title: 'Complaint Status Updated',
    message: 'Your complaint "Library Noise Issue" has been marked as In-Progress',
    timestamp: '5 minutes ago',
    read: false,
    icon: 'alert-circle',
    complaintId: '1',
    status: 'In-Progress',
  },
  {
    id: '2',
    type: 'urgent',
    title: 'Urgent: Campus Closure',
    message: 'Campus will be closed on 28th Feb for maintenance. All activities suspended.',
    timestamp: '2 hours ago',
    read: false,
    icon: 'alert',
  },
  {
    id: '3',
    type: 'announcement',
    title: 'New Feature Available',
    message: 'Complaint tracking feature is now live. Track your complaints in real-time.',
    timestamp: '1 day ago',
    read: true,
    icon: 'star',
  },
  {
    id: '4',
    type: 'update',
    title: 'Your Complaint Resolved',
    message: 'Your complaint "Cafeteria Food Quality" has been successfully resolved.',
    timestamp: '2 days ago',
    read: true,
    icon: 'check-circle',
    complaintId: '2',
    status: 'Resolved',
  },
  {
    id: '5',
    type: 'system',
    title: 'Maintenance Scheduled',
    message: 'System maintenance is scheduled for tonight 2 AM - 4 AM IST.',
    timestamp: '3 days ago',
    read: true,
    icon: 'settings',
  },
  {
    id: '6',
    type: 'complaint',
    title: 'New Response on Your Complaint',
    message: 'Admin has responded to your complaint with more information.',
    timestamp: '5 days ago',
    read: true,
    icon: 'mail',
  },
];

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const headerScale = useSharedValue(0.8);
  const headerOpacity = useSharedValue(0);
  const listTranslate = useSharedValue(50);
  const listOpacity = useSharedValue(0);

  useFocusEffect(
    React.useCallback(() => {
      headerScale.value = withSpring(1, { damping: 13, stiffness: 100 });
      headerOpacity.value = withTiming(1, { duration: 400 });
      listTranslate.value = withTiming(0, { duration: 500 });
      listOpacity.value = withTiming(1, { duration: 500 });
    }, [])
  );

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  const listStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: listTranslate.value }],
    opacity: listOpacity.value,
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return COLORS.secondary;
      case 'complaint':
        return COLORS.info;
      case 'update':
        return COLORS.success;
      case 'announcement':
        return COLORS.accent;
      case 'system':
        return COLORS.warning;
      default:
        return COLORS.primary;
    }
  };

  const getNotificationIcon = (type: string, icon: string) => {
    switch (type) {
      case 'urgent':
        return 'alert';
      case 'complaint':
        return 'alert-circle';
      case 'update':
        return 'check-circle';
      case 'announcement':
        return 'star';
      case 'system':
        return 'settings';
      default:
        return 'bell';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const markAsUnread = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((n) =>
        n.id === id ? { ...n, read: false } : n
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((n) => n.id !== id)
    );
  };

  const markAllAsRead = () => {
    if (unreadCount === 0) return; // Don't do anything if no unread
    setNotifications((prevNotifications) =>
      prevNotifications.map((n) => ({ ...n, read: true }))
    );
    Alert.alert('Success', 'All notifications marked as read!');
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Refreshed', 'Notifications updated successfully!');
    }, 1500);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilter === 'unread') return !n.read;
    if (selectedFilter === 'all') return true;
    return n.type === selectedFilter;
  });

  const renderNotificationItem = ({ item, index }: { item: Notification; index: number }) => {
    const color = getNotificationColor(item.type);
    const iconName = getNotificationIcon(item.type, item.icon);

    return (
      <Animated.View
        entering={FadeInDown.delay(100 + index * 50).duration(500)}
        layout={Layout.springify()}
        style={styles.notificationItemWrapper}
      >
        <TouchableOpacity
          style={[
            styles.notificationCard,
            !item.read && styles.notificationCardUnread,
          ]}
          activeOpacity={0.7}
          onPress={() => markAsRead(item.id)}
        >
          {/* Left Badge */}
          <View style={[styles.notificationBadge, { backgroundColor: color + '20' }]}>
            <FontAwesome5 name={iconName} size={20} color={color} solid />
          </View>

          {/* Content */}
          <View style={styles.notificationContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.notificationTitle, !item.read && styles.titleUnread]}>
                {item.title}
              </Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>{item.timestamp}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => (item.read ? markAsUnread(item.id) : markAsRead(item.id))}
            >
              <Ionicons
                name={item.read ? 'mail-outline' : 'mail-open-outline'}
                size={18}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteNotification(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFilterButton = (filter: string, label: string) => {
    const isActive = selectedFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setSelectedFilter(filter)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterButtonText,
            isActive && styles.filterButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialCommunityIcons
        name="bell-off-outline"
        size={64}
        color={COLORS.textLight}
        style={{ marginBottom: 16 }}
      />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateMessage}>
        You're all caught up! Check back later for updates.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <Animated.View style={[styles.headerContainer, headerStyle]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonBg}>
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
          <View style={styles.titleArea}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
            activeOpacity={unreadCount === 0 ? 1 : 0.7}
          >
            <Text
              style={[
                styles.markAllText,
                unreadCount === 0 && { opacity: 0.5 },
              ]}
            >
              Mark All
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Filter Buttons - Compact Horizontal */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          contentContainerStyle={styles.filterContentContainer}
        >
          {renderFilterButton('all', 'All')}
          {renderFilterButton('unread', 'Unread')}
          {renderFilterButton('complaint', 'Issues')}
          {renderFilterButton('urgent', 'Urgent')}
          {renderFilterButton('announcement', 'News')}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <Animated.View style={[styles.listContainer, listStyle]}>
        {filteredNotifications.length > 0 ? (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            scrollEnabled
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
                titleColor={COLORS.primary}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
                titleColor={COLORS.primary}
              />
            }
          >
            {renderEmptyState()}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  headerContainer: {
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 68 : 60,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 8,
  },
  backButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  unreadBadge: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 11,
  },
  markAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Filter
  filterWrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 16,
  },
  filterContentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  filterButtonTextActive: {
    color: COLORS.surface,
  },

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // Notification Item
  notificationItemWrapper: {
    marginBottom: 10,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 0,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  notificationCardUnread: {
    backgroundColor: COLORS.primary + '08',
    borderColor: COLORS.primary + '30',
  },
  notificationBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    marginRight: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    lineHeight: 19,
  },
  titleUnread: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.secondary,
    marginLeft: 6,
  },
  notificationMessage: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 6,
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Actions
  actionContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});
