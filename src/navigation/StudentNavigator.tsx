import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentTabNavigator from './StudentTabNavigator';
import ProfileScreen from '../screens/student/ProfileScreen';
import EditProfileScreen from '../screens/student/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function StudentNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="TabNavigator" 
        component={StudentTabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}
