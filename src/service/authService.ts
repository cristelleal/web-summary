import { supabase } from "../lib/supabase";
import type { GoogleUserInfo } from "../types";

// Fonction pour se connecter avec Google
export const signInWithGoogle = async (): Promise<{ oauthUrl: string; userInfo: GoogleUserInfo }> => {
  try {
    console.log("Début de la connexion avec Google...");

    // 1. Obtenir le token Google via chrome.identity.getAuthToken
    const token = await getGoogleAuthToken();

    if (!token) {
      throw new Error("Impossible d'obtenir le token d'accès Google");
    }

    console.log("Token Google obtenu");

    // 2. Récupérer les informations de l'utilisateur Google
    const googleUser = await getGoogleUserInfo(token);
    console.log("Informations utilisateur récupérées:", googleUser.email);

    // 3. Connecter l'utilisateur à Supabase avec le token Google
    console.log("Connexion à Supabase...");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          access_token: token,
          expires_in: '3600',
        },
      },
    });

    if (error) {
      console.error("Erreur Supabase:", error);
      throw error;
    }

    console.log("Redirection vers l'URL d'authentification OAuth de Supabase :", data.url);

    // Retourner l'URL pour que le frontend puisse rediriger l'utilisateur
    return {
      oauthUrl: data.url,
      userInfo: googleUser,
    };
  } catch (error) {
    console.error("Erreur lors de la connexion avec Google:", error);
    throw error;
  }
};

// Fonction pour obtenir un token Google via getAuthToken
const getGoogleAuthToken = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      console.log("Demande de token Google via getAuthToken...");

      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          console.error("Chrome runtime error:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        if (!token) {
          console.error("Aucun token obtenu");
          reject(new Error("Aucun token obtenu"));
          return;
        }

        console.log("Token Google obtenu avec succès");
        resolve(token);
      });
    } catch (error) {
      console.error("Erreur inattendue:", error);
      reject(error);
    }
  });
};

// Fonction pour récupérer les informations utilisateur Google
const getGoogleUserInfo = async (
  accessToken: string
): Promise<GoogleUserInfo> => {
  console.log("Récupération des informations utilisateur Google...");

  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Erreur API Google:", response.status, response.statusText);
      throw new Error(
        `Erreur API Google: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Informations utilisateur récupérées avec succès");
    return data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des informations utilisateur:",
      error
    );
    throw error;
  }
};

// Vérifier si l'utilisateur est connecté
export const checkUser = async () => {
  try {
    console.log("Vérification de la session utilisateur...");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user || null;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'utilisateur:", error);
    return null;
  }
};

// Se déconnecter
export const signOut = async () => {
  try {
    console.log("Déconnexion...");

    // Déconnexion de Supabase
    await supabase.auth.signOut();

    // Révocation du token Google
    return new Promise<void>((resolve, reject) => {
      chrome.identity.clearAllCachedAuthTokens(() => {
        if (chrome.runtime.lastError) {
          console.error(
            "Erreur lors du nettoyage des tokens:",
            chrome.runtime.lastError
          );
          reject(chrome.runtime.lastError);
        } else {
          console.log("Tokens nettoyés avec succès");
          resolve();
        }
      });
    });
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    throw error;
  }
};

// Vérifier l'état d'authentification
export const getAuthStatus = async () => {
  try {
    console.log("Vérification du statut d'authentification...");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error(
      "Erreur lors de la vérification du statut d'authentification:",
      error
    );
    return null;
  }
};
