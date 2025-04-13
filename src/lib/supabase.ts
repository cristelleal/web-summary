import { createClient } from "@supabase/supabase-js";

export interface Summary {
  id: string;
  user_id: string;
  url: string;
  title: string;
  summary: string;
  created_at: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getUserId(): Promise<string> {
  const storageKey = "web_summarizer_user_id";

  return new Promise((resolve) => {
    chrome.storage.local.get([storageKey], (result) => {
      if (result[storageKey]) {
        resolve(result[storageKey]);
      } else {
        const newUserId = crypto.randomUUID();
        chrome.storage.local.set({ [storageKey]: newUserId });
        resolve(newUserId);
      }
    });
  });
}

export async function saveSummary(
  url: string,
  title: string,
  summary: string
): Promise<Summary | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("summaries")
    .insert([
      {
        user_id: userId,
        url,
        title,
        summary,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error saving summary:", error);
    throw error;
  }

  return data;
}

export async function getSummaries(): Promise<Summary[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("summaries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching summaries:", error);
    throw error;
  }

  return data || [];
}

export async function deleteSummary(id: string): Promise<void> {
  const { error } = await supabase.from("summaries").delete().eq("id", id);

  if (error) {
    console.error("Error deleting summary:", error);
    throw error;
  }
}
