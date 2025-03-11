
import React from 'react';
import { Link } from 'lucide-react';

interface DomainHeaderProps {
  domainName: string | undefined;
}

export const DomainHeader = ({ domainName }: DomainHeaderProps) => {
  return (
    <div className="flex items-center gap-3 mb-8">
      <Link className="h-6 w-6 text-primary" />
      <h1 className="text-2xl font-bold text-gray-900">Domain Verification: {domainName}</h1>
    </div>
  );
};
