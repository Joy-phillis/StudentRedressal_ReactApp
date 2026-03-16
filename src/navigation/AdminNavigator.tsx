import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminBottomTabs from './AdminBottomTabs';
import AdminProfile from '../screens/admin/AdminProfile';
import Reports from '../screens/admin/Reports';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right', // smooth transition to profile
      }}
    >
      {/* Main Bottom Tabs */}
      <Stack.Screen
        name="AdminTabs"
        component={AdminBottomTabs}
      />

      {/* Profile Screen (opens above tabs) */}
      <Stack.Screen
        name="AdminProfile"
        component={AdminProfile}
      />

      {/* Reports Screen */}
      <Stack.Screen
        name="Reports"
        component={Reports}
      />
    </Stack.Navigator>
  );
}