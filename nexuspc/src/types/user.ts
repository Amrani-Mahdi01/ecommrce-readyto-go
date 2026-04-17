export type UserRole = 'customer' | 'admin';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface PcBuild {
  id: string;
  user_id: string;
  name: string;
  components: Record<string, string>; // slot -> product_id
  total_price: number;
  is_public: boolean;
  created_at: string;
}
