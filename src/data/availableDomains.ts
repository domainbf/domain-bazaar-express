
// This file is being kept for compatibility but is no longer used for domain data
// Real domains are loaded from the database instead

interface DomainData {
  name: string;
  price: string;
  category: "premium" | "short" | "dev";
  highlight: boolean;
  description?: string;
}

// Empty array as we're no longer using static data
export const availableDomains: readonly DomainData[] = [] as const;
