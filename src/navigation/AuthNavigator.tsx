import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator();

interface AuthNavigatorProps {
  setUserRole: (role: string) => void;
}

export default function AuthNavigator({ setUserRole }: AuthNavigatorProps) {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login">
        {props => <LoginScreen {...props} setUserRole={setUserRole} />}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {props => <RegisterScreen {...props} setUserRole={setUserRole} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}