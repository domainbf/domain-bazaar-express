
// Domain data interface
interface DomainData {
  name: string;
  price: string;
  category: "premium" | "short" | "dev";
  highlight: boolean;
  description?: string;
}

// No fallback data - all domains come from database
export const fallbackDomains: readonly DomainData[] = [] as const;

// Keep empty for backward compatibility
export const availableDomains: readonly DomainData[] = [] as const;
