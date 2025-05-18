import { supabase } from "./src/lib/supabase";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID;
const EXTENSION_ID =
  import.meta.env.VITE_EXTENSION_ID;

// Écoutez les messages de l'extension
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "getAuthStatus") {
    checkAndRefreshSession()
      .then((user) => sendResponse({ user }))
      .catch((error) => sendResponse({ error: error.message }));

    return true; // Indique que sendResponse sera appelé de manière asynchrone
  }

  if (message.action === "signInWithGoogle") {
    handleGoogleSignIn()
      .then((result) => sendResponse({ success: true, ...result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true;
  }

  if (message.action === "signOut") {
    handleSignOut()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true;
  }
});

// Fonction pour gérer la connexion Google
async function handleGoogleSignIn() {
  try {
    // Obtenir un token Google via l'API Chrome Identity
    const authResponse = await getGoogleAuthResponse();

    if (!authResponse.token) {
      throw new Error("Aucun token d'accès n'a été obtenu");
    }

    // Récupérer les informations de l'utilisateur Google
    const googleUser = await getGoogleUserInfo(authResponse.token);

    // Connecter l'utilisateur à Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          access_token: authResponse.token,
          expires_in: '3600',
        },
      },
    });

    if (error) throw error;

    return {
      provider: data.provider,
      url: data.url,
      googleUser,
    };
  } catch (error) {
    console.error("Erreur lors de la connexion Google:", error);
    throw error;
  }
}

// Fonction pour gérer la déconnexion
async function handleSignOut() {
  try {
    // Déconnexion de Supabase
    await supabase.auth.signOut();

    // Révocation du token Google
    return new Promise<void>((resolve, reject) => {
      chrome.identity.clearAllCachedAuthTokens(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    throw error;
  }
}

// Fonction pour obtenir le token Google via Chrome Identity
function getGoogleAuthResponse(): Promise<{ token: string; code: string }> {
  return new Promise((resolve, reject) => {
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${GOOGLE_CLIENT_ID}&response_type=token&redirect_uri=https://${EXTENSION_ID}.chromiumapp.org/&scope=email%20profile`;

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true,
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        if (!responseUrl) {
          reject(new Error("Authentification annulée"));
          return;
        }

        // Extraire le token ou le code d'autorisation de l'URL de réponse
        const urlParams = new URLSearchParams(
          new URL(responseUrl).hash.substring(1)
        );
        const token = urlParams.get("access_token");
        const code = urlParams.get("code");

        if (!token && !code) {
          reject(new Error("Aucun token ou code d'autorisation reçu"));
          return;
        }

        resolve({ token: token || "", code: code || "" });
      }
    );
  });
}

// Fonction pour récupérer les informations de l'utilisateur Google
async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Impossible de récupérer les informations utilisateur");
  }

  return response.json();
}

// Vérifiez et rafraîchissez la session si nécessaire
async function checkAndRefreshSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // Vérifier si le token expire bientôt (dans les 5 minutes)
      const expiresIn = session.expires_at
        ? session.expires_at * 1000 - Date.now()
        : 0;

      if (expiresIn < 5 * 60 * 1000) {
        // Tenter de rafraîchir la session
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        return data.user;
      }

      return session.user;
    }

    return null;
  } catch (error) {
    console.error("Erreur lors de la vérification de la session:", error);
    return null;
  }
}

// Vérifiez périodiquement si la session est toujours valide
setInterval(checkAndRefreshSession, 5 * 60 * 1000); // Vérifier toutes les 5 minutes

// Au démarrage du service worker, vérifiez la session
checkAndRefreshSession().then((user) => {
  if (user) {
    console.log("Session utilisateur active:", user.email);
  } else {
    console.log("Aucune session utilisateur active");
  }
});

// Écoutez les changements d'état d'authentification
supabase.auth.onAuthStateChange((event, session) => {
  console.log(
    "Changement d'état d'authentification:",
    event,
    session?.user?.email
  );
});
