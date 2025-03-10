
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onRefresh: () => void;
}

export const EmptyState = ({ onRefresh }: EmptyStateProps) => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <p className="text-gray-600 mb-4">No pending verifications</p>
      <Button variant="outline" onClick={onRefresh}>Refresh</Button>
    </div>
  );
};
