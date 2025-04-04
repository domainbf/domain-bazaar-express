
export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  is_seller?: boolean;
  seller_verified?: boolean;
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  custom_url?: string;
  verification_status?: string;
  is_admin?: boolean;
  account_level?: string;
  domains_count?: number;
  completed_transactions?: number;
  balance?: number;
}

export interface ProfileDomain {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  status: string;
  highlight?: boolean;
  is_verified?: boolean;
}
