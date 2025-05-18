import { supabase } from "../lib/supabase";
import type { GoogleUserInfo } from "../types";

export const signInWithGoogle = async (): Promise<{ oauthUrl: string; userInfo: GoogleUserInfo }> => {
  try {
    console.log("Début de la connexion avec Google...");

    await new Promise<void>((resolve) => {
      chrome.identity.clearAllCachedAuthTokens(() => {
        console.log("Tokens OAuth nettoyés");
        resolve();
      });
    });

    const accessToken = await getGoogleToken();
    console.log("Token Google obtenu:", accessToken);

    const googleUser = await getGoogleUserInfo(accessToken);
    console.log("Informations utilisateur récupérées:", googleUser.email);

    // Connecter l'utilisateur à Supabase avec le token Google
    console.log("Connexion à Supabase...");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          access_token: accessToken,
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

// Fonction pour obtenir un token Google via chrome.identity.launchWebAuthFlow
const getGoogleToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      console.log("Obtention du token Google...");
      
      const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const REDIRECT_URL = chrome.identity.getRedirectURL();
      
      console.log("URL de redirection:", REDIRECT_URL);
      
      // Construire l'URL d'authentification Google
      const authParams = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URL,
        response_type: 'token',
        scope: 'email profile'
      });
      
      const authURL = `https://accounts.google.com/o/oauth2/auth?${authParams.toString()}`;
      console.log("URL d'authentification:", authURL);
      
      // Lancer le flux d'authentification web
      chrome.identity.launchWebAuthFlow(
        {
          url: authURL,
          interactive: true
        },
        (redirectURL) => {
          if (chrome.runtime.lastError) {
            console.error("Erreur Chrome:", chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }
          
          if (!redirectURL) {
            console.error("Pas d'URL de redirection reçue");
            reject(new Error("Authentification annulée"));
            return;
          }
          
          console.log("URL de redirection reçue:", redirectURL);
          
          // Extraire le token de l'URL de redirection
          const url = new URL(redirectURL);
          const fragmentParams = new URLSearchParams(url.hash.substring(1));
          const accessToken = fragmentParams.get('access_token');
          
          if (!accessToken) {
            console.error("Aucun token d'accès trouvé dans l'URL de redirection");
            reject(new Error("Aucun token d'accès trouvé"));
            return;
          }
          
          console.log("Token d'accès extrait avec succès");
          resolve(accessToken);
        }
      );
    } catch (error) {
      console.error("Erreur lors de l'obtention du token Google:", error);
      reject(error);
    }
  });
};

// Fonction pour récupérer les infos utilisateur Google
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
