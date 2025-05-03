
import { Card, CardContent } from "@/components/ui/card";
import { DomainActions } from '../DomainActions';

interface EmptyDomainStateProps {
  onDomainAdded: () => void;
  isEmpty: boolean;
  isFiltered: boolean;
}

export const EmptyDomainState = ({ onDomainAdded, isEmpty, isFiltered }: EmptyDomainStateProps) => {
  if (!isEmpty && !isFiltered) {
    return null;
  }

  return (
    <Card>
      <CardContent className="py-10 text-center">
        {isEmpty ? (
          <>
            <p className="text-gray-500 mb-4">您还没有添加任何域名</p>
            <DomainActions mode="add" onSuccess={onDomainAdded} />
          </>
        ) : (
          <p className="text-gray-500">没有找到符合条件的域名</p>
        )}
      </CardContent>
    </Card>
  );
};
