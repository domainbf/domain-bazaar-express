
import React from 'react';
import { Button } from "@/components/ui/button";

interface HeaderSectionProps {
  onRefresh: () => void;
}

export const HeaderSection = ({ onRefresh }: HeaderSectionProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Pending Domain Verifications</h2>
      <Button size="sm" variant="outline" onClick={onRefresh}>
        Refresh
      </Button>
    </div>
  );
};
