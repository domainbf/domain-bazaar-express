
export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
  custom_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  company_name: string | null;
  verification_status: string;
  is_seller: boolean;
  seller_verified: boolean;
  total_sales: number;
  seller_rating: number | null;
  payment_info: any;
  verification_documents: any;
  preferred_payment_methods: string[];
  is_admin?: boolean; // Add this property to fix the TypeScript error
}

export interface ProfileDomain {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  status?: string;
  highlight?: boolean;
}
