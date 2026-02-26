import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { View, Text } from 'react-native';

import AdminDashboard from '../screens/admin/AdminDashboard';
import AllComplaints from '../screens/admin/AllComplaints';
import ManageStudents from '../screens/admin/ManageStudents';
import ManageStaff from '../screens/admin/ManageStaff';
import SettingsScreen from '../screens/admin/SettingsScreen'; // <- new import

const Tab = createBottomTabNavigator();

export default function AdminBottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1E5F9E',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 75,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: '#fff',
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Dashboard') iconName = 'grid-outline';
          if (route.name === 'Complaints') iconName = 'document-text-outline';
          if (route.name === 'Students') iconName = 'person-outline';
          if (route.name === 'Staff') iconName = 'people-outline';
          if (route.name === 'Settings') iconName = 'settings-outline'; // <- settings icon

          // Smooth animation
          const scale = useSharedValue(focused ? 1.2 : 1);

          scale.value = withTiming(focused ? 1.2 : 1, {
            duration: 220,
            easing: Easing.out(Easing.exp),
          });

          const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }],
          }));

          return (
            <Animated.View style={animatedStyle}>
              <Ionicons name={iconName} size={22} color={color} />
            </Animated.View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboard}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Complaints"
        component={AllComplaints}
        options={{ tabBarLabel: 'Complaints' }}
      />
      <Tab.Screen
        name="Students"
        component={ManageStudents}
        options={{ tabBarLabel: 'Students' }}
      />
      <Tab.Screen
        name="Staff"
        component={ManageStaff}
        options={{ tabBarLabel: 'Staff' }}
      />
      <Tab.Screen
        name="Settings" // <- new tab
        component={SettingsScreen} // <- new screen
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}