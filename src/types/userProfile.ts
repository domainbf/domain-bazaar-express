
export interface UserProfile {
  id: string;
  avatar_url?: string;
  bio?: string;
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  custom_url?: string;
  full_name?: string;
  is_seller: boolean;
  payment_info?: any;
  preferred_payment_methods?: string[];
  seller_rating?: number;
  seller_verified: boolean;
  total_sales: number;
  updated_at: string;
  username?: string;
  verification_documents?: any;
  verification_status: string;
  is_admin?: boolean;
  account_level?: string;
  domains_count?: number;
  completed_transactions?: number;
  balance?: number;
}

// Add ProfileDomain interface for profile-related components
export interface ProfileDomain {
  id: string;
  name: string;
  category?: string;
  price?: number;
  status: string;
  created_at: string;
  is_verified?: boolean;
  verification_status?: string;
  description?: string;
  highlight?: boolean;
}
