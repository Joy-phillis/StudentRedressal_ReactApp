import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <RootNavigator />
      <StatusBar style="auto" />
    </View>
  );
}