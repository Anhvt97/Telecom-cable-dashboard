export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  team_name: string;
  is_approved: boolean;
  created_at?: string;
}
