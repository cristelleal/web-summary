export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    email?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    provider?: string;
  };
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface Summary {
  id: string;
  user_id: string;
  url: string;
  title: string;
  summary: string;
  created_at: string;
}
