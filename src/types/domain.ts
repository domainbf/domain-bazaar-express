
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
