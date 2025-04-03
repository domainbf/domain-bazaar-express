
interface DomainData {
  name: string;
  price: string;
  category: "premium" | "short" | "dev";
  highlight: boolean;
  description?: string; // Add the description property as optional
}

export const availableDomains: readonly DomainData[] = [
  { name: "nic.bn", price: "50,000", category: "premium", highlight: true, description: "Premium domain name for your business." },
  { name: "X.RW", price: "25,000", category: "short", highlight: true, description: "Ultra short single letter domain." },
  { name: "F.AF", price: "30,000", category: "short", highlight: true, description: "Rare single letter domain opportunity." },
  { name: "L.KE", price: "28,000", category: "short", highlight: false, description: "Valuable single letter domain." },
  { name: "Y.CR", price: "32,000", category: "short", highlight: false, description: "Short and memorable domain name." },
  { name: "CXL.NET", price: "15,000", category: "premium", highlight: true, description: "Three-letter premium .NET domain." },
  { name: "Top.vg", price: "12,000", category: "premium", highlight: false, description: "Brandable top-level domain name." },
  { name: "Dev.ug", price: "8,000", category: "dev", highlight: true, description: "Perfect domain for developers or tech companies." },
  { name: "BUG.KZ", price: "10,000", category: "dev", highlight: false, description: "Memorable dev-related domain name." }
] as const;
