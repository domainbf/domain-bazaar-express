
// Fallback domain data for when database is unavailable
interface DomainData {
  name: string;
  price: string;
  category: "premium" | "short" | "dev";
  highlight: boolean;
  description?: string;
}

// Fallback domains to show when database is not available
export const fallbackDomains: readonly DomainData[] = [
  {
    name: "ai-solutions.bn",
    price: "15000",
    category: "premium",
    highlight: true,
    description: "Perfect for AI and technology companies"
  },
  {
    name: "crypto.bn",
    price: "25000",
    category: "premium", 
    highlight: true,
    description: "Premium cryptocurrency domain"
  },
  {
    name: "app.bn",
    price: "12000",
    category: "short",
    highlight: true,
    description: "Short and memorable for applications"
  },
  {
    name: "dev.bn",
    price: "8000",
    category: "dev",
    highlight: false,
    description: "Perfect for developers and tech projects"
  },
  {
    name: "api.bn",
    price: "10000",
    category: "dev",
    highlight: false,
    description: "Ideal for API services and backends"
  },
  {
    name: "tech.bn",
    price: "18000",
    category: "premium",
    highlight: false,
    description: "Great for technology companies"
  }
] as const;

// Keep empty for backward compatibility
export const availableDomains: readonly DomainData[] = [] as const;
