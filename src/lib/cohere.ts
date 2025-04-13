import { CohereClient } from "cohere-ai";

const COHERE_API_KEY = import.meta.env.VITE_COHERE_API_KEY;

if (!COHERE_API_KEY) {
  throw new Error("Missing Cohere API key");
}

const cohere = new CohereClient({
  token: COHERE_API_KEY,
});

export async function generateSummary(text: string): Promise<string> {
  const truncatedText = text.slice(0, 10000);

  const prompt = `Tu es un assistant intelligent. Résume en français le texte suivant, de façon claire, concise et structurée. Garde les idées principales et ignore les détails inutiles.\n\nTexte à résumer en français :\n${truncatedText}\n\nRésumé :`;

  try {
    const response = await cohere.generate({
      prompt,
      maxTokens: 400,
      temperature: 0.3,
      stopSequences: ["--"],
    });

    return response.generations?.[0]?.text.trim() ?? "Résumé non disponible";
  } catch (err) {
    console.error("Error", err);
    return "Erreur lors de la génération du résumé.";
  }
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
