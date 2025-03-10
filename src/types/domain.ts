
export interface DomainListing {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  highlight: boolean;
  status: string;
  created_at: string;
  owner_id: string;
  verification_status?: string;
  is_verified?: boolean;
}

export interface DomainOffer {
  id: string;
  domain_id: string;
  amount: number;
  status: string;
  message: string;
  created_at: string;
  contact_email: string;
  domain_name?: string;
  buyer_email?: string;
  seller_id?: string;
  buyer_id?: string;
  updated_at?: string;
}

export interface Domain {
  id: string;
  name: string;
  price: number;
  category: string;
  highlight: boolean;
  status: string;
  description?: string;
  owner_id: string;
  created_at?: string;
  verification_status?: string;
  is_verified?: boolean;
}

export interface DomainVerification {
  id: string;
  domain_id: string;
  verification_type: string;
  status: string;
  created_at: string;
  updated_at?: string;
  verification_data?: any;
}

export interface AdminStats {
  total_domains: number;
  pending_verifications: number;
  active_listings: number;
  total_offers: number;
  recent_transactions: number;
}
