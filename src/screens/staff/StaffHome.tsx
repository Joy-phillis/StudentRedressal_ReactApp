import React from 'react';
import { View, Text, Button } from 'react-native';

export default function StaffHome({ navigation }: any) {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text>Staff Home</Text>
      <Button title="View Assigned Complaints" onPress={() => navigation.navigate('Assigned')} />
      <Button title="Go to Profile" onPress={() => navigation.navigate('Profile')} />
    </View>
  );
}