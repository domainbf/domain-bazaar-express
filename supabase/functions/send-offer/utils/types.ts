
export interface OfferRequest {
  domain: string;
  offer: string;
  email: string;
  message?: string;
  buyerId?: string | null;
  domainId?: string;
  sellerId?: string;
  ownerEmail?: string;
  captchaToken: string;
  dashboardUrl?: string;
}

export interface VerifyCaptchaResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  credit?: boolean;
}
