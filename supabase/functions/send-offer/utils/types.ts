
export interface OfferRequest {
  domain: string;
  offer: string | number;
  email: string;
  message?: string;
  buyerId?: string | null;
  domainId?: string;
  sellerId?: string;
  ownerEmail?: string;
  captchaToken?: string;
  dashboardUrl?: string;
  currency?: string;
  currencySymbol?: string;
  formattedOffer?: string;
}

export interface VerifyCaptchaResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  credit?: boolean;
}
