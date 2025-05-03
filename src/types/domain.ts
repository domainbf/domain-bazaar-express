
export interface Domain {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  status?: string;
  highlight?: boolean;
  owner_id?: string;
  created_at?: string;
  is_verified?: boolean;
  verification_status?: string;
  views?: number;
  domain_analytics?: DomainAnalytics[];
}

export interface DomainListing extends Domain {
  // 继承Domain的所有字段，并添加特定于列表的额外字段
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
  last_checked?: string;
  verification_attempts?: number;
  verification_method?: string;
  expiry_date?: string;
  user_id?: string;
}

export interface AdminStats {
  total_domains: number;
  pending_verifications: number;
  active_listings: number;
  total_offers: number;
  recent_transactions: number;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  timestamp: string;
  status: 'verified' | 'pending' | 'failed';
}

export interface DomainAnalytics {
  id?: string;
  domain_id?: string;
  views?: number;
  favorites?: number;
  offers?: number;
  last_updated?: string;
}

export interface DomainValueEstimate {
  min_price: number;
  max_price: number;
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
  similar_domains?: {
    name: string;
    price: number;
    sold_date?: string;
  }[];
  confidence_score: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'offer' | 'verification' | 'system' | 'transaction';
  is_read: boolean;
  created_at: string;
  related_id?: string;
  action_url?: string;
}
