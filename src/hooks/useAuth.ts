import { useState, useEffect } from 'react';
import { signInWithGoogle, signOut, checkUser } from '../service/authService';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier l'état d'authentification initial
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const currentUser = await checkUser();
        if (currentUser) {
          setUser({
            ...currentUser,
            email: currentUser.email ?? '',
          });
        } else {
          setUser(null);
        }
        setIsAuthenticated(!!currentUser);
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'authentification:', err);
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        setLoading(false);
      }
    };

    // Écouteur pour les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Changement d\'état d\'authentification:', event);
      
      if (session?.user) {
        console.log('Utilisateur connecté:', session.user.email);
        setUser({
          ...session.user,
          email: session.user.email ?? '',
        });
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        console.log('Utilisateur déconnecté');
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    checkAuthStatus();

    // Nettoyage de la souscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fonction de connexion
  const login = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithGoogle();
      setUser(result.userInfo);
      setIsAuthenticated(true);
      return result;
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError(err instanceof Error ? err : new Error('Erreur de connexion'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      setError(err instanceof Error ? err : new Error('Erreur de déconnexion'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout
  };
}