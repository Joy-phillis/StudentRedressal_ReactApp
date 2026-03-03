import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminBottomTabs from './AdminBottomTabs';
import AdminProfile from '../screens/admin/AdminProfile';

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
    </Stack.Navigator>
  );
}