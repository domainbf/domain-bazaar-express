
interface DomainData {
  name: string;
  price: string;
  category: "premium" | "short" | "dev";
  highlight: boolean;
}

export const availableDomains: readonly DomainData[] = [
  { name: "nic.bn", price: "50,000", category: "premium", highlight: true },
  { name: "X.RW", price: "25,000", category: "short", highlight: true },
  { name: "F.AF", price: "30,000", category: "short", highlight: true },
  { name: "L.KE", price: "28,000", category: "short", highlight: false },
  { name: "Y.CR", price: "32,000", category: "short", highlight: false },
  { name: "CXL.NET", price: "15,000", category: "premium", highlight: true },
  { name: "Top.vg", price: "12,000", category: "premium", highlight: false },
  { name: "Dev.ug", price: "8,000", category: "dev", highlight: true },
  { name: "BUG.KZ", price: "10,000", category: "dev", highlight: false }
] as const;
