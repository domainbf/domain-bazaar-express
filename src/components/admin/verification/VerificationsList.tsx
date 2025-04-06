
import { DomainVerification } from '@/types/domain';
import { VerificationCard } from './VerificationCard';

interface VerificationsListProps {
  verifications: DomainVerification[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const VerificationsList = ({ verifications, onApprove, onReject }: VerificationsListProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-4 border-b">Domain</th>
            <th className="text-left p-4 border-b">Type</th>
            <th className="text-left p-4 border-b">Submitted</th>
            <th className="text-left p-4 border-b">Verification Data</th>
            <th className="text-left p-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {verifications.map((verification) => (
            <VerificationCard 
              key={verification.id}
              verification={verification}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
