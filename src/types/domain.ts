
export interface Domain {
  id?: string;
  name?: string;
  price?: number;
  category?: string;
  description?: string;
  status?: string;
  highlight?: boolean;
  owner_id?: string;
  created_at?: string;
  is_verified?: boolean;
  verification_status?: string;
}

// For consistency, the DomainListing interface should extend Domain
export interface DomainListing extends Domain {
  // Add any additional fields specific to listings
  // but inherit all fields from Domain
}

export interface DomainOffer {
  id: string;
  domain_id: string;
  amount: number;
  status: string;
  message?: string;
  created_at: string;
  contact_email?: string;
  domain_name?: string;
  buyer_email?: string;
  seller_id?: string;
  buyer_id?: string;
  updated_at?: string;
}

export interface DomainVerification {
  id: string;
  domain_id: string;
  verification_type: string;
  status: string;
  created_at: string;
  updated_at?: string;
  verification_data: any;
  domain_listings?: Domain;
}

export interface AdminStats {
  total_domains: number;
  pending_verifications: number;
  active_listings: number;
  total_offers: number;
  recent_transactions: number;
}
