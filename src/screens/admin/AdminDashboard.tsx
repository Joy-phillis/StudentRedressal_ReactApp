import React from 'react';
import { View, Text, Button } from 'react-native';

export default function AdminDashboard({ navigation }: any) {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text>Admin Dashboard</Text>
      <Button title="View All Complaints" onPress={() => navigation.navigate('AllComplaints')} />
    </View>
  );
}