
import React from 'react';
import { useTranslation } from 'react-i18next';

interface AuthModalHeaderProps {
  title: string;
}

export const AuthModalHeader = ({ title }: AuthModalHeaderProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-foreground">
        {React.createElement('span', {}, title)}
      </h2>
      <p className="text-muted-foreground mt-2">{t('auth.welcome')}</p>
    </div>
  );
};
