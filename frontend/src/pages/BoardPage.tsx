import React from 'react';
import { JobFeed } from '../components/JobFeed';
import { JobListing } from '../types';

interface BoardPageProps {
  onNavigateHealth?: () => void;
  onSelectListing: (listing: JobListing) => void;
}

export const BoardPage: React.FC<BoardPageProps> = ({ onNavigateHealth, onSelectListing }) => {
  return (
    <div>
      <JobFeed
        onNavigateHealth={onNavigateHealth}
        onSelectListing={onSelectListing}
      />
    </div>
  );
};
