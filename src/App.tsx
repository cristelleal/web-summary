import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { History, RefreshCw, AlertTriangle, Copy, Check, X } from "lucide-react";
import { SummaryList } from "./components/SummaryList";
import {
  getSummaries,
  deleteSummary,
  saveSummary,
} from "./lib/supabase";
import { Summary } from "./types";
import { generateSummary, getCurrentPageContent } from "./lib/cohere";
import icon from "/icons/icon16.png";
import './App.css';

function App() {
  const { user, loading: authLoading, isAuthenticated, login, logout } = useAuth();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [recentSummaryText, setRecentSummaryText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Charger les résumés et vérifier la page actuelle au chargement
  useEffect(() => {
    if (isAuthenticated) {
      loadSummaries();
      checkCurrentPage();
    }
  }, [isAuthenticated]);

  async function checkCurrentPage() {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab && tab.url) {
          if (
            tab.url.startsWith("chrome://") ||
            tab.url.startsWith("chrome-extension://") ||
            tab.url.startsWith("about:")
          ) {
            setError("Cette page ne peut pas être résumée");
            setCurrentUrl(null);
          } else {
            setCurrentUrl(tab.url);
            setError(null);
          }
        } else {
          setError("Impossible de déterminer la page actuelle");
          setCurrentUrl(null);
        }
      });
    } catch (err) {
      console.error("Error checking current page:", err);
    }
  }

  async function loadSummaries() {
    try {
      setLoading(true);
      const data = await getSummaries();
      setSummaries(data);
    } catch (err) {
      console.error("Failed to load summaries:", err);

      if (err instanceof Error) {
        setError(`Impossible de charger les résumés: ${err.message}`);
      } else {
        setError("Impossible de charger les résumés");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSummary(id);
      setSummaries(summaries.filter((summary) => summary.id !== id));
    } catch (err) {
      console.error("Failed to delete summary:", err);

      if (err instanceof Error) {
        alert(`Erreur lors de la suppression: ${err.message}`);
      } else {
        alert("Erreur lors de la suppression du résumé");
      }
    }
  }

  async function handleSummarize() {
    try {
      setSummarizing(true);
      setError(null);
      setCopied(false);

      const pageData = await getCurrentPageContent();
      console.log("Page Data:", pageData);

      const summary = await generateSummary(pageData.content);
      console.log("Generated Summary:", summary);

      try {
        const savedSummary = await saveSummary(
          pageData.url,
          pageData.title,
          summary
        );
        console.log("Saved Summary:", savedSummary);

        if (savedSummary) {
          setSummaries([savedSummary, ...summaries]);
          setRecentSummaryText(savedSummary.summary);
        }
      } catch (err) {
        console.error("Supabase error details:", err);
        if (
          err instanceof Error &&
          (err as { code?: string }).code === "42501"
        ) {
          throw new Error(
            "Erreur de permission avec la base de données: politique RLS violée"
          );
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error("Error during summarization:", err);

      if (err instanceof Error) {
        setError(`Échec de la génération du résumé: ${err.message}`);
      } else {
        setError("Échec de la génération du résumé");
      }
    } finally {
      setSummarizing(false);
    }
  }

  const handleCopyText = () => {
    if (recentSummaryText) {
      navigator.clipboard
        .writeText(recentSummaryText)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Erreur lors de la copie:", err);
        });
    }
  };

  const handleCloseSummary = () => {
    setRecentSummaryText(null);
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Réinitialiser l'état après la déconnexion
      setSummaries([]);
      setRecentSummaryText(null);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  // Affichage du chargement initial
  if (authLoading) {
    return (
      <div className="w-[400px] h-[500px] bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FB8500]"></div>
      </div>
    );
  }

  // Affichage pour utilisateur non connecté
  if (!isAuthenticated) {
    return (
      <div className="w-[400px] h-[500px] bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative w-10 h-10 mr-3">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FB8500] to-[#FFB703] shadow-md"></div>
              <div className="absolute inset-0.5 rounded-lg bg-white opacity-10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img src={icon} alt="Logo" className="w-8 h-8 rounded-full" />
              </div>
              <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white opacity-30"></div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Web Summary
              </h1>
              <p className="text-xs text-gray-400 -mt-0.5">Résumez n'importe quelle page web</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Connectez-vous pour commencer</h2>
            <p className="text-gray-500 mb-6">
              Utilisez votre compte Google pour accéder à tous les résumés de vos pages web préférées.
            </p>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#FB8500]/5 to-[#FFB703]/5 border border-[#FB8500]/10 mb-8">
              <ul className="text-left space-y-3">
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-[#FB8500]/10 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-[#FB8500] text-xs font-medium">1</span>
                  </div>
                  <p className="text-gray-700">Résumez instantanément n'importe quelle page web</p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-[#FB8500]/10 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-[#FB8500] text-xs font-medium">2</span>
                  </div>
                  <p className="text-gray-700">Sauvegardez vos résumés pour y accéder ultérieurement</p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 rounded-full bg-[#FB8500]/10 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-[#FB8500] text-xs font-medium">3</span>
                  </div>
                  <p className="text-gray-700">Copiez et partagez facilement vos résumés</p>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-gray-700 font-medium">Se connecter avec Google</span>
          </button>
        </div>
      </div>
    );
  }

  // Affichage des erreurs
  if (loading) {
    return (
      <div className="w-[400px] h-[500px] bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FB8500]"></div>
      </div>
    );
  }

  if (error && !currentUrl) {
    return (
      <div className="w-[400px] h-[500px] bg-white flex items-center justify-center p-4">
        <div className="p-6 rounded-xl w-full max-w-sm flex flex-col items-center">
          <div className="flex items-center mb-4 text-[#FB8500]">
            <AlertTriangle className="mr-2" size={24} />
            <p className="font-medium text-lg">Erreur</p>
          </div>
          <p className="text-gray-700 mb-6 text-center">{error}</p>
          <button
            onClick={loadSummaries}
            className="mt-2 w-full px-6 py-3 bg-[#FB8500] text-white rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Affichage principal de l'application (utilisateur connecté)
  return (
    <div className="w-[400px] h-[500px] bg-white flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative w-10 h-10 mr-3">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FB8500] to-[#FFB703] shadow-md"></div>
            <div className="absolute inset-0.5 rounded-lg bg-white opacity-10"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img src={icon} alt="Logo" className="w-8 h-8 rounded-full" />
            </div>
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white opacity-30"></div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Web Summary
            </h1>
            <p className="text-xs text-gray-400 -mt-0.5">Génération de résumé par Cohere</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSummaries}
            className="p-2 text-gray-400 hover:text-[#FB8500] transition-colors rounded-full hover:bg-gray-50 active:bg-gray-100"
            aria-label="Rafraîchir les résumés"
          >
            <RefreshCw size={18} />
          </button>
          <div className="user-menu relative group">
            {user?.user_metadata?.avatar_url ? (
              <button className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#FB8500]/20 hover:border-[#FB8500]/50 transition-all">
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </button>
            ) : (
              <button className="w-8 h-8 rounded-full bg-[#FB8500]/10 text-[#FB8500] flex items-center justify-center font-medium hover:bg-[#FB8500]/20 transition-colors">
                {user?.email?.substring(0, 1).toUpperCase() || "U"}
              </button>
            )}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="p-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start">
              <AlertTriangle
                className="text-red-500 mr-2 mt-0.5 flex-shrink-0"
                size={18}
              />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleSummarize}
            disabled={summarizing || !currentUrl}
            className="generate-button"
            aria-label="Résumer cette page"
          >
            <div className="generate-button-inner">
              {summarizing ? (
                <>
                  <div className="loader-spin" aria-hidden="true"></div>
                  <span>Génération en cours...</span>
                </>
              ) : (
                "Résumer cette page"
              )}
            </div>
            <div className="shine-effect"></div>
            <div className="inner-light"></div>
          </button>

          {recentSummaryText && (
            <div className="mb-4 relative bg-[#FB8500]/5 rounded-lg border border-[#FB8500]/10 p-3">
              <div className="absolute top-0 right-0 flex items-center p-1 bg-white/70 rounded-tr-lg rounded-bl-lg">
                <button
                  onClick={handleCopyText}
                  className="p-1 text-gray-500 hover:text-[#FB8500] transition-colors"
                  title="Copier le résumé"
                >
                  {copied ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
                <button
                  onClick={handleCloseSummary}
                  className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                  title="Fermer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-sm text-gray-700 mt-5">
                {recentSummaryText}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 py-3 mb-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FB8500] to-[#FFB703] flex items-center justify-center shadow-sm">
              <History className="text-white" size={14} />
            </div>
            <h2 className="text-base font-medium text-gray-900">Historique</h2>
          </div>

          <div className="pb-4">
            <SummaryList summaries={summaries} onDelete={handleDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
