import React, { createContext, useState, ReactNode } from 'react';

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  registration: string;
  department?: string;
  semester?: string;
  gpa?: string;
  image?: string | null;
}

interface ProfileContextValue {
  profile: ProfileData;
  setProfile: (p: Partial<ProfileData>) => void;
}

const defaultProfile: ProfileData = {
  name: 'Rajesh Singh',
  email: 'rajesh.singh@student.edu',
  phone: '+91 98765 43210',
  location: 'Delhi, India',
  dateOfBirth: '15 August 2004',
  guardianName: 'Vikram Singh',
  guardianPhone: '+91 98765 12345',
  registration: '2023001',
  department: 'Computer Science & Engineering',
  semester: '4th Semester (2025-26)',
  gpa: '8.45 / 10',
  image: null,
};

export const ProfileContext = createContext<ProfileContextValue>({
  profile: defaultProfile,
  setProfile: () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ProfileData>(defaultProfile);

  const setProfile = (patch: Partial<ProfileData>) => {
    setProfileState(prev => ({ ...prev, ...patch }));
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}
