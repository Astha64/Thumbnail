import React, { useState } from 'react';
import { ThumbnailVariants, ThumbnailResponse } from '../../types/api';
import { StyleBadge } from './StyleBadge';
import { VariantSelector, Variant } from './VariantSelector';
import { Spinner } from '../ui/Spinner';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface ThumbnailCardProps {
  thumbnail: ThumbnailResponse;
}

export const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ thumbnail }) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant>('youtube');
  const isPending = thumbnail.status === 'pending' || thumbnail.status === 'generating';
  const isFailed = thumbnail.status === 'failed';

  const getVariantUrl = (): string | null => {
    if (!thumbnail.variants) return thumbnail.imagekit_url;
    return thumbnail.variants[selectedVariant] || thumbnail.imagekit_url;
  };

  const variantUrl = getVariantUrl();

  if (isPending) {
    return (
      <div className="rounded-2xl border border-surface-border bg-slate-900/50 overflow-hidden animate-pulse">
        <div className="aspect-video bg-gradient-to-br from-slate-800/60 to-slate-900/60 flex items-center justify-center relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <span className="text-sm text-slate-400">Generating thumbnail...</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <StyleBadge styleName={thumbnail.style_name} />
          <div className="h-8 w-full bg-slate-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 overflow-hidden">
        <div className="aspect-video bg-rose-500/5 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
            <p className="text-sm text-rose-300 font-medium">Thumbnail Generation Failed</p>
            {thumbnail.error_message && (
              <p className="text-xs text-rose-400/80 max-w-sm">{thumbnail.error_message}</p>
            )}
          </div>
        </div>
        <div className="p-4 space-y-3">
          <StyleBadge styleName={thumbnail.style_name} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-slate-900/50 overflow-hidden hover:border-brand-500/40 transition-colors group">
      <div className="aspect-video bg-slate-950/60 relative overflow-hidden">
        {variantUrl ? (
          <img
            src={variantUrl}
            alt={`Thumbnail - ${thumbnail.style_name}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600">No image</div>
        )}
        {variantUrl && (
          <a
            href={variantUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 p-2 rounded-lg bg-slate-900/80 border border-surface-border text-slate-300 hover:text-white hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
            title="Open image in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
      <div className="p-4 space-y-3">
        <StyleBadge styleName={thumbnail.style_name} />
        {thumbnail.variants && (
          <VariantSelector selected={selectedVariant} onSelect={setSelectedVariant} />
        )}
        {variantUrl && (
          <a
            href={variantUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors pt-1"
          >
            View / Download
          </a>
        )}
      </div>
    </div>
  );
};
