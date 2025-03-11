
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DomainNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Domain not found. <Button variant="link" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </AlertDescription>
    </Alert>
  );
};
