
import { useState } from 'react';
import { Input } from "@/components/ui/input";

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const UserFilters = ({ searchQuery, onSearchChange }: UserFiltersProps) => {
  return (
    <div className="flex gap-2 mb-4">
      <Input 
        placeholder="Search users..." 
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
    </div>
  );
};
