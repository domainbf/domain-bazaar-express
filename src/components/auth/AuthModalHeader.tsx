
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AuthModalHeaderProps {
  title: string;
}

export const AuthModalHeader = ({ title }: AuthModalHeaderProps) => {
  return (
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-center text-black">
        {title}
      </DialogTitle>
    </DialogHeader>
  );
};
