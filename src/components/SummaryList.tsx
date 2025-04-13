import { useState } from "react";
import {
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  FileText,
} from "lucide-react";
import { SummaryListProps } from "./summaryListProps.interface";

export function SummaryList({ summaries, onDelete }: SummaryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  if (summaries.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FileText className="text-gray-400" size={24} />
        </div>
        <p className="text-gray-500 font-medium mb-1">Aucun résumé</p>
        <p className="mt-2 text-gray-400 text-sm">
          Cliquez sur "Résumer cette page" pour créer votre premier résumé
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-3">
      {summaries.map((summary) => {
        const isExpanded = expandedId === summary.id;
        return (
          <div
            key={summary.id}
            className="rounded-xl border border-gray-200 overflow-hidden bg-white transition-shadow hover:shadow-sm"
          >
            <div
              className="p-3 cursor-pointer flex items-start gap-3"
              onClick={() => toggleExpand(summary.id)}
            >
              <div className="mt-1 flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown size={16} className="text-[#FB8500]" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate text-sm">
                  {summary.title || "Page sans titre"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {summary.url}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(summary.created_at)}
                </p>
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <a
                  href={summary.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-[#FB8500] transition-colors rounded-full hover:bg-gray-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Voulez-vous supprimer ce résumé ?")) {
                      onDelete(summary.id);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 pt-1 border-t border-gray-100 mt-1">
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 max-h-48 overflow-y-auto">
                  {summary.summary}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
