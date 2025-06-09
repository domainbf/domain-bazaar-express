
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
  // Adding the missing properties
  ownerName?: string;
  views?: number;
  favorites?: number;
  offers?: number;
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

export interface VerificationCheckResult {
  success: boolean;
  message: string;
  details?: any;
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

// 新增类型定义
export interface DomainPriceHistory {
  id: string;
  domain_id: string;
  price: number;
  previous_price?: number;
  change_reason: string;
  changed_by?: string;
  created_at: string;
}

export interface DomainAuction {
  id: string;
  domain_id: string;
  starting_price: number;
  current_price: number;
  reserve_price?: number;
  bid_increment: number;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended' | 'cancelled';
  winner_id?: string;
  total_bids: number;
  created_at: string;
  updated_at: string;
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  is_automatic: boolean;
  created_at: string;
}

export interface UserReview {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  transaction_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface DomainShare {
  id: string;
  domain_id: string;
  user_id?: string;
  platform: string;
  created_at: string;
}

export interface UserActivity {
  id: string;
  user_id?: string;
  activity_type: string;
  resource_id?: string;
  metadata?: any;
  created_at: string;
}

export interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  length?: {
    min: number;
    max: number;
  };
  keywords?: string[];
  extension?: string[];
  sortBy?: 'price' | 'name' | 'length' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchSuggestion {
  domain: string;
  type: 'exact' | 'similar' | 'trending';
  score: number;
}
