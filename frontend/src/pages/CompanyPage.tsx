import React from 'react';
import { CompanyProfile } from '../components/CompanyProfile';
import { JobListing } from '../types';

interface CompanyPageProps {
  onSelectListing: (listing: JobListing) => void;
}

export const CompanyPage: React.FC<CompanyPageProps> = ({ onSelectListing }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CompanyProfile onSelectListing={onSelectListing} />
    </div>
  );
};
