
import { Button } from "@/components/ui/button";

interface UserHeaderProps {
  onRefresh: () => void;
}

export const UserHeader = ({ onRefresh }: UserHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">User Management</h2>
      <Button size="sm" variant="outline" onClick={onRefresh}>
        Refresh
      </Button>
    </div>
  );
};
