import { useEffect, useState } from 'react';
import { History, RefreshCw, FileText, AlertTriangle } from 'lucide-react';
import { SummaryList } from './components/SummaryList';
import { getSummaries, deleteSummary, saveSummary, type Summary } from './lib/supabase';
import { generateSummary, getCurrentPageContent } from './lib/cohere';

function App() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    loadSummaries();
    checkCurrentPage();
  }, []);

  async function checkCurrentPage() {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab && tab.url) {
          if (tab.url.startsWith('chrome://') || 
              tab.url.startsWith('chrome-extension://') ||
              tab.url.startsWith('about:')) {
            setError('Cette page ne peut pas être résumée');
            setCurrentUrl(null);
          } else {
            setCurrentUrl(tab.url);
            setError(null);
          }
        } else {
          setError('Impossible de déterminer la page actuelle');
          setCurrentUrl(null);
        }
      });
    } catch (err) {
      console.error('Error checking current page:', err);
    }
  }

  async function loadSummaries() {
    try {
      setLoading(true);
      const data = await getSummaries();
      setSummaries(data);
    } catch (err) {
      console.error('Failed to load summaries:', err);
      
      if (err instanceof Error) {
        setError(`Impossible de charger les résumés: ${err.message}`);
      } else {
        setError('Impossible de charger les résumés');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSummary(id);
      setSummaries(summaries.filter(summary => summary.id !== id));
    } catch (err) {
      console.error('Failed to delete summary:', err);
      
      if (err instanceof Error) {
        alert(`Erreur lors de la suppression: ${err.message}`);
      } else {
        alert('Erreur lors de la suppression du résumé');
      }
    }
  }

  async function handleSummarize() {
    try {
      setSummarizing(true);
      setError(null);
  
      const pageData = await getCurrentPageContent();
      console.log('Page Data:', pageData);
  
      const summary = await generateSummary(pageData.content);
      console.log('Generated Summary:', summary);
  
      try {
        const savedSummary = await saveSummary(
          pageData.url,
          pageData.title,
          summary
        );
        console.log('Saved Summary:', savedSummary);
  
        if (savedSummary) {
          setSummaries([savedSummary, ...summaries]);
        }
      } catch (err) {
        console.error('Supabase error details:', err);
        if (err instanceof Error && (err as { code?: string }).code === '42501') {
          throw new Error('Erreur de permission avec la base de données: politique RLS violée');
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error during summarization:', err);
      
      if (err instanceof Error) {
        setError(`Échec de la génération du résumé: ${err.message}`);
      } else {
        setError('Échec de la génération du résumé');
      }
    } finally {
      setSummarizing(false);
    }
  }

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

  return (
    <div className="w-[400px] h-[500px] bg-white flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FB8500] to-[#FFB703] flex items-center justify-center mr-3">
            <FileText className="text-white" size={16} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Summarizer</h1>
        </div>
        <button
          onClick={loadSummaries}
          className="p-2 text-gray-400 hover:text-[#FB8500] transition-colors rounded-full hover:bg-gray-50"
          aria-label="Rafraîchir les résumés"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-hidden flex flex-col">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start">
            <AlertTriangle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleSummarize}
          disabled={summarizing || !currentUrl}
          className={`w-full py-3.5 px-4 rounded-full font-medium text-base transition-all mb-6 ${
            summarizing || !currentUrl
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#FB8500] text-white shadow-md hover:shadow-lg hover:bg-[#F77F00]'
          }`}
        >
          {summarizing ? 
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
              Génération...
            </span> : 
            'Résumer cette page'
          }
        </button>

        <div className="flex items-center gap-2 py-3 mb-4">
          <div className="w-6 h-6 rounded-full bg-[#FB8500] bg-opacity-10 flex items-center justify-center">
            <History className="text-[#FB8500]" size={14} />
          </div>
          <h2 className="text-base font-medium text-gray-900">Historique</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          <SummaryList summaries={summaries} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}

export default App;