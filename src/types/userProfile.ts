
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
  verification_status?: string;
  account_level?: string;
  domains_count?: number;
  completed_transactions?: number;
  balance?: number;
  email?: string;
  payment_info?: any;
  preferred_payment_methods?: string[];
  seller_rating?: number;
  total_sales?: number;
  verification_documents?: any;
  updated_at?: string;
  custom_url?: string;
  is_admin?: boolean;
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
