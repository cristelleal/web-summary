import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Variables d'environnement Supabase manquantes");
}

// Création d'un client Supabase singleton
let instance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (!instance) {
    console.log("Création d'une nouvelle instance Supabase");
    instance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return instance;
};

export const supabase = getSupabase();

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Summary {
  id: string;
  user_id: string;
  url: string;
  title: string;
  summary: string;
  created_at: string;
}

export async function getSummaries(): Promise<Summary[]> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log("Aucun utilisateur connecté pour récupérer les résumés");
      return [];
    }

    const { data, error } = await supabase
      .from("summaries")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des résumés:", error);
      throw error;
    }

    return (data as unknown as Summary[]) || [];
  } catch (error) {
    console.error("Erreur dans getSummaries:", error);
    return [];
  }
}

export async function saveSummary(
  url: string,
  title: string,
  summary: string
): Promise<Summary | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error("Utilisateur non connecté");
    }

    const { data, error } = await supabase
      .from("summaries")
      .insert([
        {
          url,
          title,
          summary,
          user_id: session.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de l'enregistrement du résumé:", error);
      throw error;
    }

    return data as unknown as Summary;
  } catch (error) {
    console.error("Erreur dans saveSummary:", error);
    throw error;
  }
}

export async function deleteSummary(id: string): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error("Utilisateur non connecté");
    }

    const { error } = await supabase
      .from("summaries")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Erreur lors de la suppression du résumé:", error);
      throw error;
    }
  } catch (error) {
    console.error("Erreur dans deleteSummary:", error);
    throw error;
  }
}
