import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { View, Text } from 'react-native';

import StudentHome from '../screens/student/StudentHome';
import ComplaintsScreen from '../screens/student/ComplaintsScreen';
import NotificationsScreen from '../screens/student/NotificationsScreen';
import SettingsScreen from '../screens/student/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function StudentTabNavigator() {
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
          if (route.name === 'Complaints') iconName = 'document-text-outline';
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
      <Tab.Screen name="Home" component={StudentHome} />
      <Tab.Screen name="Complaints" component={ComplaintsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}