import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState('loading'); // 'loading', 'authenticated', 'unverified', 'unauthenticated'

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setAuthState(session.user.email_confirmed_at ? 'authenticated' : 'unverified');
      } else {
        setAuthState('unauthenticated');
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session);
      
      if (session?.user) {
        setUser(session.user);
        
        if (event === 'SIGNED_IN') {
          // Check if email is verified
          if (session.user.email_confirmed_at) {
            setAuthState('authenticated');
            // Ensure user profile exists
            await ensureUserProfile(session.user);
          } else {
            setAuthState('unverified');
          }
        } else if (event === 'USER_UPDATED') {
          if (session.user.email_confirmed_at) {
            setAuthState('authenticated');
          }
        }
      } else {
        setUser(null);
        setAuthState('unauthenticated');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ensure user profile exists in database
  const ensureUserProfile = async (user) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        await supabase
          .from('users')
          .insert([
            { 
              id: user.id, 
              email: user.email,
              username: user.user_metadata?.username || user.email.split('@')[0]
            }
          ]);
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  // Enhanced sign up with email confirmation
  const signUp = async (email, password, username) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      
      // Create user profile immediately (even before email verification)
      if (data.user) {
        await supabase
          .from('users')
          .insert([
            { 
              id: data.user.id, 
              email: data.user.email,
              username: username
            }
          ]);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    // Update last login
    if (data.user) {
      await supabase
        .from('users')
        .update({ last_login: new Date() })
        .eq('id', data.user.id);
    }
    
    return data;
  };

  // Sign out function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Resend verification email
  const resendVerificationEmail = async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
  };

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select();
    
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    authState,
    signUp,
    signIn,
    signOut,
    resendVerificationEmail,
    updateProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}