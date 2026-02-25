import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import StaffHome from '../screens/staff/StaffHome';
import AssignedComplaints from '../screens/staff/AssignedComplaints';
import StaffProfile from '../screens/staff/StaffProfile';

const Tab = createBottomTabNavigator();

export default function StaffNavigator() {
  return (
    <Tab.Navigator initialRouteName="Home">
      <Tab.Screen name="Home" component={StaffHome} />
      <Tab.Screen name="Assigned" component={AssignedComplaints} />
      <Tab.Screen name="Profile" component={StaffProfile} />
    </Tab.Navigator>
  );
}