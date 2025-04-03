
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
