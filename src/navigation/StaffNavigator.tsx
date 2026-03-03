import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StaffTabNavigator from './StaffTabNavigator';
import StaffProfile from '../screens/staff/StaffProfile';
import EditProfileScreen from '../screens/student/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function StaffNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="TabNavigator"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* MAIN STAFF TABS */}
      <Stack.Screen
        name="TabNavigator"
        component={StaffTabNavigator}
        options={{ headerShown: false }}
      />

      {/* MODAL SCREENS */}
      <Stack.Group
        screenOptions={{
          presentation: 'modal',
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Profile"
          component={StaffProfile}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}