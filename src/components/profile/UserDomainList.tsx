
import { ProfileDomain } from "@/types/userProfile";
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainGrid } from "./DomainGrid";
import { DomainTable } from "./DomainTable";
import { Grid2X2, List } from "lucide-react";

interface UserDomainListProps {
  domains: ProfileDomain[];
  isLoading?: boolean;
  emptyMessage?: string;
  showViewToggle?: boolean;
}

export const UserDomainList = ({
  domains,
  isLoading = false,
  emptyMessage = "用户没有任何域名",
  showViewToggle = true
}: UserDomainListProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (domains.length === 0 && !isLoading) {
    return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div>
      {showViewToggle && domains.length > 0 && (
        <div className="flex justify-end mb-4">
          <Tabs value={viewMode} onValueChange={(val: string) => setViewMode(val as "grid" | "list")}>
            <TabsList className="grid w-[120px] grid-cols-2">
              <TabsTrigger value="grid"><Grid2X2 className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="list"><List className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {viewMode === "grid" ? (
        <DomainGrid domains={domains} isLoading={isLoading} emptyMessage={emptyMessage} />
      ) : (
        <DomainTable domains={domains} isLoading={isLoading} emptyMessage={emptyMessage} />
      )}
    </div>
  );
};
