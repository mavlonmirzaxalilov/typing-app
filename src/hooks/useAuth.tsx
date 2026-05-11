import React, { createContext, useContext, useEffect, useState } from 'react';
import { account, databases, APPWRITE_CONFIG } from '../lib/appwrite';
import { UserProfile } from '../types';
import { Models } from 'appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.users) return;
      
      const response = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        uid
      );
      setProfile(response as unknown as UserProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const checkSession = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      await fetchProfile(currentUser.$id);
    } catch (error) {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.$id);
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
