import React from 'react';
import { CollectorHealthConsole } from '../components/CollectorHealthConsole';

export const HealthPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CollectorHealthConsole />
    </div>
  );
};
