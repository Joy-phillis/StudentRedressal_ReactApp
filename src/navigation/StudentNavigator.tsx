import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentTabNavigator from './StudentTabNavigator';
import ProfileScreen from '../screens/student/ProfileScreen';
import EditProfileScreen from '../screens/student/EditProfileScreen';
import TermsConditions from '../screens/student/TermsScreen';
import PrivacyPolicy from '../screens/student/PrivacyPolicyScreen';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator();

export default function StudentNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* MAIN TABS */}
      <Stack.Screen 
        name="TabNavigator" 
        component={StudentTabNavigator} 
        options={{ headerShown: false }}
      />

      {/* MODAL GROUP */}
      <Stack.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen}
        />

        {/* ✅ ADDED SCREENS */}
        <Stack.Screen 
          name="TermsConditions" 
          component={TermsConditions}
        />
        <Stack.Screen 
          name="PrivacyPolicy" 
          component={PrivacyPolicy}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}