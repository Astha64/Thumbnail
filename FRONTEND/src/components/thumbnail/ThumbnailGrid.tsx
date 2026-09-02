import React from 'react';
import { ThumbnailResponse } from '../../types/api';
import { ThumbnailCard } from './ThumbnailCard';
import { ThumbnailSkeleton } from './ThumbnailSkeleton';

interface ThumbnailGridProps {
  thumbnails: ThumbnailResponse[];
  pendingCount?: number;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  thumbnails,
  pendingCount = 0,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {thumbnails.map((t) => (
        <ThumbnailCard key={t.id} thumbnail={t} />
      ))}
      {Array.from({ length: pendingCount }).map((_, i) => (
        <ThumbnailSkeleton key={`pending-${i}`} />
      ))}
    </div>
  );
};
