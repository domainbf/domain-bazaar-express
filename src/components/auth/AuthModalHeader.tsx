
import React from 'react';

interface AuthModalHeaderProps {
  title: string;
}

export const AuthModalHeader = ({ title }: AuthModalHeaderProps) => {
  return (
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900">
        {React.createElement('span', {}, title)}
      </h2>
      <p className="text-gray-500 mt-2">欢迎使用 NIC.BN</p>
    </div>
  );
};
