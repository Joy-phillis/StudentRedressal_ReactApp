import React, { createContext, useContext } from 'react';

interface AuthContextType {
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ logout: () => void }> = ({ logout, children }) => {
  return <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>;
};
