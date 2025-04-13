/*
  # Create summaries table for web page summaries

  1. New Tables
    - `summaries`
      - `id` (uuid, primary key)
      - `user_id` (text, not null) - Local extension-generated user ID
      - `url` (text, not null)
      - `title` (text, not null)
      - `summary` (text, not null)
      - `created_at` (timestamptz, default: now())

  2. Security
    - Enable RLS on `summaries` table
    - Add policies for users to:
      - Read their own summaries
      - Create new summaries
      - Delete their own summaries
*/

CREATE TABLE IF NOT EXISTS summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own summaries"
  ON summaries
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create summaries"
  ON summaries
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own summaries"
  ON summaries
  FOR DELETE
  USING (auth.uid()::text = user_id);