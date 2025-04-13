import { CohereClient } from "cohere-ai";

const COHERE_API_KEY = import.meta.env.VITE_COHERE_API_KEY;

if (!COHERE_API_KEY) {
  throw new Error("Missing Cohere API key");
}

const cohere = new CohereClient({
  token: COHERE_API_KEY,
});

export async function generateSummary(text: string): Promise<string> {
  const chunkSize = 10000;
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  const partialSummaries = [];

  for (const chunk of chunks) {
    const response = await cohere.generate({
      prompt: `Tu es un assistant intelligent. Résume de manière claire, concise et en français le contenu suivant extrait d'une page web. Garde le sens original et les idées clés.\n\nTexte à résumer :\n${chunk}\n\nRésumé en français :`,
      maxTokens: 350,
      temperature: 0.3,
      stopSequences: ["--"],
    });

    const summary = response.generations?.[0]?.text.trim();
    if (summary) partialSummaries.push(summary);
  }

  const finalResponse = await cohere.generate({
    prompt: `Voici plusieurs résumés partiels d'une page web. Fais une synthèse globale en français, claire et concise, en gardant uniquement les points clés.\n\n${partialSummaries.join(
      "\n\n"
    )}\n\nRésumé final :`,
    maxTokens: 400,
    temperature: 0.3,
    stopSequences: ["--"],
  });

  return finalResponse.generations?.[0]?.text.trim() ?? "Résumé non disponible";
}

export async function getCurrentPageContent(): Promise<{
  url: string;
  title: string;
  content: string;
}> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        reject(new Error("No active tab found"));
        return;
      }

      const activeTab = tabs[0];

      if (!activeTab.id) {
        reject(new Error("Active tab has no ID"));
        return;
      }

      if (!activeTab.url || activeTab.url.startsWith("chrome://")) {
        reject(new Error("Cannot access content on this page"));
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          func: () => {
            try {
              const elementsToRemove = document.querySelectorAll(
                "script, style, nav, header, footer, iframe, noscript, svg, aside, .sidebar, .nav, .menu, .ad, .advertisement, .cookie-banner"
              );

              const docClone = document.cloneNode(true) as Document;

              elementsToRemove.forEach((el) => {
                const elInClone =
                  docClone.querySelector(`[id="${el.id}"]`) ||
                  docClone.querySelector(`[class="${el.className}"]`);
                if (elInClone) elInClone.remove();
              });

              const mainElements = [
                docClone.querySelector("main"),
                docClone.querySelector("article"),
                docClone.querySelector('[role="main"]'),
                docClone.querySelector(".main-content"),
                docClone.querySelector("#content"),
                docClone.querySelector(".content"),
              ].filter(Boolean);

              let content = "";

              if (mainElements.length > 0) {
                mainElements.forEach((el) => {
                  if (el?.textContent) content += el.textContent.trim() + " ";
                });
              } else {
                const contentElements = docClone.querySelectorAll(
                  "p, h1, h2, h3, h4, h5, h6"
                );
                contentElements.forEach((el) => {
                  if (el.textContent && el.textContent.trim().length > 10) {
                    content += el.textContent.trim() + " ";
                  }
                });
              }

              if (content.length < 500) {
                content = document.body.innerText;
              }

              content = content
                .replace(/\\s+/g, " ")
                .trim()
                .substring(0, 90000);

              return {
                url: window.location.href,
                title: document.title,
                content: content,
              };
            } catch {
              return {
                url: window.location.href,
                title: document.title || "No title",
                content:
                  document.body.innerText.substring(0, 90000) ||
                  "No content found",
              };
            }
          },
        },
        (results) => {
          if (chrome.runtime.lastError) {
            reject(
              new Error(
                `Chrome runtime error: ${chrome.runtime.lastError.message}`
              )
            );
            return;
          }

          if (!results || results.length === 0) {
            reject(new Error("No results returned from script execution"));
            return;
          }

          if (results[0]?.result) {
            resolve(results[0].result);
          } else {
            reject(new Error("No valid result returned from script execution"));
          }
        }
      );
    });
  });
}
