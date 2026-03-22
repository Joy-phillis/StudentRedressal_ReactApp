import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';

interface RealTimeContextType {
  refreshTrigger: number;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export function RealTimeProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  useEffect(() => {
    // Subscribe to complaints changes
    const complaintsChannel = supabase
      .channel('public:complaints')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
        },
        () => {
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    // Subscribe to notifications changes
    const notificationsChannel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    // Subscribe to announcements changes
    const announcementsChannel = supabase
      .channel('public:announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    // Subscribe to messages changes
    const messagesChannel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    // Subscribe to profiles changes
    const profilesChannel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(complaintsChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  return (
    <RealTimeContext.Provider value={{ refreshTrigger }}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
}
