import React from 'react';

interface ThumbnailSkeletonProps {
  styleName?: string;
}

export const ThumbnailSkeleton: React.FC<ThumbnailSkeletonProps> = ({ styleName }) => {
  return (
    <div className="rounded-2xl border border-surface-border bg-slate-900/50 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gradient-to-br from-slate-800/60 to-slate-900/60 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 border border-surface-border flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-brand-500/60 border-t-transparent animate-spin" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-4 w-24 bg-slate-800 rounded-md" />
        <div className="h-8 w-full bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
};
