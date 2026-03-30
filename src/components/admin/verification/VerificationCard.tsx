
import { DomainVerification } from '@/types/domain';
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink } from 'lucide-react';

interface VerificationCardProps {
  verification: DomainVerification;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const VerificationCard = ({ verification, onApprove, onReject }: VerificationCardProps) => {
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-4 font-medium">
        {verification.domain_listings?.name || 'Unknown Domain'}
      </td>
      <td className="p-4 capitalize">{verification.verification_type}</td>
      <td className="p-4">
        {new Date(verification.created_at).toLocaleDateString()}
      </td>
      <td className="p-4">
        {verification.verification_type === 'dns' ? (
          <div className="text-sm">
            <p>TXT Record: {verification.verification_data.recordName}</p>
            <p className="text-muted-foreground truncate">{verification.verification_data.recordValue}</p>
          </div>
        ) : (
          <div className="text-sm">
            <p>File: {verification.verification_data.fileLocation}</p>
            <div className="flex items-center">
              <p className="text-muted-foreground truncate">{verification.verification_data.fileContent}</p>
              <a 
                href={`https://${verification.domain_listings?.name}${verification.verification_data.fileLocation}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ml-2 text-blue-600 hover:text-blue-600 dark:text-blue-400"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </td>
      <td className="p-4">
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/15"
            onClick={() => onApprove(verification.id)}
          >
            <Check className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500/15"
            onClick={() => onReject(verification.id)}
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      </td>
    </tr>
  );
};
