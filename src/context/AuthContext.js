// src/context/AuthContext.js
// Migré vers Supabase — voir docs/ARCHITECTURE.md (ADR-002).
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    // On récupère le profil public et son profil privé associé (1:1) en une
    // seule requête grâce à l'embedding PostgREST (profiles_private.id ->
    // profiles.id, cf migration Module 1).
    const { data, error } = await supabase
      .from('profiles')
      .select('*, profiles_private(*)')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erreur chargement profil Supabase:', error.message);
      setProfile(null);
      return;
    }
    setProfile(data);
  }, []);

  const refreshProfile = useCallback(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    let profileChannel;

    // 1. Session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Écoute des changements d'auth (login/logout/refresh token)
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authSubscription.unsubscribe();
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, [fetchProfile]);

  // 3. Écoute temps réel des changements du profil public (équivalent de
  //    l'ancien onSnapshot Firestore)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => fetchProfile(user.id)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, authenticated: !!user, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
