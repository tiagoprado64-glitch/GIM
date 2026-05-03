'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserData {
  uid: string;
  email: string | null;
  subscriptionStatus: 'free' | 'active' | 'expired';
  displayName?: string;
  profile?: {
    gender: 'male' | 'female' | 'other';
    age: number;
    weight: number;
    height: number;
    objective: string;
    frequency: number;
  };
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser) {
        await loadOrCreateUser(authUser);
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authUser = session?.user ?? null;
        setUser(authUser);

        if (authUser) {
          await loadOrCreateUser(authUser);
        } else {
          setUserData(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  // Listen for real-time changes on the user's row (e.g. subscription status from webhook)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            const row = payload.new as any;
            setUserData({
              uid: row.id,
              email: row.email,
              subscriptionStatus: row.subscription_status || 'free',
              displayName: row.display_name || '',
              profile: row.profile || undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadOrCreateUser = async (authUser: User) => {
    // Always set minimal userData so the app doesn't get stuck
    const fallbackUserData: UserData = {
      uid: authUser.id,
      email: authUser.email ?? null,
      subscriptionStatus: 'free',
      displayName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
    };

    try {
      // Try to fetch existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create new
        const { error: insertError } = await supabase.from('users').insert({
          id: authUser.id,
          email: authUser.email,
          display_name: fallbackUserData.displayName,
          subscription_status: 'free',
        });

        if (insertError) {
          console.error('Error creating user row:', insertError);
        }
        setUserData(fallbackUserData);
      } else if (fetchError) {
        console.error('Error fetching user:', fetchError);
        // Still set userData so the app works
        setUserData(fallbackUserData);
      } else if (existingUser) {
        setUserData({
          uid: existingUser.id,
          email: existingUser.email,
          subscriptionStatus: existingUser.subscription_status || 'free',
          displayName: existingUser.display_name || '',
          profile: existingUser.profile || undefined,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData(fallbackUserData);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await loadOrCreateUser(user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
