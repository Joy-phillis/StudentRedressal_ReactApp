import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AllComplaints from '../screens/admin/AllComplaints';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={AdminDashboard} />
      <Stack.Screen name="AllComplaints" component={AllComplaints} />
    </Stack.Navigator>
  );
}