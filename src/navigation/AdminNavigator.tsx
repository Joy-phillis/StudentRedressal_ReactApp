import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminBottomTabs from './AdminBottomTabs';
import AdminProfile from '../screens/admin/AdminProfile';
import Reports from '../screens/admin/Reports';
import AllComplaints from '../screens/admin/AllComplaints';
import ManageStaff from '../screens/admin/ManageStaff';
import ManageStudents from '../screens/admin/ManageStudents';
import NotificationsScreen from '../screens/admin/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Main Bottom Tabs */}
      <Stack.Screen
        name="AdminTabs"
        component={AdminBottomTabs}
      />

      {/* Modal Screens */}
      <Stack.Screen
        name="AdminProfile"
        component={AdminProfile}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="Reports"
        component={Reports}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AllComplaints"
        component={AllComplaints}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="ManageStaff"
        component={ManageStaff}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="ManageStudents"
        component={ManageStudents}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}