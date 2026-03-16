import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textLight: string;
  border: string;
  card: string;
  icon: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: (value: boolean) => void;
  colors: ThemeColors;
}

const LIGHT_COLORS = {
  primary: '#1E5F9E',
  secondary: '#FF3B30',
  background: '#F4F7FB',
  surface: '#FFFFFF',
  text: '#0F3057',
  textLight: '#6B7280',
  border: '#E5E7EB',
  card: '#FFFFFF',
  icon: '#0F3057',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF3B30',
  info: '#2196F3',
};

const DARK_COLORS = {
  primary: '#3B82F6',
  secondary: '#FF3B30',
  background: '#1A1A2E',
  surface: '#16213E',
  text: '#E8E8E8',
  textLight: '#A0A0A0',
  border: '#2A2A4E',
  card: '#1F2940',
  icon: '#E8E8E8',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF6B6B',
  info: '#64B5F6',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('darkMode');
      if (savedTheme !== null) {
        setIsDark(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    } finally {
      setLoaded(true);
    }
  };

  const toggleTheme = async (value: boolean) => {
    setIsDark(value);
    try {
      await AsyncStorage.setItem('darkMode', JSON.stringify(value));
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  if (!loaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: isDark ? DARK_COLORS : LIGHT_COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
