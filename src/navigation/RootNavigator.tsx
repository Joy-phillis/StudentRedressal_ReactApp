import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ProfileProvider } from '../context/ProfileContext';
import AuthNavigator from './AuthNavigator';
import { AuthProvider } from '../context/AuthContext';
import StudentNavigator from './StudentNavigator';
import AdminNavigator from './AdminBottomTabs';
import StaffNavigator from './StaffNavigator';
import SplashScreenPage from '../screens/SplashScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

type UserRole = 'student' | 'admin' | 'staff' | null;

export default function RootNavigator() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    // Clear any previously stored role so every launch starts at login
    const init = async () => {
      try {
        await AsyncStorage.removeItem('userRole');
      } catch (error) {
        console.log('Error clearing role:', error);
      } finally {
        setUserRole(null);
        setIsLoadingUser(false);
      }
    };

    init();

    // Splash screen timer
    const timer = setTimeout(() => setIsSplashVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Logout function (used by AuthContext)
  const handleLogout = async () => {
    try {
      // also sign out from Supabase so session is cleared
      await supabase.auth.signOut();
    } catch (err) {
      console.log('supabase signOut error', err);
    }
    AsyncStorage.removeItem('userRole'); // Clear stored role
    setUserRole(null); // This will automatically show AuthNavigator
  };

  // Show splash screen first
  if (isSplashVisible || isLoadingUser) {
    return <SplashScreenPage />;
  }

  return (
    <NavigationContainer>
      <AuthProvider logout={handleLogout} />
      {userRole ? (
        // Only authenticated users get ProfileProvider
        <ProfileProvider>
          {userRole === 'student' && <StudentNavigator />}
          {userRole === 'admin' && <AdminNavigator />}
          {userRole === 'staff' && <StaffNavigator />}
        </ProfileProvider>
      ) : (
        // Unauthenticated users see AuthNavigator
        <AuthNavigator
          setUserRole={async (role: string) => {
            if (role === 'student' || role === 'admin' || role === 'staff') {
              await AsyncStorage.setItem('userRole', role);
              setUserRole(role);
            } else {
              console.warn(`Invalid role: ${role}`);
            }
          }}
        />
      )}
    </NavigationContainer>
  );
}