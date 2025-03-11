
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const VerificationFooter = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-end">
      <Button variant="outline" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </Button>
    </div>
  );
};
