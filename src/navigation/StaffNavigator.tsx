import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StaffTabNavigator from './StaffTabNavigator';
import StaffProfile from '../screens/staff/StaffProfile';
import EditProfileScreen from '../screens/student/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function StaffNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="TabNavigator"
        component={StaffTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
        <Stack.Screen name="Profile" component={StaffProfile} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}