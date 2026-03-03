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
      }}
    >
      <Stack.Screen
        name="AdminTabs"
        component={AdminBottomTabs}
      />

      {/* 🔥 ADD THIS */}
      <Stack.Screen
        name="AdminProfile"
        component={AdminProfile}
      />
    </Stack.Navigator>
  );
}