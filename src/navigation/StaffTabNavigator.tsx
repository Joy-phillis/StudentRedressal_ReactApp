import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

import StaffHome from '../screens/staff/StaffHome';
import AssignedComplaints from '../screens/staff/AssignedComplaints';
import StaffReports from '../screens/staff/StaffReports';
import NotificationsScreen from '../screens/staff/NotificationsScreen';
import SettingsScreen from '../screens/staff/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function StaffTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1E5F9E',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 5,
          borderTopWidth: 0,
          backgroundColor: '#fff',
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 3,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Home') iconName = 'home-outline';
          if (route.name === 'Assigned') iconName = 'document-text-outline';
          if (route.name === 'Reports') iconName = 'analytics-outline';
          if (route.name === 'Notifications') iconName = 'notifications-outline';
          if (route.name === 'Settings') iconName = 'settings-outline';

          // Animate icon on focus
          const scale = useSharedValue(focused ? 1.3 : 1);
          scale.value = withTiming(focused ? 1.3 : 1, { duration: 250, easing: Easing.out(Easing.exp) });

          const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }],
          }));

          return (
            <Animated.View style={animatedStyle}>
              <Ionicons name={iconName} size={size} color={color} />
            </Animated.View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={StaffHome} />
      <Tab.Screen name="Assigned" component={AssignedComplaints} />
      <Tab.Screen name="Reports" component={require('../screens/staff/StaffReports').default} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
