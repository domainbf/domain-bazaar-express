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
