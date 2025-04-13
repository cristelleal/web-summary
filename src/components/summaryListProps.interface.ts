import { Summary } from "../lib/supabase";

export interface SummaryListProps {
  summaries: Summary[];
  onDelete: (id: string) => void;
}