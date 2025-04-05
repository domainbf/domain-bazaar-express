
import { DomainVerification } from "@/types/domain";
import { VerificationCard } from "./VerificationCard";

interface VerificationsListProps {
  verifications: DomainVerification[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const VerificationsList = ({
  verifications,
  onApprove,
  onReject
}: VerificationsListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {verifications.length === 0 ? (
        <div className="col-span-full text-center py-10">
          <p className="text-gray-500">No pending verifications</p>
        </div>
      ) : (
        verifications.map((verification) => (
          <VerificationCard
            key={verification.id}
            verification={verification}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))
      )}
    </div>
  );
};
