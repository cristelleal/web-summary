import { useState, useEffect } from "react";
import { signInWithGoogle, signOut, checkUser } from "../service/authService";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fonction pour se connecter avec Google
  const login = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithGoogle();
      setUser(result.userInfo as User);
      return result;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur d'authentification";
      setError(new Error(errorMessage));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error("Erreur inconnue lors de la déconnexion"));
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Vérifiez l'état d'authentification initial
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        // Vérifier la session Supabase
        const currentUser = await checkUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email ?? "",
            user_metadata: currentUser.user_metadata,
          });
        } else {
          setUser(null);
        }
      } catch (err: unknown) {
        console.error(
          "Erreur lors de la vérification de l'authentification:",
          err
        );
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(
            new Error(
              "Erreur inconnue lors de la vérification de l'authentification"
            )
          );
        }
      } finally {
        setLoading(false);
      }
    };

    // Configurez l'écouteur d'événements pour les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Changement d'état auth:", event, session);
      if (session) {
        setUser(session.user as User);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    checkAuthStatus();

    // Nettoyez l'écouteur d'événements à la désinscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
