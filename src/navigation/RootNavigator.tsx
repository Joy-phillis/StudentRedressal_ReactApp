import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ProfileProvider } from '../context/ProfileContext';
import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import AdminNavigator from './AdminNavigator';
import StaffNavigator from './StaffNavigator';
import SplashScreenPage from '../screens/SplashScreen';

type UserRole = 'student' | 'admin' | 'staff' | null;

export default function RootNavigator() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    // Simulate fetching user role from async storage or API
    const fetchUserRole = async () => {
      try {
        // Replace this with actual fetch logic
        const storedRole = await new Promise<UserRole>((resolve) =>
          setTimeout(() => resolve(null), 1000) // Simulated delay
        );
        setUserRole(storedRole);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserRole();

    // Splash screen timer
    const timer = setTimeout(() => setIsSplashVisible(false), 3000);

    return () => clearTimeout(timer);
  }, []);

  // 1️⃣ Show Splash First
  if (isSplashVisible) {
    return <SplashScreenPage />;
  }

  // 2️⃣ Show loading state while fetching user role
  if (isLoadingUser) {
    return <SplashScreenPage />; // Could replace with a loading spinner
  }

  // 3️⃣ After Splash & loading → Show Navigation
  return (
    <NavigationContainer>
      <ProfileProvider>
        {userRole === 'student' && <StudentNavigator />}
        {userRole === 'admin' && <AdminNavigator />}
        {userRole === 'staff' && <StaffNavigator />}
        {!userRole && (
          <AuthNavigator
            setUserRole={(role: string) => {
              // Only accept valid roles
              if (role === 'student' || role === 'admin' || role === 'staff') {
                setUserRole(role);
              } else {
                console.warn(`Invalid role: ${role}`);
              }
            }}
          />
        )}
      </ProfileProvider>
    </NavigationContainer>
  );
}