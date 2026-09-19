'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { DEMO_USER } from '@/lib/storage/demoData';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isSupabase: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  switchUser: (user: UserProfile) => void;
  resetToDemoUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'buytrack_current_user';
const ALL_USERS_KEY = 'buytrack_all_profiles';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);

      // 1. If Supabase is configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser(profile as UserProfile);
              setIsLoading(false);
              return;
            } else {
              const newProf: UserProfile = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                currency: '₹',
                created_at: session.user.created_at || new Date().toISOString(),
              };
              setUser(newProf);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Supabase auth session error:', e);
        }
      }

      // 2. Local Demo / Account storage
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            setUser(DEMO_USER);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(DEMO_USER));
          }
        } else {
          setUser(DEMO_USER);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(DEMO_USER));
        }
      }

      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const current = (prof as UserProfile) || {
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email: email,
            currency: '₹',
            created_at: new Date().toISOString(),
          };
          setUser(current);
          if (typeof window !== 'undefined') {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(current));
          }
          setIsLoading(false);
          return { success: true };
        }
      }

      // Local / Offline authentication simulation
      const usersStr = localStorage.getItem(ALL_USERS_KEY);
      const profiles: UserProfile[] = usersStr ? JSON.parse(usersStr) : [DEMO_USER];
      let found = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

      if (!found) {
        // Automatically create account for local login if new
        found = {
          id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          email: email,
          currency: '₹',
          created_at: new Date().toISOString(),
        };
        profiles.push(found);
        localStorage.setItem(ALL_USERS_KEY, JSON.stringify(profiles));
      }

      setUser(found);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(found));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  const signup = async (name: string, email: string, password?: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase && password) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const newProf: UserProfile = {
            id: data.user.id,
            name,
            email,
            currency: '₹',
            created_at: new Date().toISOString(),
          };
          await supabase.from('profiles').upsert(newProf);
          setUser(newProf);
          if (typeof window !== 'undefined') {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newProf));
          }
          setIsLoading(false);
          return { success: true };
        }
      }

      // Local account creation
      const usersStr = localStorage.getItem(ALL_USERS_KEY);
      const profiles: UserProfile[] = usersStr ? JSON.parse(usersStr) : [DEMO_USER];
      
      const newProf: UserProfile = {
        id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        email,
        currency: '₹',
        created_at: new Date().toISOString(),
      };

      profiles.push(newProf);
      localStorage.setItem(ALL_USERS_KEY, JSON.stringify(profiles));
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newProf));
      setUser(newProf);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase logout failed:', e);
      }
    }
    // Switch to empty state or stay on demo user option
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  };

  const updateProfile = async (profileUpdate: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...profileUpdate };
    setUser(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update(profileUpdate).eq('id', user.id);
      } catch (e) {
        console.warn('Supabase profile update failed:', e);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
      const usersStr = localStorage.getItem(ALL_USERS_KEY);
      if (usersStr) {
        const list: UserProfile[] = JSON.parse(usersStr);
        const idx = list.findIndex((u) => u.id === user.id);
        if (idx >= 0) {
          list[idx] = updated;
          localStorage.setItem(ALL_USERS_KEY, JSON.stringify(list));
        }
      }
    }
  };

  const switchUser = (newUser: UserProfile) => {
    setUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    }
  };

  const resetToDemoUser = () => {
    setUser(DEMO_USER);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(DEMO_USER));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSupabase: isSupabaseConfigured,
        login,
        signup,
        logout,
        updateProfile,
        switchUser,
        resetToDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
